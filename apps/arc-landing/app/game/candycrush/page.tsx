'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Mode = 'menu' | 'playing' | 'result';
type ResultKind = 'levelClear' | 'win' | 'lose';

type GemType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
type GemSpecial = 'striped' | 'rainbow' | 'bomb' | undefined;

type CellRef = {
  row: number;
  col: number;
};

type Gem = {
  id: number;
  row: number;
  col: number;
  type: GemType;
  special?: GemSpecial;
  removing?: boolean;
};

type MatchRun = {
  orientation: 'h' | 'v';
  cells: CellRef[];
  type: GemType;
};

type ResultState = {
  kind: ResultKind;
  heading: string;
  message: string;
  score: number;
  combos: number;
  bestChain: number;
  levelReached: number;
} | null;

const ROWS = 8;
const COLS = 8;
const CELL_PERCENT = 100 / COLS;
const MOVE_DUR = 300;

const LEVELS = [
  { target: 500, moves: 30 },
  { target: 1000, moves: 25 },
  { target: 2000, moves: 20 },
] as const;

const GEM_META: Record<GemType, { fill: string; symbol: string; clipPath: string }> = {
  red: {
    fill: '#ef4444',
    symbol: 'R',
    clipPath: 'circle(50% at 50% 50%)',
  },
  blue: {
    fill: '#3b82f6',
    symbol: 'B',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0 50%)',
  },
  green: {
    fill: '#22c55e',
    symbol: 'G',
    clipPath: 'polygon(50% 0%, 100% 100%, 0 100%)',
  },
  yellow: {
    fill: '#eab308',
    symbol: 'Y',
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 72%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)',
  },
  purple: {
    fill: '#a855f7',
    symbol: 'P',
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0 50%)',
  },
  orange: {
    fill: '#f97316',
    symbol: 'O',
    clipPath: 'polygon(14% 0%, 86% 0%, 100% 14%, 100% 86%, 86% 100%, 14% 100%, 0 86%, 0 14%)',
  },
};

const GEM_TYPES: GemType[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function keyOf(row: number, col: number): string {
  return `${row}:${col}`;
}

function cloneBoard(board: (Gem | null)[][]): (Gem | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function adjacent(a: CellRef, b: CellRef): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function createGem(row: number, col: number): Gem {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    row,
    col,
    type: pickRandom(GEM_TYPES),
  };
}

function wouldCreateMatch(board: (Gem | null)[][], row: number, col: number, type: GemType): boolean {
  const left1 = board[row]?.[col - 1];
  const left2 = board[row]?.[col - 2];
  if (left1?.type === type && left2?.type === type) {
    return true;
  }

  const up1 = board[row - 1]?.[col];
  const up2 = board[row - 2]?.[col];
  if (up1?.type === type && up2?.type === type) {
    return true;
  }

  return false;
}

function createInitialBoard(): (Gem | null)[][] {
  const board = Array.from({ length: ROWS }, () => Array<Gem | null>(COLS).fill(null));

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      let type: GemType = pickRandom(GEM_TYPES);
      let attempts = 0;
      while (wouldCreateMatch(board, row, col, type) && attempts < 12) {
        type = pickRandom(GEM_TYPES);
        attempts += 1;
      }

      board[row][col] = {
        id: Math.floor(Math.random() * 1_000_000),
        row,
        col,
        type,
      };
    }
  }

  return board;
}

