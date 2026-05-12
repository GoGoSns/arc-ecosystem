'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ArrowLeft, TrendingUp, User, Clock, ExternalLink } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  usePredictionStore,
  getMyBets,
  formatTimeAgo,
  shorten,
  type Bet,
  type Market,
} from '@/lib/predictionStore'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

type Tab = 'active' | 'pending' | 'settled'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyBetsPage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { markets } = usePredictionStore()
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
              Connect to view your betting history
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
            href="/prediction"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--fg)', opacity: 0.45 }}
          >
            <ArrowLeft size={13} />
            Back to Markets
          </Link>
        </main>
      </div>
    )
  }

  const allMyBets = getMyBets(markets, address)

  // Partition by tab
  const activeBets = allMyBets.filter(({ market }) => market.status === 'active')
  const pendingBets = allMyBets.filter(({ market }) => market.status === 'closed')
  const settledBets = allMyBets.filter(
    ({ market }) => market.status === 'resolved' || market.status === 'cancelled',
  )

  const tabItems: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeBets.length },
    { key: 'pending', label: 'Pending', count: pendingBets.length },
    { key: 'settled', label: 'Settled', count: settledBets.length },
  ]

  const currentBets =
    tab === 'active' ? activeBets : tab === 'pending' ? pendingBets : settledBets

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalWagered = allMyBets.reduce((s, { bet }) => s + bet.amount, 0)

  const wonBets = settledBets.filter(
    ({ bet, market }) =>
      market.status === 'resolved' &&
      market.outcome &&
      market.outcome !== 'invalid' &&
      bet.side === market.outcome,
  )
  const lostBets = settledBets.filter(
    ({ bet, market }) =>
      market.status === 'resolved' &&
      market.outcome &&
      market.outcome !== 'invalid' &&
      bet.side !== market.outcome,
  )
  const totalWon = wonBets.reduce((s, { bet }) => s + (bet.payout ?? 0), 0)
  const winRate =
    wonBets.length + lostBets.length > 0
      ? Math.round((wonBets.length / (wonBets.length + lostBets.length)) * 100)
      : 0

  // ── Render ─────────────────────────────────────────────────────────────────

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
              <User size={28} />
              My Bets
            </h1>
            <p className="text-sm mt-1 font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              {shorten(address)}
            </p>
          </div>
          <Link
            href="/prediction"
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--fg)', opacity: 0.5 }}
          >
            <ArrowLeft size={14} />
            All Markets
          </Link>
        </div>

        {/* Stats grid */}
        {allMyBets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Wagered" value={`$${totalWagered.toFixed(2)}`} color="var(--accent)" />
            <StatCard
              label="Total Won"
              value={`$${totalWon.toFixed(2)}`}
              color={totalWon > 0 ? '#4ade80' : 'var(--fg)'}
            />
            <StatCard
              label="Active Positions"
              value={activeBets.length.toString()}
              color="var(--accent)"
            />
            <StatCard
              label="Win Rate"
              value={wonBets.length + lostBets.length > 0 ? `${winRate}%` : '—'}
              color={winRate >= 50 ? '#4ade80' : winRate > 0 ? '#f87171' : 'var(--fg)'}
            />
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl self-start"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {tabItems.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
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

        {/* Bet list */}
        {currentBets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <TrendingUp size={36} style={{ color: 'var(--fg)', opacity: 0.12 }} />
            <p className="text-base" style={{ color: 'var(--fg)', opacity: 0.35 }}>
              {tab === 'active'
                ? 'No active bets'
                : tab === 'pending'
                  ? 'No bets awaiting resolution'
                  : 'No settled bets yet'}
            </p>
            <Link
              href="/prediction"
              className="sweep px-5 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
            >
              Browse Markets
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentBets.map(({ bet, market }) => (
              <BetRow key={bet.id} bet={bet} market={market} />
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
    <div className="sweep rounded-2xl p-4 flex flex-col gap-1" style={CARD}>
      <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

// ── Bet Row ───────────────────────────────────────────────────────────────────

function BetRow({ bet, market }: { bet: Bet; market: Market }) {
  const isResolved = market.status === 'resolved'
  const isCancelled = market.status === 'cancelled'

  const won =
    isResolved &&
    market.outcome &&
    market.outcome !== 'invalid' &&
    bet.side === market.outcome

  const lost =
    isResolved &&
    market.outcome &&
    market.outcome !== 'invalid' &&
    bet.side !== market.outcome

  const refundable = (isResolved && market.outcome === 'invalid') || isCancelled

  function getStatusEl() {
    if (market.status === 'active') {
      return (
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
          <Clock size={11} />
          Awaiting outcome
        </span>
      )
    }
    if (market.status === 'closed') {
      return (
        <span className="text-xs" style={{ color: '#facc15' }}>
          Awaiting creator resolution
        </span>
      )
    }
    if (won && bet.payout) {
      return (
        <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
          {bet.claimed ? `+$${bet.payout.toFixed(2)} paid` : `+$${bet.payout.toFixed(2)} (claim pending)`}
        </span>
      )
    }
    if (lost) {
      return (
        <span className="text-sm font-semibold" style={{ color: '#f87171', opacity: 0.7 }}>
          -${bet.amount.toFixed(2)}
        </span>
      )
    }
    if (refundable && bet.payout) {
      return (
        <span className="text-sm" style={{ color: '#facc15' }}>
          {bet.claimed
            ? `$${bet.payout.toFixed(2)} refunded`
            : `$${bet.payout.toFixed(2)} refund pending`}
        </span>
      )
    }
    return null
  }

  return (
    <div className="sweep rounded-2xl p-4 flex flex-col gap-3" style={CARD}>
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/prediction/${market.id}`}
          className="text-sm font-medium leading-snug hover:opacity-80 transition-opacity flex-1 min-w-0"
          style={{ color: 'var(--fg)' }}
        >
          {market.question}
        </Link>
        <span
          className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: bet.side === 'yes' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
            color: bet.side === 'yes' ? '#4ade80' : '#f87171',
          }}
        >
          {bet.side.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums" style={{ color: 'var(--fg)', opacity: 0.7 }}>
            ${bet.amount.toFixed(2)} staked
          </span>
          <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.35 }}>
            {formatTimeAgo(bet.timestamp)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {getStatusEl()}
          <a
            href={`https://testnet.arcscan.app/tx/${bet.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--accent)' }}
            aria-label="View on ArcScan"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Claim TX link (after payout processed) */}
      {bet.claimTxHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${bet.claimTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:opacity-100 transition-opacity w-fit"
          style={{ color: 'var(--accent)', opacity: 0.6 }}
        >
          Payout tx <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}
