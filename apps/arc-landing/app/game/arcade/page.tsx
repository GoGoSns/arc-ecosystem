'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw, Star, Zap } from 'lucide-react';
import { HubBadge, HubCard } from '@/components/HubPrimitives';
import { GameToast } from '@/components/GameToast';
import { useGameStore } from '@/lib/gameStore';

// ── Tap The Gold ──────────────────────────────────────────────────────────────

const GRID_SIZE = 20;
const GOLD_COUNT = 6;
const GAME_DURATION = 10;

function shuffleGrid(): boolean[] {
  const cells = Array(GRID_SIZE).fill(false) as boolean[];
  const indices = Array.from({ length: GRID_SIZE }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  indices.slice(0, GOLD_COUNT).forEach((i) => { cells[i] = true; });
  return cells;
}

type TapState = 'idle' | 'playing' | 'done';

function TapGoldGame({ onXPEarned }: { onXPEarned: (xp: number) => void }) {
  const [gameState, setGameState] = useState<TapState>('idle');
  const [grid, setGrid] = useState<boolean[]>(() => shuffleGrid());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveArcadeBest = useGameStore((s) => s.saveArcadeBest);
  const addBonusXP = useGameStore((s) => s.addBonusXP);
  const arcadeBest = useGameStore((s) => s.arcadeBests.tapGold);

  const endGame = useCallback((finalScore: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const xp = Math.max(finalScore * 3, 0);
    saveArcadeBest('tapGold', finalScore);
    addBonusXP(xp);
    onXPEarned(xp);
    setGameState('done');
  }, [saveArcadeBest, addBonusXP, onXPEarned]);

  const startGame = () => {
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGrid(shuffleGrid());
    setGameState('playing');
  };

  const handleCellClick = (isGold: boolean) => {
    if (gameState !== 'playing' || !isGold) return;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setGrid(shuffleGrid());
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, endGame]);

  const xpEarned = score * 3;

  return (
    <HubCard className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Free · No wallet</HubBadge>
          <h2 className="mt-3 text-2xl font-black uppercase sm:text-3xl">Tap The Gold</h2>
          <p className="mt-1 text-sm text-[#8a8a9a]">Tap gold ◆ diamonds before time runs out. XP = taps × 3.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555566]">Best</div>
          <div className="text-2xl font-black text-[#d4af37]">{arcadeBest}</div>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="mt-8 text-center space-y-6">
          <div className="grid grid-cols-5 gap-1.5 opacity-30 pointer-events-none">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-lg border text-xs font-black flex items-center justify-center ${i < GOLD_COUNT ? 'border-[#d4af37]/60 bg-[#d4af37]/15 text-[#d4af37]' : 'border-[#1a1a2e] bg-[#0a0a0f] text-[#1a1a2e]'}`}>
                {i < GOLD_COUNT ? '◆' : '·'}
              </div>
            ))}
          </div>
          <p className="text-[#8a8a9a] text-sm">A 4×5 grid appears — tap the ◆ diamonds as fast as you can. New layout every tap!</p>
          <button onClick={startGame} className="primary-button mx-auto">
            <Zap size={14} />
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555566]">Score </span>
              <span className="font-black text-white text-lg">{score}</span>
            </div>
            <div className={`rounded-2xl border px-4 py-2 font-mono text-xl font-black transition-colors ${timeLeft <= 3 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a2e] bg-black/30 text-white'}`}>
              {timeLeft}s
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {grid.map((isGold, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(isGold)}
                className={`aspect-square rounded-xl border text-base font-black transition-all select-none ${
                  isGold
                    ? 'border-[#d4af37]/60 bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/30 active:scale-90'
                    : 'border-[#1a1a2e] bg-[#0a0a0f] text-[#1a1a2e] cursor-default'
                }`}
              >
                {isGold ? '◆' : '·'}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'done' && (
        <div className="mt-8 text-center space-y-4">
          <div className="text-6xl font-black text-[#d4af37]">{score}</div>
          <div className="text-[#8a8a9a] text-sm">diamonds tapped</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-sm font-black text-[#f0d79e]">
            <Star size={14} />
            +{xpEarned} XP earned
          </div>
          {score > arcadeBest && score > 0 && (
            <div className="text-[#30d158] text-sm font-bold">New personal best!</div>
          )}
          <button onClick={startGame} className="secondary-button mx-auto">
            <RotateCcw size={14} />
            Play Again
          </button>
        </div>
      )}
    </HubCard>
  );
}

// ── Memory Match ──────────────────────────────────────────────────────────────

const CARD_SYMBOLS = ['ETH', 'BTC', 'USDC', 'ARC'] as const;
const CARD_COLORS: Record<string, string> = {
  ETH: 'border-purple-500/50 bg-purple-500/15 text-purple-300',
  BTC: 'border-orange-500/50 bg-orange-500/15 text-orange-300',
  USDC: 'border-blue-500/50 bg-blue-500/15 text-blue-300',
  ARC: 'border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f0d79e]',
};

interface MemCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(): MemCard[] {
  const symbols = [...CARD_SYMBOLS, ...CARD_SYMBOLS] as string[];
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return symbols.map((symbol, id) => ({ id, symbol, flipped: false, matched: false }));
}

type MemState = 'idle' | 'playing' | 'done';

function MemoryMatchGame({ onXPEarned }: { onXPEarned: (xp: number) => void }) {
  const [gameState, setGameState] = useState<MemState>('idle');
  const [deck, setDeck] = useState<MemCard[]>(() => createDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [flips, setFlips] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveArcadeBest = useGameStore((s) => s.saveArcadeBest);
  const addBonusXP = useGameStore((s) => s.addBonusXP);
  const arcadeBest = useGameStore((s) => s.arcadeBests.memoryMatch);

  const endGame = useCallback((finalFlips: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = Math.max(0, 100 - finalFlips * 5);
    const xp = Math.max(10, score);
    saveArcadeBest('memoryMatch', score);
    addBonusXP(xp);
    onXPEarned(xp);
    setGameState('done');
  }, [saveArcadeBest, addBonusXP, onXPEarned]);

  const startGame = () => {
    setDeck(createDeck());
    setSelected([]);
    setFlips(0);
    setElapsed(0);
    setLocked(false);
    startTimeRef.current = Date.now();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  const handleCardClick = (id: number) => {
    if (locked || gameState !== 'playing') return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched || selected.includes(id)) return;

    const nextSelected = [...selected, id];
    const nextFlips = flips + 1;
    setFlips(nextFlips);
    setSelected(nextSelected);

    const nextDeck = deck.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setDeck(nextDeck);

    if (nextSelected.length === 2) {
      setLocked(true);
      const [cardA, cardB] = nextSelected.map((sid) => nextDeck.find((c) => c.id === sid)!);

      if (cardA.symbol === cardB.symbol) {
        const matchedDeck = nextDeck.map((c) => nextSelected.includes(c.id) ? { ...c, matched: true } : c);
        setDeck(matchedDeck);
        setSelected([]);
        setLocked(false);
        if (matchedDeck.every((c) => c.matched)) {
          setTimeout(() => endGame(nextFlips), 400);
        }
      } else {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => nextSelected.includes(c.id) && !c.matched ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const matchedPairs = deck.filter((c) => c.matched).length / 2;
  const finalScore = Math.max(0, 100 - flips * 5);
  const xpEarned = Math.max(10, finalScore);
  const isNewBest = gameState === 'done' && finalScore > arcadeBest;

  return (
    <HubCard className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">Free · No wallet</HubBadge>
          <h2 className="mt-3 text-2xl font-black uppercase sm:text-3xl">Memory Match</h2>
          <p className="mt-1 text-sm text-[#8a8a9a]">Match all 4 crypto pairs. Fewer flips = higher score.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#555566]">Best</div>
          <div className="text-2xl font-black text-[#30d158]">{arcadeBest}</div>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="mt-8 text-center space-y-6">
          <div className="grid grid-cols-4 gap-2 max-w-[240px] mx-auto opacity-30 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl border border-[#1a1a2e] bg-[#0d0d12] text-[#333] flex items-center justify-center text-sm font-black">?</div>
            ))}
          </div>
          <p className="text-[#8a8a9a] text-sm">8 cards face-down. Click to reveal pairs: ETH, BTC, USDC, ARC. Match all 4 to win!</p>
          <button onClick={startGame} className="primary-button mx-auto">
            <Star size={14} />
            Start Game
          </button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'done') && (
        <div className="mt-6">
          {gameState === 'playing' && (
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-3 py-2 text-sm">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">Flips </span>
                <span className="font-black text-white">{flips}</span>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-3 py-2 text-sm">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">Matched </span>
                <span className="font-black text-white">{matchedPairs}/4</span>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-3 py-2 font-mono text-sm text-white">
                {elapsed}s
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {deck.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={gameState === 'done'}
                className={`aspect-square rounded-xl border text-xs font-black transition-all select-none ${
                  card.flipped || card.matched
                    ? CARD_COLORS[card.symbol] + (card.matched ? ' opacity-50' : '')
                    : 'border-[#1a1a2e] bg-[#0d0d12] text-[#444] hover:border-[#333]'
                }`}
              >
                {card.flipped || card.matched ? card.symbol : '?'}
              </button>
            ))}
          </div>

          {gameState === 'done' && (
            <div className="mt-6 text-center space-y-3">
              <div className="text-4xl font-black text-[#30d158]">{flips} flips</div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-sm font-black text-[#f0d79e]">
                <Star size={14} />
                +{xpEarned} XP earned
              </div>
              {isNewBest && <div className="text-[#30d158] text-sm font-bold">New personal best!</div>}
              <button onClick={startGame} className="secondary-button mx-auto">
                <RotateCcw size={14} />
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </HubCard>
  );
}

// ── Arcade Hub ─────────────────────────────────────────────────────────────────

export default function ArcadePage() {
  const [sessionXP, setSessionXP] = useState(0);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: 'win' | 'loss' | 'info';
    title: string;
    message: string;
    amount?: string;
  }>({ isVisible: false, type: 'win', title: '', message: '' });

  const handleXPEarned = (xp: number) => {
    if (xp <= 0) return;
    setSessionXP((prev) => prev + xp);
    setToast({
      isVisible: true,
      type: 'win',
      title: 'XP Earned!',
      message: `+${xp} XP added to your account.`,
      amount: `+${xp} XP`,
    });
  };

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <GameToast
          isVisible={toast.isVisible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          amount={toast.amount}
          onClose={() => setToast((p) => ({ ...p, isVisible: false }))}
        />

        <div className="reveal space-y-4">
          <Link
            href="/game"
            className="inline-flex items-center gap-2 text-sm text-[#8a8a9a] hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Game Hub
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Arcade</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Free · XP rewards</HubBadge>
          </div>
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Arcade
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#8a8a9a]">
            Free mini-games that earn XP. No wallet needed — just tap, match, and climb the leaderboard.
          </p>
          {sessionXP > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 font-black text-[#f0d79e]">
              <Star size={14} />
              +{sessionXP} XP this session
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <TapGoldGame onXPEarned={handleXPEarned} />
          <MemoryMatchGame onXPEarned={handleXPEarned} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/game" className="secondary-button">
            <ArrowLeft size={14} />
            Back to Hub
          </Link>
          <Link href="/game/quiz-pot" className="secondary-button">
            Play Quiz
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
