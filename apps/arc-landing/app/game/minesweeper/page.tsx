'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type DifficultyKey = 'easy' | 'medium' | 'hard';
type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type GameState = {
  difficulty: DifficultyKey;
  board: Cell[];
  status: GameStatus;
  timer: number;
  explodedIndex: number | null;
};

const DIFFICULTIES: Record<
  DifficultyKey,
  {
    label: string;
    rows: number;
    cols: number;
    mines: number;
    cellSize: number;
  }
> = {
  easy: {
    label: 'Easy',
    rows: 9,
    cols: 9,
    mines: 10,
    cellSize: 36,
  },
  medium: {
    label: 'Medium',
    rows: 16,
    cols: 16,
    mines: 40,
    cellSize: 28,
  },
  hard: {
    label: 'Hard',
    rows: 16,
    cols: 30,
    mines: 99,
    cellSize: 20,
  },
};

const DIFFICULTY_ORDER: DifficultyKey[] = ['easy', 'medium', 'hard'];

const NUMBER_CLASSES: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-emerald-400',
  3: 'text-red-400',
  4: 'text-violet-400',
  5: 'text-[#7c2d12]',
  6: 'text-cyan-300',
  7: 'text-[#111111]',
  8: 'text-gray-400',
};

const STATUS_LABELS: Record<GameStatus, string> = {
  ready: 'Ready',
  playing: 'Playing',
  won: 'Cleared',
  lost: 'Boom',
};

const FACE_EMOJI: Record<GameStatus, string> = {
  ready: '🙂',
  playing: '🙂',
  won: '😎',
  lost: '💀',
};

function createEmptyBoard(rows: number, cols: number): Cell[] {
  return Array.from({ length: rows * cols }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }));
}

function cloneBoard(board: Cell[]): Cell[] {
  return board.map((cell) => ({ ...cell }));
}

function getNeighbors(index: number, rows: number, cols: number): number[] {
  const neighbors: number[] = [];
  const row = Math.floor(index / cols);
  const col = index % cols;

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
        continue;
      }

      neighbors.push(nextRow * cols + nextCol);
    }
  }

  return neighbors;
}

function shuffleIndices(indices: number[]): number[] {
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  return indices;
}

function createGeneratedBoard(baseBoard: Cell[], rows: number, cols: number, mines: number, safeIndex: number): Cell[] {
  const board = cloneBoard(baseBoard).map((cell) => ({
    ...cell,
    mine: false,
    revealed: false,
  }));
  const candidates = Array.from({ length: rows * cols }, (_, index) => index).filter((index) => index !== safeIndex);
  const mineCount = Math.min(mines, candidates.length);
  const mineIndices = shuffleIndices(candidates).slice(0, mineCount);

  for (const mineIndex of mineIndices) {
    board[mineIndex].mine = true;
  }

  for (let index = 0; index < board.length; index += 1) {
    if (board[index].mine) {
      continue;
    }

    board[index].adjacent = getNeighbors(index, rows, cols).reduce((count, neighborIndex) => {
      return count + (board[neighborIndex].mine ? 1 : 0);
    }, 0);
  }

  return board;
}

function floodReveal(board: Cell[], startIndex: number, rows: number, cols: number): Cell[] {
  const nextBoard = cloneBoard(board);
  const stack = [startIndex];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const index = stack.pop();
    if (index === undefined || visited.has(index)) {
      continue;
    }

    visited.add(index);

    const cell = nextBoard[index];
    if (cell.revealed || cell.flagged) {
      continue;
    }

    cell.revealed = true;

    if (cell.mine || cell.adjacent !== 0) {
      continue;
    }

    for (const neighborIndex of getNeighbors(index, rows, cols)) {
      if (!visited.has(neighborIndex)) {
        stack.push(neighborIndex);
      }
    }
  }

  return nextBoard;
}

function revealAllMines(board: Cell[]): Cell[] {
  return board.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell));
}

function revealAllCells(board: Cell[]): Cell[] {
  return board.map((cell) => ({ ...cell, revealed: true }));
}

function createInitialGame(difficulty: DifficultyKey = 'easy'): GameState {
  const config = DIFFICULTIES[difficulty];

  return {
    difficulty,
    board: createEmptyBoard(config.rows, config.cols),
    status: 'ready',
    timer: 0,
    explodedIndex: null,
  };
}

function getCellAriaLabel(cell: Cell, index: number, game: GameState): string {
  if (!cell.revealed) {
    return cell.flagged ? `Flagged cell ${index + 1}` : `Hidden cell ${index + 1}`;
  }

  if (cell.mine) {
    return game.status === 'lost' && game.explodedIndex === index
      ? `Exploded mine ${index + 1}`
      : `Mine ${index + 1}`;
  }

  return cell.adjacent === 0 ? `Empty cell ${index + 1}` : `${cell.adjacent} adjacent mines`;
}

function getCellContent(cell: Cell, index: number, game: GameState): string {
  if (!cell.revealed) {
    return cell.flagged ? '🚩' : '';
  }

  if (cell.mine) {
    return game.status === 'lost' && game.explodedIndex === index ? '💣' : '💣';
  }

  return cell.adjacent === 0 ? '' : String(cell.adjacent);
}

