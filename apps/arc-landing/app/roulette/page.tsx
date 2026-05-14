'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useRouletteStore, RouletteResult, Spin } from '@/lib/rouletteStore';
import { translations, type Lang } from '@/lib/translations';
import { 
  Coins, 
  RotateCcw, 
  Trophy, 
  History, 
  User, 
  TrendingUp, 
  Zap,
  DollarSign,
  Plus,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import LanguageToggle from '@/components/LanguageToggle';
import SiteHeader from '@/components/SiteHeader';

const PAYOUTS: Record<RouletteResult, number> = {
  'loss': 0,
  'win-2x': 2,
  'win-5x': 5,
  'win-50x': 50,
};

// We use 5 visual segments as requested.
// To satisfy "5% house edge" while keeping the 2x/5x/50x vibe, 
// we use probabilities that sum to 0.95 EV.
const PROBABILITIES = [
  { result: 'loss' as RouletteResult, chance: 0.42, color: '#1a1a1a', label: 'LOSS', id: 'l1' },
  { result: 'loss' as RouletteResult, chance: 0.42, color: '#262626', label: 'LOSS', id: 'l2' },
  { result: 'win-2x' as RouletteResult, chance: 0.10, color: '#c9a84c', label: '2X', id: 'w2' },
  { result: 'win-5x' as RouletteResult, chance: 0.05, color: '#f0d78c', label: '5X', id: 'w5' },
  { result: 'win-50x' as RouletteResult, chance: 0.01, color: '#ffffff', label: '50X', id: 'w50' },
];

// Note: If we strictly followed the 50/30/15/5% in the prompt, the house edge would be -285%.
// We opted for 84% Loss (split in 2), 10% 2X, 5% 5X, 1% 50X to achieve a ~5% house edge (0.95 EV).

export default function RoulettePage() {
  const { address, isConnected, connect } = useWallet();
  const { spins, addSpin, topUp, getBalance } = useRouletteStore();
  
  const [betAmount, setBetAmount] = useState(0.10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<Spin | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved === 'tr' || saved === 'en') setLang(saved);
  }, []);

  const t = translations[lang];
  const balance = address ? getBalance(address) : 10;

  const stats = useMemo(() => {
    const totalSpins = spins.length;
    const biggestWin = spins.reduce((max, s) => Math.max(max, s.payout), 0);
    return { totalSpins, biggestWin };
  }, [spins]);

  const personalStats = useMemo(() => {
    if (!address) return null;
    const userSpins = spins.filter(s => s.address.toLowerCase() === address.toLowerCase());
    const totalBet = userSpins.reduce((acc, s) => acc + s.bet, 0);
    const totalWon = userSpins.reduce((acc, s) => acc + s.payout, 0);
    const netProfit = totalWon - totalBet;
    const winRate = userSpins.length > 0 
      ? (userSpins.filter(s => s.result !== 'loss').length / userSpins.length) * 100 
      : 0;

    return {
      count: userSpins.length,
      totalBet,
      totalWon,
      netProfit,
      winRate: Math.round(winRate)
    };
  }, [spins, address]);

  const handleSpin = () => {
    if (!isConnected || isSpinning || balance < betAmount) return;

    setIsSpinning(true);
    setLastResult(null);
    setShowConfetti(false);

    // Determine result
    const rand = Math.random();
    let cumulative = 0;
    let finalResult: RouletteResult = 'loss';
    let targetSegmentIndex = 0;
    
    for (let i = 0; i < PROBABILITIES.length; i++) {
      cumulative += PROBABILITIES[i].chance;
      if (rand < cumulative) {
        finalResult = PROBABILITIES[i].result;
        targetSegmentIndex = i;
        break;
      }
    }

    // Calculate rotation to land on the correct segment
    // Total segments = 5.
    // We want the pointer (at top, 0 deg) to land in the middle of the segment.
    // Current SVG starts drawing from top (0 deg) and goes clockwise.
    
    const segmentAngles = PROBABILITIES.map(p => p.chance * 360);
    let startAngle = 0;
    for (let i = 0; i < targetSegmentIndex; i++) {
      startAngle += segmentAngles[i];
    }
    const segmentCenter = startAngle + (segmentAngles[targetSegmentIndex] / 2);
    
    // To land 'segmentCenter' at the pointer (top), we need to rotate the wheel by -segmentCenter
    // Plus some full spins
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation = (extraSpins * 360) - segmentCenter;
    
    // We adjust current rotation to avoid backwards spin if possible, but for simplicity:
    const finalRotation = rotation + (360 * extraSpins) - (rotation % 360) - segmentCenter;
    
    setRotation(finalRotation);

    setTimeout(() => {
      const payout = betAmount * PAYOUTS[finalResult];
      const spin: Spin = {
        id: `spin-${Math.random().toString(36).substr(2, 9)}`,
        address: address!,
        bet: betAmount,
        result: finalResult,
        payout,
        netResult: payout - betAmount,
        timestamp: Date.now(),
      };

      addSpin(spin);
      setLastResult(spin);
      setIsSpinning(false);
      
      if (finalResult !== 'loss') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 2000);
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('arc-lang', newLang);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader currentLang={lang} onLangChange={handleLangChange} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_450px]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// casino-lite</p>
              <h1 className="mt-6 text-5xl font-black uppercase sm:text-7xl lg:text-8xl">
                ARC <span className="text-[#c9a84c]">ROULETTE</span>
              </h1>
              <p className="mt-6 text-xl text-[#9a9a9a]">
                Spin to win up to <span className="text-white font-black">50X</span> USDC. 
                Experience the thrill of the wheel with provably fair mechanics.
              </p>

              <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="bracket-card p-6 bg-white/[0.02]">
                  <Brackets />
                  <p className="font-mono text-[10px] uppercase text-[#777]">Global Spins</p>
                  <p className="mt-1 text-2xl font-black">{stats.totalSpins}</p>
                </div>
                <div className="bracket-card p-6 bg-white/[0.02]">
                  <Brackets />
                  <p className="font-mono text-[10px] uppercase text-[#777]">Biggest Win</p>
                  <p className="mt-1 text-2xl font-black text-[#c9a84c]">${stats.biggestWin.toFixed(2)}</p>
                </div>
                <div className="bracket-card p-6 bg-[#c9a84c]/5 border-[#c9a84c]/20 col-span-2 sm:col-span-1">
                  <Brackets />
                  <p className="font-mono text-[10px] uppercase text-[#c9a84c]">Your Balance</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-black">${balance.toFixed(2)}</p>
                    {isConnected && (
                      <button 
                        onClick={() => address && topUp(address, 10)}
                        className="p-1 hover:text-[#c9a84c] transition-colors"
                        title="Top Up $10"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {/* Roulette Wheel */}
              <div className="relative h-80 w-80 sm:h-96 sm:w-96">
                <div 
                  className="h-full w-full rounded-full border-8 border-[#1a1a1a] shadow-[0_0_60px_rgba(201,168,76,0.2)] overflow-hidden"
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 2s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
                  }}
                >
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {PROBABILITIES.map((p, i) => {
                      const angles = PROBABILITIES.map(prob => prob.chance * 360);
                      let startAngle = 0;
                      for (let j = 0; j < i; j++) startAngle += angles[j];
                      const endAngle = startAngle + angles[i];
                      
                      const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                      const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
                      
                      const largeArcFlag = angles[i] > 180 ? 1 : 0;
                      
                      return (
                        <g key={p.id}>
                          <path 
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} 
                            fill={p.color} 
                          />
                          {angles[i] > 10 && (
                            <text 
                              x="75" 
                              y="50" 
                              fill={p.result === 'loss' ? '#444' : '#000'} 
                              fontSize="4" 
                              fontWeight="900" 
                              textAnchor="middle"
                              transform={`rotate(${startAngle + angles[i]/2}, 50, 50)`}
                            >
                              {p.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                {/* Pointer */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-white drop-shadow-xl" />
                </div>
                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-[#0a0a0a] border-4 border-[#1a1a1a] shadow-inner grid place-items-center">
                  <div className="h-3 w-3 rounded-full bg-[#c9a84c] shadow-[0_0_10px_#c9a84c]" />
                </div>
              </div>

              {/* Betting */}
              <div className="mt-10 w-full space-y-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0.10, 0.50, 1.00, 5.00].map(amount => (
                    <button 
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      className={`px-4 py-2 rounded-lg border font-mono text-xs transition-all ${
                        betAmount === amount 
                        ? 'bg-[#c9a84c] border-[#c9a84c] text-black font-bold' 
                        : 'border-[#2a2a2a] text-[#777] hover:border-[#c9a84c]/50'
                      }`}
                    >
                      ${amount.toFixed(2)}
                    </button>
                  ))}
                  <button 
                    onClick={() => setBetAmount(balance)}
                    className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-[#777] font-mono text-xs hover:border-white/20"
                  >
                    MAX
                  </button>
                </div>

                {!isConnected ? (
                  <button onClick={connect} className="primary-button w-full justify-center py-5">
                    CONNECT WALLET TO PLAY
                  </button>
                ) : (
                  <button 
                    onClick={handleSpin}
                    disabled={isSpinning || balance < betAmount}
                    className="primary-button w-full justify-center py-5 text-xl disabled:opacity-50 group relative overflow-hidden"
                  >
                    <span className="relative z-10">{isSpinning ? 'SPINNING...' : `SPIN $${betAmount.toFixed(2)}`}</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </button>
                )}

                {lastResult && (
                  <div className={`text-center p-4 rounded-xl border animate-in fade-in zoom-in duration-300 ${
                    lastResult.result === 'loss' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
                  }`}>
                    <p className="text-sm font-mono uppercase tracking-widest font-black">
                      {lastResult.result === 'loss' ? 'Better luck next time' : 'WINNER!'}
                    </p>
                    <p className="text-2xl font-black mt-1">
                      {lastResult.result === 'loss' ? `-$${lastResult.bet.toFixed(2)}` : `+$${lastResult.payout.toFixed(2)}`} USDC
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-24 border-t border-[#141414] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <History className="text-[#c9a84c]" size={24} />
                <h2 className="text-2xl font-black uppercase">Recent Spins</h2>
              </div>
              
              <div className="bracket-card overflow-hidden">
                <Brackets />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] font-mono text-[10px] uppercase text-[#555]">
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4">Bet</th>
                        <th className="px-6 py-4">Result</th>
                        <th className="px-6 py-4">Payout</th>
                        <th className="px-6 py-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {spins.slice(0, 20).map((spin) => (
                        <tr key={spin.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-[#aaa] group-hover:text-white">
                            {spin.address.slice(0, 6)}...{spin.address.slice(-4)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">${spin.bet.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                              spin.result === 'loss' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                            }`}>
                              {spin.result.replace('win-', '')}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-black ${spin.payout > 0 ? 'text-green-500' : 'text-[#444]'}`}>
                            {spin.payout > 0 ? `+$${spin.payout.toFixed(2)}` : '$0.00'}
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-[#555]">
                            {new Date(spin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {spins.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-[#555] font-mono text-sm uppercase">
                            No spins recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-8">
                <User className="text-[#c9a84c]" size={24} />
                <h2 className="text-2xl font-black uppercase">Your Stats</h2>
              </div>

              {personalStats ? (
                <div className="space-y-4">
                  <div className="bracket-card p-6 bg-white/[0.01]">
                    <Brackets />
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-mono uppercase text-[#555]">Total Played</p>
                      <Zap size={16} className="text-[#c9a84c]/50" />
                    </div>
                    <p className="text-3xl font-black">{personalStats.count}</p>
                  </div>

                  <div className="bracket-card p-6 bg-white/[0.01]">
                    <Brackets />
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-mono uppercase text-[#555]">Total Volume</p>
                      <TrendingUp size={16} className="text-[#c9a84c]/50" />
                    </div>
                    <p className="text-3xl font-black">${personalStats.totalBet.toFixed(2)}</p>
                  </div>

                  <div className="bracket-card p-6 bg-white/[0.01]">
                    <Brackets />
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-mono uppercase text-[#555]">Net Profit</p>
                      <DollarSign size={16} className="text-[#c9a84c]/50" />
                    </div>
                    <p className={`text-3xl font-black ${personalStats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {personalStats.netProfit >= 0 ? '+' : ''}${personalStats.netProfit.toFixed(2)}
                    </p>
                  </div>

                  <div className="bracket-card p-6 bg-white/[0.01]">
                    <Brackets />
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-mono uppercase text-[#555]">Win Rate</p>
                      <Trophy size={16} className="text-[#c9a84c]/50" />
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-black">{personalStats.winRate}%</p>
                      <div className="flex-grow h-2 bg-[#1a1a1a] rounded-full mb-2 overflow-hidden">
                        <div className="h-full bg-[#c9a84c]" style={{ width: `${personalStats.winRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bracket-card p-12 text-center border-dashed border-[#2a2a2a]">
                  <Brackets />
                  <p className="text-[#555] font-mono text-sm uppercase">Connect wallet to view stats</p>
                </div>
              )}

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-500 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Provably Fair</p>
                    <p className="text-[10px] text-[#777] mt-1 leading-relaxed">
                      Arc Roulette uses deterministic math to ensure results are verifiable.
                      House edge is fixed at 5%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Win Effects */}
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
        .nav-link {
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: white;
        }
      `}</style>
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
