'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useDropsStore, Drop, DropStatus } from '@/lib/dropsStore';
import { 
  Gift, 
  Users, 
  Coins, 
  Timer, 
  Twitter, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  Archive,
  Zap,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import LanguageToggle from '@/components/LanguageToggle';
import { HubMetricCard } from '@/components/HubPrimitives';
import { translations, type Lang } from '@/lib/translations';

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

function Countdown({ targetDate }: { targetDate: number }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-red-500 font-bold uppercase">ENDED</span>;

  return (
    <div className="flex gap-2 font-mono text-sm">
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="font-black text-white">{timeLeft.days}</span>
        <span className="text-[8px] text-[#555] uppercase">d</span>
      </div>
      <span className="text-white/20">:</span>
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="font-black text-white">{timeLeft.hours}</span>
        <span className="text-[8px] text-[#555] uppercase">h</span>
      </div>
      <span className="text-white/20">:</span>
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="font-black text-white">{timeLeft.minutes}</span>
        <span className="text-[8px] text-[#555] uppercase">m</span>
      </div>
      <span className="text-white/20">:</span>
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="font-black text-[#c9a84c]">{timeLeft.seconds}</span>
        <span className="text-[8px] text-[#555] uppercase">s</span>
      </div>
    </div>
  );
}

export default function DropsPage() {
  const { address, isConnected, connect } = useWallet();
  const { drops } = useDropsStore();
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved) setLang(saved);
  }, []);

  const t = translations[lang];
  const copy = t.drops;

  const activeDrops = useMemo(() => drops.filter(d => d.status === 'active'), [drops]);
  const upcomingDrops = useMemo(() => drops.filter(d => d.status === 'upcoming'), [drops]);

  const stats = useMemo(() => {
    const totalPrizePool = drops.reduce((acc, d) => acc + (d.prizeType === 'usdc' ? d.prizeAmount : 0), 0);
    const totalEntries = drops.reduce((acc, d) => acc + d.entries.length, 0);
    const userEntries = address ? drops.filter(d => d.entries.some(e => e.address.toLowerCase() === address.toLowerCase())).length : 0;
    return {
      activeCount: activeDrops.length,
      totalPrizePool,
      totalEntries,
      userEntries
    };
  }, [drops, activeDrops, address]);

  return (
    <main className="page-shell min-h-screen overflow-x-clip text-white">
      {/* Nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <Link href="/drops" className="text-white">{t.nav.drops}</Link>
            <Link href="/drops/archive" className="nav-link">{copy.hero.archiveCta}</Link>
            <Link href="/quests" className="nav-link">{t.nav.quests}</Link>
            <Link href="/roulette" className="nav-link">{t.nav.roulette}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle currentLang={lang} onChange={(l) => { setLang(l); localStorage.setItem('arc-lang', l); }} />
            <AppSwitcher />
            {isConnected ? (
              <div className="bracket-button">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            ) : (
              <button onClick={connect} className="bracket-button">CONNECT WALLET</button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-16 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="reveal mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between" style={{ transitionDelay: '40ms' }}>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">{copy.hero.tagline}</p>
              <h1 className="mt-6 text-5xl font-black uppercase sm:text-7xl lg:text-8xl">
                {copy.hero.titlePrefix} <span className="text-[#c9a84c]">{copy.hero.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl text-[#9a9a9a]">
                {copy.hero.description}
              </p>
            </div>
            <Link href="/drops/archive" className="bracket-button flex items-center gap-2">
              <Archive size={16} /> {copy.hero.archiveCta}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <HubMetricCard label={copy.stats.active} value={stats.activeCount} icon={Zap} />
            <HubMetricCard label={copy.stats.pool} value={`$${stats.totalPrizePool.toLocaleString()}`} icon={Coins} />
            <HubMetricCard label={copy.stats.entries} value={stats.totalEntries} icon={Users} />
            <HubMetricCard label={copy.stats.yours} value={stats.userEntries} icon={CheckCircle2} />
          </div>

          {/* Active Drops */}
          <div className="reveal mb-20" style={{ transitionDelay: '120ms' }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-2xl font-black uppercase tracking-wider">{copy.sections.active}</h2>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              {activeDrops.map((drop) => (
                <Link href={`/drops/${drop.id}`} key={drop.id} className="group">
                  <article className="bracket-card h-full flex flex-col overflow-hidden bg-white/[0.01] transition-transform hover:-translate-y-1">
                    <Brackets />
                    {/* Banner */}
                    <div className={`h-48 w-full bg-gradient-to-br ${
                      drop.id === 'diamond-drop' ? 'from-blue-600/40 to-purple-600/40' : 'from-orange-600/40 to-red-600/40'
                    } relative flex items-center justify-center`}>
                      <Gift size={64} className="text-white/20 group-hover:scale-110 transition-transform" />
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2">
                        <Countdown targetDate={drop.endDate} />
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-3xl font-black uppercase group-hover:text-[#c9a84c] transition-colors">{drop.title}</h3>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-[#777] uppercase">{copy.cards.prize}</p>
                          <p className="text-xl font-black text-[#c9a84c]">
                            {drop.prizeType === 'usdc' ? `$${drop.prizeAmount}` : `${drop.prizeAmount} NFTs`}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-[#777] text-sm leading-relaxed mb-8 line-clamp-2">
                        {drop.description}
                      </p>
                      
                      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] uppercase">
                            <Users size={12} /> {drop.entries.length} {copy.cards.entries}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] uppercase">
                            <LayoutGrid size={12} /> {drop.winnerCount} {copy.cards.winners}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {drop.requirements.map(req => (
                            <div key={req} className="p-1.5 bg-white/5 rounded border border-white/10 text-[#777]">
                              {req.includes('twitter') ? <Twitter size={12} /> : 
                               req.includes('discord') ? <MessageSquare size={12} /> : 
                               <Zap size={12} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Drops */}
          <div className="reveal" style={{ transitionDelay: '180ms' }}>
            <div className="flex items-center gap-3 mb-10">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h2 className="text-2xl font-black uppercase tracking-wider text-[#777]">{copy.sections.upcoming}</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingDrops.map((drop) => (
                <div key={drop.id} className="bracket-card p-6 bg-white/[0.01] opacity-60">
                  <Brackets />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black uppercase mb-1">{drop.title}</h3>
                      <p className="text-[10px] font-mono text-[#c9a84c] uppercase">
                        {copy.cards.startsIn} {Math.floor((drop.startDate - Date.now()) / 86400000)} {copy.cards.days}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <Timer size={20} className="text-[#555]" />
                    </div>
                  </div>
                  <p className="text-xs text-[#555] mb-6 line-clamp-2">{drop.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-xs font-black text-white/40">
                      {drop.prizeType === 'usdc' ? `$${drop.prizeAmount}` : `${drop.prizeAmount} NFTs`}
                    </span>
                    <Link href={`/drops/${drop.id}`} className="text-[10px] font-mono text-[#555] hover:text-white transition-colors">
                      {copy.cards.details} <ArrowRight size={10} className="inline ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2a2a2a] px-4 py-12 mt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 font-mono text-xs uppercase tracking-[0.16em] text-[#777] md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Arc Ecosystem &middot; Verified Giveaways</p>
          <div className="flex gap-5">
            <Link href="/drops" className="nav-link">// Active</Link>
            <Link href="/drops/archive" className="nav-link">// Archive</Link>
            <a href="https://x.com/arcnetwork_" target="_blank" rel="noopener noreferrer" className="nav-link">// X</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
