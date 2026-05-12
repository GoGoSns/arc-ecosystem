'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { 
  MousePointerClick, 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Wallet,
  Play,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useGamesStore } from '@/lib/gamesStore';
import { sendUSDC } from '@/lib/payments';

const GAME_DURATION = 10; // seconds
const TARGET_LIFESPAN = 1200; // ms
const SPAWN_INTERVAL = 600; // ms

interface Target {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

export default function ClickRushPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { payoutAddress, recordScore } = useGamesStore();

  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targets, setTargets] = useState<Target[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);
  const nextTargetId = useRef(0);

  const startGame = useCallback((paid: boolean) => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setTargets([]);
    setIsPaid(paid);
    setGameState('playing');
    
    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawning
    spawnRef.current = setInterval(() => {
      if (gameAreaRef.current) {
        const { width, height } = gameAreaRef.current.getBoundingClientRect();
        const newTarget: Target = {
          id: nextTargetId.current++,
          x: Math.random() * (width - 80) + 40,
          y: Math.random() * (height - 80) + 40,
          createdAt: Date.now(),
        };
        setTargets((prev) => [...prev, newTarget]);
      }
    }, SPAWN_INTERVAL);

    // End game after duration
    setTimeout(() => {
      if (spawnRef.current) clearInterval(spawnRef.current);
      setGameState('result');
    }, GAME_DURATION * 1000);
  }, []);

  const handlePayAndStart = async () => {
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }
    setLoading(true);
    try {
      const { txHash } = await sendUSDC(payoutAddress, '1');
      setIsPaid(true);
      startGame(true);
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onTargetClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setScore((s) => s + 1);
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  // Cleanup targets
  useEffect(() => {
    if (gameState === 'playing') {
      const cleanup = setInterval(() => {
        const now = Date.now();
        setTargets((prev) => prev.filter((t) => now - t.createdAt < TARGET_LIFESPAN));
      }, 100);
      return () => clearInterval(cleanup);
    }
  }, [gameState]);

  // Record score
  useEffect(() => {
    if (gameState === 'result' && isPaid && address) {
      recordScore({
        gameType: 'click-rush',
        playerAddress: address,
        score: score,
        displayScore: `${score} clicks`,
        paidEntry: true,
      });
    }
  }, [gameState, isPaid, address, score, recordScore]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <button 
          onClick={() => router.push('/games')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} /> Back to Games
        </button>

        {gameState === 'lobby' && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
              <MousePointerClick size={40} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Click Rush</h1>
              <p className="text-lg opacity-60">Click as many gold targets as possible in 10 seconds.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={handlePayAndStart}
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
                onClick={() => startGame(false)}
                className="py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-colors"
              >
                Free Practice Mode
              </button>
            </div>
            
            <div className="flex flex-col gap-2 opacity-40 text-sm">
              <p>Rules: Targets last 1.2s. Maximize your clicks!</p>
              <p>Paid entries count towards the weekly prize pool.</p>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center px-8 py-4 z-10">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Time</span>
                  <div className="flex items-center gap-2 text-3xl font-bold font-mono">
                    <Clock size={24} style={{ color: timeLeft < 4 ? '#ef4444' : 'var(--accent)' }} />
                    {timeLeft}s
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Clicks</span>
                  <div className="text-3xl font-bold font-mono text-[var(--accent)]">{score}</div>
                </div>
              </div>
              {isPaid && (
                <div className="px-4 py-2 rounded-xl border border-accent/20 bg-accent/5 text-[var(--accent)] font-bold text-xs uppercase tracking-widest">
                  Paid Entry
                </div>
              )}
            </div>

            <div 
              ref={gameAreaRef}
              className="flex-1 relative cursor-crosshair overflow-hidden select-none"
              style={{ background: 'rgba(255,255,255,0.01)', margin: '0 2rem 2rem 2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {targets.map((target) => (
                <button
                  key={target.id}
                  onMouseDown={(e) => onTargetClick(e, target.id)}
                  className="absolute w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in fade-in duration-150"
                  style={{ 
                    left: target.x - 32, 
                    top: target.y - 32,
                    background: 'var(--accent)',
                    boxShadow: '0 0 20px rgba(201,168,76,0.4)',
                    border: '4px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <div className="w-full h-full sweep rounded-full opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'result' && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <Trophy size={64} style={{ color: 'var(--accent)' }} className="animate-bounce" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Game Over</h2>
              <p className="text-6xl font-bold mb-4">{score}</p>
              <p className="text-xl opacity-60">Clicks in 10 seconds</p>
            </div>

            {isPaid ? (
              <div className="p-6 rounded-2xl w-full border border-green-500/20 bg-green-500/5 text-green-400">
                <p className="font-bold mb-1">Score Recorded!</p>
                <p className="text-sm opacity-80">You've been added to the weekly leaderboard.</p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl w-full border border-white/10 bg-white/5 opacity-60">
                <p className="font-bold mb-1">Practice Mode</p>
                <p className="text-sm">Paid entry required to save score to leaderboard.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => setGameState('lobby')}
                className="py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 transition-colors"
              >
                <RotateCcw size={18} /> Play Again
              </button>
              <button 
                onClick={() => router.push('/games')}
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
