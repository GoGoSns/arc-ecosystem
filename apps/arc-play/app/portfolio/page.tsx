'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useBalance } from 'wagmi'
import { injected } from 'wagmi/connectors'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  RefreshCw,
  Wallet,
  ExternalLink,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Navbar from '@/components/Navbar'

// ── Constants ──────────────────────────────────────────────────────────────────

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Types ──────────────────────────────────────────────────────────────────────

interface BSTransfer {
  hash: string
  from: { hash: string }
  to: { hash: string }
  total: { value: string; decimals: string }
  token: {
    address_hash: string
    symbol: string
    decimals: string
    type: string
  }
  timestamp: string
}

interface ChartPoint {
  month: string
  count: number
  volume: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const shorten = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`

function fmtNative(value: bigint): string {
  const n = Number(value) / 1e18
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtTransfer(t: BSTransfer): string {
  const n = Number(t.total.value) / Math.pow(10, Number(t.total.decimals))
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtAmount(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function buildChartData(txs: BSTransfer[]): ChartPoint[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const [y, m] = [d.getFullYear(), d.getMonth()]
    const bucket = txs.filter(t => {
      const dt = new Date(t.timestamp)
      return dt.getFullYear() === y && dt.getMonth() === m
    })
    return {
      month: MONTHS[m],
      count: bucket.length,
      volume: bucket.reduce(
        (s, t) => s + Number(t.total.value) / Math.pow(10, Number(t.total.decimals)),
        0,
      ),
    }
  })
}

async function fetchUSDCTransfers(address: string): Promise<BSTransfer[]> {
  const res = await fetch(
    `https://testnet.arcscan.app/api/v2/addresses/${address}/token-transfers`,
  )
  if (!res.ok) throw new Error('fetch failed')
  const data = (await res.json()) as { items: BSTransfer[] }
  return data.items.filter(
    t => t.token.address_hash.toLowerCase() === USDC_ADDRESS.toLowerCase(),
  )
}

// ── Shared style objects ───────────────────────────────────────────────────────

