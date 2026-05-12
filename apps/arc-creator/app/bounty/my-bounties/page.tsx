'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Trophy, ArrowLeft, Plus, Briefcase, FileText, 
  CheckCircle, Clock, DollarSign, PieChart, TrendingUp 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useBountyStore, Bounty, Proposal } from '@/lib/bountyStore';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: '#4ade80',
    in_progress: '#facc15',
    submitted: '#60a5fa',
    completed: '#c9a84c',
    pending: '#9ca3af',
    accepted: '#4ade80',
    rejected: '#ef4444',
    won: '#c9a84c',
    cancelled: '#9ca3af',
  };
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${colors[status] || '#9ca3af'}15`, color: colors[status] || '#9ca3af', border: `1px solid ${colors[status] || '#9ca3af'}30` }}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MyBountiesPage() {
  const { address, isConnected } = useAccount();
  const { bounties } = useBountyStore();
  const [activeTab, setActiveTab] = useState<'posted' | 'proposals'>('posted');
  const [subTab, setSubTab] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const postedBounties = bounties.filter(b => b.ownerAddress.toLowerCase() === address?.toLowerCase());
  const myProposals = bounties.flatMap(b => b.proposals.map(p => ({ ...p, bounty: b })))
    .filter(p => p.hunterAddress.toLowerCase() === address?.toLowerCase());

  // Stats
  const totalPosted = postedBounties.length;
  const totalSpent = postedBounties.filter(b => b.status === 'completed').reduce((acc, b) => acc + (b.finalAmount || 0), 0);
  const proposalsSubmitted = myProposals.length;
  const wonAmount = myProposals.filter(p => p.status === 'accepted' && p.bounty.status === 'completed').reduce((acc, p) => acc + (p.bounty.finalAmount || 0), 0);
  const winRate = proposalsSubmitted > 0 ? (myProposals.filter(p => p.status === 'accepted').length / proposalsSubmitted) * 100 : 0;

  const filteredPosted = postedBounties.filter(b => subTab === 'all' || b.status === subTab);
  const filteredProposals = myProposals.filter(p => {
    if (subTab === 'all') return true;
    if (subTab === 'won') return p.status === 'accepted' && p.bounty.status === 'completed';
    return p.status === subTab;
  });

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--fg)' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <Link href="/bounty/create" className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
            <Plus size={16} /> Post New Bounty
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Bounties Posted', value: totalPosted, icon: FileText },
            { label: 'Total Spent', value: `$${totalSpent} USDC`, icon: DollarSign },
            { label: 'Proposals Sent', value: proposalsSubmitted, icon: Briefcase },
            { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 border border-white/5 bg-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <stat.icon size={16} className="opacity-30" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-6">
          <div className="flex p-1 rounded-2xl bg-white/5 self-start">
            <button onClick={() => { setActiveTab('posted'); setSubTab('all'); }} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: activeTab === 'posted' ? 'rgba(201,168,76,0.1)' : 'transparent', color: activeTab === 'posted' ? 'var(--accent)' : 'var(--fg)', opacity: activeTab === 'posted' ? 1 : 0.4 }}>
              Posted by Me
            </button>
            <button onClick={() => { setActiveTab('proposals'); setSubTab('all'); }} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: activeTab === 'proposals' ? 'rgba(201,168,76,0.1)' : 'transparent', color: activeTab === 'proposals' ? 'var(--accent)' : 'var(--fg)', opacity: activeTab === 'proposals' ? 1 : 0.4 }}>
              My Proposals
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {activeTab === 'posted' ? (
              ['all', 'open', 'in_progress', 'submitted', 'completed'].map(s => (
                <button key={s} onClick={() => setSubTab(s)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ background: subTab === s ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'var(--fg)', opacity: subTab === s ? 1 : 0.3, border: subTab === s ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
                  {s}
                </button>
              ))
            ) : (
              ['all', 'pending', 'accepted', 'rejected', 'won'].map(s => (
                <button key={s} onClick={() => setSubTab(s)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ background: subTab === s ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'var(--fg)', opacity: subTab === s ? 1 : 0.3, border: subTab === s ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
                  {s}
                </button>
              ))
            )}
          </div>

          {/* List */}
          <div className="flex flex-col gap-4">
            {activeTab === 'posted' ? (
              filteredPosted.length > 0 ? (
                filteredPosted.map(b => (
                  <Link href={`/bounty/${b.id}`} key={b.id} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.04] transition-all">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={b.status} />
                        <span className="text-[10px] font-mono opacity-40">#{b.id.split('-')[0]}</span>
                      </div>
                      <h3 className="font-bold text-lg">{b.title}</h3>
                      <div className="flex items-center gap-4 text-xs opacity-50">
                        <span className="flex items-center gap-1"><DollarSign size={12} /> {b.budget} USDC</span>
                        <span className="flex items-center gap-1"><Briefcase size={12} /> {b.proposals.length} Proposals</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-4 py-2 rounded-xl border border-white/10">View Details</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-white/5 opacity-40">No bounties found.</div>
              )
            ) : (
              filteredProposals.length > 0 ? (
                filteredProposals.map(p => (
                  <Link href={`/bounty/${p.bounty.id}`} key={p.id} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.04] transition-all">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={p.status === 'accepted' && p.bounty.status === 'completed' ? 'won' : p.status} />
                        <span className="text-[10px] font-mono opacity-40">#{p.id.split('-')[0]}</span>
                      </div>
                      <h3 className="font-bold text-lg">{p.bounty.title}</h3>
                      <div className="flex items-center gap-4 text-xs opacity-50">
                        <span className="flex items-center gap-1"><DollarSign size={12} /> My Bid: {p.bidAmount} USDC</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Bounty: {p.bounty.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-4 py-2 rounded-xl border border-white/10">View Bounty</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-white/5 opacity-40">No proposals found.</div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
