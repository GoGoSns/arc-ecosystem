'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bug, X } from 'lucide-react';
import { useNodeStore, isNodeAdmin, shortenAddr, type BugSeverity, type BugStatus } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';
import SiteHeader from '@/components/SiteHeader';

const SEV_COLOR: Record<BugSeverity, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#facc15',
  low:      '#60a5fa',
};

const STATUS_COLOR: Record<BugStatus, string> = {
  reported:  '#9ca3af',
  triaged:   '#facc15',
  fixed:     '#c9a84c',
  duplicate: '#6b7280',
  invalid:   '#6b7280',
};

export default function BountyPage() {
  const { address, isConnected, connect } = useWallet();
  const { bugs, reportBug, updateBug } = useNodeStore();
  const admin = isNodeAdmin(address);

  const [sevFilter, setSevFilter]     = useState<BugSeverity | 'all'>('all');
  const [statusFilter, setStatusFilt] = useState<BugStatus | 'all'>('all');
  const [sort, setSort]               = useState<'newest' | 'reward'>('newest');
  const [showModal, setShowModal]     = useState(false);

  // Form state
  const [title, setTitle]         = useState('');
  const [desc, setDesc]           = useState('');
  const [sev, setSev]             = useState<BugSeverity>('medium');
  const [cveLink, setCveLink]     = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = bugs
    .filter((b) => sevFilter === 'all' || b.severity === sevFilter)
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .sort((a, b) =>
      sort === 'newest'
        ? b.reportedAt - a.reportedAt
        : (b.rewardAmount ?? 0) - (a.rewardAmount ?? 0)
    );

  const openCount     = bugs.filter((b) => b.status === 'reported' || b.status === 'triaged').length;
  const resolvedCount = bugs.filter((b) => b.status === 'fixed').length;
  const totalPaid     = bugs.reduce((s, b) => s + (b.rewardAmount ?? 0), 0);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 5)   e.title = 'Title must be at least 5 characters.';
    if (desc.trim().length < 100)  e.desc  = 'Description must be at least 100 characters.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!address || !validateForm()) return;
    reportBug({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: desc.trim(),
      severity: sev,
      status: 'reported',
      reporterAddress: address,
      cveLink: cveLink.trim() || undefined,
      reportedAt: Date.now(),
    });
    setTitle(''); setDesc(''); setSev('medium'); setCveLink(''); setFormErrors({});
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bug size={20} className="text-[#c9a84c]" />
              <h1 className="text-3xl font-black">Bug Bounty Program</h1>
            </div>
            <p className="text-[#777] text-sm">Find security issues. Earn USDC. Help secure Arc.</p>
          </div>
          <a href="https://hackerone.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#aaa' }}>
            <span className="text-base">🛡️</span> HackerOne Program
          </a>
        </div>

        {/* Info */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)' }}>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <p className="text-[#aaa]">🛡️ Powered by HackerOne — official Arc bounty program</p>
            <p className="text-[#aaa]">💰 Rewards: <span className="text-[#c9a84c] font-bold">$50 – $50,000 USDC</span> by severity</p>
            <p className="text-[#aaa]">📤 Submit through HackerOne, track progress here</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Open Bounties', value: openCount },
            { label: 'Resolved',      value: resolvedCount },
            { label: 'Total Paid',    value: `$${totalPaid.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <div className="text-2xl font-black">{value}</div>
              <div className="text-[10px] text-[#555] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters + report button */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="flex gap-1 p-1 rounded-xl flex-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
              <button key={s} onClick={() => setSevFilter(s)}
                className="px-2 py-1 rounded-lg text-xs font-bold capitalize transition-all"
                style={{ background: sevFilter === s ? 'rgba(201,168,76,0.15)' : 'transparent', color: sevFilter === s ? '#c9a84c' : '#777' }}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['newest', 'reward'] as const).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className="px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all"
                style={{ background: sort === s ? 'rgba(201,168,76,0.15)' : 'transparent', color: sort === s ? '#c9a84c' : '#777' }}>
                {s === 'newest' ? 'Newest' : 'Highest Reward'}
              </button>
            ))}
          </div>
          {isConnected ? (
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold shrink-0"
              style={{ background: '#c9a84c', color: '#0a0a0a' }}>
              + Report Bug
            </button>
          ) : (
            <button onClick={connect} className="px-4 py-2 rounded-xl text-sm font-bold shrink-0" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
              Connect to Report
            </button>
          )}
        </div>

        {/* Bug list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🦺</div>
            <p className="text-[#555] text-lg mb-2">No bugs reported yet.</p>
            <p className="text-[#444] text-sm">Be the hero who finds the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bug) => (
              <div key={bug.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    style={{ background: `${SEV_COLOR[bug.severity]}18`, color: SEV_COLOR[bug.severity] }}>
                    {bug.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                    style={{ background: `${STATUS_COLOR[bug.status]}18`, color: STATUS_COLOR[bug.status] }}>
                    {bug.status}
                  </span>
                  {bug.rewardAmount && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#4ade80]"
                      style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                      ${bug.rewardAmount.toLocaleString()} USDC
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[15px] mb-1">{bug.title}</h3>
                <p className="text-xs text-[#666] mb-3 leading-relaxed">
                  {bug.description.slice(0, 200)}{bug.description.length > 200 ? '...' : ''}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-[#555]">
                  <span>by {bug.reporterName || shortenAddr(bug.reporterAddress)}</span>
                  <span>{new Date(bug.reportedAt).toLocaleDateString()}</span>
                  {bug.cveLink && (
                    <a href={bug.cveLink} target="_blank" rel="noopener noreferrer"
                      className="text-[#c9a84c] hover:underline">HackerOne →</a>
                  )}
                </div>

                {/* Admin update */}
                {admin && (
                  <AdminBugPanel bug={bug} onUpdate={(updates) => updateBug(bug.id, updates)} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#111', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black">Report a Bug</h2>
              <button onClick={() => setShowModal(false)} className="text-[#555] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${formErrors.title ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                {formErrors.title && <p className="text-xs text-[#ef4444] mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['critical', 'high', 'medium', 'low'] as BugSeverity[]).map((s) => (
                    <button key={s} onClick={() => setSev(s)}
                      className="py-2 rounded-lg text-xs font-bold capitalize transition-all"
                      style={{
                        background: sev === s ? `${SEV_COLOR[s]}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${sev === s ? SEV_COLOR[s] : 'rgba(255,255,255,0.07)'}`,
                        color: sev === s ? SEV_COLOR[s] : '#666',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Description * (min 100 chars)</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5}
                  placeholder="Steps to reproduce, impact, proof of concept..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${formErrors.desc ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#ef4444]">{formErrors.desc ?? ''}</span>
                  <span className="text-xs text-[#555]">{desc.length} chars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">HackerOne Link (optional)</label>
                <input value={cveLink} onChange={(e) => setCveLink(e.target.value)} placeholder="https://hackerone.com/reports/..."
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>

              <button onClick={handleSubmit}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminBugPanel({ bug, onUpdate }: { bug: { status: BugStatus; rewardAmount?: number }; onUpdate: (u: Partial<{ status: BugStatus; rewardAmount: number }>) => void }) {
  const [status, setStatus]   = useState(bug.status);
  const [reward, setReward]   = useState(String(bug.rewardAmount ?? ''));

  return (
    <div className="mt-3 pt-3 border-t border-[#1e1e1e] flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">Admin</span>
      <select value={status} onChange={(e) => setStatus(e.target.value as BugStatus)}
        className="rounded-lg px-2 py-1 text-xs text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {(['reported', 'triaged', 'fixed', 'duplicate', 'invalid'] as BugStatus[]).map((s) => (
          <option key={s} value={s} className="bg-[#111]">{s}</option>
        ))}
      </select>
      <input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Reward $" type="number"
        className="w-24 rounded-lg px-2 py-1 text-xs text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
      <button onClick={() => onUpdate({ status, rewardAmount: reward ? Number(reward) : undefined })}
        className="px-3 py-1 rounded-lg text-xs font-bold"
        style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>
        Update
      </button>
    </div>
  );
}
