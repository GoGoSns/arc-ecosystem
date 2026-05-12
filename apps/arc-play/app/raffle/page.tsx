'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Ticket, Plus, User, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  useRaffleStore,
  getRafflesByStatus,
  formatTimeLeft,
  getPrizeDisplay,
  getPotAmount,
  RAFFLE_CATEGORIES,
  RAFFLE_CATEGORY_LABELS,
  shorten,
  type Raffle,
} from '@/lib/raffleStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  active: { color: '#4ade80', label: 'Active' },
  closed: { color: '#facc15', label: 'Awaiting Draw' },
  drawn: { color: '#c9a84c', label: 'Drawn' },
  paid: { color: '#60a5fa', label: 'Paid Out' },
  cancelled: { color: '#888', label: 'Cancelled' },
}

const STATUS_FILTERS = ['all', 'active', 'closed', 'drawn', 'cancelled'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RafflePage() {
  const { raffles, closeRaffleIfDue } = useRaffleStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    const now = Date.now()
    Object.values(raffles).forEach((r) => {
      if (r.status === 'active' && r.endsAt < now) closeRaffleIfDue(r.id)
    })
  }, [raffles, closeRaffleIfDue])

  const allRaffles = getRafflesByStatus(raffles, statusFilter)
  const filtered =
    categoryFilter === 'all' ? allRaffles : allRaffles.filter((r) => r.category === categoryFilter)

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight flex items-center gap-3"
              style={{ color: 'var(--accent)' }}
            >
              <Ticket size={28} />
              NFT Raffle
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Fair raffles with onchain randomness
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/raffle/my-raffles"
              className="sweep flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
            >
              <User size={15} />
              My Raffles
            </Link>
            <Link
              href="/raffle/create"
              className="sweep flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={15} />
              Create Raffle
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex gap-1 p-1 rounded-xl overflow-x-auto"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background: statusFilter === s ? 'rgba(201,168,76,0.2)' : 'transparent',
                  color: statusFilter === s ? 'var(--accent)' : 'var(--fg)',
                  opacity: statusFilter === s ? 1 : 0.55,
                }}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: 'var(--fg)',
            }}
          >
            <option value="all">All Categories</option>
            {RAFFLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {RAFFLE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          <span className="text-sm ml-auto" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            {filtered.length} raffle{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid / Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Ticket size={40} style={{ color: 'var(--fg)', opacity: 0.12 }} />
            <p className="text-lg font-medium" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              No raffles yet. Be the first to host one!
            </p>
            <Link
              href="/raffle/create"
              className="sweep px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Create Raffle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Raffle Card ───────────────────────────────────────────────────────────────

function RaffleCard({ raffle }: { raffle: Raffle }) {
  const statusInfo = STATUS_STYLES[raffle.status] ?? STATUS_STYLES.cancelled
  const isActive = raffle.status === 'active' && raffle.endsAt > Date.now()

  return (
    <Link
      href={`/raffle/${raffle.id}`}
      className="sweep rounded-2xl flex flex-col overflow-hidden transition-all hover:scale-[1.01]"
      style={CARD}
    >
      {/* NFT Image */}
      {raffle.prizeNftImage && (
        <div className="w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img
            src={raffle.prizeNftImage}
            alt={raffle.prizeNftName ?? 'NFT Prize'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* Category + Status */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
          >
            {RAFFLE_CATEGORY_LABELS[raffle.category]}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusInfo.color }}
            />
            <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-base font-semibold leading-snug"
          style={{
            color: 'var(--fg)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {raffle.title}
        </h3>

        {/* Prize */}
        <div
          className="text-sm font-medium px-3 py-2 rounded-xl"
          style={{ background: 'rgba(201,168,76,0.07)', color: 'var(--accent)' }}
        >
          {raffle.prizeMode === 'pot'
            ? `🏆 $${getPotAmount(raffle).toFixed(2)} pot (${raffle.ticketsSold} tickets)`
            : `🏆 ${getPrizeDisplay(raffle)}`}
        </div>

        {/* Stats */}
        <div
          className="flex items-center justify-between text-xs"
          style={{ color: 'var(--fg)', opacity: 0.5 }}
        >
          <span>
            {raffle.ticketsSold}
            {raffle.maxTickets ? ` / ${raffle.maxTickets}` : ''} tickets · $
            {raffle.ticketPrice} USDC ea.
          </span>
          {isActive ? (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTimeLeft(raffle.endsAt)}
            </span>
          ) : (
            <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
          )}
        </div>

        {/* Winner badge */}
        {(raffle.status === 'drawn' || raffle.status === 'paid') && raffle.winnerAddress && (
          <div
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)' }}
          >
            🏆 Won by {shorten(raffle.winnerAddress)}
          </div>
        )}
      </div>
    </Link>
  )
}