const CARD = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
}
const SKELETON = { background: 'rgba(255,255,255,0.05)' }

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()

  const {
    data: usdcBalance,
    isLoading: balanceLoading,
    isFetching: balanceFetching,
    isError: balanceError,
    refetch: refetchBalance,
  } = useBalance({
    address,
    query: { enabled: !!address },
  })

  const [transfers, setTransfers] = useState<BSTransfer[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState(false)

  const loadTransfers = useCallback(async () => {
    if (!address) return
    setTxLoading(true)
    setTxError(false)
    try {
      setTransfers(await fetchUSDCTransfers(address))
    } catch {
      setTxError(true)
    } finally {
      setTxLoading(false)
    }
  }, [address])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  function handleRefresh() {
    void refetchBalance()
    void loadTransfers()
  }

  const addr = address?.toLowerCase() ?? ''
  const totalSent = transfers
    .filter(t => t.from.hash.toLowerCase() === addr)
    .reduce((s, t) => s + Number(t.total.value) / Math.pow(10, Number(t.total.decimals)), 0)
  const totalReceived = transfers
    .filter(t => t.to.hash.toLowerCase() === addr)
    .reduce((s, t) => s + Number(t.total.value) / Math.pow(10, Number(t.total.decimals)), 0)
  const chartData = buildChartData(transfers)
  const recent = transfers.slice(0, 20)

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Portfolio Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            Your USDC activity on Arc Testnet
          </p>
        </div>

        {/* ── Not connected ─────────────────────────────────── */}
        {!isConnected && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-5 text-center max-w-xs">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.1)' }}
              >
                <Wallet size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                  Connect your wallet
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                  View your USDC balance and transaction history on Arc Testnet
                </p>
              </div>
              <button
                onClick={() => connect({ connector: injected() })}
                className="sweep w-full px-8 py-3 rounded-xl text-base font-semibold"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* ── Connected ─────────────────────────────────────── */}
        {isConnected && address && (
          <>
            {/* USDC Balance Card */}
            <div className="rounded-2xl p-6 max-w-2xl mx-auto w-full" style={CARD}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                  Available Balance
                </p>
                <button
                  onClick={handleRefresh}
                  aria-label="Refresh balance"
                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  <RefreshCw size={15} className={balanceFetching ? 'animate-spin' : ''} />
                </button>
              </div>

              {balanceLoading ? (
                <div className="h-14 w-52 rounded-xl animate-pulse mt-1" style={SKELETON} />
              ) : balanceError ? (
                <p className="text-sm mt-2" style={{ color: '#f87171' }}>
                  Failed to load balance — try refreshing.
                </p>
              ) : (
                <p
                  className="text-5xl font-bold tabular-nums leading-tight mt-1"
                  style={{ color: 'var(--accent)' }}
                >
                  {usdcBalance !== undefined ? fmtNative(usdcBalance.value) : '—'}
                  <span
                    className="text-lg font-medium ml-2"
                    style={{ color: 'var(--fg)', opacity: 0.45 }}
                  >
                    USDC
                  </span>
                </p>
              )}

              <p className="text-xs font-mono mt-3" style={{ color: 'var(--fg)', opacity: 0.3 }}>
                {shorten(address)} · Arc Testnet
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Total Sent */}
              <div className="sweep rounded-2xl p-5" style={CARD}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(248,113,113,0.1)' }}
                  >
                    <ArrowUpRight size={18} style={{ color: '#f87171' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                    Total Sent
                  </span>
                </div>
                {txLoading ? (
                  <div className="h-7 w-28 rounded-lg animate-pulse" style={SKELETON} />
                ) : (
                  <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--fg)' }}>
                    {fmtAmount(totalSent)}{' '}
                    <span className="text-sm font-medium" style={{ opacity: 0.4 }}>USDC</span>
                  </p>
                )}
              </div>

              {/* Total Received */}
              <div className="sweep rounded-2xl p-5" style={CARD}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(74,222,128,0.1)' }}
                  >
                    <ArrowDownLeft size={18} style={{ color: '#4ade80' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                    Total Received
                  </span>
                </div>
                {txLoading ? (
                  <div className="h-7 w-28 rounded-lg animate-pulse" style={SKELETON} />
                ) : (
                  <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--fg)' }}>
                    {fmtAmount(totalReceived)}{' '}
                    <span className="text-sm font-medium" style={{ opacity: 0.4 }}>USDC</span>
                  </p>
                )}
              </div>

              {/* Total Transactions */}
              <div className="sweep rounded-2xl p-5" style={CARD}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.1)' }}
                  >
                    <Activity size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                    Total Transactions
                  </span>
                </div>
                {txLoading ? (
                  <div className="h-7 w-16 rounded-lg animate-pulse" style={SKELETON} />
                ) : (
                  <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--fg)' }}>
                    {transfers.length}
                  </p>
                )}
              </div>
            </div>

            {/* Activity Bar Chart */}
            <div className="rounded-2xl p-6" style={CARD}>
              <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--fg)' }}>
                Activity (Last 6 Months)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(237,237,237,0.45)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={32}
                    tick={{ fill: 'rgba(237,237,237,0.45)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const pt = payload[0].payload as ChartPoint
                      return (
                        <div
                          style={{
                            background: '#111111',
                            border: '1px solid rgba(201,168,76,0.25)',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontSize: 13,
                          }}
                        >
                          <p style={{ color: '#c9a84c', fontWeight: 600, marginBottom: 4 }}>
                            {label as string}
                          </p>
                          <p style={{ color: 'rgba(237,237,237,0.75)' }}>
                            {pt.count} transaction{pt.count !== 1 ? 's' : ''}
                          </p>
                          <p style={{ color: 'rgba(237,237,237,0.55)' }}>
                            {pt.volume.toFixed(2)} USDC volume
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction History */}
            <div className="rounded-2xl p-6" style={CARD}>
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                Transaction History
              </h2>

              {/* Loading skeleton */}
              {txLoading && (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className="h-[52px] rounded-xl animate-pulse"
                      style={SKELETON}
                    />
                  ))}
                </div>
              )}

              {/* Error */}
              {txError && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                    Could not load transactions
                  </p>
                  <button
                    onClick={() => void loadTransfers()}
                    className="sweep text-sm px-4 py-2 rounded-xl"
                    style={{ border: '1px solid rgba(201,168,76,0.3)', color: 'var(--accent)' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!txLoading && !txError && recent.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Activity size={28} style={{ color: 'var(--fg)', opacity: 0.18 }} />
                  <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                    No transactions yet
                  </p>
                </div>
              )}

              {/* List */}
              {!txLoading && !txError && recent.length > 0 && (
                <div className="flex flex-col">
                  {recent.map((tx, i) => {
                    const sent = tx.from.hash.toLowerCase() === addr
                    const peer = sent ? tx.to.hash : tx.from.hash
                    return (
                      <div
                        key={`${tx.hash}-${i}`}
                        className="flex items-center gap-3 py-3"
                        style={{
                          borderBottom:
                            i < recent.length - 1
                              ? '1px solid rgba(255,255,255,0.05)'
                              : 'none',
                        }}
                      >
                        {/* Direction icon */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: sent
                              ? 'rgba(248,113,113,0.1)'
                              : 'rgba(74,222,128,0.1)',
                          }}
                        >
                          {sent ? (
                            <ArrowUpRight size={15} style={{ color: '#f87171' }} />
                          ) : (
                            <ArrowDownLeft size={15} style={{ color: '#4ade80' }} />
                          )}
                        </div>

                        {/* Counterparty + time */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-mono truncate"
                            style={{ color: 'var(--fg)' }}
                          >
                            {shorten(peer)}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                            {timeAgo(tx.timestamp)}
                          </p>
                        </div>

                        {/* Amount */}
                        <p
                          className="text-sm font-semibold tabular-nums flex-shrink-0"
                          style={{ color: sent ? '#f87171' : '#4ade80' }}
                        >
                          {sent ? '−' : '+'}{fmtTransfer(tx)}{' '}
                          <span className="text-xs font-medium opacity-70">USDC</span>
                        </p>

                        {/* ArcScan link */}
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--accent)' }}
                          aria-label="View on ArcScan"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
