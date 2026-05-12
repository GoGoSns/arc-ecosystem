'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Plus, User, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  usePredictionStore,
  getMarketsByStatus,
  getMarketOdds,
  formatTimeLeft,
  CATEGORIES,
  CATEGORY_LABELS,
  type Market,
} from '@/lib/predictionStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  active: { color: '#4ade80', label: 'Active' },
  closed: { color: '#facc15', label: 'Awaiting Resolution' },
  resolved: { color: '#60a5fa', label: 'Resolved' },
  cancelled: { color: '#888', label: 'Cancelled' },
}

const STATUS_FILTERS = ['all', 'active', 'closed', 'resolved'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PredictionPage() {
  const { markets, closeMarket } = usePredictionStore()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    const now = Date.now()
    Object.values(markets).forEach((m) => {
      if (m.status === 'active' && m.endsAt < now) closeMarket(m.id)
    })
  }, [markets, closeMarket])

  const allMarkets = getMarketsByStatus(markets, statusFilter)
  const filtered =
    categoryFilter === 'all' ? allMarkets : allMarkets.filter((m) => m.category === categoryFilter)

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
              <TrendingUp size={28} />
              Prediction Market
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Bet on real-world outcomes with USDC
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/prediction/my-bets"
              className="sweep flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
            >
              <User size={15} />
              My Bets
            </Link>
            <Link
              href="/prediction/create"
              className="sweep flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={15} />
              Create Market
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          <span className="text-sm ml-auto" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            {filtered.length} market{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Market Grid / Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <TrendingUp size={40} style={{ color: 'var(--fg)', opacity: 0.12 }} />
            <p className="text-lg font-medium" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              No markets yet. Create the first one!
            </p>
            <Link
              href="/prediction/create"
              className="sweep px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Create Market
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Market Card ───────────────────────────────────────────────────────────────

function MarketCard({ market }: { market: Market }) {
  const odds = getMarketOdds(market)
  const totalPool = market.yesPool + market.noPool
  const statusInfo = STATUS_STYLES[market.status] ?? STATUS_STYLES.cancelled
  const isActive = market.status === 'active' && market.endsAt > Date.now()

  return (
    <Link
      href={`/prediction/${market.id}`}
      className="sweep rounded-2xl p-5 flex flex-col gap-4 transition-all hover:scale-[1.01]"
      style={CARD}
    >
      {/* Category + Status */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
          style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
        >
          {market.category}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: statusInfo.color }}
          />
          <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
        </span>
      </div>

      {/* Question */}
      <h3
        className="text-base font-semibold leading-snug"
        style={{
          color: 'var(--fg)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {market.question}
      </h3>

      {/* Description */}
      {market.description && (
        <p
          className="text-sm"
          style={{
            color: 'var(--fg)',
            opacity: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {market.description}
        </p>
      )}

      {/* Odds bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span style={{ color: '#4ade80' }}>YES {odds.yesPercent}%</span>
          <span style={{ color: '#f87171' }}>NO {odds.noPercent}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(248,113,113,0.3)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${odds.yesPercent}%`, background: '#4ade80' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
        <span>
          ${totalPool.toFixed(2)} pool · {market.bets.length} bet{market.bets.length !== 1 ? 's' : ''}
        </span>
        {market.status === 'resolved' && market.outcome ? (
          <span
            className="font-semibold"
            style={{
              color:
                market.outcome === 'yes'
                  ? '#4ade80'
                  : market.outcome === 'no'
                    ? '#f87171'
                    : '#facc15',
            }}
          >
            {market.outcome === 'invalid' ? 'Invalid' : `${market.outcome.toUpperCase()} won`}
          </span>
        ) : isActive ? (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Closes in {formatTimeLeft(market.endsAt)}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatTimeLeft(market.endsAt)}
          </span>
        )}
      </div>
    </Link>
  )
}
