'use client';

import { useWallet } from '@/contexts/WalletContext';
import { 
  useQuestStore, 
  QUESTS, 
  BADGES, 
  getProgressPercent, 
  getXpForLevel 
} from '@/lib/questStore';
import { 
  Trophy, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  ArrowLeft,
  Share2,
  Medal,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RARITY_COLORS = {
  common: 'text-gray-400 border-gray-400/20 bg-gray-400/5',
  rare: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  epic: 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  legendary: 'text-[#c9a84c] border-[#c9a84c]/20 bg-[#c9a84c]/5 shadow-[0_0_15px_rgba(201,168,76,0.1)]',
};

export default function ProfilePage() {
  const { address, isConnected, connect } = useWallet();
  const { getUserProgress } = useQuestStore();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected && !address) {
      // Optional: redirect or show connect state
    }
  }, [isConnected, address]);

  if (!isConnected || !address) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <div className="bracket-card p-12 text-center max-w-md">
          <Brackets />
          <div className="h-20 w-20 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto border border-[#c9a84c]/20 mb-8">
            <Lock className="text-[#c9a84c]" size={32} />
          </div>
          <h1 className="text-3xl font-black mb-4">WALLET REQUIRED</h1>
          <p className="text-[#777] mb-8">Connect your wallet to view your quest profile, XP, and badges.</p>
          <button onClick={connect} className="bracket-button w-full justify-center py-4">CONNECT WALLET</button>
          <Link href="/quests" className="block mt-6 text-sm text-[#555] hover:text-[#c9a84c] transition-colors">
            Back to Quest Hub
          </Link>
        </div>
      </main>
    );
  }

  const progress = getUserProgress(address);
  const percent = getProgressPercent(progress.totalXp);
  const completedQuests = QUESTS.filter(q => progress.completedQuests.includes(q.id));
  
  // Milestones
  const milestones = [
    { label: 'First Quest', reached: progress.completedQuests.length >= 1 },
    { label: '10 Quests', reached: progress.completedQuests.length >= 10 },
    { label: 'Half Way', reached: progress.completedQuests.length >= 15 },
    { label: 'Quest Master', reached: progress.completedQuests.length === QUESTS.length },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link href="/quests" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors font-mono text-xs uppercase mb-6">
              <ArrowLeft size={14} /> Back to Hub
            </Link>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">User Profile</p>
            <h1 className="text-4xl font-black mt-2">
              {address.slice(0, 6)}...{address.slice(-4)}
            </h1>
            <p className="text-[#555] font-mono text-xs mt-2 uppercase tracking-widest">
              Joined {new Date(progress.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-4">
             <button className="bracket-button">
              SHARE <Share2 size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Main Column */}
          <div className="space-y-8">
            {/* Level & XP */}
            <div className="bracket-card p-10 bg-gradient-to-br from-[#c9a84c]/5 to-transparent">
              <Brackets />
              <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Level Ring */}
                <div className="relative h-48 w-48">
                  <svg className="h-full w-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-[#1a1a1a]"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={552.92}
                      strokeDashoffset={552.92 - (552.92 * percent) / 100}
                      strokeLinecap="round"
                      className="text-[#c9a84c] transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="font-mono text-[10px] uppercase text-[#777] tracking-[0.2em]">LEVEL</p>
                    <p className="text-6xl font-black">{progress.level}</p>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-[#777] tracking-[0.2em] mb-1">Total XP</p>
                      <p className="text-4xl font-black text-[#c9a84c]">{progress.totalXp}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase text-[#777] tracking-[0.2em] mb-1">Rank</p>
                      <p className="text-4xl font-black">#12</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs text-[#777]">
                      <span>{progress.totalXp} XP</span>
                      <span>{getXpForLevel(progress.level + 1)} XP</span>
                    </div>
                    <div className="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-[#c9a84c] to-[#f0d78c]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-center font-mono text-[10px] text-[#555] uppercase pt-2">
                      {getXpForLevel(progress.level + 1) - progress.totalXp} XP to next level
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <section>
              <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                <Medal className="text-[#c9a84c]" /> BADGE COLLECTION
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {BADGES.map((badge) => {
                  const isEarned = progress.earnedBadges.includes(badge.id);
                  return (
                    <div 
                      key={badge.id}
                      className={`bracket-card p-6 text-center transition-all ${isEarned ? RARITY_COLORS[badge.rarity] : 'opacity-40 grayscale'}`}
                    >
                      <Brackets />
                      <div className="text-4xl mb-4 relative">
                        {badge.icon}
                        {!isEarned && <Lock className="absolute -top-1 -right-1 text-white" size={12} />}
                      </div>
                      <p className="font-black text-xs uppercase mb-1">{badge.name}</p>
                      <p className="text-[10px] uppercase tracking-tighter opacity-70">{badge.rarity}</p>
                      
                      {/* Tooltip-like info on hover */}
                      <div className="absolute inset-0 bg-[#0a0a0a] opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 text-[10px] leading-tight">
                        {badge.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Achievements */}
            <section>
               <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-3">
                <Trophy className="text-[#c9a84c]" /> ACHIEVEMENTS
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {milestones.map((m) => (
                  <div key={m.label} className={`flex items-center gap-4 p-4 border rounded-xl ${m.reached ? 'border-[#c9a84c]/30 bg-[#c9a84c]/5' : 'border-[#2a2a2a] opacity-50'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${m.reached ? 'bg-[#c9a84c] border-[#c9a84c] text-black' : 'border-[#2a2a2a] text-[#333]'}`}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className={`font-black uppercase text-sm ${m.reached ? 'text-white' : 'text-[#777]'}`}>{m.label}</p>
                      <p className="text-[10px] font-mono text-[#555]">
                        {m.reached ? 'REACHED' : 'LOCKED'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
             <div className="bracket-card p-6">
              <Brackets />
              <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
                <Clock className="text-[#c9a84c]" size={16} /> QUEST HISTORY
              </h3>
              <div className="space-y-4">
                {completedQuests.length > 0 ? (
                  completedQuests.slice().reverse().map((q) => (
                    <div key={q.id} className="flex gap-3 border-l-2 border-[#c9a84c]/30 pl-4 py-1">
                      <div>
                        <p className="text-xs font-black uppercase">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono text-[#c9a84c]">+{q.xpReward} XP</span>
                          <span className="text-[9px] font-mono text-[#555]">&middot; COMPLETED</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#555] italic text-center py-8">No quests completed yet.</p>
                )}
              </div>
              {completedQuests.length > 5 && (
                <button className="w-full mt-6 text-[10px] font-mono uppercase text-[#777] hover:text-white transition-colors">
                  View full history
                </button>
              )}
            </div>

            <div className="bracket-card p-6 bg-white/[0.02]">
              <Brackets />
              <h3 className="text-sm font-black uppercase mb-4">Stats Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[#777]">Completion Rate</span>
                  <span>{Math.round((progress.completedQuests.length / QUESTS.length) * 100)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#777]">Quests Left</span>
                  <span>{QUESTS.length - progress.completedQuests.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#777]">Badges Found</span>
                  <span>{progress.earnedBadges.length} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

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
