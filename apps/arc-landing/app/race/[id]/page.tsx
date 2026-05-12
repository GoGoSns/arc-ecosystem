'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy, 
  Timer, 
  Users, 
  Coins, 
  CheckCircle2, 
  Medal,
  ShieldAlert,
  Edit3,
  UserPlus,
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useRaceStore, Race, ADMIN_ADDRESS } from '@/lib/raceStore';
import { useWallet } from '@/contexts/WalletContext';
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

  if (!timeLeft) return <span className="text-red-500 font-bold uppercase tracking-widest">Race Ended</span>;

  return (
    <div className="flex gap-4 font-mono">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.days}</span>
        <span className="text-[10px] text-[#777] uppercase">Days</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.hours}</span>
        <span className="text-[10px] text-[#777] uppercase">Hrs</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black">{timeLeft.minutes}</span>
        <span className="text-[10px] text-[#777] uppercase">Min</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-[#c9a84c]">{timeLeft.seconds}</span>
        <span className="text-[10px] text-[#777] uppercase">Sec</span>
      </div>
    </div>
  );
}

export default function RaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { races, joinRace, updateScore, endRace } = useRaceStore();
  const { address, isConnected } = useWallet();
  
  const race = useMemo(() => races.find(r => r.id === id), [races, id]);
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  const [joinName, setJoinName] = useState('');
  const [newScore, setNewScore] = useState('');
  const [sortField, setSortField] = useState<'score' | 'joinedAt'>('score');
  const [sortDir, setSortFieldDir] = useState<'asc' | 'desc'>('desc');

  if (!race) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-black uppercase mb-4">Race Not Found</h1>
          <Link href="/race" className="primary-button inline-flex">BACK TO RACE HUB</Link>
        </div>
      </div>
    );
  }

  const sortedParticipants = [...race.participants].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (sortDir === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const isJoined = isConnected && !!address && race.participants.some(p => p.address.toLowerCase() === address.toLowerCase());
  const userParticipant = race.participants.find(p => p.address.toLowerCase() === address?.toLowerCase());

  const handleJoin = () => {
    if (!address) return;
    joinRace(race.id, address, joinName);
    setJoinName('');
  };

  const handleUpdateScore = () => {
    if (!address) return;
    const scoreNum = parseInt(newScore);
    if (!isNaN(scoreNum)) {
      updateScore(race.id, address, scoreNum);
      setNewScore('');
    }
  };

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
            <Link href="/race/history" className="nav-link">HISTORY</Link>
          </div>
          <div className="flex items-center gap-3">
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

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Link href="/race" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Hub
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Main Content */}
            <div className="space-y-12">
              <div className="reveal">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-3 py-1 rounded text-[10px] font-black uppercase border ${
                    race.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    race.status === 'upcoming' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-white/5 text-[#777] border-white/10'
                  }`}>
                    {race.status}
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-black uppercase text-[#777]">
                    {race.category.replace('-', ' ')}
                  </div>
                </div>
                <h1 className="text-4xl font-black uppercase sm:text-5xl lg:text-6xl mb-6">{race.title}</h1>
                <p className="text-[#9a9a9a] text-lg leading-relaxed max-w-2xl">{race.description}</p>
              </div>

              {/* Leaderboard */}
              <div className="bracket-card p-0 overflow-hidden bg-white/[0.01]">
                <Brackets />
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-3">
                    <Medal className="text-[#c9a84c]" size={20} /> Leaderboard
                  </h2>
                  <div className="text-xs font-mono text-[#555] uppercase">
                    {race.participants.length} Participants
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-[#555]">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Participant</th>
                        <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => {
                          if (sortField === 'score') setSortFieldDir(sortDir === 'asc' ? 'desc' : 'asc');
                          else { setSortField('score'); setSortFieldDir('desc'); }
                        }}>
                          <div className="flex items-center gap-1">
                            Score {sortField === 'score' && (sortDir === 'asc' ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)}
                          </div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => {
                          if (sortField === 'joinedAt') setSortFieldDir(sortDir === 'asc' ? 'desc' : 'asc');
                          else { setSortField('joinedAt'); setSortFieldDir('desc'); }
                        }}>
                          <div className="flex items-center gap-1">
                            Joined {sortField === 'joinedAt' && (sortDir === 'asc' ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedParticipants.map((p, idx) => {
                        const rank = idx + 1;
                        const isUser = p.address.toLowerCase() === address?.toLowerCase();
                        return (
                          <tr key={p.address} className={`group hover:bg-white/[0.02] transition-colors ${isUser ? 'bg-[#c9a84c]/5' : ''}`}>
                            <td className="px-6 py-4">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isUser ? 'text-[#c9a84c]' : 'text-white'}`}>
                                  {p.name || `${p.address.slice(0, 6)}...${p.address.slice(-4)}`}
                                  {isUser && <span className="ml-2 text-[8px] border border-[#c9a84c]/30 px-1 py-0.5 rounded">YOU</span>}
                                </span>
                                <span className="text-[10px] font-mono text-[#555]">{p.address}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm font-black text-white group-hover:text-[#c9a84c]">
                              {p.score.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-[10px] font-mono text-[#555]">
                              {new Date(p.joinedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                      {race.participants.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-[#555] font-mono uppercase text-sm">
                            No participants yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rules & Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bracket-card p-6 bg-white/[0.02]">
                  <Brackets />
                  <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                    <Info className="text-[#c9a84c]" size={18} /> Race Rules
                  </h3>
                  <ul className="space-y-3 text-sm text-[#777]">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] mt-1.5 shrink-0" />
                      Participants must join the race before the end date.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] mt-1.5 shrink-0" />
                      Scores are calculated based on the {race.category} category.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] mt-1.5 shrink-0" />
                      Top 5 participants at the end of the race will receive rewards.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#c9a84c] mt-1.5 shrink-0" />
                      Winners are announced 24 hours after the race ends.
                    </li>
                  </ul>
                </div>
                <div className="bracket-card p-6 bg-white/[0.02]">
                  <Brackets />
                  <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                    <Coins className="text-[#c9a84c]" size={18} /> Prize Breakdown
                  </h3>
                  <div className="space-y-4">
                    {race.prizes.map((amount, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-mono text-[#555]">{i+1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Place</span>
                        <span className={`font-black ${i < 3 ? 'text-white' : 'text-[#777]'}`}>${amount} USDC</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Status & Timer Card */}
              <div className="bracket-card p-8 bg-black/40 border-white/5 text-center">
                <Brackets />
                <Timer className="mx-auto mb-4 text-[#c9a84c]" size={32} />
                <p className="text-[10px] font-mono text-[#777] uppercase mb-4">
                  {race.status === 'upcoming' ? 'Starts In' : race.status === 'active' ? 'Ends In' : 'Race Finished'}
                </p>
                <Countdown targetDate={race.status === 'upcoming' ? race.startDate : race.endDate} />
              </div>

              {/* Interaction Card */}
              <div className="bracket-card p-8 bg-[#c9a84c]/5 border-[#c9a84c]/20">
                <Brackets />
                {isConnected ? (
                  <>
                    {race.status === 'active' && !isJoined ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <UserPlus className="text-[#c9a84c]" size={20} />
                          <h3 className="text-xl font-black uppercase">Join Race</h3>
                        </div>
                        <p className="text-xs text-[#777] mb-6">Enter your display name and join the competition for the ${race.prizePool} prize pool.</p>
                        <input 
                          type="text" 
                          placeholder="Display Name (optional)"
                          className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#c9a84c] outline-none transition-colors"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                        />
                        <button onClick={handleJoin} className="primary-button w-full justify-center">JOIN NOW</button>
                      </div>
                    ) : isJoined && race.status === 'active' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Edit3 className="text-[#c9a84c]" size={20} />
                          <h3 className="text-xl font-black uppercase">Update Score</h3>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-6">
                          <p className="text-[10px] font-mono text-[#555] uppercase mb-1">Your Current Score</p>
                          <p className="text-3xl font-black text-[#c9a84c]">{userParticipant?.score.toLocaleString()}</p>
                        </div>
                        <input 
                          type="number" 
                          placeholder="New Score"
                          className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-[#c9a84c] outline-none transition-colors mb-4"
                          value={newScore}
                          onChange={(e) => setNewScore(e.target.value)}
                        />
                        <button onClick={handleUpdateScore} className="secondary-button w-full justify-center">SUBMIT SCORE</button>
                        <p className="text-[10px] text-center text-[#555] mt-4 font-mono">// HONOR SYSTEM ACTIVE</p>
                      </div>
                    ) : isJoined && race.status === 'ended' ? (
                      <div className="text-center py-4">
                        <Trophy className="mx-auto mb-4 text-[#c9a84c]" size={32} />
                        <h3 className="text-xl font-black uppercase mb-2">Well Played!</h3>
                        <p className="text-xs text-[#777]">The race has ended. Check the leaderboard for final standings and winners.</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <ShieldAlert className="mx-auto mb-4 text-[#777]" size={32} />
                        <p className="text-xs text-[#777] uppercase font-black">Participation Closed</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-xs text-[#777] uppercase font-mono tracking-widest">Connect wallet to join</p>
                    <div className="bracket-button opacity-50 cursor-not-allowed">WALLET DISCONNECTED</div>
                  </div>
                )}
              </div>

              {/* Admin Panel */}
              {isAdmin && (
                <div className="bracket-card p-6 bg-red-500/5 border-red-500/20">
                  <Brackets />
                  <h3 className="text-lg font-black uppercase text-red-500 mb-4 flex items-center gap-2">
                    <ShieldAlert size={18} /> Admin Panel
                  </h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => endRace(race.id)}
                      disabled={race.status === 'ended'}
                      className="w-full px-4 py-3 bg-red-500 text-white font-black text-xs uppercase rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      END RACE
                    </button>
                    <button className="w-full px-4 py-3 border border-red-500/30 text-red-500 font-black text-xs uppercase rounded hover:bg-red-500/10">
                      DISTRIBUTE PRIZES
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
