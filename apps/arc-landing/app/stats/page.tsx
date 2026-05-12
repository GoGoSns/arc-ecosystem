'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Activity, Users, TrendingUp, Award,
  Zap, RefreshCw, ArrowRightLeft,
} from 'lucide-react';
import { useForumStore } from '@/lib/forumStore';
import { useFeedbackStore } from '@/lib/feedbackStore';
import { useNodeStore, shortenAddr } from '@/lib/nodeStore';

// ─── Mock cross-app data (other apps live on different origins) ────────────────

const MOCK = {
  totalTx:           1247,
  totalVolume:       42890,
  activeWallets:     156,
  payPayments:       387,
  payVolume:         18420,
  creatorTips:       124,
  creatorSubs:       43,
  playGames:         892,
  playPredictions:   67,
  MOCK_ACTIVITY: [
    { id: 'm1', icon: '💸', label: '[PAYMENT] 0xCf87...c02f → 0xD844...9B3d · $50 USDC', ts: Date.now() - 60_000 * 3 },
    { id: 'm2', icon: '🎮', label: '[GAME] Click Rush — 0x3C33...752D scored 4,210 pts', ts: Date.now() - 60_000 * 11 },
    { id: 'm3', icon: '🔮', label: '[PREDICTION] 0xD4c0...daae bet $20 on "BTC above $100k"', ts: Date.now() - 60_000 * 22 },
    { id: 'm4', icon: '💰', label: '[TIP] 0x319d...460F tipped $5 to Arc Creator', ts: Date.now() - 60_000 * 35 },
    { id: 'm5', icon: '🎟️', label: '[RAFFLE] 0xB87B...4365 entered NFT raffle #7', ts: Date.now() - 60_000 * 48 },
  ],
  MOCK_DAILY: [38, 52, 41, 67, 89, 74, 92], // last 7 days tx counts
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, gold, green,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  gold?: boolean;
  green?: boolean;
}) {
  return (
    <div className="rounded-2xl p-6" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(201,168,76,0.15)',
      boxShadow: '0 0 20px rgba(201,168,76,0.04)',
    }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-[#c9a84c]" />
        <span className="text-[10px] text-[#555] uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-4xl font-black mb-1 flex items-center gap-2 ${gold ? 'text-[#c9a84c]' : green ? 'text-[#4ade80]' : 'text-white'}`}>
        {green && <span className="h-3 w-3 rounded-full bg-[#4ade80] animate-pulse shrink-0" />}
        {value}
      </div>
      <div className="text-xs text-[#555]">{sub}</div>
    </div>
  );
}

function MiniCard({ label, value, real = true }: { label: string; value: number | string; real?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-2xl font-black mb-1">{value}</div>
      <div className="text-[10px] text-[#555] uppercase tracking-wider leading-tight">{label}</div>
      {!real && <div className="text-[9px] text-[#333] mt-1">mock data</div>}
    </div>
  );
}

