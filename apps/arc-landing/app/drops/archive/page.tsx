'use client';

import { useMemo } from 'react';
import { useDropsStore } from '@/lib/dropsStore';
import { 
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';

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

export default function DropsArchivePage() {
  const { drops } = useDropsStore();
  
  const pastDrops = useMemo(() => 
    drops.filter(d => d.status === 'ended').sort((a, b) => b.endDate - a.endDate)
  , [drops]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/drops" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to active drops
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-black uppercase sm:text-5xl lg:text-6xl mb-6">Drop <span className="text-[#c9a84c]">Archive</span></h1>
            <p className="text-[#9a9a9a] text-lg max-w-2xl">
              History of all completed giveaways in the Arc Ecosystem. Check past winners and participation stats.
            </p>
          </div>

          <div className="bracket-card overflow-hidden bg-white/[0.01]">
            <Brackets />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 font-mono text-[10px] uppercase text-[#555]">
                    <th className="px-8 py-6">Date</th>
                    <th className="px-8 py-6">Drop Title</th>
                    <th className="px-8 py-6">Prize</th>
                    <th className="px-8 py-6 text-center">Winners</th>
                    <th className="px-8 py-6 text-center">Entries</th>
                    <th className="px-8 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pastDrops.map((drop) => (
                    <tr key={drop.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono text-xs text-[#555]">
                          <Calendar size={12} />
                          {new Date(drop.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white group-hover:text-[#c9a84c] transition-colors uppercase">
                            {drop.title}
                          </span>
                          <span className="text-[10px] text-[#555] line-clamp-1">{drop.description}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Gift size={14} className="text-[#c9a84c]" />
                          <span className="text-sm font-bold text-white">
                            {drop.prizeType === 'usdc' ? `$${drop.prizeAmount.toLocaleString()}` : `${drop.prizeAmount} NFTs`}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Trophy size={14} className="text-[#c9a84c]" />
                          <span className="text-sm font-black">{drop.winners.length || drop.winnerCount}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users size={14} className="text-[#777]" />
                          <span className="text-sm font-bold text-[#aaa]">{drop.entries.length}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link href={`/drops/${drop.id}`} className="inline-flex items-center gap-2 text-[10px] font-mono text-[#555] hover:text-white transition-colors uppercase">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pastDrops.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <p className="text-[#555] font-mono text-sm uppercase">No past drops recorded yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2a2a2a] px-4 py-12 mt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 font-mono text-xs uppercase tracking-[0.16em] text-[#777] md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Arc Ecosystem &middot; Giveaway Transparency</p>
          <div className="flex gap-5">
            <Link href="/drops" className="nav-link">// Active Drops</Link>
            <a href="https://x.com/arcnetwork_" target="_blank" rel="noopener noreferrer" className="nav-link">// X</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
