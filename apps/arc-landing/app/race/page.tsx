'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Timer, 
  Users, 
  Coins, 
  ArrowRight, 
  Calendar,
  CheckCircle2,
  Medal,
  TrendingUp,
  History as HistoryIcon
} from 'lucide-react';
import { useRaceStore, Race } from '@/lib/raceStore';
import { useWallet } from '@/contexts/WalletContext';
import AppSwitcher from '@/components/AppSwitcher';
import { translations } from '@/lib/translations';
import LanguageToggle from '@/components/LanguageToggle';

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

  if (!timeLeft) return <span className="text-red-500 font-bold">ENDED</span>;

  return (
    <div className="flex gap-4 font-mono">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.days}</span>
        <span className="text-[10px] text-[#777] uppercase">Days</span>
      </div>
      <span className="text-2xl font-black text-white/20">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.hours}</span>
        <span className="text-[10px] text-[#777] uppercase">Hrs</span>
      </div>
      <span className="text-2xl font-black text-white/20">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.minutes}</span>
        <span className="text-[10px] text-[#777] uppercase">Min</span>
      </div>
      <span className="text-2xl font-black text-white/20">:</span>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-[#c9a84c]">{timeLeft.seconds}</span>
        <span className="text-[10px] text-[#777] uppercase">Sec</span>
      </div>
    </div>
  );
}

