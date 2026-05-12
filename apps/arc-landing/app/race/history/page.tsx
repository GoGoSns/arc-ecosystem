'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  History, 
  Search, 
  Filter, 
  ExternalLink,
  Trophy,
  Calendar,
  Layers
} from 'lucide-react';
import { useRaceStore, RaceCategory } from '@/lib/raceStore';
import AppSwitcher from '@/components/AppSwitcher';

function Brackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

const CATEGORIES: { id: RaceCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'volume', label: 'Volume' },
  { id: 'forum-posts', label: 'Forum Posts' },
  { id: 'quests', label: 'Quests' },
  { id: 'referrals', label: 'Referrals' },
];

export default function RaceHistory() {
  const { races } = useRaceStore();
  const [activeCategory, setActiveCategory] = useState<RaceCategory | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const years = useMemo(() => {
    const yearsSet = new Set(races.map(r => new Date(r.endDate).getFullYear().toString()));
    return ['all', ...Array.from(yearsSet).sort((a, b) => b.localeCompare(a))];
  }, [races]);

  const pastRaces = useMemo(() => {
    return races
      .filter(r => r.status === 'ended')
      .filter(r => activeCategory === 'all' || r.category === activeCategory)
      .filter(r => selectedYear === 'all' || new Date(r.endDate).getFullYear().toString() === selectedYear)
      .sort((a, b) => b.endDate - a.endDate);
  }, [races, activeCategory, selectedYear]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/race" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Race
          </Link>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <Link href="/race" className="nav-link">HUB</Link>
            <Link href="/race/history" className="text-white">HISTORY</Link>
          </div>
          <div className="flex items-center gap-3">
            <AppSwitcher />
            <Link href="/race" className="bracket-button">BACK TO HUB</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Link href="/race" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Hub
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// archives</p>
              <h1 className="text-4xl font-black uppercase sm:text-5xl lg:text-6xl mt-4">RACE <span className="text-[#c9a84c]">HISTORY</span></h1>
              <p className="text-[#777] mt-4 max-w-xl">Review past competitions, winners, and prize distributions in the Arc Ecosystem.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <select 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm focus:border-[#c9a84c] outline-none appearance-none transition-colors"
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as any)}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex-1 lg:flex-none relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                <select 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm focus:border-[#c9a84c] outline-none appearance-none transition-colors"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {years.filter(y => y !== 'all').map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bracket-card p-0 overflow-hidden bg-white/[0.01]">
            <Brackets />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-[#555]">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Race Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Winner</th>
                    <th className="px-6 py-4">Grand Prize</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pastRaces.map((race) => {
                    const winner = [...race.participants].sort((a, b) => b.score - a.score)[0];
                    return (
                      <tr key={race.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-[#555]">
                          {new Date(race.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold group-hover:text-[#c9a84c] transition-colors">{race.title}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-black uppercase text-[#777]">
                            {race.category.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {winner ? (
                            <div className="flex items-center gap-2">
                              <Trophy className="text-[#c9a84c]" size={14} />
                              <span className="text-sm font-bold text-white">{winner.name || `${winner.address.slice(0, 6)}...`}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-[#555]">No winner</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-[#c9a84c]">${race.prizes[0]} USDC</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/race/${race.id}`} className="inline-flex p-2 border border-white/10 rounded hover:border-[#c9a84c]/50 text-[#555] hover:text-[#c9a84c] transition-all">
                            <ExternalLink size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {pastRaces.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <History className="mx-auto mb-4 text-[#222]" size={48} />
                        <p className="text-[#555] font-mono uppercase tracking-widest">No historical races found</p>
                        <button 
                          onClick={() => { setActiveCategory('all'); setSelectedYear('all'); }}
                          className="mt-4 text-[#c9a84c] hover:underline text-xs uppercase font-black"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 p-8 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] shrink-0">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black uppercase">Start Your Own Race?</h4>
                <p className="text-sm text-[#777] mt-1">Want to host a competition for your community? Contact the Arc Labs team.</p>
              </div>
            </div>
            <button className="bracket-button border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black">
              CONTACT TEAM
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
