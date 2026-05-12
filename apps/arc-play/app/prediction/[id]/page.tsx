'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAccount, useBalance } from 'wagmi'
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { sendUSDC } from '@/lib/payments'
import {
  usePredictionStore,
  getMarketOdds,
  calcPotentialPayout,
  formatTimeLeft,
  formatTimeAgo,
  shorten,
  CATEGORY_LABELS,
  type Bet,
  type Market,
} from '@/lib/predictionStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const { markets, closeMarket, resolveMarket, cancelMarket, claimPayout, placeBet } =
    usePredictionStore()
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address, query: { enabled: !!address } })

  const market = markets[id]

  // Auto-close if deadline passed
  useEffect(() => {
    if (market?.status === 'active' && market.endsAt < Date.now()) {
      closeMarket(id)
    }
  }, [market, id, closeMarket])

  // ── Betting state ───────────────────────────────────────────────────────────
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [betting, setBetting] = useState(false)
  const [betError, setBetError] = useState('')
  const [betSuccess, setBetSuccess] = useState<{ txHash: string; explorerUrl: string } | null>(null)

  // ── Resolution state ────────────────────────────────────────────────────────
  const [resolveOutcome, setResolveOutcome] = useState<'yes' | 'no' | 'invalid' | ''>('')
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')

  // ── Cancel state ────────────────────────────────────────────────────────────
  const [cancelling, setCancelling] = useState(false)

  // ── Claim state ─────────────────────────────────────────────────────────────
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimError, setClaimError] = useState('')

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  if (!market) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="max-w-4xl mx-auto w-full px-4 py-16 text-center flex flex-col items-center gap-6">
          <TrendingUp size={48} style={{ color: 'var(--fg)', opacity: 0.12 }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            Market not found
          </h2>
          <Link
            href="/prediction"
            className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
          >
            <ArrowLeft size={15} />
            Back to Markets
          </Link>
        </main>
      </div>
    )
  }

  const odds = getMarketOdds(market)
  const totalPool = market.yesPool + market.noPool
  const isCreator = address?.toLowerCase() === market.creatorAddress.toLowerCase()
  const isActive = market.status === 'active' && market.endsAt > Date.now()
  const canBet = isActive && isConnected && !isCreator
  const walletBalance = balance ? Number(balance.value) / 1e18 : 0

  const yesMultiplier = odds.yesPercent > 0 ? 100 / odds.yesPercent : 2
  const noMultiplier = odds.noPercent > 0 ? 100 / odds.noPercent : 2

  const betAmountNum = parseFloat(betAmount) || 0
  const potentialPayout =
    selectedSide && betAmountNum > 0
      ? calcPotentialPayout(betAmountNum, selectedSide, market)
      : 0

  const sortedBets = [...market.bets].sort((a, b) => b.timestamp - a.timestamp)
  const paginatedBets = sortedBets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sortedBets.length / PAGE_SIZE)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handlePlaceBet() {
    if (!selectedSide || !address) return
    setBetError('')

    if (betAmountNum <= 0) return setBetError('Enter an amount greater than 0')
    if (betAmountNum > walletBalance) return setBetError('Insufficient balance')
    if (market.endsAt < Date.now()) return setBetError('Betting deadline has passed')

    setBetting(true)
    try {
      const result = await sendUSDC(market.creatorAddress, betAmountNum.toFixed(6))
      placeBet(market.id, selectedSide, betAmountNum, result.txHash, address)
      setBetSuccess(result)
      setBetAmount('')
      setSelectedSide(null)
    } catch {
      setBetError('Transaction failed. Check your wallet and try again.')
    } finally {
      setBetting(false)
    }
  }

  async function handleResolve() {
    if (!resolveOutcome || !address) return
    setResolveError('')

    if (market.endsAt > Date.now()) {
      return setResolveError('Cannot resolve before the betting deadline has passed')
    }

    setResolving(true)
    try {
      resolveMarket(market.id, resolveOutcome, resolveNote, address)
    } catch {
      setResolveError('Failed to resolve market')
    } finally {
      setResolving(false)
    }
  }

  async function handleCancel() {
    if (!address || !isCreator) return
    setCancelling(true)
    try {
      cancelMarket(market.id)
    } finally {
      setCancelling(false)
    }
  }

  async function handleClaimPayout(bet: Bet) {
    if (!address || !bet.payout || bet.payout <= 0) return
    setClaimError('')

    if (address.toLowerCase() !== market.creatorAddress.toLowerCase()) {
      setClaimError('Creator must be connected to process payouts')
      return
    }

    setClaiming(bet.id)
    try {
      const result = await sendUSDC(bet.bettor, bet.payout.toFixed(6))
      claimPayout(market.id, bet.id, result.txHash)
    } catch {
      setClaimError('Payout transaction failed')
    } finally {
      setClaiming(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Back link */}
        <Link
          href="/prediction"
          className="flex items-center gap-2 text-sm w-fit"
          style={{ color: 'var(--fg)', opacity: 0.5 }}
        >
          <ArrowLeft size={14} />
          All Markets
        </Link>

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
              style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
            >
              {CATEGORY_LABELS[market.category]}
            </span>
            <StatusBadge status={market.status} />
          </div>

          <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--accent)' }}>
            {market.question}
          </h1>

          {market.description && (
            <p className="text-base leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.65 }}>
              {market.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            <span>
              Created by{' '}
              <a
                href={`https://testnet.arcscan.app/address/${market.creatorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent)', opacity: 0.8 }}
              >
                {shorten(market.creatorAddress)}
                {isCreator && ' (you)'}
              </a>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Created {formatTimeAgo(market.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {isActive
                ? `Closes in ${formatTimeLeft(market.endsAt)}`
                : `Closed ${formatTimeAgo(market.endsAt)}`}
            </span>
          </div>
        </div>

        {/* ── Resolution Banner ──────────────────────────────────────────────── */}
        {market.status === 'resolved' && market.outcome && (
          <div
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
              background:
                market.outcome === 'yes'
                  ? 'rgba(74,222,128,0.08)'
                  : market.outcome === 'no'
                    ? 'rgba(248,113,113,0.08)'
                    : 'rgba(250,204,21,0.08)',
              border: `1px solid ${market.outcome === 'yes' ? 'rgba(74,222,128,0.3)' : market.outcome === 'no' ? 'rgba(248,113,113,0.3)' : 'rgba(250,204,21,0.3)'}`,
            }}
          >
            <p
              className="text-xl font-bold"
              style={{
                color:
                  market.outcome === 'yes'
                    ? '#4ade80'
                    : market.outcome === 'no'
                      ? '#f87171'
                      : '#facc15',
              }}
            >
              {market.outcome === 'invalid'
                ? 'Resolved: Invalid — Refunds Available'
                : `Resolved: ${market.outcome.toUpperCase()} Won`}
            </p>
            {market.resolutionNote && (
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.7 }}>
                {market.resolutionNote}
              </p>
            )}
            {market.resolvedAt && (
              <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                Resolved {formatTimeAgo(market.resolvedAt)}
              </p>
            )}
          </div>
        )}

        {market.status === 'cancelled' && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(136,136,136,0.08)',
              border: '1px solid rgba(136,136,136,0.3)',
            }}
          >
            <p className="text-lg font-bold" style={{ color: '#888' }}>
              Market Cancelled — Refunds Available
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              The creator cancelled this market. All bets are eligible for refund.
            </p>
          </div>
        )}

        {/* ── Live Odds ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
              Live Odds
            </h2>
            <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              ${totalPool.toFixed(2)}{' '}
              <span className="text-sm font-normal" style={{ opacity: 0.5 }}>
                USDC at stake
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold" style={{ color: '#4ade80' }}>
                  YES {odds.yesPercent}%
                </span>
                <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                  ${market.yesPool.toFixed(2)} pool
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold" style={{ color: '#f87171' }}>
                  NO {odds.noPercent}%
                </span>
                <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                  ${market.noPool.toFixed(2)} pool
                </span>
              </div>
            </div>

            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: 'rgba(248,113,113,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${odds.yesPercent}%`, background: '#4ade80' }}
              />
            </div>
          </div>
        </div>

        {/* ── Betting UI ─────────────────────────────────────────────────────── */}
        {canBet && (
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
              Place Your Bet
            </h2>

            {betSuccess ? (
              <div
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <p className="font-semibold" style={{ color: '#4ade80' }}>
                  Bet placed successfully!
                </p>
                <a
                  href={betSuccess.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--accent)', opacity: 0.8 }}
                >
                  View on ArcScan <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => setBetSuccess(null)}
                  className="text-sm mt-1 w-fit underline"
                  style={{ color: 'var(--fg)', opacity: 0.5 }}
                >
                  Place another bet
                </button>
              </div>
            ) : (
              <>
                {/* Side selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedSide((s) => (s === 'yes' ? null : 'yes'))
                      setBetError('')
                    }}
                    className="sweep rounded-xl p-4 font-bold text-lg transition-all"
                    style={{
                      background:
                        selectedSide === 'yes'
                          ? 'rgba(74,222,128,0.2)'
                          : 'rgba(74,222,128,0.06)',
                      border: `2px solid ${selectedSide === 'yes' ? '#4ade80' : 'rgba(74,222,128,0.2)'}`,
                      color: '#4ade80',
                    }}
                  >
                    YES @ {yesMultiplier.toFixed(2)}x
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSide((s) => (s === 'no' ? null : 'no'))
                      setBetError('')
                    }}
                    className="sweep rounded-xl p-4 font-bold text-lg transition-all"
                    style={{
                      background:
                        selectedSide === 'no'
                          ? 'rgba(248,113,113,0.2)'
                          : 'rgba(248,113,113,0.06)',
                      border: `2px solid ${selectedSide === 'no' ? '#f87171' : 'rgba(248,113,113,0.2)'}`,
                      color: '#f87171',
                    }}
                  >
                    NO @ {noMultiplier.toFixed(2)}x
                  </button>
                </div>

                {/* Amount input (shown after side selection) */}
                {selectedSide && (
                  <div className="flex flex-col gap-3">
                    {/* Quick amounts */}
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 25, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setBetAmount(amt.toString())}
                          className="sweep px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{
                            border: '1px solid rgba(201,168,76,0.25)',
                            color: 'var(--accent)',
                            background:
                              betAmount === amt.toString()
                                ? 'rgba(201,168,76,0.15)'
                                : 'transparent',
                          }}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {/* Amount input */}
                    <div className="relative">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="Custom amount (USDC)"
                        min="0.01"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(201,168,76,0.2)',
                          color: 'var(--fg)',
                        }}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: 'var(--fg)', opacity: 0.4 }}
                      >
                        USDC
                      </span>
                    </div>

                    {/* Potential payout */}
                    {betAmountNum > 0 && (
                      <div
                        className="rounded-xl p-4 flex flex-col gap-1"
                        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
                      >
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                            Potential win
                          </span>
                          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                            ${potentialPayout.toFixed(2)} USDC
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                          Based on current odds · Final payout calculated from pool at resolution
                        </p>
                      </div>
                    )}

                    {betError && (
                      <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                        <AlertTriangle size={13} />
                        {betError}
                      </p>
                    )}

                    <div
                      className="text-xs"
                      style={{ color: 'var(--fg)', opacity: 0.35 }}
                    >
                      Wallet balance: {walletBalance.toFixed(2)} USDC
                    </div>

                    <button
                      onClick={handlePlaceBet}
                      disabled={betting || betAmountNum <= 0}
                      className="sweep w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                      style={{
                        background:
                          selectedSide === 'yes'
                            ? 'rgba(74,222,128,0.85)'
                            : 'rgba(248,113,113,0.85)',
                        color: '#0a0a0a',
                      }}
                    >
                      {betting
                        ? 'Sending transaction...'
                        : `Bet ${selectedSide.toUpperCase()} — $${betAmountNum > 0 ? betAmountNum.toFixed(2) : '0'}`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Status messages (non-bettor views) ────────────────────────────── */}
        {!canBet && market.status === 'active' && !isCreator && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {!isConnected ? (
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                Connect your wallet to place a bet
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                Market creators cannot bet on their own markets
              </p>
            )}
          </div>
        )}

        {market.status === 'closed' && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}
          >
            <p className="text-sm font-medium" style={{ color: '#facc15' }}>
              Betting closed — Awaiting resolution by creator
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              Expected resolution by {new Date(market.resolveBy).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* ── Creator Actions ────────────────────────────────────────────────── */}
        {isCreator && (market.status === 'active' || market.status === 'closed') && (
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              Creator Actions
            </h2>

            {/* Resolve panel — only when closed */}
            {market.status === 'closed' && (
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-start gap-2 p-3 rounded-xl text-xs"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: '#f87171' }}>
                    Resolution is irreversible. Choose carefully — this cannot be undone.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    What was the outcome?
                  </p>
                  <div className="flex flex-col gap-2">
                    {([['yes', 'YES won', '#4ade80'], ['no', 'NO won', '#f87171'], ['invalid', 'Invalid — Refund All', '#facc15']] as const).map(([val, label, color]) => (
                      <label
                        key={val}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                        style={{
                          background:
                            resolveOutcome === val ? `${color}18` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${resolveOutcome === val ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="outcome"
                          value={val}
                          checked={resolveOutcome === val}
                          onChange={() => setResolveOutcome(val)}
                          className="accent-current"
                        />
                        <span className="text-sm font-medium" style={{ color }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Resolution note (optional — explain your reasoning)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: 'var(--fg)',
                  }}
                />

                {resolveError && (
                  <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                    <AlertTriangle size={13} />
                    {resolveError}
                  </p>
                )}

                <button
                  onClick={handleResolve}
                  disabled={!resolveOutcome || resolving}
                  className="sweep w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                >
                  {resolving ? 'Resolving...' : 'Resolve Market'}
                </button>
              </div>
            )}

            {/* Cancel button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="sweep w-full py-2.5 rounded-xl font-medium text-sm disabled:opacity-40"
                style={{
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Market (Refund All Bets)'}
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                All bettors will receive their original bet amount back
              </p>
            </div>
          </div>
        )}

        {/* ── Payout claims (resolved or cancelled) ────────────────────────── */}
        {(market.status === 'resolved' || market.status === 'cancelled') &&
          market.bets.some((b) => b.payout && b.payout > 0 && !b.claimed) && (
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                Pending Payouts
              </h2>

              {claimError && (
                <p className="text-sm flex items-center gap-1.5" style={{ color: '#f87171' }}>
                  <AlertTriangle size={13} />
                  {claimError}
                </p>
              )}

              {!isCreator && (
                <div
                  className="rounded-xl p-3 text-xs"
                  style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.2)' }}
                >
                  <p style={{ color: '#facc15' }}>
                    Payouts are processed by the market creator. Connect as creator to process.
                  </p>
                  <p className="mt-1" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                    Smart contract escrow coming soon.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {market.bets
                  .filter((b) => b.payout && b.payout > 0 && !b.claimed)
                  .map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-mono truncate" style={{ color: 'var(--fg)' }}>
                          {shorten(bet.bettor)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                          Bet ${bet.amount.toFixed(2)} on {bet.side.toUpperCase()} →{' '}
                          <span style={{ color: '#4ade80' }}>
                            ${bet.payout!.toFixed(2)} payout
                          </span>
                        </span>
                      </div>
                      {isCreator ? (
                        <button
                          onClick={() => handleClaimPayout(bet)}
                          disabled={claiming === bet.id}
                          className="sweep flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                          style={{ background: '#4ade80', color: '#0a0a0a' }}
                        >
                          {claiming === bet.id ? 'Sending...' : `Pay $${bet.payout!.toFixed(2)}`}
                        </button>
                      ) : (
                        <span
                          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg"
                          style={{
                            background: 'rgba(250,204,21,0.1)',
                            color: '#facc15',
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* ── Bettors List ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
            Bets ({market.bets.length})
          </h2>

          {market.bets.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <TrendingUp size={28} style={{ color: 'var(--fg)', opacity: 0.12 }} />
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                No bets yet
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <div
                  className="grid text-xs font-medium pb-2 mb-1"
                  style={{
                    gridTemplateColumns: '1fr 80px 80px 80px 32px',
                    color: 'var(--fg)',
                    opacity: 0.4,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span>Bettor</span>
                  <span className="text-center">Side</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Time</span>
                  <span />
                </div>

                {paginatedBets.map((bet, i) => (
                  <div
                    key={bet.id}
                    className="grid items-center py-3 text-sm"
                    style={{
                      gridTemplateColumns: '1fr 80px 80px 80px 32px',
                      borderBottom:
                        i < paginatedBets.length - 1
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                    }}
                  >
                    <span className="font-mono truncate" style={{ color: 'var(--fg)' }}>
                      {shorten(bet.bettor)}
                    </span>
                    <span className="text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background:
                            bet.side === 'yes'
                              ? 'rgba(74,222,128,0.15)'
                              : 'rgba(248,113,113,0.15)',
                          color: bet.side === 'yes' ? '#4ade80' : '#f87171',
                        }}
                      >
                        {bet.side.toUpperCase()}
                      </span>
                    </span>
                    <span
                      className="text-right tabular-nums"
                      style={{ color: 'var(--fg)' }}
                    >
                      ${bet.amount.toFixed(2)}
                    </span>
                    <span
                      className="text-right"
                      style={{ color: 'var(--fg)', opacity: 0.4, fontSize: 11 }}
                    >
                      {formatTimeAgo(bet.timestamp)}
                    </span>
                    <a
                      href={`https://testnet.arcscan.app/tx/${bet.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--accent)' }}
                      aria-label="View on ArcScan"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 rounded-lg text-sm disabled:opacity-30"
                    style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'var(--accent)' }}
                  >
                    Prev
                  </button>
                  <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="px-3 py-1 rounded-lg text-sm disabled:opacity-30"
                    style={{ border: '1px solid rgba(201,168,76,0.2)', color: 'var(--accent)' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Market['status'] }) {
  const map = {
    active: { color: '#4ade80', label: 'Active' },
    closed: { color: '#facc15', label: 'Awaiting Resolution' },
    resolved: { color: '#60a5fa', label: 'Resolved' },
    cancelled: { color: '#888', label: 'Cancelled' },
  }
  const s = map[status]
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      <span style={{ color: s.color }}>{s.label}</span>
    </span>
  )
}