export default function RaceHub() {
  const { races } = useRaceStore();
  const { address, isConnected } = useWallet();
  const [lang, setLang] = useState<'en' | 'tr'>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as 'en' | 'tr' | null;
    if (saved) setLang(saved);
  }, []);

  const t = translations[lang];

  const activeRace = useMemo(() => races.find(r => r.status === 'active'), [races]);
  const upcomingRace = useMemo(() => races.find(r => r.status === 'upcoming'), [races]);
  const pastRaces = useMemo(() => races.filter(r => r.status === 'ended').slice(0, 5), [races]);

  const stats = useMemo(() => {
    const activeCount = races.filter(r => r.status === 'active').length;
    const totalPrize = races.reduce((acc, r) => acc + (r.status !== 'upcoming' ? r.prizePool : 0), 0);
    const totalParticipants = races.reduce((acc, r) => acc + r.participants.length, 0);
    const userWins = address ? races.filter(r => r.status === 'ended' && r.participants[0]?.address.toLowerCase() === address.toLowerCase()).length : 0;

    return [
      { label: 'Active Races', value: activeCount, icon: <TrendingUp size={18} /> },
      { label: 'Prize Pool USDC', value: `$${totalPrize}`, icon: <Coins size={18} /> },
      { label: 'Total Participants', value: totalParticipants, icon: <Users size={18} /> },
      { label: 'Your Wins', value: userWins, icon: <Trophy size={18} /> },
    ];
  }, [races, address]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <Link href="/race" className="text-white">ARC RACE</Link>
            <Link href="/race/history" className="nav-link">HISTORY</Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle currentLang={lang} onChange={(l) => setLang(l)} />
            <AppSwitcher />
            {isConnected ? (
              <div className="bracket-button">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            ) : (
              <div className="bracket-button opacity-50 cursor-not-allowed">WALLET DISCONNECTED</div>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16">
            <div className="reveal">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// competition</p>
              <h1 className="mt-6 text-5xl font-black uppercase sm:text-7xl lg:text-8xl">
                ARC <span className="text-[#c9a84c]">RACE</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-[#9a9a9a]">
                Compete. Climb the leaderboard. Win USDC. Join weekly competitions in different categories to prove your dominance in the ecosystem.
              </p>
            </div>
            <Link href="/race/history" className="bracket-button flex items-center gap-2">
              <HistoryIcon size={16} /> VIEW HISTORY
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="bracket-card p-6 bg-white/[0.02]">
                <Brackets />
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#777]">{stat.label}</p>
                  <div className="text-[#c9a84c]/50">{stat.icon}</div>
                </div>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Active Race Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-xl font-black uppercase tracking-wider">Active Race</h2>
              </div>
              
              {activeRace ? (
                <div className="bracket-card p-8 bg-gradient-to-br from-[#c9a84c]/10 to-transparent border-[#c9a84c]/30">
                  <Brackets />
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="inline-block px-3 py-1 bg-[#c9a84c] text-black text-[10px] font-black uppercase rounded mb-4">
                        {activeRace.category.replace('-', ' ')}
                      </div>
                      <h3 className="text-4xl font-black mb-4">{activeRace.title}</h3>
                      <p className="text-[#9a9a9a] mb-8 leading-relaxed">
                        {activeRace.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <p className="text-[10px] font-mono text-[#777] uppercase mb-1">Prize Pool</p>
                          <p className="text-3xl font-black text-[#c9a84c] tracking-tight">${activeRace.prizePool} <span className="text-sm font-normal text-[#777]">USDC</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-[#777] uppercase mb-1">Participants</p>
                          <p className="text-3xl font-black">{activeRace.participants.length}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <Link href={`/race/${activeRace.id}`} className="primary-button">
                          VIEW LEADERBOARD <ArrowRight size={16} />
                        </Link>
                        {isConnected && !!address && activeRace.participants.some(p => p.address.toLowerCase() === address.toLowerCase()) ? (
                          <div className="flex items-center gap-2 px-6 py-3 border border-green-500/30 bg-green-500/10 rounded text-green-500 font-black text-xs">
                            <CheckCircle2 size={16} /> ALREADY JOINED
                          </div>
                        ) : (
                          <Link href={`/race/${activeRace.id}`} className="secondary-button">
                            JOIN RACE
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-xl border border-white/5 text-center min-w-[240px]">
                      <Timer className="text-[#c9a84c] mb-4" size={32} />
                      <p className="text-[10px] font-mono text-[#777] uppercase mb-4">Time Remaining</p>
                      <Countdown targetDate={activeRace.endDate} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bracket-card p-12 text-center border-dashed border-[#2a2a2a]">
                  <Brackets />
                  <p className="text-[#555] font-mono uppercase">No active races at the moment</p>
                </div>
              )}
            </div>

            {/* Upcoming & Recent Winners */}
            <div className="space-y-8">
              {/* Upcoming Race */}
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-6">Upcoming Race</h2>
                {upcomingRace ? (
                  <div className="bracket-card p-6 bg-white/[0.01] border-blue-500/20">
                    <Brackets />
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-[#777] uppercase">Starts in {Math.floor((upcomingRace.startDate - Date.now()) / 86400000)} days</p>
                        <h3 className="text-xl font-black">{upcomingRace.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-[#777] mb-6 line-clamp-2">{upcomingRace.description}</p>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-blue-400">PRIZE POOL: ${upcomingRace.prizePool} USDC</span>
                      <Link href={`/race/${upcomingRace.id}`} className="text-white hover:text-blue-400 flex items-center gap-1 transition-colors">
                        DETAILS <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bracket-card p-8 text-center border-dashed border-[#2a2a2a]">
                    <Brackets />
                    <p className="text-[#555] font-mono uppercase">Stay tuned for next race</p>
                  </div>
                )}
              </div>

              {/* Recent Winners */}
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-6">Recent Winners</h2>
                <div className="space-y-3">
                  {pastRaces.map((race, i) => {
                    const winner = [...race.participants].sort((a, b) => b.score - a.score)[0];
                    return (
                      <div key={i} className="bracket-card p-4 bg-white/[0.02] flex items-center justify-between">
                        <Brackets />
                        <div className="flex items-center gap-3">
                          <Medal className="text-[#c9a84c]" size={20} />
                          <div>
                            <p className="text-[10px] font-mono text-[#777] uppercase">{race.title}</p>
                            <p className="text-sm font-bold text-white">
                              {winner?.name || winner?.address.slice(0, 8) || 'No Winner'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#c9a84c]">${race.prizes[0]} USDC</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