function findMatchRuns(board: (Gem | null)[][]): MatchRun[] {
  const runs: MatchRun[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    let col = 0;
    while (col < COLS) {
      const cell = board[row][col];
      if (!cell) {
        col += 1;
        continue;
      }

      let end = col + 1;
      while (end < COLS && board[row][end]?.type === cell.type) {
        end += 1;
      }

      const length = end - col;
      if (length >= 3) {
        runs.push({
          orientation: 'h',
          type: cell.type,
          cells: Array.from({ length }, (_, index) => ({ row, col: col + index })),
        });
      }

      col = end;
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    let row = 0;
    while (row < ROWS) {
      const cell = board[row][col];
      if (!cell) {
        row += 1;
        continue;
      }

      let end = row + 1;
      while (end < ROWS && board[end][col]?.type === cell.type) {
        end += 1;
      }

      const length = end - row;
      if (length >= 3) {
        runs.push({
          orientation: 'v',
          type: cell.type,
          cells: Array.from({ length }, (_, index) => ({ row: row + index, col })),
        });
      }

      row = end;
    }
  }

  return runs;
}

function uniqueCellsFromRuns(runs: MatchRun[]): CellRef[] {
  const seen = new Set<string>();
  const cells: CellRef[] = [];
  runs.forEach((run) => {
    run.cells.forEach((cell) => {
      const key = keyOf(cell.row, cell.col);
      if (!seen.has(key)) {
        seen.add(key);
        cells.push(cell);
      }
    });
  });
  return cells;
}

function computeMatchScore(runs: MatchRun[]): number {
  if (runs.length === 0) {
    return 0;
  }

  const hasHorizontal = runs.some((run) => run.orientation === 'h');
  const hasVertical = runs.some((run) => run.orientation === 'v');
  const overlapping = runs.some((left, leftIndex) =>
    runs.slice(leftIndex + 1).some((right) =>
      left.cells.some((cell) => right.cells.some((other) => other.row === cell.row && other.col === cell.col)),
    ),
  );

  if (hasHorizontal && hasVertical && overlapping) {
    return 80;
  }

  return runs.reduce((total, run) => {
    if (run.cells.length >= 5) {
      return total + 100;
    }

    if (run.cells.length === 4) {
      return total + 60;
    }

    return total + 30;
  }, 0);
}

function collapseBoard(board: (Gem | null)[][]): (Gem | null)[][] {
  const next = Array.from({ length: ROWS }, () => Array<Gem | null>(COLS).fill(null));

  for (let col = 0; col < COLS; col += 1) {
    const stack: Gem[] = [];

    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const cell = board[row][col];
      if (cell) {
        stack.push(cell);
      }
    }

    let targetRow = ROWS - 1;
    stack.forEach((cell) => {
      next[targetRow][col] = {
        ...cell,
        row: targetRow,
        col,
      };
      targetRow -= 1;
    });

    while (targetRow >= 0) {
      next[targetRow][col] = createGem(targetRow, col);
      targetRow -= 1;
    }
  }

  return next;
}

function isBoardFull(board: (Gem | null)[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

function GemTile({
  gem,
  selected,
  onClick,
}: {
  gem: Gem;
  selected: boolean;
  onClick?: () => void;
}) {
  const meta = GEM_META[gem.type];
  const removed = gem.removing === true;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute rounded-2xl transition-all duration-300 ease-out ${selected ? 'ring-2 ring-[#d4af37] ring-offset-0' : ''}`}
      style={{
        left: `calc(${gem.col * CELL_PERCENT}% + 4px)`,
        top: `calc(${gem.row * CELL_PERCENT}% + 4px)`,
        width: `calc(${CELL_PERCENT}% - 8px)`,
        height: `calc(${CELL_PERCENT}% - 8px)`,
        opacity: removed ? 0 : 1,
        transform: removed ? 'scale(0.2) rotate(14deg)' : 'scale(1)',
      }}
    >
      <span
        className="flex h-full w-full items-center justify-center text-[10px] font-black text-white shadow-[0_0_14px_rgba(0,0,0,0.35)]"
        style={{
          clipPath: meta.clipPath,
          background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.4), ${meta.fill} 58%, rgba(0,0,0,0.28) 100%)`,
          boxShadow: `0 0 14px ${meta.fill}55`,
        }}
      >
        {meta.symbol}
      </span>
    </button>
  );
}

