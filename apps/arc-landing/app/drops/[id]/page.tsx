'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useDropsStore, Drop, DropEntry, EntryRequirement, ADMIN_ADDRESS } from '@/lib/dropsStore';
import { 
  Gift, 
  Users, 
  Coins, 
  Timer, 
  Twitter, 
  MessageSquare, 
  CheckCircle2, 
  ArrowLeft,
  ShieldAlert,
  Zap,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';
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

  if (!timeLeft) return <span className="text-red-500 font-bold uppercase tracking-widest">Ended</span>;

  return (
    <div className="flex gap-4 font-mono">
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black">{timeLeft.days}</span>
        <span className="text-[10px] text-[#777] uppercase">Days</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black">{timeLeft.hours}</span>
        <span className="text-[10px] text-[#777] uppercase">Hrs</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black">{timeLeft.minutes}</span>
        <span className="text-[10px] text-[#777] uppercase">Min</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-[#c9a84c]">{timeLeft.seconds}</span>
        <span className="text-[10px] text-[#777] uppercase">Sec</span>
      </div>
    </div>
  );
}

export default function DropDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { address, isConnected, connect } = useWallet();
  const { drops, addEntry, selectWinners } = useDropsStore();
  
  const drop = useMemo(() => drops.find(d => d.id === id), [drops, id]);
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  const [completed, setCompleted] = useState<EntryRequirement[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved) setLang(saved);
  }, []);

  const t = translations[lang];

  const userEntry = useMemo(() => 
    address ? drop?.entries.find(e => e.address.toLowerCase() === address.toLowerCase()) : null
  , [drop, address]);

  const toggleRequirement = (req: EntryRequirement) => {
    if (completed.includes(req)) {
      setCompleted(completed.filter(r => r !== req));
    } else {
      setCompleted([...completed, req]);
    }
  };

  const canSubmit = useMemo(() => 
    isConnected && drop?.requirements.every(req => completed.includes(req) || (req === 'wallet-connect' && isConnected))
  , [isConnected, drop, completed]);

  const handleSubmit = () => {
    if (!canSubmit || !address || !drop) return;
    
    const entry: DropEntry = {
      address,
      enteredAt: Date.now(),
      completed: [...completed, 'wallet-connect']
    };
    
    addEntry(drop.id, entry);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  if (!drop) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Link href="/drops" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Drops
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            {/* Main Content */}
            <div className="space-y-12">
              <div className="reveal">
                {/* Banner Image / Hero */}
                <div className={`h-64 w-full rounded-2xl bg-gradient-to-br ${
                  drop.id === 'diamond-drop' ? 'from-blue-600/40 to-purple-600/40' : 'from-orange-600/40 to-red-600/40'
                } border border-white/5 flex items-center justify-center mb-10 overflow-hidden relative group`}>
                   <Gift size={96} className="text-white/20 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-black/20" />
                   <div className="absolute bottom-6 left-6 text-left">
                     <p className="font-mono text-[10px] uppercase text-[#c9a84c] tracking-[0.2em] mb-2">// reward</p>
                     <h2 className="text-4xl font-black uppercase">
                       {drop.prizeType === 'usdc' ? `$${drop.prizeAmount.toLocaleString()} USDC` : `${drop.prizeAmount} Rare NFTs`}
                     </h2>
                   </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`px-3 py-1 rounded text-[10px] font-black uppercase border ${
                    drop.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    drop.status === 'upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-white/5 text-[#777] border-white/10'
                  }`}>
                    {drop.status}
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-black uppercase text-[#777]">
                    {drop.winnerCount} Winners
                  </div>
                </div>

                <h1 className="text-4xl font-black uppercase sm:text-5xl lg:text-6xl mb-6">{drop.title}</h1>
                <p className="text-[#9a9a9a] text-lg leading-relaxed mb-10">
                  {drop.description}
                </p>

                {/* Requirements Checklist */}
                <div className="bracket-card p-8 bg-white/[0.01]">
                  <Brackets />
                  <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
                    <UserCheck className="text-[#c9a84c]" size={20} /> Requirements
                  </h3>
                  
                  <div className="space-y-4">
                    {drop.requirements.map((req) => {
                      const isComplete = userEntry ? true : (req === 'wallet-connect' ? isConnected : completed.includes(req));
                      return (
                        <div 
                          key={req} 
                          onClick={() => !userEntry && req !== 'wallet-connect' && toggleRequirement(req)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                            isComplete ? 'bg-green-500/5 border-green-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-6 w-6 rounded border flex items-center justify-center transition-colors ${
                              isComplete ? 'bg-green-500 border-green-500 text-black' : 'border-white/20'
                            }`}>
                              {isComplete && <CheckCircle2 size={14} />}
                            </div>
                            <div>
                              <p className={`text-sm font-bold uppercase ${isComplete ? 'text-white' : 'text-[#777]'}`}>
                                {req === 'wallet-connect' && 'Connect Wallet'}
                                {req === 'twitter-follow' && 'Follow @arcnetwork_ on Twitter'}
                                {req === 'twitter-retweet' && 'Retweet the Drop Post'}
                                {req === 'discord-join' && 'Join the Arc Discord'}
                                {req === 'forum-post' && 'Post in #drops forum channel'}
                              </p>
                              {req.includes('twitter') && (
                                <a
                                  href={drop.twitterUrl || '#'}
                                  target={drop.twitterUrl ? '_blank' : undefined}
                                  rel={drop.twitterUrl ? 'noopener noreferrer' : undefined}
                                  className="mt-1 flex items-center gap-1 text-[10px] text-[#c9a84c] hover:underline"
                                >
                                  Go to Twitter <ExternalLink size={8} />
                                </a>
                              )}
                              {req.includes('discord') && (
                                <a
                                  href={drop.discordUrl || '#'}
                                  target={drop.discordUrl ? '_blank' : undefined}
                                  rel={drop.discordUrl ? 'noopener noreferrer' : undefined}
                                  className="mt-1 flex items-center gap-1 text-[10px] text-[#c9a84c] hover:underline"
                                >
                                  Go to Discord <ExternalLink size={8} />
                                </a>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-white/10" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-10">
                    {userEntry ? (
                      <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                        <CheckCircle2 size={32} className="text-green-500 mx-auto mb-4" />
                        <h4 className="text-lg font-black uppercase text-green-500">Entry Submitted</h4>
                        <p className="text-xs text-[#777] mt-2">
                          You entered this drop on {new Date(userEntry.enteredAt).toLocaleDateString()}. Winners will be announced after the countdown ends.
                        </p>
                      </div>
                    ) : drop.status === 'active' ? (
                      <button 
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        className="primary-button w-full justify-center py-5 text-xl disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        <span className="relative z-10">SUBMIT ENTRY</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      </button>
                    ) : drop.status === 'upcoming' ? (
                      <button disabled className="bracket-button w-full justify-center opacity-50">
                        WAITING FOR START...
                      </button>
                    ) : (
                      <div className="text-center p-6 border border-white/10 rounded-xl">
                        <p className="text-[#555] font-mono text-sm uppercase">Drop has ended</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Winners Section (if ended) */}
              {drop.status === 'ended' && drop.winners.length > 0 && (
                <div className="bracket-card p-8 bg-[#c9a84c]/5 border-[#c9a84c]/20">
                  <Brackets />
                  <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-3">
                    <Zap className="text-[#c9a84c]" size={24} /> Winners Revealed
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {drop.winners.map((winner, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-xs">
                        <span className="text-[#c9a84c] font-black">#{idx + 1}</span>
                        <span className="text-white/80">{winner}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-[10px] text-[#777] uppercase tracking-widest">
                      Winners were selected randomly from all valid entries.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Timer Card */}
              <div className="bracket-card p-8 bg-black/40 border-white/5 text-center">
                <Brackets />
                <Timer className="mx-auto mb-4 text-[#c9a84c]" size={32} />
                <p className="text-[10px] font-mono text-[#777] uppercase mb-4">
                  {drop.status === 'upcoming' ? 'Starts In' : drop.status === 'active' ? 'Ends In' : 'Status'}
                </p>
                <Countdown targetDate={drop.status === 'upcoming' ? drop.startDate : drop.endDate} />
              </div>

              {/* Stats Card */}
              <div className="bracket-card p-8 bg-white/[0.01]">
                <Brackets />
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-mono text-[#777] uppercase mb-1">Total Entries</p>
                    <p className="text-3xl font-black">{drop.entries.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#777] uppercase mb-1">Success Probability</p>
                    <p className="text-3xl font-black text-[#c9a84c]">
                      {drop.entries.length > 0 ? `${Math.min(100, (drop.winnerCount / drop.entries.length * 100)).toFixed(1)}%` : '100%'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Panel */}
              {isAdmin && drop.status !== 'upcoming' && (
                <div className="bracket-card p-8 bg-red-500/5 border-red-500/20">
                  <Brackets />
                  <h3 className="text-lg font-black uppercase text-red-500 mb-6 flex items-center gap-2">
                    <ShieldAlert size={20} /> Admin Control
                  </h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => selectWinners(drop.id)}
                      disabled={drop.status === 'ended' || drop.entries.length === 0}
                      className="w-full primary-button bg-red-500 hover:bg-red-600 justify-center border-none text-white disabled:opacity-30"
                    >
                      SELECT WINNERS
                    </button>
                    <p className="text-[10px] text-center text-[#777] uppercase font-mono mt-4 leading-relaxed">
                      Randomly selects {drop.winnerCount} winners and moves drop to 'ended' status.
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Entries Feed */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#777] mb-6 flex items-center gap-2">
                  <Users size={14} /> Recent Entries
                </h3>
                <div className="space-y-3">
                  {drop.entries.slice(0, 10).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500/50" />
                        <span className="font-mono text-[10px] text-[#aaa]">{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</span>
                      </div>
                      <span className="text-[9px] text-[#555] font-mono">
                        {Math.floor((Date.now() - entry.enteredAt) / 60000)}m ago
                      </span>
                    </div>
                  ))}
                  {drop.entries.length === 0 && (
                    <p className="text-center text-[10px] text-[#555] font-mono py-8 uppercase">No entries yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
          {[...Array(60)].map((_, i) => (
            <div 
              key={i}
              className="absolute h-2 w-2 bg-[#c9a84c] rounded-sm animate-confetti"
              style={{ 
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random()
              }}
            />
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2.5s linear forwards;
        }
      `}</style>
    </main>
  );
}
