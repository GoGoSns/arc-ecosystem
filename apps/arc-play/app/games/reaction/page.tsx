'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { 
  Zap, 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Wallet,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useGamesStore } from '@/lib/gamesStore';
import { sendUSDC } from '@/lib/payments';

const TOTAL_ROUNDS = 5;

export default function ReactionTestPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { payoutAddress, recordScore } = useGamesStore();

  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'ready' | 'result'>('lobby');
  const [rounds, setRounds] = useState<number[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setError(null);
    setGameState('waiting');
    
    const delay = Math.random() * 4000 + 2000; // 2-6 seconds
    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const startGame = (paid: boolean) => {
    setIsPaid(paid);
    setRounds([]);
    startRound();
  };

  const handlePayAndStart = async () => {
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }
    setLoading(true);
    try {
      await sendUSDC(payoutAddress, '1');
      startGame(true);
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      // Too early
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError('Too early!');
      const penaltyTime = 1000; // 1s penalty
      setRounds((prev) => [...prev, penaltyTime]);
      
      if (rounds.length + 1 >= TOTAL_ROUNDS) {
        setGameState('result');
      } else {
        setTimeout(startRound, 1500);
      }
    } else if (gameState === 'ready') {
      const endTime = performance.now();
      const reactionTime = Math.round(endTime - startTimeRef.current);
      setRounds((prev) => [...prev, reactionTime]);
      
      if (rounds.length + 1 >= TOTAL_ROUNDS) {
        setGameState('result');
      } else {
        setGameState('lobby'); // Brief pause between rounds
        setTimeout(startRound, 1000);
      }
    }
  };

  const avgReaction = rounds.length > 0 
    ? Math.round(rounds.reduce((a, b) => a + b, 0) / rounds.length) 
    : 0;

  // Record score
  useEffect(() => {
    if (gameState === 'result' && isPaid && address) {
      // In store, higher score is better. For reaction, lower ms is better.
      // Store as 10000 - avg_ms so desc sort works.
      const rawScore = 10000 - avgReaction;
      recordScore({
        gameType: 'reaction',
        playerAddress: address,
        score: rawScore,
        displayScore: `${avgReaction}ms`,
        paidEntry: true,
      });
    }
  }, [gameState, isPaid, address, avgReaction, recordScore]);

  return (
    <div 
      className={`flex flex-col flex-1 h-screen transition-colors duration-300 ${
        gameState === 'waiting' ? 'bg-red-500/20' : 
        gameState === 'ready' ? 'bg-green-500/40' : 
        'bg-[#0a0a0a]'
      }`}
      onMouseDown={handleClick}
    >
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative select-none">
        <button 
          onClick={() => router.push('/games')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity z-20"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} /> Back to Games
        </button>

        {gameState === 'lobby' && rounds.length === 0 && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.1)' }}>
              <Zap size={40} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Reaction Test</h1>
              <p className="text-lg opacity-60">Click as fast as you can when the screen turns green. 5 rounds.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); handlePayAndStart(); }}
                disabled={loading}
                className="sweep py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                {loading ? 'Processing...' : (
                  <>
                    <Wallet size={20} />
                    Pay $1 Entry & Start
                  </>
                )}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(false); }}
                className="py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-colors"
              >
                Free Practice Mode
              </button>
            </div>
          </div>
        )}

        {(gameState === 'waiting' || gameState === 'ready' || error) && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Round {rounds.length + 1} of {TOTAL_ROUNDS}</p>
              <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${(rounds.length / TOTAL_ROUNDS) * 100}%` }}
                />
              </div>
            </div>

            {error ? (
              <div className="flex flex-col items-center gap-4 text-[#ef4444]">
                <AlertCircle size={80} />
                <h2 className="text-5xl font-bold uppercase tracking-tight">{error}</h2>
                <p className="text-xl opacity-60">1.0s penalty applied</p>
              </div>
            ) : gameState === 'waiting' ? (
              <div className="flex flex-col items-center gap-4 opacity-40">
                <Clock size={80} className="animate-pulse" />
                <h2 className="text-5xl font-bold uppercase tracking-tight">Wait for green...</h2>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-white">
                <Zap size={100} className="fill-white" />
                <h2 className="text-7xl font-black uppercase tracking-tighter animate-bounce">CLICK!</h2>
              </div>
            )}
          </div>
        )}

        {gameState === 'result' && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <Trophy size={64} style={{ color: 'var(--accent)' }} className="animate-bounce" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Reaction Average</h2>
              <p className="text-6xl font-bold mb-4">{avgReaction}ms</p>
              <div className="flex gap-4 justify-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-40">Best</span>
                  <span className="font-bold text-[#4ade80]">{Math.min(...rounds)}ms</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[10px] uppercase opacity-40">Worst</span>
                  <span className="font-bold text-[#ef4444]">{Math.max(...rounds)}ms</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); setGameState('lobby'); setRounds([]); }}
                className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <RotateCcw size={18} /> Play Again
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); router.push('/games'); }}
                className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <ArrowLeft size={18} /> Hub
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
