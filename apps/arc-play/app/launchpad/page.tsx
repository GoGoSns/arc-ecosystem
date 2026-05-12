'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Rocket, Plus, Coins, Users, TrendingUp, Clock, AlertTriangle, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { 
  useLaunchpadStore, 
  getLaunchesByStatus, 
  getLaunchStats, 
  LaunchStatus, 
  LaunchMode,
  TokenLaunch
} from '@/lib/launchpadStore';

const STATUS_OPTIONS: { label: string; value: LaunchStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Live', value: 'live' },
  { label: 'Ended', value: 'ended' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const MODE_OPTIONS: { label: string; value: LaunchMode | 'all' }[] = [
  { label: 'All Modes', value: 'all' },
  { label: 'Basic', value: 'basic' },
  { label: 'Allocation', value: 'allocation' },
  { label: 'IDO', value: 'ido' },
];

export default function LaunchpadBrowse() {
  const { launches } = useLaunchpadStore();
  const [statusFilter, setStatusFilter] = useState<LaunchStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<LaunchMode | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredLaunches = useMemo(() => {
    let list = getLaunchesByStatus(launches, statusFilter);
    if (modeFilter !== 'all') {
      list = list.filter(l => l.mode === modeFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l => 
        l.tokenName.toLowerCase().includes(s) || 
        l.tokenSymbol.toLowerCase().includes(s)
      );
    }
    return list;
  }, [launches, statusFilter, modeFilter, search]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: 'var(--accent)' }}>
              Token Launchpad
            </h1>
            <p className="text-lg" style={{ color: 'var(--fg)', opacity: 0.65 }}>
              Discover early. Invest in promising tokens.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/launchpad/my-launches"
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              My Portfolio
            </Link>
            <Link 
              href="/launchpad/create"
              className="px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/10"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              <Plus size={20} />
              Launch Token
            </Link>
          </div>
        </div>

        {/* MVP Alert */}
        <div 
          className="mb-10 p-4 rounded-xl flex items-start gap-4"
          style={{ background: 'rgba(201,168,76,0.05)', border: '1px border rgba(201,168,76,0.2)' }}
        >
          <div className="p-2 rounded-lg" style={{ background: 'rgba(201,168,76,0.1)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--accent)' }}>MVP - Trust-based System</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.7 }}>
              This is a presale tracking MVP. Tokens are not automatically distributed via smart contracts. 
              Creators manually airdrop tokens post-launch based on recorded contributions. 
              Only invest in projects you trust.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
            <input 
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg outline-none transition-all"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg outline-none cursor-pointer"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg outline-none cursor-pointer"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              {MODE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {filteredLaunches.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed border-white/5">
            <Rocket size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-xl opacity-40">No launches found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLaunches.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LaunchCard({ launch }: { launch: TokenLaunch }) {
  const stats = getLaunchStats(launch);
  
  const modeColors: Record<LaunchMode, string> = {
    basic: '#60a5fa',
    allocation: '#a78bfa',
    ido: '#c9a84c'
  };

  const statusColors: Record<LaunchStatus, string> = {
    upcoming: '#94a3b8',
    live: '#22c55e',
    ended: '#60a5fa',
    completed: '#c9a84c',
    cancelled: '#ef4444',
    refunded: '#f97316'
  };

  const getTimeInfo = () => {
    const now = Date.now();
    if (now < launch.startsAt) {
      const diff = launch.startsAt - now;
      return `Starts in ${formatDiff(diff)}`;
    }
    if (now < launch.endsAt) {
      const diff = launch.endsAt - now;
      return `Ends in ${formatDiff(diff)}`;
    }
    return 'Ended';
  };

  const formatDiff = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    const mins = Math.floor(ms / (1000 * 60));
    return `${mins}m`;
  };

  return (
    <Link 
      href={`/launchpad/${launch.id}`}
      className="sweep group flex flex-col p-6 rounded-2xl border transition-all hover:translate-y-[-4px]"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-between items-start mb-6">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden shadow-inner"
          style={{ background: 'rgba(255,255,255,0.05)', color: modeColors[launch.mode] }}
        >
          {launch.tokenLogoUrl ? (
            <img src={launch.tokenLogoUrl} alt={launch.tokenSymbol} className="w-full h-full object-cover" />
          ) : (
            launch.tokenSymbol.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span 
            className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md"
            style={{ background: `${modeColors[launch.mode]}20`, color: modeColors[launch.mode] }}
          >
            {launch.mode}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColors[launch.status] }}>
            {launch.status === 'live' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColors[launch.status] }} />}
            {launch.status.toUpperCase()}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--fg)' }}>
        {launch.tokenName} <span className="text-sm opacity-40 font-normal">({launch.tokenSymbol})</span>
      </h3>
      <p className="text-sm line-clamp-2 mb-6 h-10" style={{ color: 'var(--fg)', opacity: 0.5 }}>
        {launch.description}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider opacity-40">Raised</span>
          <span className="font-mono text-sm" style={{ color: 'var(--fg)' }}>
            ${stats.raised.toLocaleString()} <span className="opacity-30">/ ${stats.cap.toLocaleString()}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[10px] uppercase tracking-wider opacity-40">Contributors</span>
          <span className="font-mono text-sm" style={{ color: 'var(--fg)' }}>{stats.contributors}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider mb-2">
          <span style={{ color: modeColors[launch.mode] }}>{stats.percentFilled.toFixed(1)}% Filled</span>
          <span className="opacity-40">{getTimeInfo()}</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.percentFilled}%`, background: modeColors[launch.mode] }}
          />
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs opacity-50">
          <Clock size={12} />
          <span>Ends {new Date(launch.endsAt).toLocaleDateString()}</span>
        </div>
        <div 
          className="text-xs font-bold transition-colors"
          style={{ color: modeColors[launch.mode] }}
        >
          View Details →
        </div>
      </div>
    </Link>
  );
}
