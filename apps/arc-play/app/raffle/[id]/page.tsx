'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAccount, useBalance } from 'wagmi'
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertTriangle,
  Ticket,
  Trophy,
  Dice5,
  ShieldCheck,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { sendUSDC } from '@/lib/payments'
import {
  useRaffleStore,
  getPublicClient,
  selectWinner,
  formatTimeLeft,
  formatTimeAgo,
  shorten,
  getPrizeDisplay,
  getPotAmount,
  RAFFLE_CATEGORY_LABELS,
  type Raffle,
  type Ticket as RaffleTicket,
} from '@/lib/raffleStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  closed: '#facc15',
  drawn: '#c9a84c',
  paid: '#60a5fa',
  cancelled: '#888',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  closed: 'Awaiting Draw',
  drawn: 'Drawn',
  paid: 'Paid Out',
  cancelled: 'Cancelled',
}

// ── Confetti items (stable, computed once at module level) ────────────────────

const CONFETTI_ITEMS = Array.from({ length: 24 }, (_, i) => ({
  emoji: ['🎉', '🏆', '🎊', '⭐', '✨', '🌟'][i % 6],
  left: `${((i * 4.16) % 100).toFixed(1)}%`,
  delay: `${((i * 0.07) % 1.4).toFixed(2)}s`,
  duration: `${(1.2 + (i % 4) * 0.4).toFixed(1)}s`,
}))

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RaffleDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const { raffles, closeRaffleIfDue, buyTickets, drawWinner, payWinner, cancelRaffle } =
    useRaffleStore()
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address, query: { enabled: !!address } })

  const raffle = raffles[id]

  // Auto-close if deadline passed
  useEffect(() => {
    if (raffle?.status === 'active' && raffle.endsAt < Date.now()) {
      closeRaffleIfDue(id)
    }
  }, [raffle, id, closeRaffleIfDue])

  // Countdown re-render every second when active
  const [, setTick] = useState(0)
  useEffect(() => {
    if (raffle?.status !== 'active') return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [raffle?.status])

  // ── Purchase state ──────────────────────────────────────────────────────────
  const [qty, setQty] = useState(1)
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState('')
  const [buySuccess, setBuySuccess] = useState<{ txHash: string; explorerUrl: string } | null>(null)

  // ── Draw state ──────────────────────────────────────────────────────────────
  type DrawPhase = 'idle' | 'fetching' | 'calculating' | 'done'
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('idle')
  const [drawLog, setDrawLog] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [drawError, setDrawError] = useState('')

  // ── Payout state ────────────────────────────────────────────────────────────
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  // ── Cancel state ────────────────────────────────────────────────────────────
  const [cancelling, setCancelling] = useState(false)

  // ── Verify panel ────────────────────────────────────────────────────────────
  const [showVerify, setShowVerify] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)

  if (!raffle) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="max-w-4xl mx-auto w-full px-4 py-16 text-center flex flex-col items-center gap-6">
          <Ticket size={48} style={{ color: 'var(--fg)', opacity: 0.12 }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            Raffle not found
          </h2>
          <Link
            href="/raffle"
            className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
          >
            <ArrowLeft size={15} />
            All Raffles
          </Link>
        </main>
      </div>
    )
  }

  const isCreator = !!address && address.toLowerCase() === raffle.creatorAddress.toLowerCase()
  const isActive = raffle.status === 'active' && raffle.endsAt > Date.now()
  const canBuy = isActive && isConnected && !isCreator
  const walletBalance = balance ? Number(balance.value) / 1e18 : 0
  const ticketCost = qty * raffle.ticketPrice
  const totalRaised = raffle.ticketsSold * raffle.ticketPrice
  const myTickets = address
    ? raffle.participants.filter((t) => t.buyer.toLowerCase() === address.toLowerCase())
    : []
  const soldOut = !!raffle.maxTickets && raffle.ticketsSold >= raffle.maxTickets
  const remainingTickets = raffle.maxTickets ? raffle.maxTickets - raffle.ticketsSold : null

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleBuy() {
    if (!address || !canBuy) return
    setBuyError('')

    if (qty <= 0) return setBuyError('Select at least 1 ticket')
    if (ticketCost > walletBalance) return setBuyError('Insufficient USDC balance')
    if (raffle.endsAt < Date.now()) return setBuyError('Sales have closed')
    if (remainingTickets !== null && qty > remainingTickets)
      return setBuyError(`Only ${remainingTickets} tickets remaining`)

    setBuying(true)
    try {
      const result = await sendUSDC(raffle.creatorAddress, ticketCost.toFixed(6))
      buyTickets(raffle.id, address, result.txHash, qty)
      setBuySuccess(result)
      setQty(1)
    } catch {
      setBuyError('Transaction failed. Check your wallet and try again.')
    } finally {
      setBuying(false)
    }
  }

  async function handleDraw() {
    if (drawPhase !== 'idle') return
    setDrawError('')
    setDrawLog([])
    setDrawPhase('fetching')

    try {
      const client = getPublicClient()

      // Get latest block
      const blockNumber = await client.getBlockNumber()
      setDrawLog((l) => [...l, `Fetching block #${blockNumber}...`])

      const block = await client.getBlock({ blockNumber })
      if (!block.hash) throw new Error('No block hash available')

      setDrawLog((l) => [...l, `Block hash: ${block.hash!.slice(0, 20)}...`])
      setDrawPhase('calculating')

      // Calculate winner
      const winnerIndex = selectWinner(block.hash!, raffle.participants.length)
      const winner = raffle.participants[winnerIndex]

      setDrawLog((l) => [
        ...l,
        `Seed mod ${raffle.participants.length} = index ${winnerIndex}`,
        `Winner: Ticket #${winner.id} → ${shorten(winner.buyer)}`,
      ])

      // Persist
      drawWinner(raffle.id, Number(blockNumber), block.hash!)

      setDrawPhase('done')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'Draw failed. Try again.')
      setDrawPhase('idle')
    }
  }

  async function handlePayWinner() {
    if (!address || !raffle.winnerAddress) return
    setPayError('')
    setPaying(true)

    const amount =
      raffle.prizeMode === 'pot'
        ? getPotAmount(raffle)
        : (raffle.prizeUsdc ?? 0)

    if (amount <= 0) {
      setPayError('No USDC prize to pay. Send NFT manually.')
      setPaying(false)
      return
    }

    try {
      const result = await sendUSDC(raffle.winnerAddress, amount.toFixed(6))
      payWinner(raffle.id, result.txHash)
    } catch {
      setPayError('Payout transaction failed.')
    } finally {
      setPaying(false)
    }
  }

  async function handleCancel() {
    if (!address || !isCreator) return
    setCancelling(true)
    try {
      cancelRaffle(raffle.id)
    } finally {
      setCancelling(false)
    }
  }

  const sortedParticipants = [...raffle.participants].sort((a, b) => b.timestamp - a.timestamp)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />

      {/* Confetti */}
      {showConfetti && (
        <>
          <style>{`
            @keyframes raffleConfetti {
              from { transform: translateY(100vh) rotate(0deg); opacity: 1; }
              to   { transform: translateY(-20vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {CONFETTI_ITEMS.map((item, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: '1.75rem',
                  left: item.left,
                  bottom: 0,
                  animation: `raffleConfetti ${item.duration} ${item.delay} ease-out forwards`,
                }}
              >
                {item.emoji}
              </span>
            ))}
          </div>
        </>
      )}

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        {/* Back */}
        <Link
          href="/raffle"
          className="flex items-center gap-2 text-sm w-fit"
          style={{ color: 'var(--fg)', opacity: 0.5 }}
        >
          <ArrowLeft size={14} />
          All Raffles
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* NFT Image */}
          {raffle.prizeNftImage && (
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{ maxHeight: 360 }}
            >
              <img
                src={raffle.prizeNftImage}
                alt={raffle.prizeNftName ?? 'NFT Prize'}
                className="w-full object-cover"
                style={{ maxHeight: 360 }}
              />
            </div>
          )}

          {/* Category + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
            >
              {RAFFLE_CATEGORY_LABELS[raffle.category]}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: STATUS_COLORS[raffle.status] }}
              />
              <span style={{ color: STATUS_COLORS[raffle.status] }}>
                {STATUS_LABELS[raffle.status]}
              </span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--accent)' }}>
            {raffle.title}
          </h1>

          {/* Description */}
          {raffle.description && (
            <p className="text-base leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.65 }}>
              {raffle.description}
            </p>
          )}

          {/* Prize callout */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Trophy size={20} style={{ color: 'var(--accent)' }} />
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {raffle.prizeMode === 'pot'
                  ? `Pot Prize: $${getPotAmount(raffle).toFixed(2)} USDC (grows with each ticket)`
                  : getPrizeDisplay(raffle)}
              </span>
            </div>
            {raffle.prizeDescription && (
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                {raffle.prizeDescription}
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            <span>
              Created by{' '}
              <a
                href={`https://testnet.arcscan.app/address/${raffle.creatorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent)', opacity: 0.8 }}
              >
                {shorten(raffle.creatorAddress)}
                {isCreator && ' (you)'}
              </a>
            </span>
            {isActive && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Closes in {formatTimeLeft(raffle.endsAt)}
              </span>
            )}
            {!isActive && raffle.status === 'closed' && (
              <span className="flex items-center gap-1" style={{ color: '#facc15' }}>
                <Clock size={12} />
                Sales closed {formatTimeAgo(raffle.endsAt)}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Tickets Sold" value={`${raffle.ticketsSold}${raffle.maxTickets ? ` / ${raffle.maxTickets}` : ''}`} />
          <StatBox label="Ticket Price" value={`$${raffle.ticketPrice} USDC`} />
          <StatBox label="Total Raised" value={`$${totalRaised.toFixed(2)}`} color="var(--accent)" />
          {myTickets.length > 0 && (
            <StatBox label="Your Tickets" value={myTickets.length.toString()} color="#4ade80" />
          )}
        </div>

        {/* Progress bar */}
        {raffle.maxTickets && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              <span>{raffle.ticketsSold} sold</span>
              <span>{raffle.maxTickets - raffle.ticketsSold} remaining</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (raffle.ticketsSold / raffle.maxTickets) * 100)}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
            {soldOut && (
              <p className="text-sm font-semibold text-center" style={{ color: '#f87171' }}>
                Sold out!
              </p>
            )}
          </div>
        )}

        {/* ── Purchase UI ───────────────────────────────────────────────────── */}
        {raffle.status === 'active' && (
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            {canBuy && !soldOut ? (
              <>
                <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                  Buy Tickets
                </h2>

                {buySuccess ? (
                  <div
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}
                  >
                    <p className="font-semibold" style={{ color: '#4ade80' }}>
                      Tickets purchased successfully!
                    </p>
                    <a
                      href={buySuccess.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent)', opacity: 0.8 }}
                    >
                      View on ArcScan <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => setBuySuccess(null)}
                      className="text-sm mt-1 w-fit underline"
                      style={{ color: 'var(--fg)', opacity: 0.5 }}
                    >
                      Buy more tickets
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Quick qty buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {[1, 5, 10, 25].map((n) => (
                        <button
                          key={n}
                          onClick={() => setQty(n)}
                          className="sweep px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{
                            border: '1px solid rgba(201,168,76,0.25)',
                            color: 'var(--accent)',
                            background: qty === n ? 'rgba(201,168,76,0.15)' : 'transparent',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      <input
                        type="number"
                        value={qty}
                        min={1}
                        max={remainingTickets ?? 9999}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(201,168,76,0.2)',
                          color: 'var(--fg)',
                        }}
                      />
                    </div>

                    {/* Total */}
                    <div
                      className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                        {qty} ticket{qty !== 1 ? 's' : ''} × ${raffle.ticketPrice}
                      </span>
                      <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                        ${ticketCost.toFixed(2)} USDC
                      </span>
                    </div>

                    {/* Wallet balance */}
                    <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                      Wallet balance: {walletBalance.toFixed(2)} USDC
                    </p>

                    {buyError && (
                      <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                        <AlertTriangle size={13} />
                        {buyError}
                      </p>
                    )}

                    <button
                      onClick={handleBuy}
                      disabled={buying}
                      className="sweep w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                    >
                      {buying
                        ? 'Sending transaction...'
                        : `Buy ${qty} ticket${qty !== 1 ? 's' : ''} — $${ticketCost.toFixed(2)} USDC`}
                    </button>
                  </>
                )}
              </>
            ) : soldOut ? (
              <p className="text-center font-semibold" style={{ color: '#f87171' }}>
                All tickets sold out!
              </p>
            ) : isCreator ? (
              <p className="text-center text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                You created this raffle — you cannot buy tickets
              </p>
            ) : (
              <p className="text-center text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                Connect your wallet to buy tickets
              </p>
            )}
          </div>
        )}

        {/* ── Draw UI ───────────────────────────────────────────────────────── */}
        {raffle.status === 'closed' && (
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            <div className="flex items-center gap-3">
              <Dice5 size={22} style={{ color: 'var(--accent)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                Draw Winner
              </h2>
            </div>

            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <p style={{ color: 'var(--fg)', opacity: 0.7 }}>
                Anyone can trigger the draw. The winner is selected using the current block hash —
                provably random and verifiable by anyone.
              </p>
            </div>

            {raffle.participants.length === 0 ? (
              <p className="text-sm" style={{ color: '#f87171' }}>
                No participants — raffle will be cancelled on draw.
              </p>
            ) : null}

            {drawLog.length > 0 && (
              <div
                ref={logRef}
                className="rounded-xl p-4 flex flex-col gap-1 font-mono text-xs"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {drawLog.map((line, i) => (
                  <p key={i} style={{ color: i === drawLog.length - 1 ? 'var(--accent)' : 'rgba(255,255,255,0.5)' }}>
                    {line}
                  </p>
                ))}
                {drawPhase === 'fetching' || drawPhase === 'calculating' ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>…</p>
                ) : null}
              </div>
            )}

            {drawError && (
              <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                <AlertTriangle size={13} />
                {drawError}
              </p>
            )}

            {drawPhase !== 'done' && (
              <button
                onClick={handleDraw}
                disabled={drawPhase !== 'idle'}
                className="sweep w-full py-4 rounded-xl font-bold text-base disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                {drawPhase === 'idle' && '🎲 Draw Winner'}
                {drawPhase === 'fetching' && 'Fetching block...'}
                {drawPhase === 'calculating' && 'Calculating winner...'}
              </button>
            )}
          </div>
        )}

        {/* ── Winner UI ─────────────────────────────────────────────────────── */}
        {(raffle.status === 'drawn' || raffle.status === 'paid') && raffle.winnerAddress && (
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: 'rgba(201,168,76,0.07)',
              border: '2px solid rgba(201,168,76,0.4)',
              boxShadow: '0 0 32px rgba(201,168,76,0.08)',
            }}
          >
            {/* Winner banner */}
            <div className="text-center flex flex-col gap-2">
              <p className="text-4xl">🏆</p>
              <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                Winner Drawn!
              </p>
              <p className="text-lg font-mono" style={{ color: 'var(--fg)' }}>
                {shorten(raffle.winnerAddress)}
              </p>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                Ticket #{raffle.winnerTicketId}
              </p>
              {raffle.status === 'paid' && raffle.payoutTxHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${raffle.payoutTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-sm hover:opacity-100 transition-opacity"
                  style={{ color: '#4ade80', opacity: 0.8 }}
                >
                  ✅ Prize paid <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* You won! */}
            {address && address.toLowerCase() === raffle.winnerAddress.toLowerCase() && raffle.status !== 'paid' && (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <p className="font-semibold" style={{ color: '#4ade80' }}>
                  🎉 You won! Awaiting creator payout.
                </p>
              </div>
            )}

            {/* Creator pay button */}
            {isCreator && raffle.status === 'drawn' && (
              <div className="flex flex-col gap-3">
                {payError && (
                  <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                    <AlertTriangle size={13} />
                    {payError}
                  </p>
                )}
                <button
                  onClick={handlePayWinner}
                  disabled={paying}
                  className="sweep w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                  style={{ background: '#4ade80', color: '#0a0a0a' }}
                >
                  {paying ? 'Sending prize...' : `Pay Winner — $${(raffle.prizeMode === 'pot' ? getPotAmount(raffle) : (raffle.prizeUsdc ?? 0)).toFixed(2)} USDC`}
                </button>
                {raffle.prizeNftImage && (
                  <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                    Remember to also transfer the NFT manually to {shorten(raffle.winnerAddress ?? '')}
                  </p>
                )}
              </div>
            )}

            {/* Verify randomness panel */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowVerify((v) => !v)}
                className="sweep flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
              >
                <ShieldCheck size={15} />
                {showVerify ? 'Hide' : 'Verify'} Randomness
              </button>

              {showVerify && raffle.drawBlockNumber && raffle.drawBlockHash && (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3 font-mono text-xs"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex flex-col gap-1">
                    <span style={{ color: 'var(--fg)', opacity: 0.45 }}>Block Number</span>
                    <a
                      href={`https://testnet.arcscan.app/block/${raffle.drawBlockNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent)', opacity: 0.8 }}
                    >
                      #{raffle.drawBlockNumber} <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: 'var(--fg)', opacity: 0.45 }}>Block Hash (seed)</span>
                    <span
                      className="break-all"
                      style={{ color: 'var(--fg)', opacity: 0.7 }}
                    >
                      {raffle.drawBlockHash}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: 'var(--fg)', opacity: 0.45 }}>Calculation</span>
                    <span style={{ color: 'var(--fg)', opacity: 0.7 }}>
                      BigInt({raffle.drawBlockHash.slice(0, 12)}…) mod {raffle.participants.length} ={' '}
                      {selectWinner(raffle.drawBlockHash, raffle.participants.length)} → Ticket #
                      {raffle.winnerTicketId}
                    </span>
                  </div>
                  <a
                    href={`https://testnet.arcscan.app/block/${raffle.drawBlockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:opacity-100 transition-opacity w-fit"
                    style={{ color: 'var(--accent)', opacity: 0.7 }}
                  >
                    View Block on ArcScan <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Creator Actions ───────────────────────────────────────────────── */}
        {isCreator && (raffle.status === 'active' || raffle.status === 'closed') && (
          <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--accent)' }}>
              Creator Actions
            </h2>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="sweep w-full py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
              style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Raffle'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.35 }}>
              Cancels the raffle. Manually refund all participants.
            </p>
          </div>
        )}

        {/* ── Cancelled banner ──────────────────────────────────────────────── */}
        {raffle.status === 'cancelled' && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(136,136,136,0.08)', border: '1px solid rgba(136,136,136,0.3)' }}
          >
            <p className="text-lg font-bold" style={{ color: '#888' }}>
              Raffle Cancelled
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              This raffle was cancelled. Participants should be refunded manually by the creator.
            </p>
          </div>
        )}

        {/* ── Participants List ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
            Participants ({raffle.participants.length})
          </h2>

          {raffle.participants.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Ticket size={28} style={{ color: 'var(--fg)', opacity: 0.12 }} />
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                No tickets sold yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Header */}
              <div
                className="grid text-xs font-medium pb-2 mb-1"
                style={{
                  gridTemplateColumns: '64px 1fr 90px 32px',
                  color: 'var(--fg)',
                  opacity: 0.4,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span>Ticket</span>
                <span>Buyer</span>
                <span className="text-right">Time</span>
                <span />
              </div>

              {sortedParticipants.map((ticket, i) => {
                const isWinner =
                  (raffle.status === 'drawn' || raffle.status === 'paid') &&
                  ticket.id === raffle.winnerTicketId
                return (
                  <div
                    key={ticket.id}
                    className="grid items-center py-3 text-sm"
                    style={{
                      gridTemplateColumns: '64px 1fr 90px 32px',
                      borderBottom:
                        i < sortedParticipants.length - 1
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                      background: isWinner ? 'rgba(201,168,76,0.08)' : 'transparent',
                      borderRadius: isWinner ? '8px' : undefined,
                    }}
                  >
                    <span
                      className="font-mono font-semibold"
                      style={{ color: isWinner ? 'var(--accent)' : 'var(--fg)', opacity: isWinner ? 1 : 0.7 }}
                    >
                      #{ticket.id}
                      {isWinner && ' 🏆'}
                    </span>
                    <span className="font-mono truncate" style={{ color: 'var(--fg)' }}>
                      {shorten(ticket.buyer)}
                      {address && ticket.buyer.toLowerCase() === address.toLowerCase() && (
                        <span className="ml-1.5 text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                          (you)
                        </span>
                      )}
                    </span>
                    <span
                      className="text-right"
                      style={{ color: 'var(--fg)', opacity: 0.4, fontSize: 11 }}
                    >
                      {formatTimeAgo(ticket.timestamp)}
                    </span>
                    <a
                      href={`https://testnet.arcscan.app/tx/${ticket.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent)' }}
                      aria-label="View on ArcScan"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color = 'var(--fg)',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={CARD}>
      <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
