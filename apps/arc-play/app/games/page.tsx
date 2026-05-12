'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Trophy, 
  MousePointerClick, 
  Brain, 
  Zap, 
  Clock, 
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useGamesStore, GameType, GameScore } from '@/lib/gamesStore';

const GAMES = [
  {
    id: 'click-rush' as GameType,
    title: 'Click Rush',
    description: 'How fast can you click?',
    icon: MousePointerClick,
    href: '/games/click-rush',
    color: '#c9a84c',
  },
  {
    id: 'memory' as GameType,
    title: 'Memory Match',
    description: 'Test your memory',
    icon: Brain,
    href: '/games/memory',
    color: '#60a5fa',
  },
  {
    id: 'reaction' as GameType,
    title: 'Reaction Test',
    description: 'Lightning reflexes',
    icon: Zap,
    href: '/games/reaction',
    color: '#4ade80',
  },
];

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(201,168,76,0.15)',
};

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function GamesHubPage() {
  const { address, isConnected } = useAccount();
  const { getLeaderboard, getMyBestScore, getPrizePool } = useGamesStore();
  
  const [activeGameTab, setActiveGameTab] = useState<GameType>('click-rush');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const leaderboard = getLeaderboard(activeGameTab, 'week');
  const prizePool = getPrizePool(activeGameTab, 'week');

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
              Play to Earn
            </h1>
            <p className="text-lg mt-2" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Compete in mini-games. Top players win USDC.
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl" style={CARD_STYLE}>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(201,168,76,0.1)' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-40">Weekly Prize Pool</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                ${prizePool} <span className="text-sm font-medium opacity-40">USDC</span>
              </p>
            </div>
          </div>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const myBest = address ? getMyBestScore(game.id, address) : null;
            const topScore = getLeaderboard(game.id, 'all')[0];

            return (
              <Link
                key={game.id}
                href={game.href}
                className="sweep rounded-2xl p-6 flex flex-col gap-6 transition-all group"
                style={CARD_STYLE}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${game.color}15` }}
                  >
                    <Icon size={24} style={{ color: game.color }} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Entry Fee</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>$1 USDC</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{game.title}</h3>
                  <p className="text-sm opacity-50">{game.description}</p>
                </div>

                <div className="flex flex-col gap-2 py-4 border-y border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-40">Your Best</span>
                    <span className="font-bold" style={{ color: myBest ? 'var(--accent)' : 'inherit' }}>
                      {myBest ? myBest.displayScore : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-40">All-time #1</span>
                    <span className="font-mono opacity-60">
                      {topScore ? `${topScore.displayScore} (${shorten(topScore.playerAddress)})` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 font-bold text-sm" style={{ color: 'var(--accent)' }}>
                  Play Now <ChevronRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Leaderboard Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--fg)' }}>
              <Trophy size={24} style={{ color: 'var(--accent)' }} />
              Weekly Leaderboard
            </h2>
          </div>

          <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setActiveGameTab(game.id)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all"
                  style={{ 
                    background: activeGameTab === game.id ? 'rgba(201,168,76,0.05)' : 'transparent',
                    color: activeGameTab === game.id ? 'var(--accent)' : 'var(--fg)',
                    opacity: activeGameTab === game.id ? 1 : 0.4,
                    borderBottom: activeGameTab === game.id ? '2px solid var(--accent)' : '2px solid transparent'
                  }}
                >
                  {game.title}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="p-2">
              {leaderboard.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Award size={48} className="opacity-10" />
                  <p className="text-sm opacity-40">No scores this week yet. Be the first!</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {leaderboard.map((entry, i) => {
                    const isMe = address && entry.playerAddress.toLowerCase() === address.toLowerCase();
                    const rank = i + 1;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isMe ? 'bg-white/5' : ''}`}
                      >
                        <div className="w-8 flex justify-center">
                          {rank === 1 ? (
                            <span className="text-xl">🥇</span>
                          ) : rank === 2 ? (
                            <span className="text-xl">🥈</span>
                          ) : rank === 3 ? (
                            <span className="text-xl">🥉</span>
                          ) : (
                            <span className="text-sm font-bold opacity-30">#{rank}</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-mono font-bold">
                            {shorten(entry.playerAddress)}
                            {isMe && (
                              <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)' }}>
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] opacity-40 uppercase tracking-widest font-bold">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: rank <= 3 ? 'var(--accent)' : 'var(--fg)' }}>
                            {entry.displayScore}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