export default function MinesweeperPage() {
  const [game, setGame] = useState<GameState>(() => createInitialGame('easy'));
  const [challengeOpen, setChallengeOpen] = useState(false);

  const config = DIFFICULTIES[game.difficulty];
  const safeCells = config.rows * config.cols - config.mines;
  const revealedSafeCells = game.board.reduce((count, cell) => count + (cell.revealed && !cell.mine ? 1 : 0), 0);
  const flaggedCells = game.board.reduce((count, cell) => count + (cell.flagged ? 1 : 0), 0);
  const minesLeft = config.mines - flaggedCells;
  const safeProgress = safeCells === 0 ? 0 : Math.round((revealedSafeCells / safeCells) * 100);

  useEffect(() => {
    if (game.status !== 'playing') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setGame((previous) => (previous.status === 'playing' ? { ...previous, timer: previous.timer + 1 } : previous));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [game.status]);

  const startGame = (difficulty: DifficultyKey = game.difficulty) => {
    setGame(createInitialGame(difficulty));
    setChallengeOpen(false);
  };

  const handleReveal = (index: number) => {
    setGame((previous) => {
      if (previous.status === 'won' || previous.status === 'lost') {
        return previous;
      }

      const currentConfig = DIFFICULTIES[previous.difficulty];
      const workingBoard =
        previous.status === 'ready'
          ? createGeneratedBoard(previous.board, currentConfig.rows, currentConfig.cols, currentConfig.mines, index)
          : cloneBoard(previous.board);

      const target = workingBoard[index];
      if (target.revealed || target.flagged) {
        return previous;
      }

      if (target.mine) {
        return {
          ...previous,
          board: revealAllMines(workingBoard),
          status: 'lost',
          explodedIndex: index,
        };
      }

      const floodedBoard = floodReveal(workingBoard, index, currentConfig.rows, currentConfig.cols);
      const revealedSafeCount = floodedBoard.reduce((count, cell) => count + (cell.revealed && !cell.mine ? 1 : 0), 0);

      if (revealedSafeCount === currentConfig.rows * currentConfig.cols - currentConfig.mines) {
        return {
          ...previous,
          board: revealAllCells(floodedBoard),
          status: 'won',
          explodedIndex: null,
        };
      }

      return {
        ...previous,
        board: floodedBoard,
        status: previous.status === 'ready' ? 'playing' : previous.status,
        explodedIndex: null,
      };
    });
  };

  const handleFlag = (index: number) => {
    setGame((previous) => {
      if (previous.status !== 'ready' && previous.status !== 'playing') {
        return previous;
      }

      const target = previous.board[index];
      if (target.revealed) {
        return previous;
      }

      return {
        ...previous,
        board: previous.board.map((cell, cellIndex) =>
          cellIndex === index ? { ...cell, flagged: !cell.flagged } : cell,
        ),
      };
    });
  };

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Mayın Tarlası</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a9a]">Minesweeper</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">
                {config.label} · {config.cols}x{config.rows}
              </HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Mayın Tarlası</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              Open safe tiles, flag the mines, and keep the timer low. The first click can never hit a mine.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="minesweeper" playerScore={game.status === 'won' ? game.timer : undefined} />

        <HubCard as="section" className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_ORDER.map((difficultyKey) => {
                const difficulty = DIFFICULTIES[difficultyKey];
                const active = game.difficulty === difficultyKey;

                return (
                  <button
                    key={difficultyKey}
                    type="button"
                    onClick={() => startGame(difficultyKey)}
                    className={`rounded-full border px-4 py-2 text-left transition-all ${
                      active
                        ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060] shadow-[0_0_24px_rgba(212,175,55,0.14)]'
                        : 'border-[#1a1a2e] bg-black/30 text-[#8a8a9a] hover:border-[#d4af37]/25 hover:text-white'
                    }`}
                  >
                    <span className="block font-mono text-[10px] uppercase tracking-[0.22em]">{difficulty.label}</span>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-inherit">
                      {difficulty.cols}x{difficulty.rows} · {difficulty.mines} mines
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a9a]">Timer</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{game.timer}</div>
              </div>

              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a9a]">Mines</div>
                <div className={`mt-1 text-2xl font-black ${minesLeft < 0 ? 'text-red-400' : 'text-[#f5d060]'}`}>{minesLeft}</div>
              </div>

              <button
                type="button"
                aria-label="Reset game"
                onClick={() => startGame(game.difficulty)}
                className={`grid h-14 w-14 place-items-center rounded-2xl border text-3xl transition-all ${
                  game.status === 'lost'
                    ? 'border-red-500/40 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.12)]'
                    : game.status === 'won'
                      ? 'border-[#30d158]/35 bg-[#30d158]/10 shadow-[0_0_18px_rgba(48,209,88,0.12)]'
                      : 'border-[#d4af37]/30 bg-[#d4af37]/10 shadow-[0_0_18px_rgba(212,175,55,0.12)]'
                }`}
              >
                {FACE_EMOJI[game.status]}
              </button>

              <button
                type="button"
                onClick={() => startGame(game.difficulty)}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                New Game
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a2e] pt-4">
            <div className="text-sm text-[#8a8a9a]">Left click to reveal. Right click or F to flag.</div>
            <div className="text-sm font-semibold text-[#f5d060]">{STATUS_LABELS[game.status]}</div>
          </div>
        </HubCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <HubCard as="section" className="p-3 sm:p-4">
            <div className="overflow-auto rounded-[1.35rem] border border-[#1a1a2e] bg-black/30 p-2">
              <div
                className="grid w-fit gap-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${config.cols}, ${config.cellSize}px)`,
                }}
              >
                {game.board.map((cell, index) => {
                  const exploded = game.status === 'lost' && game.explodedIndex === index;
                  const revealedMine = cell.revealed && cell.mine;
                  const hidden = !cell.revealed;
                  const content = getCellContent(cell, index, game);
                  const ariaLabel = getCellAriaLabel(cell, index, game);
                  const numberClass = cell.adjacent > 0 && !cell.mine ? NUMBER_CLASSES[cell.adjacent] ?? 'text-white' : '';
                  const mineTextClass = game.status === 'won' ? 'text-[#f5d060]' : 'text-[#fecaca]';

                  const cellClasses = hidden
                    ? cell.flagged
                      ? 'border-t-[#2a2a4a] border-l-[#2a2a4a] border-r-[#09090f] border-b-[#09090f] bg-[#1a1a2e] text-[#f5d060] shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),inset_-1px_-1px_0_rgba(0,0,0,0.72)] hover:border-[#d4af37]/40'
                      : 'border-t-[#2a2a4a] border-l-[#2a2a4a] border-r-[#09090f] border-b-[#09090f] bg-[#1a1a2e] shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),inset_-1px_-1px_0_rgba(0,0,0,0.72)] hover:-translate-y-[1px] hover:border-[#d4af37]/40'
                    : exploded
                      ? 'border-[#fb7185]/60 bg-[#4c1111] text-[#fecaca] shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_0_24px_rgba(239,68,68,0.18)]'
                      : revealedMine
                        ? 'border-[#d4af37]/30 bg-[#16130b] text-[#f5d060]'
                        : 'border-[#1a1a2e] bg-[#0d0d12]';

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={game.status === 'won' || game.status === 'lost'}
                      aria-label={ariaLabel}
                      title={ariaLabel}
                      onClick={() => handleReveal(index)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        handleFlag(index);
                      }}
                      onKeyDown={(event) => {
                        if (event.key.toLowerCase() === 'f') {
                          event.preventDefault();
                          handleFlag(index);
                        }
                      }}
                      className={`flex items-center justify-center rounded-[0.28rem] border text-center font-black text-[0.72rem] transition-all duration-150 select-none ${
                        game.status === 'won' || game.status === 'lost' ? 'cursor-default' : 'cursor-pointer'
                      } ${cellClasses}`}
                      style={{
                        width: `${config.cellSize}px`,
                        height: `${config.cellSize}px`,
                      }}
                    >
                      <span
                        className={`leading-none ${
                          cell.flagged && !cell.revealed
                            ? 'text-[#f5d060]'
                            : cell.mine && cell.revealed
                              ? mineTextClass
                              : numberClass
                        }`}
                        style={{
                          fontSize: `${Math.max(12, Math.round(config.cellSize * 0.46))}px`,
                        }}
                      >
                        {content}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </HubCard>

          <div className="space-y-4">
            <HubCard as="aside" className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Live stats</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Safe cleared</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {revealedSafeCells}/{safeCells}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#d4af37_0%,#f0d79e_52%,#30d158_100%)] transition-[width] duration-300"
                      style={{ width: `${safeProgress}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Mines left</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{minesLeft}</div>
                </div>

                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Timer</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{game.timer}s</div>
                </div>

                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Status</div>
                  <div className="mt-2 text-lg font-black text-white">{STATUS_LABELS[game.status]}</div>
                </div>
              </div>
            </HubCard>

            <HubCard as="aside" className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">How to play</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#8a8a9a]">
                <p>Open one safe cell first. Mines are placed only after that click, so the first reveal is always safe.</p>
                <p>
                  Right click, or press <code className="rounded bg-white/[0.04] px-1 py-0.5 font-mono text-[#f5d060]">F</code>{' '}
                  on a focused cell, to toggle a flag on hidden squares.
                </p>
                <p>
                  Number colors stay classic: 1 blue, 2 green, 3 red, 4 purple, 5 maroon, 6 cyan, 7 black, 8 gray.
                </p>
              </div>

              {game.status === 'won' ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setChallengeOpen(true)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                  >
                    Challenge a Friend
                  </button>
                </div>
              ) : null}
            </HubCard>
          </div>
        </div>
      </div>

      <ChallengeModal
        gameType="minesweeper"
        playerScore={game.timer}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </section>
  );
}
