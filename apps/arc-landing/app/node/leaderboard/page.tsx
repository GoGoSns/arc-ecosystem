'use client';

import Link from 'next/link';
import { ArrowLeft, Award } from 'lucide-react';
import { useNodeStore, shortenAddr, REGION_LABELS, type Region } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { address } = useWallet();
  const { operators } = useNodeStore();

  const sorted = [...operators].sort((a, b) => {
    const ua = a.uptimePercent ?? 0;
    const ub = b.uptimePercent ?? 0;
    if (ub !== ua) return ub - ua;
    return a.registeredAt - b.registeredAt;
  });

  const totalOps  = operators.length;
  const avgUptime = operators.length
    ? Math.round(operators.reduce((s, o) => s + (o.uptimePercent ?? 0), 0) / operators.length)
    : 0;

  const regionCounts: Partial<Record<Region, number>> = {};
  operators.forEach((o) => { regionCounts[o.region] = (regionCounts[o.region] ?? 0) + 1; });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/node" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
            <ArrowLeft size={14} /> Node Hub
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Leaderboard</span>
          <div />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Award size={20} className="text-[#c9a84c]" />
          <h1 className="text-3xl font-black">Operator Leaderboard</h1>
        </div>
        <p className="text-[#777] text-sm mb-8">Ranked by uptime. Ties broken by earliest registration.</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <div className="text-2xl font-black">{totalOps}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-wider mt-1">Total Operators</div>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <div className="text-2xl font-black text-[#4ade80]">{avgUptime}%</div>
            <div className="text-[10px] text-[#555] uppercase tracking-wider mt-1">Avg Uptime</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">By Region</div>
            {(Object.keys(regionCounts) as Region[]).map((r) => (
              <div key={r} className="flex justify-between text-xs">
                <span className="text-[#aaa]">{r}</span>
                <span className="text-white font-bold">{regionCounts[r]}</span>
              </div>
            ))}
            {Object.keys(regionCounts).length === 0 && <span className="text-xs text-[#555]">—</span>}
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-[#555] text-lg mb-4">No operators registered yet. Be the first!</p>
            <Link href="/node/setup" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
              Run a Node
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] text-[10px] text-[#555] uppercase tracking-wider px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>#</span>
              <span>Operator</span>
              <span>Region</span>
              <span className="hidden sm:block">Status</span>
              <span>Uptime</span>
              <span className="hidden sm:block">Joined</span>
            </div>
            {sorted.map((op, i) => {
              const isMe = address && op.address === address;
              const isTop3 = i < 3;
              return (
                <div key={op.address}
                  className="grid grid-cols-[40px_1fr_80px_80px_70px_80px] items-center px-4 py-3 text-sm transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isMe ? 'rgba(201,168,76,0.05)' : 'transparent',
                    boxShadow: isMe ? 'inset 0 0 0 1px rgba(201,168,76,0.2)' : 'none',
                  }}>
                  <span className="font-mono font-black" style={{ color: isTop3 ? '#c9a84c' : '#555' }}>
                    {isTop3 ? MEDALS[i] : `#${i + 1}`}
                  </span>
                  <div>
                    <span className="font-bold" style={{ color: isMe ? '#c9a84c' : '#e8e8e8' }}>
                      {op.name || shortenAddr(op.address)}
                    </span>
                    {isMe && <span className="ml-1.5 text-[10px] text-[#c9a84c]">(you)</span>}
                  </div>
                  <span className="text-xs text-[#777]">{op.region}</span>
                  <span className="hidden sm:block text-xs capitalize" style={{
                    color: op.status === 'verified' ? '#4ade80' : op.status === 'inactive' ? '#ef4444' : '#facc15',
                  }}>{op.status}</span>
                  <span className="text-xs font-bold" style={{ color: (op.uptimePercent ?? 0) >= 99 ? '#4ade80' : (op.uptimePercent ?? 0) >= 95 ? '#facc15' : '#aaa' }}>
                    {op.uptimePercent !== undefined ? `${op.uptimePercent}%` : '—'}
                  </span>
                  <span className="hidden sm:block text-xs text-[#555]">
                    {new Date(op.registeredAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