export default function CandyCrushPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const isChallengeRun = Boolean(challengeId);

  const [mode, setMode] = useState<Mode>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [board, setBoard] = useState<(Gem | null)[][]>(() => createInitialBoard());
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState<number>(LEVELS[0].moves);
  const [bestChain, setBestChain] = useState(0);
  const [result, setResult] = useState<ResultState>(null);
  const [selected, setSelected] = useState<CellRef | null>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [comboText, setComboText] = useState<string | null>(null);

  const boardRef = useRef(board);
  const modeRef = useRef<Mode>('menu');
  const movesRef = useRef<number>(LEVELS[0].moves);
  const scoreRef = useRef(0);
  const bestChainRef = useRef(0);
  const chainRef = useRef(1);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const resultTimerRef = useRef<number | null>(null);
  const levelReachedRef = useRef(1);
  const resultScoreRef = useRef(0);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  };

  const pushTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timer);
      callback();
    }, delay);
    timersRef.current.push(timer);
    return timer;
  };

  const syncUi = () => {
    setScore(scoreRef.current);
    setMovesLeft(movesRef.current);
    setBestChain(bestChainRef.current);
  };

  const setAndCommitBoard = (nextBoard: (Gem | null)[][]) => {
    boardRef.current = nextBoard;
    setBoard(nextBoard);
  };

  const makeResult = (kind: ResultKind): ResultState =>
    kind === 'levelClear'
      ? {
          kind,
          heading: 'Level Complete!',
          message: `Target reached for level ${levelIndex + 1}.`,
          score: scoreRef.current,
          combos: levelIndex + 1,
          bestChain: bestChainRef.current,
          levelReached: levelIndex + 1,
        }
      : kind === 'win'
        ? {
            kind,
            heading: 'You Win!',
            message: `Total Score: ${scoreRef.current}`,
            score: scoreRef.current,
            combos: levelIndex + 1,
            bestChain: bestChainRef.current,
            levelReached: levelIndex + 1,
          }
        : {
            kind,
            heading: 'Game Over',
            message: 'You ran out of moves before reaching the target.',
            score: scoreRef.current,
            combos: levelIndex + 1,
            bestChain: bestChainRef.current,
            levelReached: levelIndex + 1,
          };

  const finishResult = (kind: ResultKind) => {
    busyRef.current = false;
    clearTimers();
    setComboText(null);
    setChallengeOpen(false);
    setMode('result');
    modeRef.current = 'result';
    setResult(makeResult(kind));
    resultScoreRef.current = scoreRef.current;
  };

  const resetLevel = (nextLevelIndex: number, preserveScore = false) => {
    clearTimers();
    busyRef.current = false;
    chainRef.current = 1;
    setComboText(null);
    setSelected(null);
    setChallengeOpen(false);
    setResult(null);
    setMode('playing');
    modeRef.current = 'playing';
    setLevelIndex(nextLevelIndex);
    levelReachedRef.current = nextLevelIndex + 1;

    const nextBoard = createInitialBoard();
    setAndCommitBoard(nextBoard);

    const nextMoves = LEVELS[nextLevelIndex].moves;
    movesRef.current = nextMoves;
    setMovesLeft(nextMoves);

    if (!preserveScore) {
      scoreRef.current = 0;
      bestChainRef.current = 0;
      setScore(0);
      setBestChain(0);
    }
  };

  const startGame = () => {
    scoreRef.current = 0;
    bestChainRef.current = 0;
    movesRef.current = LEVELS[0].moves;
    levelReachedRef.current = 1;
    resetLevel(0, false);
  };

  const showCombo = (text: string) => {
    setComboText(text);
    pushTimer(() => {
      setComboText((current) => (current === text ? null : current));
    }, 850);
  };

  const unlockOrEnd = () => {
    if (scoreRef.current >= LEVELS[levelIndex].target) {
      finishResult(levelIndex >= LEVELS.length - 1 ? 'win' : 'levelClear');
      return;
    }

    if (movesRef.current <= 0) {
      finishResult('lose');
      return;
    }

    busyRef.current = false;
    setSelected(null);
  };

  const applyCollapseAndContinue = (chainCount: number) => {
    const collapsed = collapseBoard(boardRef.current);
    setAndCommitBoard(collapsed);

    const nextRuns = findMatchRuns(collapsed);
    if (nextRuns.length > 0) {
      chainRef.current = chainCount + 1;
      bestChainRef.current = Math.max(bestChainRef.current, chainRef.current);
      setBestChain(bestChainRef.current);
      showCombo(`${chainRef.current}x COMBO!`);
      pushTimer(() => resolveMatchRuns(chainRef.current), MOVE_DUR);
      return;
    }

    unlockOrEnd();
  };

  const resolveMatchRuns = (chainCount: number) => {
    const runs = findMatchRuns(boardRef.current);
    if (runs.length === 0) {
      applyCollapseAndContinue(chainCount);
      return;
    }

    const cells = uniqueCellsFromRuns(runs);
    const matchedKeys = new Set(cells.map((cell) => keyOf(cell.row, cell.col)));
    const baseScore = computeMatchScore(runs);
    const points = baseScore * chainCount;

    busyRef.current = true;
    scoreRef.current += points;
    bestChainRef.current = Math.max(bestChainRef.current, chainCount);
    setScore(scoreRef.current);
    setBestChain(bestChainRef.current);
    if (chainCount > 1) {
      showCombo(`${chainCount}x COMBO!`);
    }

    const nextBoard = cloneBoard(boardRef.current).map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell && matchedKeys.has(keyOf(rowIndex, colIndex))) {
          return { ...cell, removing: true };
        }

        return cell ? { ...cell } : null;
      }),
    );

    setAndCommitBoard(nextBoard);

    pushTimer(() => {
      const cleared = cloneBoard(boardRef.current).map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (cell && matchedKeys.has(keyOf(rowIndex, colIndex))) {
            return null;
          }

          return cell ? { ...cell, removing: false } : null;
        }),
      );

      setAndCommitBoard(cleared);
      applyCollapseAndContinue(chainCount);
    }, MOVE_DUR);
  };

  const attemptSwap = (first: CellRef, second: CellRef) => {
    if (busyRef.current) {
      return;
    }

    const firstCell = boardRef.current[first.row][first.col];
    const secondCell = boardRef.current[second.row][second.col];
    if (!firstCell || !secondCell) {
      return;
    }

    busyRef.current = true;
    setSelected(null);
    movesRef.current = Math.max(0, movesRef.current - 1);
    setMovesLeft(movesRef.current);

    const swapped = cloneBoard(boardRef.current);
    swapped[first.row][first.col] = { ...secondCell, row: first.row, col: first.col };
    swapped[second.row][second.col] = { ...firstCell, row: second.row, col: second.col };
    setAndCommitBoard(swapped);

    pushTimer(() => {
      const runs = findMatchRuns(boardRef.current);
      if (runs.length === 0) {
        const reverted = cloneBoard(boardRef.current);
        reverted[first.row][first.col] = { ...firstCell, row: first.row, col: first.col };
        reverted[second.row][second.col] = { ...secondCell, row: second.row, col: second.col };
        setAndCommitBoard(reverted);
        unlockOrEnd();
        return;
      }

      resolveMatchRuns(1);
    }, MOVE_DUR);
  };

  const handleCellClick = (row: number, col: number) => {
    if (modeRef.current !== 'playing' || busyRef.current) {
      return;
    }

    const cell = boardRef.current[row][col];
    if (!cell) {
      return;
    }

    if (!selected) {
      setSelected({ row, col });
      return;
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null);
      return;
    }

    if (!adjacent(selected, { row, col })) {
      setSelected({ row, col });
      return;
    }

    attemptSwap(selected, { row, col });
  };

  useEffect(() => {
    if (mode !== 'playing') {
      return;
    }

    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const targetScore = LEVELS[levelIndex].target;
  const finalChallengeScore = result && result.kind !== 'levelClear' ? score : 0;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Candy Crush</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Match-3</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">3 levels</HubBadge>
              {isChallengeRun ? (
                <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge Run</HubBadge>
              ) : null}
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Candy Crush</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Swap adjacent gems, trigger matches, and climb through three target-score levels.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="candycrush" playerScore={result && result.kind !== 'levelClear' ? finalChallengeScore : undefined} />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  mode === 'result'
                    ? result?.kind === 'win'
                      ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      : result?.kind === 'lose'
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                }
              >
                {mode === 'menu'
                  ? 'Ready to Swap'
                  : mode === 'playing'
                    ? `Level ${levelIndex + 1}/3`
                    : result?.heading ?? 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {mode === 'menu'
                  ? 'Build the first combo.'
                  : mode === 'playing'
                    ? 'Match, chain, and hit the target.'
                    : result?.heading ?? 'Result'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {mode === 'menu'
                  ? 'Click a gem, then click an adjacent gem to swap. Match 3 or more to score and keep moving.'
                  : mode === 'playing'
                    ? 'Three-in-a-row is worth 30 points, four-in-a-row is worth 60, and five-in-a-row is worth 100.'
                    : result?.message ?? 'Challenge the next run.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[520px] lg:grid-cols-4">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{score}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Moves</div>
                <div className={`mt-1 text-2xl font-black ${movesLeft <= 5 ? 'text-red-200' : 'text-white'}`}>{movesLeft}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Target</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{targetScore}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Chain</div>
                <div className="mt-1 text-2xl font-black text-white">{bestChain}x</div>
              </div>
            </div>
          </div>

          {mode === 'menu' ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Controls</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Click one gem, then click an adjacent gem to swap. Matches fall, refill, and chain combos.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Levels</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Beat the target score before moves run out. Each level cuts moves and raises the score target.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[#1a1a2e] bg-black/30 p-4">
                <div className="relative aspect-square overflow-hidden rounded-[1.2rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,#080810,#121224)]">
                  {board.map((row, rowIndex) =>
                    row.map((gem, colIndex) =>
                      gem ? (
                      <GemTile
                          key={gem.id}
                          gem={gem}
                          selected={selected?.row === rowIndex && selected?.col === colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        />
                      ) : null,
                    ),
                  )}

                  {comboText ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="rounded-[1.2rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.16),rgba(0,0,0,0.48))] px-5 py-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.12)]">
                        <div className="text-xs font-mono uppercase tracking-[0.28em] text-[#f0d79e]">Combo</div>
                        <div className="mt-1 text-2xl font-black text-[#f5d060]">{comboText}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div className="rounded-[1.4rem] border border-[#1a1a2e] bg-black/30 p-4">
                <div className="relative aspect-square overflow-hidden rounded-[1.2rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,#080810,#121224)]">
                  {board.map((row, rowIndex) =>
                    row.map((gem, colIndex) =>
                      gem ? (
                        <GemTile
                          key={gem.id}
                          gem={gem}
                          selected={selected?.row === rowIndex && selected?.col === colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        />
                      ) : null,
                    ),
                  )}

                  {mode === 'playing' && comboText ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="rounded-[1.2rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.16),rgba(0,0,0,0.48))] px-5 py-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.12)]">
                        <div className="text-xs font-mono uppercase tracking-[0.28em] text-[#f0d79e]">Combo</div>
                        <div className="mt-1 text-2xl font-black text-[#f5d060]">{comboText}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Tap Order</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    The first tap highlights a gem. The second tap must be adjacent to trigger a swap.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Scoring</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    3 matches are 30 points, 4 matches are 60, 5 matches are 100, and T/L shapes are worth 80.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'menu' ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
              >
                Start Game
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                Reach the target score before you run out of moves.
              </span>
            </div>
          ) : null}

          {mode === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Final Score</div>
                  <div className="mt-2 text-3xl font-black text-[#f5d060]">{result.score}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Combos</div>
                  <div className="mt-2 text-3xl font-black text-[#30d158]">{result.combos}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Chain</div>
                  <div className="mt-2 text-3xl font-black text-white">{result.bestChain}x</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level Reached</div>
                  <div className="mt-2 text-3xl font-black text-white">{result.levelReached}/3</div>
                </div>
              </div>

              <div
                className={`rounded-[1.6rem] border p-6 sm:p-8 ${
                  result.kind === 'win'
                    ? 'border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))]'
                    : result.kind === 'lose'
                      ? 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                      : 'border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        result.kind === 'win'
                          ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                          : result.kind === 'lose'
                            ? 'border-red-500/30 bg-red-500/10 text-red-200'
                            : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl text-white">
                      {result.heading}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">{result.message}</p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.score}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {result.kind === 'levelClear' ? (
                    <button
                      type="button"
                      onClick={() => resetLevel(levelIndex + 1, true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Next Level
                    </button>
                  ) : null}
                  {result.kind !== 'levelClear' ? (
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Challenge a Friend
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={startGame}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Play Again
                  </button>
                  <Link
                    href="/game"
                    className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Back to Games
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </HubCard>
      </div>

      <ChallengeModal
        gameType="candycrush"
        playerScore={finalChallengeScore}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </section>
  );
}
