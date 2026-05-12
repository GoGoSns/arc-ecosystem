'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { 
  Brain, 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Wallet,
  RotateCcw,
  Heart,
  Star,
  Zap,
  Crown,
  Diamond,
  Sun,
  Moon,
  Cloud
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useGamesStore } from '@/lib/gamesStore';
import { sendUSDC } from '@/lib/payments';

const ICONS = [Heart, Star, Zap, Crown, Diamond, Sun, Moon, Cloud];

interface Card {
  id: number;
  iconIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatchPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { payoutAddress, recordScore } = useGamesStore();

  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [flips, setFlips] = useState(0);
  const [time, setTime] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initGame = useCallback(() => {
    const newCards: Card[] = [];
    // Create 8 pairs
    for (let i = 0; i < 8; i++) {
      newCards.push({ id: i * 2, iconIndex: i, isFlipped: false, isMatched: false });
      newCards.push({ id: i * 2 + 1, iconIndex: i, isFlipped: false, isMatched: false });
    }
    // Shuffle
    setCards(newCards.sort(() => Math.random() - 0.5));
    setFlips(0);
    setTime(0);
    setFlippedIndices([]);
  }, []);

  const startGame = (paid: boolean) => {
    initGame();
    setIsPaid(paid);
    setGameState('playing');
    
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 0.1);
    }, 100);
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

  const onCardClick = (index: number) => {
    if (cards[index].isMatched || cards[index].isFlipped || flippedIndices.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setFlips((f) => f + 1);
      const [idx1, idx2] = newFlipped;
      
      if (cards[idx1].iconIndex === cards[idx2].iconIndex) {
        // Match
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Check win
  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0 && cards.every((c) => c.isMatched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('result');
    }
  }, [cards, gameState]);

  // Record score
  useEffect(() => {
    if (gameState === 'result' && isPaid && address) {
      // Score = (1000 / time_seconds) - (flips - 8) * 10
      // Ensure score is meaningful for leaderboard (higher better)
      const rawScore = Math.max(0, Math.floor((1000 / time) - (flips - 8) * 5));
      recordScore({
        gameType: 'memory',
        playerAddress: address,
        score: rawScore,
        displayScore: `${time.toFixed(1)}s (${flips} flips)`,
        paidEntry: true,
      });
    }
  }, [gameState, isPaid, address, time, flips, recordScore]);

  return (
    <div className="flex flex-col flex-1 min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative py-12">
        <button 
          onClick={() => router.push('/games')}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} /> Back to Games
        </button>

        {gameState === 'lobby' && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
              <Brain size={40} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Memory Match</h1>
              <p className="text-lg opacity-60">Find all 8 pairs as fast as possible.</p>
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
          </div>
        )}

        {gameState === 'playing' && (
          <div className="max-w-xl w-full flex flex-col gap-8">
            <div className="flex justify-between items-center px-4">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Time</span>
                  <div className="text-2xl font-bold font-mono text-[var(--accent)]">{time.toFixed(1)}s</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Flips</span>
                  <div className="text-2xl font-bold font-mono">{flips}</div>
                </div>
              </div>
              {isPaid && (
                <div className="px-3 py-1 rounded-lg border border-accent/20 bg-accent/5 text-[var(--accent)] font-bold text-[10px] uppercase tracking-widest">
                  Leaderboard Active
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 aspect-square">
              {cards.map((card, i) => {
                const Icon = ICONS[card.iconIndex];
                const isRevealed = card.isFlipped || card.isMatched;
                
                return (
                  <button
                    key={card.id}
                    onClick={() => onCardClick(i)}
                    className="relative perspective-1000 group w-full h-full"
                    disabled={card.isMatched}
                  >
                    <div 
                      className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}
                    >
                      {/* Front */}
                      <div 
                        className="absolute inset-0 backface-hidden rounded-xl border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full border border-white/20 opacity-20" />
                      </div>
                      {/* Back */}
                      <div 
                        className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 flex items-center justify-center bg-accent/10"
                        style={{ borderColor: card.isMatched ? '#4ade80' : 'var(--accent)' }}
                      >
                        <Icon 
                          size={32} 
                          style={{ color: card.isMatched ? '#4ade80' : 'var(--accent)' }} 
                          className={card.isMatched ? '' : 'animate-pulse'}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === 'result' && (
          <div className="max-w-md w-full flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in duration-300">
            <Trophy size={64} style={{ color: 'var(--accent)' }} className="animate-bounce" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Well Done!</h2>
              <p className="text-6xl font-bold mb-4">{time.toFixed(1)}s</p>
              <p className="text-xl opacity-60">Matched with {flips} flips</p>
            </div>

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

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
