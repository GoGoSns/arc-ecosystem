'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useQuestStore } from '@/lib/questStore';
import { 
  Trophy, 
  ArrowLeft,
  Medal,
  Search,
  Users
} from 'lucide-react';
import Link from 'next/link';

// Mock leaderboard data
const MOCK_PLAYERS = [
  { address: '0xB87B...4365', level: 42, xp: 88400, quests: 27, badges: 5 },
  { address: '0xCf87...c02f', level: 38, xp: 72100, quests: 25, badges: 4 },
  { address: '0xD844...9B3d', level: 35, xp: 61250, quests: 24, badges: 4 },
  { address: '0x319d...460F', level: 31, xp: 48050, quests: 22, badges: 3 },
  { address: '0xD4c0...daae', level: 28, xp: 39200, quests: 20, badges: 3 },
  { address: '0x3C33...752D', level: 25, xp: 31250, quests: 18, badges: 3 },
  { address: '0x92f9...1229', level: 22, xp: 24200, quests: 16, badges: 2 },
  { address: '0xa1b2...c3d4', level: 20, xp: 20000, quests: 15, badges: 2 },
  { address: '0xe5f6...g7h8', level: 18, xp: 16200, quests: 14, badges: 2 },
  { address: '0x1011...1213', level: 15, xp: 11250, quests: 12, badges: 1 },
];

export default function LeaderboardPage() {
  const { address, isConnected } = useWallet();
  const { getUserProgress } = useQuestStore();

  const userProgress = address ? getUserProgress(address) : null;
  
  // Combine mock data with real user if not already present
  const players = [...MOCK_PLAYERS];
  if (userProgress && !players.find(p => p.address.toLowerCase() === address?.toLowerCase())) {
    players.push({
      address: `${address?.slice(0, 6)}...${address?.slice(-4)}`,
      level: userProgress.level,
      xp: userProgress.totalXp,
      quests: userProgress.completedQuests.length,
      badges: userProgress.earnedBadges.length
    });
  }

  // Sort by XP
  players.sort((a, b) => b.xp - a.xp);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <Link href="/quests" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors font-mono text-xs uppercase mb-6">
            <ArrowLeft size={14} /> Back to Hub
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">Global Ranking</p>
              <h1 className="text-4xl font-black mt-2 flex items-center gap-4">
                LEADERBOARD <Trophy className="text-[#c9a84c]" size={32} />
              </h1>
            </div>
            <div className="flex bg-[#111] p-1 rounded-lg border border-[#2a2a2a]">
              <button className="px-6 py-2 rounded-md text-xs font-mono uppercase bg-[#222] text-white">All Time</button>
              <button className="px-6 py-2 rounded-md text-xs font-mono uppercase text-[#555] hover:text-[#777]">Monthly</button>
              <button className="px-6 py-2 rounded-md text-xs font-mono uppercase text-[#555] hover:text-[#777]">Weekly</button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {players.slice(0, 3).map((player, index) => (
            <div key={player.address} className={`bracket-card p-8 text-center relative overflow-hidden ${index === 0 ? 'bg-[#c9a84c]/10 border-[#c9a84c]/30' : 'bg-white/[0.02]'}`}>
              <Brackets />
              <div className="text-4xl mb-4">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <p className="font-mono text-xs text-[#777] mb-1">RANK {index + 1}</p>
              <p className="text-xl font-black mb-4">{player.address}</p>
              <div className="flex justify-center gap-8 border-t border-white/5 pt-6">
                <div>
                  <p className="text-xs text-[#555] font-mono uppercase">Level</p>
                  <p className="text-xl font-black">{player.level}</p>
                </div>
                <div>
                  <p className="text-xs text-[#555] font-mono uppercase">XP</p>
                  <p className="text-xl font-black text-[#c9a84c]">{player.xp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full List */}
        <div className="bracket-card overflow-hidden">
          <Brackets />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-white/[0.02]">
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Rank</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Address</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Level</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Total XP</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Quests</th>
                  <th className="px-6 py-4 font-mono text-[10px] uppercase text-[#777]">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {players.map((player, index) => {
                  const isUser = isConnected && player.address.toLowerCase().includes(address?.slice(-4).toLowerCase() || '');
                  return (
                    <tr key={player.address} className={`transition-colors hover:bg-white/[0.02] ${isUser ? 'bg-[#c9a84c]/5' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`font-mono font-bold ${index < 3 ? 'text-[#c9a84c]' : 'text-[#555]'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">
                        {player.address}
                        {isUser && <span className="ml-2 text-[10px] bg-[#c9a84c] text-black px-1.5 py-0.5 rounded uppercase font-mono">You</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded border border-[#2a2a2a] flex items-center justify-center text-[10px] font-mono">
                            {player.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#c9a84c] font-bold">{player.xp.toLocaleString()}</td>
                      <td className="px-6 py-4 text-[#777]">{player.quests}</td>
                      <td className="px-6 py-4">
                         <div className="flex gap-1">
                          {Array.from({ length: player.badges }).map((_, i) => (
                            <span key={i} className="text-xs">🏅</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between p-6 bracket-card bg-[#111]">
          <Brackets />
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[#c9a84c]/10 flex items-center justify-center border border-[#c9a84c]/20">
              <Users size={18} className="text-[#c9a84c]" />
            </div>
            <div>
              <p className="text-sm font-black uppercase">Community Active</p>
              <p className="text-[10px] font-mono text-[#555]">Join 1,240 players building on Arc</p>
            </div>
          </div>
          <Link href="/forum" className="text-xs font-mono uppercase text-[#c9a84c] hover:underline">
            Visit Community Forum &rarr;
          </Link>
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
