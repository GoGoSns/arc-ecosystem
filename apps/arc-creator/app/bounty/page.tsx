'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBountyStore, Bounty } from '@/lib/bountyStore';
import { 
  Trophy, Plus, Briefcase, Filter, ChevronDown, 
  Clock, DollarSign, Search, Tag
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['all', 'design', 'development', 'content', 'marketing', 'research', 'other'];
const STATUS_FILTERS = ['all', 'open', 'in_progress', 'submitted', 'completed'];

function StatusBadge({ status }: { status: Bounty['status'] }) {
  const colors: Record<string, string> = {
    open: '#4ade80',
    in_progress: '#facc15',
    submitted: '#60a5fa',
    completed: '#c9a84c',
    cancelled: '#9ca3af',
    expired: '#ef4444',
  };

  const label = status.replace('_', ' ');

  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ 
        background: `${colors[status]}15`, 
        color: colors[status],
        border: `1px solid ${colors[status]}30`
      }}
    >
      {label}
    </span>
  );
}

function BountyCard({ bounty, now }: { bounty: Bounty; now: number }) {
  const daysLeft = now > 0 ? Math.max(0, Math.ceil((bounty.deadline - now) / 86_400_000)) : 0;

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div
        className="sweep rounded-2xl p-6 flex flex-col gap-4 transition-all hover:scale-[1.01]"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        <div className="flex justify-between items-start">
          <StatusBadge status={bounty.status} />
          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--accent)' }}>
            <DollarSign size={14} />
            <span className="text-lg font-bold">{bounty.budget}</span>
            <span className="opacity-60">USDC</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-1 truncate" style={{ color: 'var(--fg)' }}>
            {bounty.title}
          </h3>
          <p className="text-sm line-clamp-2" style={{ color: 'var(--fg)', opacity: 0.6 }}>
            {bounty.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {bounty.requiredSkills.slice(0, 3).map((skill, i) => (
            <span 
              key={i} 
              className="text-[10px] px-2 py-1 rounded-lg" 
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.7 }}
            >
              {skill}
            </span>
          ))}
          {bounty.requiredSkills.length > 3 && (
            <span className="text-[10px] px-2 py-1 rounded-lg" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              +{bounty.requiredSkills.length - 3} more
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            <Tag size={12} />
            <span className="capitalize">{bounty.category}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            <Clock size={12} />
            <span>{now === 0 ? 'Calculating...' : daysLeft === 0 ? 'Ends today' : `Ends in ${daysLeft}d`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BountyListPage() {
  const { bounties } = useBountyStore();
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  if (!mounted) return null;

  const filteredBounties = bounties.filter((b) => {
    const matchesStatus = filter === 'all' || b.status === filter;
    const matchesCategory = category === 'all' || b.category === category;
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || 
                         b.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.12)' }}>
                <Trophy size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
                Bounty Board
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
              Complete tasks and earn USDC directly to your wallet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/bounty/my-bounties"
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              My Bounties
            </Link>
            <Link 
              href="/bounty/create"
              className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={16} />
              Post Bounty
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  style={{
                    background: filter === s ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: filter === s ? 'var(--accent)' : 'var(--fg)',
                    opacity: filter === s ? 1 : 0.4,
                  }}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                <input 
                  type="text" 
                  placeholder="Search bounties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:border-[var(--accent)]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                />
              </div>
              
              <div className="relative w-full sm:w-44">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm border outline-none cursor-pointer transition-all focus:border-[var(--accent)]"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          {/* Bounty Grid */}
          {filteredBounties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} now={now} />
              ))}
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed"
              style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.01)' }}
            >
              <Briefcase size={40} className="mb-4 opacity-20" />
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--fg)' }}>No bounties found</h3>
              <p className="text-sm opacity-50 mb-6">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => { setFilter('all'); setCategory('all'); setSearch(''); }}
                className="text-sm font-bold"
                style={{ color: 'var(--accent)' }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
