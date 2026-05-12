'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ArrowLeft, AlertTriangle, Ticket, Trophy } from 'lucide-react'
import Navbar from '@/components/Navbar'
import {
  useRaffleStore,
  getPotAmount,
  RAFFLE_CATEGORIES,
  RAFFLE_CATEGORY_LABELS,
  type RaffleCategory,
  type Raffle,
} from '@/lib/raffleStore'

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

type PrizeType = 'usdc' | 'nft' | 'both'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateRafflePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { createRaffle } = useRaffleStore()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<RaffleCategory>('usdc')
  const [prizeMode, setPrizeMode] = useState<'fixed' | 'pot'>('fixed')
  const [prizeType, setPrizeType] = useState<PrizeType>('usdc')
  const [prizeUsdc, setPrizeUsdc] = useState('')
  const [prizeNftImage, setPrizeNftImage] = useState('')
  const [prizeNftName, setPrizeNftName] = useState('')
  const [prizeDescription, setPrizeDescription] = useState('')
  const [creatorFeePercent, setCreatorFeePercent] = useState(5)
  const [ticketPrice, setTicketPrice] = useState('')
  const [maxTickets, setMaxTickets] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [commitAck, setCommitAck] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // ── Preview ──────────────────────────────────────────────────────────────────

  const previewTicketPrice = parseFloat(ticketPrice) || 0
  const previewMaxTickets = maxTickets ? parseInt(maxTickets) : undefined
  const previewPot = previewTicketPrice * 0 // 0 tickets at preview time

  const previewRaffle: Raffle = {
    id: 'preview',
    title: title || 'Your raffle title...',
    description,
    category,
    prizeMode,
    prizeUsdc: prizeMode === 'fixed' && (prizeType === 'usdc' || prizeType === 'both') ? parseFloat(prizeUsdc) || undefined : undefined,
    prizeNftImage: prizeMode === 'fixed' && (prizeType === 'nft' || prizeType === 'both') ? prizeNftImage || undefined : undefined,
    prizeNftName: prizeMode === 'fixed' && (prizeType === 'nft' || prizeType === 'both') ? prizeNftName || undefined : undefined,
    prizeDescription,
    creatorFeePercent: prizeMode === 'pot' ? creatorFeePercent : undefined,
    ticketPrice: previewTicketPrice,
    maxTickets: previewMaxTickets,
    ticketsSold: 0,
    endsAt: endsAt ? new Date(endsAt).getTime() : NOW + 86400_000,
    createdAt: NOW,
    creatorAddress: address ?? '0x0000...0000',
    participants: [],
    status: 'active',
  }

  const previewPrize =
    prizeMode === 'pot'
      ? `$${previewPot.toFixed(2)} pot`
      : prizeType === 'usdc'
        ? prizeUsdc ? `${prizeUsdc} USDC` : '—'
        : prizeType === 'nft'
          ? prizeNftName || prizeNftImage ? prizeNftName || 'NFT' : '—'
          : [prizeUsdc ? `${prizeUsdc} USDC` : '', prizeNftName || ''].filter(Boolean).join(' + ') || '—'

  // ── Validation ───────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {}
    const nowTs = Date.now()

    if (!title.trim()) errs.title = 'Title is required'
    else if (title.length > 100) errs.title = 'Max 100 characters'

    if (prizeMode === 'fixed') {
      if (prizeType === 'usdc' || prizeType === 'both') {
        if (!prizeUsdc || parseFloat(prizeUsdc) <= 0) errs.prizeUsdc = 'Enter a valid USDC prize amount'
      }
      if (prizeType === 'nft' || prizeType === 'both') {
        if (!prizeNftImage.trim()) errs.prizeNftImage = 'NFT image URL is required'
      }
    }

    const price = parseFloat(ticketPrice)
    if (!ticketPrice || isNaN(price) || price <= 0) errs.ticketPrice = 'Ticket price must be > 0'

    if (maxTickets) {
      const max = parseInt(maxTickets)
      if (isNaN(max) || max < 1 || max > 10000) errs.maxTickets = 'Must be between 1 and 10,000'
    }

    if (!endsAt) errs.endsAt = 'Sales deadline is required'
    else {
      const t = new Date(endsAt).getTime()
      if (t < nowTs + 3600_000) errs.endsAt = 'Deadline must be at least 1 hour from now'
    }

    if (!commitAck) errs.commitAck = 'You must commit to paying the winner'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !validate()) return
    setSubmitting(true)
    try {
      const raffle = createRaffle({
        title: title.trim(),
        description: description.trim(),
        category,
        prizeMode,
        prizeUsdc:
          prizeMode === 'fixed' && (prizeType === 'usdc' || prizeType === 'both')
            ? parseFloat(prizeUsdc)
            : undefined,
        prizeNftImage:
          prizeMode === 'fixed' && (prizeType === 'nft' || prizeType === 'both')
            ? prizeNftImage.trim() || undefined
            : undefined,
        prizeNftName:
          prizeMode === 'fixed' && (prizeType === 'nft' || prizeType === 'both')
            ? prizeNftName.trim() || undefined
            : undefined,
        prizeDescription: prizeDescription.trim(),
        creatorFeePercent: prizeMode === 'pot' ? creatorFeePercent : undefined,
        ticketPrice: parseFloat(ticketPrice),
        maxTickets: maxTickets ? parseInt(maxTickets) : undefined,
        endsAt: new Date(endsAt).getTime(),
        creatorAddress: address,
      })
      router.push(`/raffle/${raffle.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Not connected ────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="max-w-md mx-auto w-full px-4 py-16 flex flex-col items-center gap-6 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)' }}
          >
            <Ticket size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
              Connect your wallet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
              You need a connected wallet to create a raffle
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

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/raffle"
          className="flex items-center gap-2 text-sm mb-8 w-fit"
          style={{ color: 'var(--fg)', opacity: 0.5 }}
        >
          <ArrowLeft size={14} />
          All Raffles
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-8" style={{ color: 'var(--accent)' }}>
          Create Raffle
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* ── Form ─────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-6">

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Win 100 USDC + Cool NFT!"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              />
              <div className="flex justify-between items-center">
                {errors.title ? (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                    <AlertTriangle size={11} /> {errors.title}
                  </p>
                ) : <span />}
                <span
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--fg)', opacity: title.length > 85 ? 0.8 : 0.3 }}
                >
                  {title.length}/100
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Description{' '}
                <span className="text-xs font-normal" style={{ opacity: 0.45 }}>optional</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, terms, or context..."
                rows={3}
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
                onChange={(e) => setCategory(e.target.value as RaffleCategory)}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              >
                {RAFFLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {RAFFLE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            {/* Prize Mode */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Prize Mode <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['fixed', 'pot'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPrizeMode(mode)}
                    className="py-3 px-4 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: prizeMode === mode ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${prizeMode === mode ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.15)'}`,
                      color: prizeMode === mode ? 'var(--accent)' : 'var(--fg)',
                    }}
                  >
                    {mode === 'fixed' ? '🏆 Fixed Prize' : '🎯 Pot Mode'}
                  </button>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                {prizeMode === 'fixed'
                  ? 'You set the prize upfront (USDC amount or NFT).'
                  : 'Winner takes all ticket sales, minus your creator fee.'}
              </p>
            </div>

            {/* Fixed Prize fields */}
            {prizeMode === 'fixed' && (
              <div className="flex flex-col gap-4 pl-4" style={{ borderLeft: '2px solid rgba(201,168,76,0.2)' }}>
                {/* Prize type */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    Prize Type
                  </label>
                  <div className="flex gap-2">
                    {(['usdc', 'nft', 'both'] as const).map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setPrizeType(pt)}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: prizeType === pt ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${prizeType === pt ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.15)'}`,
                          color: prizeType === pt ? 'var(--accent)' : 'var(--fg)',
                        }}
                      >
                        {pt === 'usdc' ? 'USDC' : pt === 'nft' ? 'NFT' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* USDC amount */}
                {(prizeType === 'usdc' || prizeType === 'both') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                      USDC Prize Amount <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={prizeUsdc}
                        onChange={(e) => setPrizeUsdc(e.target.value)}
                        placeholder="e.g. 100"
                        min="0.01"
                        step="0.01"
                        className="w-full px-4 py-3 pr-16 rounded-xl outline-none text-sm"
                        style={INPUT_STYLE}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: 'var(--fg)', opacity: 0.4 }}
                      >
                        USDC
                      </span>
                    </div>
                    {errors.prizeUsdc && (
                      <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertTriangle size={11} /> {errors.prizeUsdc}
                      </p>
                    )}
                  </div>
                )}

                {/* NFT fields */}
                {(prizeType === 'nft' || prizeType === 'both') && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                        NFT Image URL <span style={{ color: '#f87171' }}>*</span>
                      </label>
                      <input
                        type="url"
                        value={prizeNftImage}
                        onChange={(e) => setPrizeNftImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                        style={INPUT_STYLE}
                      />
                      {errors.prizeNftImage && (
                        <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                          <AlertTriangle size={11} /> {errors.prizeNftImage}
                        </p>
                      )}
                      {prizeNftImage && (
                        <img
                          src={prizeNftImage}
                          alt="NFT preview"
                          className="w-32 h-20 object-cover rounded-xl"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                        NFT Name
                      </label>
                      <input
                        type="text"
                        value={prizeNftName}
                        onChange={(e) => setPrizeNftName(e.target.value)}
                        placeholder="e.g. Bored Ape #1234"
                        className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                        style={INPUT_STYLE}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pot mode fields */}
            {prizeMode === 'pot' && (
              <div className="flex flex-col gap-4 pl-4" style={{ borderLeft: '2px solid rgba(201,168,76,0.2)' }}>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    Creator Fee: {creatorFeePercent}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={creatorFeePercent}
                    onChange={(e) => setCreatorFeePercent(parseInt(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                    Winner receives {100 - creatorFeePercent}% of the pot. You keep {creatorFeePercent}%.
                  </p>
                </div>
              </div>
            )}

            {/* Prize description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Prize Description{' '}
                <span className="text-xs font-normal" style={{ opacity: 0.45 }}>optional</span>
              </label>
              <input
                type="text"
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
                placeholder="e.g. 100 USDC sent directly to winner's wallet"
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              />
            </div>

            {/* Ticket Price */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Ticket Price (USDC) <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="e.g. 5"
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 pr-16 rounded-xl outline-none text-sm"
                  style={INPUT_STYLE}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--fg)', opacity: 0.4 }}
                >
                  USDC
                </span>
              </div>
              {errors.ticketPrice && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.ticketPrice}
                </p>
              )}
            </div>

            {/* Max Tickets */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Max Tickets{' '}
                <span className="text-xs font-normal" style={{ opacity: 0.45 }}>optional</span>
              </label>
              <input
                type="number"
                value={maxTickets}
                onChange={(e) => setMaxTickets(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
                max="10000"
                step="1"
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={INPUT_STYLE}
              />
              {errors.maxTickets && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.maxTickets}
                </p>
              )}
            </div>

            {/* Sales Deadline */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                Sales Deadline <span style={{ color: '#f87171' }}>*</span>
              </label>
              <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                Ticket sales close at this time. Min 1 hour from now.
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

            {/* Commitment */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.7 }}>
                  <strong style={{ color: 'var(--accent)' }}>Trust-based MVP.</strong> As the raffle
                  creator, you are responsible for paying the winner promptly after the draw.
                  Participants trust you to honor your commitment.
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitAck}
                  onChange={(e) => setCommitAck(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm" style={{ color: 'var(--fg)' }}>
                  I commit to paying the winner promptly
                </span>
              </label>
              {errors.commitAck && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertTriangle size={11} /> {errors.commitAck}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="sweep w-full py-4 rounded-xl font-semibold text-base disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              {submitting ? 'Creating Raffle...' : 'Create Raffle'}
            </button>
          </form>

          {/* ── Preview ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Preview
            </p>

            <div className="rounded-2xl overflow-hidden flex flex-col" style={CARD}>
              {/* NFT image preview */}
              {prizeMode === 'fixed' && (prizeType === 'nft' || prizeType === 'both') && prizeNftImage && (
                <div className="w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={prizeNftImage}
                    alt="NFT preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}

              <div className="p-5 flex flex-col gap-4">
                {/* Category + status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)' }}
                  >
                    {RAFFLE_CATEGORY_LABELS[category]}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#4ade80' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                    Active
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="text-base font-semibold leading-snug"
                  style={{
                    color: 'var(--fg)',
                    opacity: title ? 1 : 0.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {title || 'Your raffle title...'}
                </h3>

                {/* Prize */}
                <div
                  className="text-sm font-medium px-3 py-2 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(201,168,76,0.07)', color: 'var(--accent)' }}
                >
                  <Trophy size={14} />
                  {previewPrize}
                </div>

                {/* Stats */}
                <div
                  className="flex items-center justify-between text-xs"
                  style={{ color: 'var(--fg)', opacity: 0.5 }}
                >
                  <span>
                    0{previewMaxTickets ? ` / ${previewMaxTickets}` : ''} tickets ·{' '}
                    ${previewTicketPrice > 0 ? previewTicketPrice : '?'} USDC
                  </span>
                  <span>
                    {endsAt ? `Ends ${new Date(endsAt).toLocaleDateString()}` : 'Set deadline'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.3 }}>
              Raffles are stored locally. No contract deployment required.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
