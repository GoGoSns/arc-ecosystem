'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Rocket, 
  TrendingUp, 
  Coins, 
  Wallet, 
  Clock, 
  ExternalLink,
  Plus
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { 
  useLaunchpadStore, 
  getMyLaunches, 
  getMyContributions, 
  getLaunchStats,
  LaunchStatus,
  LaunchMode,
  TokenLaunch,
  Contribution
} from '@/lib/launchpadStore';

const SUB_FILTERS: { label: string; value: LaunchStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Live', value: 'live' },
  { label: 'Ended', value: 'ended' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function MyLaunchpadActivity() {
  const { address, isConnected } = useAccount();
  const { launches, markClaimed } = useLaunchpadStore();
  const [activeTab, setActiveTab] = useState<'launches' | 'contributions'>('launches');
  const [launchFilter, setLaunchFilter] = useState<LaunchStatus | 'all'>('all');

  const myLaunches = useMemo(() => {
    if (!address) return [];
    const list = getMyLaunches(launches, address);
    if (launchFilter === 'all') return list;
    return list.filter(l => l.status === launchFilter);
  }, [launches, address, launchFilter]);

  const myContributions = useMemo(() => {
    if (!address) return [];
    return getMyContributions(launches, address);
  }, [launches, address]);

  const stats = useMemo(() => {
    if (!address) return { totalInvested: 0, activeInvestments: 0, totalLaunches: 0, totalRaised: 0 };
    
    const totalInvested = myContributions.reduce((acc, c) => acc + c.contribution.usdcAmount, 0);
    const activeInvestments = myContributions.filter(c => c.launch.status === 'upcoming' || c.launch.status === 'live').length;
    
    const allMyLaunches = getMyLaunches(launches, address);
    const totalLaunches = allMyLaunches.length;
    const totalRaised = allMyLaunches.reduce((acc, l) => acc + l.totalRaised, 0);

    return { totalInvested, activeInvestments, totalLaunches, totalRaised };
  }, [myContributions, launches, address]);

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-8 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Wallet size={48} className="mx-auto mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="opacity-60 mb-6">Please connect your wallet to view your launchpad activity.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: 'var(--accent)' }}>
            My Launchpad Activity
          </h1>
          <p className="text-lg opacity-60">
            Track your launches and contributions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard icon={Coins} label="Total Invested" value={`$${stats.totalInvested.toLocaleString()}`} />
          <StatCard icon={TrendingUp} label="Active Investments" value={stats.activeInvestments.toString()} />
          <StatCard icon={Rocket} label="Total Launches" value={stats.totalLaunches.toString()} />
          <StatCard icon={Wallet} label="Total Raised" value={`$${stats.totalRaised.toLocaleString()}`} />
        </div>

        {/* Tabs Toggle */}
        <div className="flex p-1 rounded-xl mb-8 w-fit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('launches')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'launches' ? 'shadow-lg' : 'opacity-50 hover:opacity-100'}`}
            style={{ 
              background: activeTab === 'launches' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'launches' ? '#000' : 'var(--fg)'
            }}
          >
            My Launches
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'contributions' ? 'shadow-lg' : 'opacity-50 hover:opacity-100'}`}
            style={{ 
              background: activeTab === 'contributions' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'contributions' ? '#000' : 'var(--fg)'
            }}
          >
            My Contributions
          </button>
        </div>

        {activeTab === 'launches' ? (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {SUB_FILTERS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLaunchFilter(opt.value)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                  style={{ 
                    background: launchFilter === opt.value ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${launchFilter === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    color: launchFilter === opt.value ? 'var(--accent)' : 'var(--fg)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {myLaunches.length === 0 ? (
              <div className="py-20 text-center rounded-2xl border-2 border-dashed border-white/5">
                <Rocket size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-xl opacity-40 mb-6">No launches yet</p>
                <Link 
                  href="/launchpad/create"
                  className="px-6 py-2 rounded-lg font-bold inline-flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  <Plus size={20} />
                  Launch Token
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myLaunches.map(launch => (
                  <LaunchCard key={launch.id} launch={launch} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myContributions.length === 0 ? (
              <div className="py-20 text-center rounded-2xl border-2 border-dashed border-white/5">
                <Coins size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-xl opacity-40 mb-6">No contributions yet</p>
                <Link 
                  href="/launchpad"
                  className="px-6 py-2 rounded-lg font-bold inline-flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  Browse Launches
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {myContributions.map(({ launch, contribution }) => (
                  <ContributionItem 
                    key={contribution.id} 
                    launch={launch} 
                    contribution={contribution} 
                    onMarkClaimed={() => markClaimed(launch.id, contribution.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-6 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <Icon size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <span className="text-[10px] uppercase tracking-widest opacity-40">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
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

  return (
    <Link 
      href={`/launchpad/${launch.id}`}
      className="sweep p-6 rounded-2xl border flex flex-col transition-all hover:translate-y-[-4px]"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-between items-start mb-6">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden"
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
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: statusColors[launch.status] }}>
            {launch.status}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">
        {launch.tokenName} <span className="text-sm opacity-40 font-normal">({launch.tokenSymbol})</span>
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Raised</div>
          <div className="font-mono text-sm">${launch.totalRaised.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Contributors</div>
          <div className="font-mono text-sm">{launch.totalContributors}</div>
        </div>
      </div>
    </Link>
  );
}

function ContributionItem({ 
  launch, 
  contribution, 
  onMarkClaimed 
}: { 
  launch: TokenLaunch, 
  contribution: Contribution,
  onMarkClaimed: () => void
}) {
  const statusColors: Record<LaunchStatus, string> = {
    upcoming: '#94a3b8',
    live: '#22c55e',
    ended: '#60a5fa',
    completed: '#c9a84c',
    cancelled: '#ef4444',
    refunded: '#f97316'
  };

  const allocation = contribution.finalAllocation || contribution.tokenAllocation;
  const canClaim = (launch.status === 'ended' || launch.status === 'completed') && !contribution.claimed;

  return (
    <div 
      className="p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <Link href={`/launchpad/${launch.id}`} className="flex items-center gap-4 flex-1 group">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent)' }}
        >
          {launch.tokenLogoUrl ? (
            <img src={launch.tokenLogoUrl} alt={launch.tokenSymbol} className="w-full h-full object-cover" />
          ) : (
            launch.tokenSymbol.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 group-hover:text-[var(--accent)] transition-colors">
            {launch.tokenName} <span className="text-sm opacity-40 font-normal">({launch.tokenSymbol})</span>
            <ExternalLink size={14} className="opacity-30" />
          </h3>
          <div className="text-sm opacity-50 flex items-center gap-3">
             <span className="flex items-center gap-1"><Clock size={12} /> {new Date(contribution.timestamp).toLocaleDateString()}</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span className="font-bold uppercase tracking-widest text-[10px]" style={{ color: statusColors[launch.status] }}>{launch.status}</span>
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-8">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Contributed</div>
          <div className="font-mono font-bold text-lg">${contribution.usdcAmount.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Allocation</div>
          <div className="font-mono font-bold text-lg text-[var(--accent)]">{allocation.toLocaleString()} {launch.tokenSymbol}</div>
        </div>
        
        <div className="min-w-[140px] flex flex-col items-end gap-2">
          {canClaim ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onMarkClaimed();
              }}
              className="px-4 py-2 rounded-lg font-bold text-xs transition-all hover:scale-105 w-full"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Mark Claimed
            </button>
          ) : contribution.claimed ? (
            <div className="px-4 py-2 rounded-lg border border-green-500/30 text-green-500 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Claimed
            </div>
          ) : (
             <div className="text-[10px] opacity-40 italic text-right max-w-[120px]">
               Tokens distributed manually by creator within 7 days
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
