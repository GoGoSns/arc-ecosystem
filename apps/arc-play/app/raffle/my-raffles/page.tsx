'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ArrowLeft, Ticket, User, ExternalLink } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  useRaffleStore,
  getMyTickets,
  formatTimeAgo,
  shorten,
  getPotAmount,
  getPrizeDisplay,
  type Raffle,
  type Ticket as RaffleTicket,
} from '@/lib/raffleStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

type Tab = 'active' | 'awaiting' | 'won' | 'lost' | 'cancelled'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyRafflesPage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { raffles } = useRaffleStore()
  const [tab, setTab] = useState<Tab>('active')

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="max-w-md mx-auto w-full px-4 py-16 flex flex-col items-center gap-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)' }}
          >
            <User size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
              Connect your wallet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
              Connect to view your raffle tickets
            </p>
          </div>
          <button
            onClick={() => connect({ connector: injected() })}
            className="sweep w-full px-8 py-3 rounded-xl text-base font-semibold"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Connect Wallet
          </button>
          <Link
            href="/raffle"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--fg)', opacity: 0.45 }}
          >
            <ArrowLeft size={13} />
            Back to Raffles
          </Link>
        </main>
      </div>
    )
  }

  const myEntries = getMyTickets(raffles, address)

  // Partition into tabs
  const activeEntries = myEntries.filter(({ raffle }) => raffle.status === 'active')
  const awaitingEntries = myEntries.filter(({ raffle }) => raffle.status === 'closed')
  const wonEntries = myEntries.filter(
    ({ raffle }) =>
      (raffle.status === 'drawn' || raffle.status === 'paid') &&
      raffle.winnerAddress?.toLowerCase() === address.toLowerCase(),
  )
  const lostEntries = myEntries.filter(
    ({ raffle }) =>
      (raffle.status === 'drawn' || raffle.status === 'paid') &&
      raffle.winnerAddress?.toLowerCase() !== address.toLowerCase(),
  )
  const cancelledEntries = myEntries.filter(({ raffle }) => raffle.status === 'cancelled')

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeEntries.length },
    { key: 'awaiting', label: 'Awaiting Draw', count: awaitingEntries.length },
    { key: 'won', label: 'Won', count: wonEntries.length },
    { key: 'lost', label: 'Lost', count: lostEntries.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledEntries.length },
  ]

  const currentEntries =
    tab === 'active'
      ? activeEntries
      : tab === 'awaiting'
        ? awaitingEntries
        : tab === 'won'
          ? wonEntries
          : tab === 'lost'
            ? lostEntries
            : cancelledEntries

  // Stats
  const totalTickets = myEntries.reduce((s, { tickets }) => s + tickets.length, 0)

  const wonAmountTotal = wonEntries.reduce((s, { raffle }) => {
    const prize = raffle.prizeMode === 'pot' ? getPotAmount(raffle) : (raffle.prizeUsdc ?? 0)
    return s + prize
  }, 0)

  const decisiveEntries = wonEntries.length + lostEntries.length
  const winRate =
    decisiveEntries > 0 ? Math.round((wonEntries.length / decisiveEntries) * 100) : null

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight flex items-center gap-3"
              style={{ color: 'var(--accent)' }}
            >
              <Ticket size={28} />
              My Raffles
            </h1>
            <p className="text-sm mt-1 font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              {shorten(address)}
            </p>
          </div>
          <Link
            href="/raffle"
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--fg)', opacity: 0.5 }}
          >
            <ArrowLeft size={14} />
            All Raffles
          </Link>
        </div>

        {/* Stats */}
        {myEntries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active Raffles" value={activeEntries.length.toString()} color="var(--accent)" />
            <StatCard label="Tickets Owned" value={totalTickets.toString()} color="var(--accent)" />
            <StatCard
              label="Won (USDC)"
              value={wonAmountTotal > 0 ? `$${wonAmountTotal.toFixed(2)}` : '—'}
              color={wonAmountTotal > 0 ? '#4ade80' : 'var(--fg)'}
            />
            <StatCard
              label="Win Rate"
              value={winRate !== null ? `${winRate}%` : '—'}
              color={winRate !== null && winRate >= 50 ? '#4ade80' : winRate !== null && winRate > 0 ? '#f87171' : 'var(--fg)'}
            />
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl self-start overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {tabDefs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              style={{
                background: tab === key ? 'rgba(201,168,76,0.2)' : 'transparent',
                color: tab === key ? 'var(--accent)' : 'var(--fg)',
                opacity: tab === key ? 1 : 0.55,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: tab === key ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Entry list */}
        {currentEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Ticket size={36} style={{ color: 'var(--fg)', opacity: 0.12 }} />
            <p className="text-base" style={{ color: 'var(--fg)', opacity: 0.35 }}>
              {tab === 'active'
                ? 'No active raffles'
                : tab === 'awaiting'
                  ? 'No raffles awaiting draw'
                  : tab === 'won'
                    ? 'No wins yet — keep trying!'
                    : tab === 'lost'
                      ? 'No losses yet'
                      : 'No cancelled raffles'}
            </p>
            <Link
              href="/raffle"
              className="sweep px-5 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
            >
              Browse Raffles
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentEntries.map(({ raffle, tickets }) => (
              <EntryRow key={raffle.id} raffle={raffle} tickets={tickets} address={address} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={CARD}>
      <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

// ── Entry Row ─────────────────────────────────────────────────────────────────

function EntryRow({
  raffle,
  tickets,
  address,
}: {
  raffle: Raffle
  tickets: RaffleTicket[]
  address: string
}) {
  const isWinner =
    (raffle.status === 'drawn' || raffle.status === 'paid') &&
    raffle.winnerAddress?.toLowerCase() === address.toLowerCase()

  const isLost =
    (raffle.status === 'drawn' || raffle.status === 'paid') &&
    raffle.winnerAddress?.toLowerCase() !== address.toLowerCase()

  function getStatusEl() {
    if (raffle.status === 'active') {
      return <span className="text-xs" style={{ color: '#4ade80' }}>Sales open</span>
    }
    if (raffle.status === 'closed') {
      return <span className="text-xs" style={{ color: '#facc15' }}>Awaiting draw</span>
    }
    if (isWinner) {
      const prize = raffle.prizeMode === 'pot' ? getPotAmount(raffle) : (raffle.prizeUsdc ?? 0)
      if (raffle.status === 'paid') {
        return (
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
              🏆 Won! ✅ Paid
            </span>
            {prize > 0 && (
              <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                +${prize.toFixed(2)} USDC
              </span>
            )}
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            🏆 You won!
          </span>
          <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            Awaiting payout
          </span>
        </div>
      )
    }
    if (isLost) {
      return (
        <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
          Better luck next time
        </span>
      )
    }
    if (raffle.status === 'cancelled') {
      return <span className="text-xs" style={{ color: '#888' }}>Refund pending</span>
    }
    return null
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        ...CARD,
        ...(isWinner ? { border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.05)' } : {}),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/raffle/${raffle.id}`}
          className="text-sm font-medium leading-snug hover:opacity-80 transition-opacity flex-1 min-w-0"
          style={{ color: 'var(--fg)' }}
        >
          {isWinner && '🏆 '}
          {raffle.title}
        </Link>
        {getStatusEl()}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            Your tickets ({tickets.length} of {raffle.ticketsSold}):
          </span>
          <div className="flex flex-wrap gap-1">
            {tickets.map((t) => (
              <span
                key={t.id}
                className="font-mono text-xs px-2 py-0.5 rounded-lg"
                style={{
                  background:
                    t.id === raffle.winnerTicketId
                      ? 'rgba(201,168,76,0.2)'
                      : 'rgba(255,255,255,0.06)',
                  color:
                    t.id === raffle.winnerTicketId ? 'var(--accent)' : 'var(--fg)',
                  border: t.id === raffle.winnerTicketId ? '1px solid rgba(201,168,76,0.3)' : 'none',
                }}
              >
                #{t.id}
                {t.id === raffle.winnerTicketId && ' 🏆'}
              </span>
            ))}
          </div>
        </div>

        <a
          href={`https://testnet.arcscan.app/tx/${tickets[0].txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--accent)' }}
          aria-label="View on ArcScan"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Payout tx link */}
      {isWinner && raffle.status === 'paid' && raffle.payoutTxHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${raffle.payoutTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:opacity-100 transition-opacity w-fit"
          style={{ color: '#4ade80', opacity: 0.7 }}
        >
          Payout tx <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}