// ─── Simple SVG Bar Chart ─────────────────────────────────────────────────────

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data);
  const H = 80;
  const W = 40;
  const gap = 6;
  const totalW = data.length * (W + gap) - gap;
  return (
    <svg viewBox={`0 0 ${totalW} ${H + 24}`} className="w-full" style={{ maxWidth: 360 }}>
      {data.map((v, i) => {
        const barH = Math.round((v / max) * H);
        const x = i * (W + gap);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={W} height={barH} rx={4}
              fill={i === data.length - 1 ? '#c9a84c' : 'rgba(201,168,76,0.3)'} />
            <text x={x + W / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#555">{labels[i]}</text>
            <text x={x + W / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#777">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { threads }              = useForumStore();
  const { feedbacks }            = useFeedbackStore();
  const { operators, validators, bugs, rpcProviders } = useNodeStore();

  // ── RPC health ──
  const [rpcStatus, setRpcStatus] = useState<{
    healthy: boolean; block: number | null; latency: number | null; error?: string;
  } | null>(null);
  const [rpcLoading, setRpcLoading] = useState(false);

  const checkRpc = useCallback(async () => {
    setRpcLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch('https://rpc.testnet.arc.network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(8000),
      });
      const latency = Math.round(performance.now() - t0);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const block = data.result ? parseInt(data.result as string, 16) : null;
      setRpcStatus({ healthy: true, block, latency });
    } catch {
      setRpcStatus({ healthy: false, block: null, latency: Math.round(performance.now() - t0) });
    }
    setRpcLoading(false);
  }, []);

  // ── Auto-refresh ──
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => { checkRpc(); }, [checkRpc]);
  useEffect(() => {
    const id = setInterval(() => {
      checkRpc();
      setLastUpdated(Date.now());
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, [checkRpc]);

  // ── "X seconds ago" live label ──
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const updatedLabel = useMemo(() => {
    void nowTick;
    return timeAgo(lastUpdated);
  }, [lastUpdated, nowTick]);

  // ── Derived community counts (real) ──
  const forumComments = useMemo(
    () => threads.reduce((s, t) => s + t.comments.length, 0),
    [threads]
  );
  const openBugs = bugs.filter((b) => b.status === 'reported' || b.status === 'triaged').length;

  // ── Contributor score ──
  const leaderboard = useMemo(() => {
    type ContribEntry = { score: number; threads: number; comments: number; feedback: number; bugs: number; nodes: number; validators: number };
    type ContribField = 'threads' | 'comments' | 'feedback' | 'bugs' | 'nodes' | 'validators';
    const scores: Record<string, ContribEntry> = {};

    const add = (addr: string, pts: number, field: ContribField) => {
      if (!addr) return;
      if (!scores[addr]) scores[addr] = { score: 0, threads: 0, comments: 0, feedback: 0, bugs: 0, nodes: 0, validators: 0 };
      scores[addr].score += pts;
      scores[addr][field] += 1;
    };

    threads.forEach((t) => {
      add(t.authorAddress, 5, 'threads');
      t.comments.forEach((c) => add(c.authorAddress, 1, 'comments'));
    });
    feedbacks.forEach((f) => add(f.authorAddress, 3, 'feedback'));
    bugs.forEach((b) => add(b.reporterAddress, 10, 'bugs'));
    operators.forEach((o) => add(o.address, 20, 'nodes'));
    validators.forEach((v) => add(v.address, 5, 'validators'));

    return Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 10);
  }, [threads, feedbacks, bugs, operators, validators]);

  // ── Activity feed ──
  const activityFeed = useMemo(() => {
    type FeedItem = { id: string; icon: string; label: string; ts: number };
    const items: FeedItem[] = [...MOCK.MOCK_ACTIVITY];

    threads.slice(0, 3).forEach((t) =>
      items.push({
        id: `thread-${t.id}`,
        icon: '💬',
        label: `[THREAD] "${t.title.slice(0, 50)}" by ${t.authorName || shortenAddr(t.authorAddress)}`,
        ts: t.createdAt,
      })
    );
    feedbacks.slice(0, 2).forEach((f) =>
      items.push({
        id: `fb-${f.id}`,
        icon: '💡',
        label: `[FEEDBACK] "${f.title.slice(0, 50)}"`,
        ts: f.createdAt,
      })
    );
    operators.slice(0, 2).forEach((o) =>
      items.push({
        id: `op-${o.address}`,
        icon: '🖥️',
        label: `[NODE] ${o.name || shortenAddr(o.address)} registered in ${o.region}`,
        ts: o.registeredAt,
      })
    );
    bugs.slice(0, 2).forEach((b) =>
      items.push({
        id: `bug-${b.id}`,
        icon: '🐛',
        label: `[BUG] "${b.title.slice(0, 50)}" — severity: ${b.severity}`,
        ts: b.reportedAt,
      })
    );

    return items.sort((a, b) => b.ts - a.ts).slice(0, 10);
  }, [threads, feedbacks, operators, bugs]);

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
            <ArrowLeft size={14} /> Arc Ecosystem
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Ecosystem Stats</span>
          <button
            onClick={() => { checkRpc(); setLastUpdated(Date.now()); }}
            className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#c9a84c] transition-colors"
          >
            <RefreshCw size={12} className={rpcLoading ? 'animate-spin' : ''} />
            {updatedLabel}
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-10">

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono text-[#c9a84c] mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Activity size={11} /> LIVE METRICS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Arc Ecosystem Stats</h1>
          <p className="text-[#777] text-lg">Live metrics across all 4 apps · Updated {updatedLabel}</p>
        </div>

        {/* ── Top 4 stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={ArrowRightLeft} label="Total Transactions" value={fmt(MOCK.totalTx)} sub="All time" />
          <StatCard icon={() => <span className="text-[#c9a84c] text-sm font-black">$</span>}
            label="USDC Volume" value={`$${fmt(MOCK.totalVolume)}`} sub="On-chain" gold />
          <StatCard icon={Users} label="Active Wallets" value={MOCK.activeWallets} sub="Last 24h" />
          <StatCard icon={Activity} label="Network Status" value="LIVE" sub="Arc Testnet" green />
        </div>

        {/* ── Apps breakdown ── */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#c9a84c] mb-5 flex items-center gap-2">
            <Zap size={13} /> Apps Activity
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Arc Pay */}
            <div className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#60a5fa]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#60a5fa]">Arc Pay</span>
                </div>
                <p className="text-[10px] text-[#555]">mock data</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Payments</span>
                  <span className="font-black">{MOCK.payPayments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Volume</span>
                  <span className="font-black text-[#60a5fa]">${fmt(MOCK.payVolume)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Features</span>
                  <span className="font-black">5 live</span>
                </div>
              </div>
              <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#60a5fa] hover:underline mt-auto">
                Open Arc Pay →
              </a>
            </div>

            {/* Arc Creator */}
            <div className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#c9a84c]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]">Arc Creator</span>
                </div>
                <p className="text-[10px] text-[#555]">mock data</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Tips</span>
                  <span className="font-black">{MOCK.creatorTips}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Subscriptions</span>
                  <span className="font-black">{MOCK.creatorSubs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Features</span>
                  <span className="font-black">4 live</span>
                </div>
              </div>
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#c9a84c] hover:underline mt-auto">
                Open Arc Creator →
              </a>
            </div>

            {/* Arc Play */}
            <div className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4ade80]">Arc Play</span>
                </div>
                <p className="text-[10px] text-[#555]">mock data</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Games Played</span>
                  <span className="font-black">{MOCK.playGames}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Predictions</span>
                  <span className="font-black">{MOCK.playPredictions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Features</span>
                  <span className="font-black">5 live</span>
                </div>
              </div>
              <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#4ade80] hover:underline mt-auto">
                Open Arc Play →
              </a>
            </div>

            {/* Arc Landing (real data) */}
            <div className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-[#a78bfa]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a78bfa]">Arc Landing</span>
                </div>
                <p className="text-[10px] text-[#4ade80]">live data</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Forum Threads</span>
                  <span className="font-black">{threads.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Feedback</span>
                  <span className="font-black">{feedbacks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Node Operators</span>
                  <span className="font-black">{operators.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#777]">Bug Reports</span>
                  <span className="font-black">{bugs.length}</span>
                </div>
              </div>
              <Link href="/node" className="text-[11px] font-bold text-[#a78bfa] hover:underline mt-auto">
                Node Hub →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Community metrics ── */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#c9a84c] mb-5 flex items-center gap-2">
            <Users size={13} /> Community
            <span className="text-[10px] text-[#4ade80] font-normal normal-case">live data</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniCard label="Forum Threads"        value={threads.length} />
            <MiniCard label="Forum Comments"       value={forumComments} />
            <MiniCard label="Feedback Submissions" value={feedbacks.length} />
            <MiniCard label="Node Operators"       value={operators.length} />
            <MiniCard label="Validator Applications" value={validators.length} />
            <MiniCard label="Bug Reports"          value={bugs.length} />
          </div>
        </section>

        {/* ── Network health + 7-day chart ── */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#c9a84c] mb-5 flex items-center gap-2">
            <Activity size={13} /> Network Health
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {/* RPC status */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">RPC Status</h3>
                <button onClick={() => { checkRpc(); setLastUpdated(Date.now()); }}
                  className="text-xs text-[#555] hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
                  <RefreshCw size={11} className={rpcLoading ? 'animate-spin' : ''} /> refresh
                </button>
              </div>
              <p className="text-[10px] text-[#444] font-mono mb-4">rpc.testnet.arc.network</p>
              {rpcStatus ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Status',
                      value: rpcStatus.healthy ? 'Healthy' : 'Down',
                      color: rpcStatus.healthy ? '#4ade80' : '#ef4444',
                      dot: true,
                    },
                    { label: 'Block Height', value: rpcStatus.block?.toLocaleString() ?? '—', color: '#fff' },
                    { label: 'Chain ID',     value: '5042002',                              color: '#fff' },
                    {
                      label: 'Latency',
                      value: rpcStatus.latency !== null ? `${rpcStatus.latency}ms` : '—',
                      color: (rpcStatus.latency ?? 999) < 300 ? '#4ade80' : '#facc15',
                    },
                  ].map(({ label, value, color, dot }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</div>
                      <div className="font-black flex items-center gap-1.5" style={{ color }}>
                        {dot && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />}
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#555]">
                  {rpcLoading ? 'Checking RPC...' : 'Click refresh to check'}
                </div>
              )}

              {/* RPC provider list */}
              <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#555] uppercase tracking-wider">Providers</span>
                  <Link href="/node/rpc" className="text-[10px] text-[#c9a84c] hover:underline">Add RPC →</Link>
                </div>
                <div className="space-y-1.5">
                  {rpcProviders.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#facc15] shrink-0" />
                      <span className="text-[#aaa] font-bold">{r.name}</span>
                      {r.isOfficial && <span className="text-[#c9a84c] text-[9px]">★</span>}
                      <span className="text-[#444] font-mono text-[10px] ml-auto truncate max-w-[120px]">{r.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 7-day activity chart */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-sm font-bold mb-1">Daily Activity</h3>
              <p className="text-[10px] text-[#444] mb-5">Transactions — last 7 days (mock)</p>
              <BarChart data={MOCK.MOCK_DAILY} labels={DAY_LABELS} />
              <div className="flex justify-between mt-4 text-xs text-[#555]">
                <span>Total: {MOCK.MOCK_DAILY.reduce((a, b) => a + b, 0)} tx</span>
                <span>Avg: {Math.round(MOCK.MOCK_DAILY.reduce((a, b) => a + b, 0) / MOCK.MOCK_DAILY.length)}/day</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Activity feed + leaderboard ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Recent activity */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#c9a84c] mb-4 flex items-center gap-2">
              <TrendingUp size={13} /> Recent Activity
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {activityFeed.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#555]">No activity yet.</div>
              ) : (
                <div>
                  {activityFeed.map((item, i) => (
                    <div key={item.id}
                      className="flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      style={{ borderBottom: i < activityFeed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#ccc] leading-snug">{item.label}</p>
                      </div>
                      <span className="text-[10px] text-[#444] shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(item.ts)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Contributor leaderboard */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#c9a84c] mb-4 flex items-center gap-2">
              <Award size={13} /> Top Contributors
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#555] text-sm mb-2">No contributions yet.</p>
                  <p className="text-[#444] text-xs">Post a thread, report a bug, or run a node to appear here.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[36px_1fr_56px] text-[9px] text-[#444] uppercase tracking-wider px-4 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>#</span><span>Contributor</span><span className="text-right">Score</span>
                  </div>
                  {leaderboard.map(([addr, data], i) => (
                    <div key={addr}
                      className="grid grid-cols-[36px_1fr_56px] items-center px-4 py-3 text-sm transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      style={{ borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span className="font-black text-xs" style={{ color: i < 3 ? '#c9a84c' : '#444' }}>
                        {i < 3 ? MEDALS[i] : `#${i + 1}`}
                      </span>
                      <div>
                        <div className="font-mono text-xs text-[#aaa]">{shortenAddr(addr)}</div>
                        <div className="text-[9px] text-[#444] mt-0.5">
                          {[
                            data.threads    > 0 && `${data.threads} thread${data.threads > 1 ? 's' : ''}`,
                            data.comments   > 0 && `${data.comments} comment${data.comments > 1 ? 's' : ''}`,
                            data.feedback   > 0 && `${data.feedback} feedback`,
                            data.bugs       > 0 && `${data.bugs} bug${data.bugs > 1 ? 's' : ''}`,
                            data.nodes      > 0 && `${data.nodes} node`,
                            data.validators > 0 && `validator`,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="text-right font-black text-[#c9a84c]">{data.score}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Score legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#444]">
              {[['Node', '20pts'], ['Bug report', '10pts'], ['Thread', '5pts'], ['Validator app', '5pts'], ['Feedback', '3pts'], ['Comment', '1pt']].map(([k, v]) => (
                <span key={k}><span className="text-[#333]">{k}</span> = <span className="text-[#c9a84c]">{v}</span></span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
