'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { 
  QUESTS, 
  QuestCategory, 
  QuestDifficulty, 
  useQuestStore, 
  getProgressPercent, 
  getXpToNextLevel,
  getXpForLevel,
  Quest
} from '@/lib/questStore';
import { 
  Trophy, 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Filter, 
  ChevronDown,
  LayoutGrid,
  User,
  Medal,
  Wallet,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';

const CATEGORIES: { id: QuestCategory | 'all', label: string, icon: string }[] = [
  { id: 'all', label: 'All', icon: '🌀' },
  { id: 'starter', label: 'Starter', icon: '🌱' },
  { id: 'payment', label: 'Payment', icon: '💰' },
  { id: 'creator', label: 'Creator', icon: '🎨' },
  { id: 'play', label: 'Play', icon: '🎮' },
  { id: 'community', label: 'Community', icon: '💬' },
  { id: 'builder', label: 'Builder', icon: '🛠️' },
  { id: 'special', label: 'Special', icon: '⭐' },
];

const DIFFICULTIES: QuestDifficulty[] = ['easy', 'medium', 'hard', 'legendary'];

const DIFFICULTY_COLORS = {
  easy: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20',
  medium: 'bg-[#facc15]/10 text-[#facc15] border-[#facc15]/20',
  hard: 'bg-[#fb923c]/10 text-[#fb923c] border-[#fb923c]/20',
  legendary: 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20',
};

export default function QuestsPage() {
  const { address, isConnected, connect } = useWallet();
  const { getUserProgress, completeQuest } = useQuestStore();
  
  const [activeCategory, setActiveCategory] = useState<QuestCategory | 'all'>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<QuestDifficulty | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'available' | 'completed'>('all');

  const progress = address ? getUserProgress(address) : null;

  const filteredQuests = useMemo(() => {
    return QUESTS.filter(q => {
      const categoryMatch = activeCategory === 'all' || q.category === activeCategory;
      const difficultyMatch = activeDifficulty === 'all' || q.difficulty === activeDifficulty;
      
      let statusMatch = true;
      if (progress) {
        const isCompleted = progress.completedQuests.includes(q.id);
        if (activeStatus === 'available') statusMatch = !isCompleted;
        if (activeStatus === 'completed') statusMatch = isCompleted;
      }

      return categoryMatch && difficultyMatch && statusMatch;
    });
  }, [activeCategory, activeDifficulty, activeStatus, progress]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <Link href="/quests" className="text-white">QUEST HUB</Link>
            <Link href="/quests/leaderboard" className="nav-link">LEADERBOARD</Link>
            {isConnected && <Link href="/quests/profile" className="nav-link">MY PROFILE</Link>}
          </div>
          <div className="flex items-center gap-3">
            <AppSwitcher />
            {isConnected ? (
              <Link href="/quests/profile" className="bracket-button">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Link>
            ) : (
              <button type="button" onClick={connect} aria-label="Connect wallet" className="bracket-button">
                CONNECT WALLET
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// gamification</p>
              <h1 className="mt-6 text-5xl font-black uppercase sm:text-7xl lg:text-8xl">
                QUEST <span className="text-[#c9a84c]">HUB</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-[#9a9a9a]">
                Complete ecosystem tasks, earn XP, level up your profile, and unlock exclusive badges. 
                Your journey through the Arc Ecosystem starts here.
              </p>

              {!isConnected && (
                <div className="mt-10 flex flex-wrap gap-4">
                  {[
                    { label: 'Total Quests', value: QUESTS.length },
                    { label: 'Categories', value: CATEGORIES.length - 1 },
                    { label: 'Max XP', value: QUESTS.reduce((acc, q) => acc + q.xpReward, 0) },
                    { label: 'Active Players', value: '1,240+' },
                  ].map((stat) => (
                    <div key={stat.label} className="bracket-card px-6 py-4">
                      <Brackets />
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#777]">{stat.label}</p>
                      <p className="mt-1 text-2xl font-black">{stat.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isConnected && progress && (
              <div className="bracket-card p-8 bg-[#c9a84c]/5 border-[#c9a84c]/20">
                <Brackets />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase text-[#c9a84c]">Level</p>
                    <p className="text-6xl font-black">{progress.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs uppercase text-[#777]">Total XP</p>
                    <p className="text-3xl font-black text-[#c9a84c]">{progress.totalXp}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex justify-between text-xs font-mono uppercase text-[#777] mb-2">
                    <span>Progress to Level {progress.level + 1}</span>
                    <span>{progress.totalXp} / {getXpForLevel(progress.level + 1)} XP</span>
                  </div>
                  <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c9a84c] to-[#f0d78c] transition-all duration-1000"
                      style={{ width: `${getProgressPercent(progress.totalXp)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border border-[#2a2a2a] rounded-lg">
                    <p className="text-2xl font-black">{progress.completedQuests.length}</p>
                    <p className="text-[10px] font-mono uppercase text-[#777]">Quests</p>
                  </div>
                  <div className="text-center p-4 border border-[#2a2a2a] rounded-lg">
                    <p className="text-2xl font-black">{progress.earnedBadges.length}</p>
                    <p className="text-[10px] font-mono uppercase text-[#777]">Badges</p>
                  </div>
                </div>

                <Link href="/quests/profile" className="bracket-button w-full mt-6 justify-center">
                  VIEW PROFILE <User size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 border-y border-[#2a2a2a] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={activeCategory === cat.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap text-sm ${
                  activeCategory === cat.id 
                    ? 'bg-[#c9a84c] border-[#c9a84c] text-black font-bold' 
                    : 'border-[#2a2a2a] text-[#777] hover:border-[#c9a84c]/50'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 ml-auto">
             <select 
              aria-label="Filter quests by difficulty"
              value={activeDifficulty} 
              onChange={(e) => setActiveDifficulty(e.target.value as any)}
              className="bg-transparent border border-[#2a2a2a] text-[#777] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#c9a84c]"
            >
              <option value="all">All Difficulties</option>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>

            <div className="flex bg-[#111] p-1 rounded-lg border border-[#2a2a2a]">
              {(['all', 'available', 'completed'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setActiveStatus(s)}
                  aria-pressed={activeStatus === s}
                  className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase transition-all ${
                    activeStatus === s ? 'bg-[#222] text-white shadow-lg' : 'text-[#555] hover:text-[#777]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quest Grid */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          {filteredQuests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuests.map((quest) => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  isCompleted={progress?.completedQuests.includes(quest.id) || false}
                  onComplete={() => address && completeQuest(address, quest.id)}
                  isConnected={isConnected}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-[#2a2a2a] rounded-2xl">
              <div className="grid h-20 w-20 place-items-center bg-[#111] rounded-full mx-auto border border-[#2a2a2a]">
                <LayoutGrid className="text-[#333]" size={32} />
              </div>
              <h3 className="mt-6 text-xl font-bold">No quests found</h3>
              <p className="mt-2 text-[#777]">Try adjusting your filters or category.</p>
              <button 
                onClick={() => {setActiveCategory('all'); setActiveDifficulty('all'); setActiveStatus('all');}}
                className="mt-6 text-[#c9a84c] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function QuestCard({ 
  quest, 
  isCompleted, 
  onComplete,
  isConnected
}: { 
  quest: Quest, 
  isCompleted: boolean, 
  onComplete: () => void,
  isConnected: boolean
}) {
  const cat = CATEGORIES.find(c => c.id === quest.category);
  
  return (
    <article className={`bracket-card flex flex-col p-6 transition-all group ${isCompleted ? 'opacity-70 grayscale-[0.5]' : 'hover:border-[#c9a84c]/40'}`}>
      <Brackets />
      
      <div className="flex items-start justify-between mb-4">
        <span className={`px-2 py-1 rounded text-[10px] font-mono border ${DIFFICULTY_COLORS[quest.difficulty]}`}>
          {quest.difficulty.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          {quest.badgeId && (
            <span className="text-lg" title="Unlocks a badge">🏅</span>
          )}
          <span className="bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-1 rounded text-[10px] font-black border border-[#c9a84c]/30">
            +{quest.xpReward} XP
          </span>
        </div>
      </div>

      <h3 className="text-xl font-black group-hover:text-[#c9a84c] transition-colors">{quest.title}</h3>
      <p className="mt-2 text-[#777] text-sm leading-relaxed flex-1">
        {quest.description}
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
          <span className="text-xl">{cat?.icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase text-[#555]">Requirement</p>
            <p className="text-xs text-[#aaa] truncate">{quest.requirement}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {quest.externalUrl && !isCompleted && (
            <a 
              href={quest.externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white font-mono text-xs py-3 rounded transition-all"
            >
              OPEN <ExternalLink size={12} />
            </a>
          )}
          
          {isConnected && !isCompleted ? (
            <button 
              onClick={onComplete}
              className="flex-1 flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-black font-black text-xs py-3 rounded transition-all"
            >
              COMPLETE <CheckCircle2 size={12} />
            </button>
          ) : isCompleted ? (
            <div className="w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 font-black text-xs py-3 rounded cursor-default">
              COMPLETED <CheckCircle2 size={12} />
            </div>
          ) : (
            <button 
              disabled
              className="flex-1 flex items-center justify-center gap-2 bg-[#111] text-[#333] border border-[#222] font-mono text-xs py-3 rounded cursor-not-allowed"
            >
              CONNECT TO START
            </button>
          )}
        </div>
      </div>
    </article>
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
