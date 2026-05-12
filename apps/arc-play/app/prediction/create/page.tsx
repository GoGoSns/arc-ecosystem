'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ArrowLeft, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  usePredictionStore,
  getMarketOdds,
  formatTimeLeft,
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type Market,
} from '@/lib/predictionStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(201,168,76,0.2)',
  color: 'var(--fg)',
}

const NOW = Date.now()
const MIN_ENDS_AT = new Date(NOW + 3600_000).toISOString().slice(0, 16)
const MAX_ENDS_AT = new Date(NOW + 365 * 86400_000).toISOString().slice(0, 16)

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateMarketPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { createMarket } = usePredictionStore()

  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('crypto')
  const [endsAt, setEndsAt] = useState('')
  const [resolveBy, setResolveBy] = useState('')
  const [oracleAck, setOracleAck] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Build a preview market from form state
  const previewMarket: Market = {
    id: 'preview',
    question: question || 'Your market question will appear here...',
    description,
    category,
    endsAt: endsAt ? new Date(endsAt).getTime() : NOW + 86400_000,
    resolveBy: resolveBy ? new Date(resolveBy).getTime() : NOW + 2 * 86400_000,
    creatorAddress: address ?? '0x0000...0000',
    status: 'active',
    yesPool: 0,
    noPool: 0,
    bets: [],
    createdAt: NOW,
  }
  const previewOdds = getMarketOdds(previewMarket)
  const previewEnds = endsAt ? new Date(endsAt).getTime() : NOW + 86400_000

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (!question.trim()) errs.question = 'Question is required'
    else if (question.length > 200) errs.question = 'Max 200 characters'

    if (!endsAt) errs.endsAt = 'Betting deadline is required'
    else {
      const t = new Date(endsAt).getTime()
      if (t < NOW + 3600_000) errs.endsAt = 'Deadline must be at least 1 hour from now'
      if (t > NOW + 365 * 86400_000) errs.endsAt = 'Deadline cannot be more than 1 year away'
    }

    if (!resolveBy) errs.resolveBy = 'Expected resolution time is required'
    else if (endsAt && new Date(resolveBy).getTime() <= new Date(endsAt).getTime()) {
      errs.resolveBy = 'Resolution time must be after the betting deadline'
    }

    if (!oracleAck) errs.oracleAck = 'You must accept the oracle responsibility'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !validate()) return
    setSubmitting(true)
    try {
      const market = createMarket({
        question: question.trim(),
        description: description.trim(),
        category,
        endsAt: new Date(endsAt).getTime(),
        resolveBy: new Date(resolveBy).getTime(),
        creatorAddress: address,
      })
      router.push(`/prediction/${market.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Not connected ─────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="max-w-md mx-auto w-full px-4 py-16 flex flex-col items-center gap-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)' }}
          >
            <TrendingUp size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
              Connect your wallet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
              You need a connected wallet to create a prediction market
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

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/prediction"
          className="flex items-center gap-2 text-sm mb-8 w-fit"
          style={{ color: 'var(--fg)', opacity: 0.5 }}
        >
          <ArrowLeft size={14} />
          All Markets
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-8" style={{ color: 'var(--accent)' }}>
          Create Prediction Market
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* ── Form ─────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-6">

            {/* Question */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Market Question <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Will BTC hit $200k by end of 2026?"
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                style={INPUT_STYLE}
              />
              <div className="flex justify-between items-center">
                {errors.question ? (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                    <AlertTriangle size={11} /> {errors.question}
                  </p>
                ) : (
                  <span />
                )}
                <span
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--fg)', opacity: question.length > 180 ? 0.8 : 0.3 }}
                >
                  {question.length}/200
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Description{' '}
                <span className="text-xs font-normal" style={{ opacity: 0.45 }}>
                  optional
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, sources, or resolution criteria..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                style={INPUT_STYLE}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Category <span style={{ color: '#f87171' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            {/* Betting deadline */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Betting Deadline <span style={{ color: '#f87171' }}>*</span>
              </label>
              <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                Bets close at this time. Min 1 hour from now.
              </p>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                min={MIN_ENDS_AT}
                max={MAX_ENDS_AT}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              />
              {errors.endsAt && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.endsAt}
                </p>
              )}
            </div>

            {/* Resolution time */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Expected Resolution Time <span style={{ color: '#f87171' }}>*</span>
              </label>
              <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                When you expect to know the outcome and resolve this market.
              </p>
              <input
                type="datetime-local"
                value={resolveBy}
                onChange={(e) => setResolveBy(e.target.value)}
                min={endsAt || MIN_ENDS_AT}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              />
              {errors.resolveBy && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.resolveBy}
                </p>
              )}
            </div>

            {/* Oracle disclaimer */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.7 }}>
                  <strong style={{ color: 'var(--accent)' }}>You are the oracle.</strong> As the
                  market creator, you are responsible for resolving this market fairly after the
                  deadline. Bettors trust you to report the true outcome. In this MVP, payouts are
                  trust-based — you will be responsible for sending winnings to winners.
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oracleAck}
                  onChange={(e) => setOracleAck(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm" style={{ color: 'var(--fg)' }}>
                  I understand I am the oracle and commit to resolving this market fairly
                </span>
              </label>
              {errors.oracleAck && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.oracleAck}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="sweep w-full py-4 rounded-xl font-semibold text-base disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              {submitting ? 'Creating Market...' : 'Create Market'}
            </button>
          </form>

          {/* ── Preview ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Preview
            </p>

            <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
              {/* Category + status */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
                  style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
                >
                  {category}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#4ade80' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                  Active
                </span>
              </div>

              {/* Question */}
              <h3
                className="text-base font-semibold leading-snug"
                style={{
                  color: question ? 'var(--fg)' : 'var(--fg)',
                  opacity: question ? 1 : 0.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {question || 'Your market question will appear here...'}
              </h3>

              {/* Odds bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span style={{ color: '#4ade80' }}>YES {previewOdds.yesPercent}%</span>
                  <span style={{ color: '#f87171' }}>NO {previewOdds.noPercent}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(248,113,113,0.3)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: '50%', background: '#4ade80' }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: 'var(--fg)', opacity: 0.5 }}
              >
                <span>$0.00 pool · 0 bets</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {endsAt
                    ? `Closes in ${formatTimeLeft(previewEnds)}`
                    : 'Set deadline above'}
                </span>
              </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.3 }}>
              Markets are stored locally. No contract deployment required.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
