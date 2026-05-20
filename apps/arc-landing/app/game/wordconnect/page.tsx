'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type GamePhase = 'menu' | 'playing' | 'result';
type Direction = 'across' | 'down';

type Tile = {
  id: number;
  letter: string;
};

type Placement = {
  word: string;
  row: number;
  col: number;
  direction: Direction;
};

type GridCell = {
  row: number;
  col: number;
  letter: string;
  words: string[];
};

type Level = {
  letters: string;
  words: string[];
  placements: Placement[];
  grid: GridCell[];
  rows: number;
  cols: number;
};

type ResultState = {
  score: number;
  timeBonus: number;
  elapsedSeconds: number;
  wordsFound: number;
  totalWords: number;
} | null;

const LEVEL_ROWS = Array.from({ length: 10 }, (_, index) => index + 1);

function shuffleArray<T>(values: T[]): T[] {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function createTiles(letters: string): Tile[] {
  return letters.split('').map((letter, index) => ({ id: index, letter }));
}

function buildLevel(letters: string, words: string[], placements: Placement[]): Level {
  const cellMap = new Map<string, GridCell>();
  let maxRow = 0;
  let maxCol = 0;

  placements.forEach(({ word, row, col, direction }) => {
    word.split('').forEach((letter, index) => {
      const cellRow = row + (direction === 'down' ? index : 0);
      const cellCol = col + (direction === 'across' ? index : 0);
      const key = `${cellRow}:${cellCol}`;
      const existing = cellMap.get(key);

      if (existing) {
        existing.words = Array.from(new Set([...existing.words, word]));
      } else {
        cellMap.set(key, {
          row: cellRow,
          col: cellCol,
          letter,
          words: [word],
        });
      }

      maxRow = Math.max(maxRow, cellRow);
      maxCol = Math.max(maxCol, cellCol);
    });
  });

  return {
    letters,
    words,
    placements,
    grid: Array.from(cellMap.values()).sort((left, right) => left.row - right.row || left.col - right.col),
    rows: maxRow + 1,
    cols: maxCol + 1,
  };
}

const LEVELS: Level[] = [
  buildLevel('ARC', ['ARC', 'CAR'], [
    { word: 'ARC', row: 0, col: 0, direction: 'across' },
    { word: 'CAR', row: 0, col: 4, direction: 'down' },
  ]),
  buildLevel('DEFI', ['DEF', 'FED', 'DIE', 'FIE'], [
    { word: 'DEF', row: 0, col: 0, direction: 'across' },
    { word: 'FED', row: 0, col: 5, direction: 'down' },
    { word: 'DIE', row: 3, col: 0, direction: 'across' },
    { word: 'FIE', row: 3, col: 5, direction: 'down' },
  ]),
  buildLevel('TOKEN', ['TOKEN', 'TONE', 'NOTE', 'KNOT'], [
    { word: 'TOKEN', row: 0, col: 0, direction: 'across' },
    { word: 'TONE', row: 0, col: 6, direction: 'down' },
    { word: 'NOTE', row: 3, col: 0, direction: 'across' },
    { word: 'KNOT', row: 3, col: 6, direction: 'down' },
  ]),
  buildLevel('STAKE', ['STAKE', 'STEAK', 'TAKE', 'SAKE', 'ATE'], [
    { word: 'STAKE', row: 0, col: 0, direction: 'across' },
    { word: 'STEAK', row: 0, col: 7, direction: 'down' },
    { word: 'TAKE', row: 3, col: 0, direction: 'across' },
    { word: 'SAKE', row: 3, col: 7, direction: 'down' },
    { word: 'ATE', row: 6, col: 1, direction: 'across' },
  ]),
  buildLevel('CHAIN', ['CHAIN', 'CHIN', 'INCH', 'CAN'], [
    { word: 'CHAIN', row: 0, col: 0, direction: 'across' },
    { word: 'CHIN', row: 0, col: 6, direction: 'down' },
    { word: 'INCH', row: 3, col: 0, direction: 'across' },
    { word: 'CAN', row: 3, col: 6, direction: 'down' },
  ]),
  buildLevel('BLOCK', ['BLOCK', 'LOCK', 'BOLD', 'COLD'], [
    { word: 'BLOCK', row: 0, col: 0, direction: 'across' },
    { word: 'LOCK', row: 0, col: 6, direction: 'down' },
    { word: 'BOLD', row: 3, col: 0, direction: 'across' },
    { word: 'COLD', row: 3, col: 6, direction: 'down' },
  ]),
  buildLevel('BRIDGE', ['BRIDGE', 'RIDE', 'BIRD', 'GRID'], [
    { word: 'BRIDGE', row: 0, col: 0, direction: 'across' },
    { word: 'RIDE', row: 0, col: 7, direction: 'down' },
    { word: 'BIRD', row: 3, col: 0, direction: 'across' },
    { word: 'GRID', row: 3, col: 7, direction: 'down' },
  ]),
  buildLevel('MINING', ['MINING', 'MINI', 'MIND', 'GRIM'], [
    { word: 'MINING', row: 0, col: 0, direction: 'across' },
    { word: 'MINI', row: 0, col: 8, direction: 'down' },
    { word: 'MIND', row: 3, col: 0, direction: 'across' },
    { word: 'GRIM', row: 3, col: 8, direction: 'down' },
  ]),
  buildLevel('WALLET', ['WALLET', 'WALL', 'TALL', 'TELL', 'LATE'], [
    { word: 'WALLET', row: 0, col: 0, direction: 'across' },
    { word: 'WALL', row: 0, col: 8, direction: 'down' },
    { word: 'TALL', row: 3, col: 0, direction: 'across' },
    { word: 'TELL', row: 3, col: 8, direction: 'down' },
    { word: 'LATE', row: 6, col: 2, direction: 'across' },
  ]),
  buildLevel('CRYPTO', ['CRYPTO', 'COPY', 'CROP', 'TROY', 'PORT'], [
    { word: 'CRYPTO', row: 0, col: 0, direction: 'across' },
    { word: 'COPY', row: 0, col: 8, direction: 'down' },
    { word: 'CROP', row: 3, col: 0, direction: 'across' },
    { word: 'TROY', row: 3, col: 8, direction: 'down' },
    { word: 'PORT', row: 6, col: 2, direction: 'across' },
  ]),
];

function createInitialTiles(levelIndex: number): Tile[] {
  return shuffleArray(createTiles(LEVELS[levelIndex].letters));
}

function shouldAutoSubmit(candidate: string, level: Level, foundWords: string[]): boolean {
  if (!level.words.includes(candidate) || foundWords.includes(candidate)) {
    return false;
  }

  return !level.words.some((word) => !foundWords.includes(word) && word !== candidate && word.startsWith(candidate));
}

function getTileMap(tiles: Tile[]): Map<number, string> {
  return new Map(tiles.map((tile) => [tile.id, tile.letter]));
}

function buildCandidate(selectedTileIds: number[], tileMap: Map<number, string>): string {
  return selectedTileIds.map((id) => tileMap.get(id) ?? '').join('');
}

function getTimeBonus(elapsedSeconds: number): number {
  return Math.max(0, 120 - elapsedSeconds * 4);
}

export default function WordConnectPage() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileIds, setSelectedTileIds] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [flashWord, setFlashWord] = useState<string | null>(null);
  const [message, setMessage] = useState('Choose a level and start the board.');
  const [result, setResult] = useState<ResultState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);

  const currentLevel = LEVELS[selectedLevel];
  const tileMap = getTileMap(tiles);
  const currentCandidate = buildCandidate(selectedTileIds, tileMap);
  const foundWordSet = new Set(foundWords);
  const wordsLeft = currentLevel.words.length - foundWords.length;
  const scoreSoFar = foundWords.length * 10;

  const resetBoardState = () => {
    setTiles([]);
    setSelectedTileIds([]);
    setFoundWords([]);
    setFlashWord(null);
    setResult(null);
    setChallengeOpen(false);
    setStartedAt(0);
    setMessage('Choose a level and start the board.');
  };

  const startLevel = (levelIndex = selectedLevel) => {
    const nextLevel = LEVELS[levelIndex];

    setSelectedLevel(levelIndex);
    setTiles(createInitialTiles(levelIndex));
    setSelectedTileIds([]);
    setFoundWords([]);
    setFlashWord(null);
    setResult(null);
    setChallengeOpen(false);
    setStartedAt(Date.now());
    setMessage(`Find ${nextLevel.words.length} words from the ${nextLevel.letters} tile set.`);
    setPhase('playing');
  };

  const backToMenu = () => {
    resetBoardState();
    setPhase('menu');
  };

  const finishLevel = (words: string[]) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const timeBonus = getTimeBonus(elapsedSeconds);
    const score = words.length * 10 + timeBonus;

    setResult({
      score,
      timeBonus,
      elapsedSeconds,
      wordsFound: words.length,
      totalWords: currentLevel.words.length,
    });
    setPhase('result');
    setMessage('');
    setSelectedTileIds([]);
  };

  const completeWord = (candidate: string) => {
    const normalized = candidate.toUpperCase();

    if (!currentLevel.words.includes(normalized)) {
      setMessage('That word is not on this level.');
      return;
    }

    if (foundWords.includes(normalized)) {
      setMessage(`${normalized} is already found.`);
      return;
    }

    const nextFoundWords = [...foundWords, normalized];
    setFoundWords(nextFoundWords);
    setSelectedTileIds([]);
    setFlashWord(normalized);
    setMessage(`Found ${normalized}!`);

    if (nextFoundWords.length === currentLevel.words.length) {
      finishLevel(nextFoundWords);
    }
  };

  const handleTileClick = (tileId: number) => {
    if (phase !== 'playing' || selectedTileIds.includes(tileId)) {
      return;
    }

    const nextSelectedIds = [...selectedTileIds, tileId];
    const candidate = buildCandidate(nextSelectedIds, tileMap).toUpperCase();

    if (candidate.length > 0 && shouldAutoSubmit(candidate, currentLevel, foundWords)) {
      completeWord(candidate);
      return;
    }

    setSelectedTileIds(nextSelectedIds);

    if (currentLevel.words.includes(candidate)) {
      setMessage(`"${candidate}" is valid. Press Submit to lock it in.`);
    } else {
      setMessage(`Building: ${candidate}`);
    }
  };

  const handleSubmit = () => {
    if (phase !== 'playing' || selectedTileIds.length === 0) {
      return;
    }

    const candidate = buildCandidate(selectedTileIds, tileMap).toUpperCase();
    completeWord(candidate);
  };

  const handleClear = () => {
    if (phase !== 'playing') {
      return;
    }

    setSelectedTileIds([]);
    setMessage('Selection cleared.');
  };

  const handleShuffle = () => {
    if (phase !== 'playing') {
      return;
    }

    setTiles((previous) => shuffleArray(previous));
    setSelectedTileIds([]);
    setMessage('Letters shuffled.');
  };

  const resultScore = result?.score ?? 0;
  const completed = phase === 'result' && result !== null;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Word Connect</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Letter Puzzle</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">{LEVELS.length} levels</HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Word Connect</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Scramble the letters, build each hidden word, and clear the board before the timer bonus slips away.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="wordconnect" playerScore={completed ? resultScore : undefined} />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  phase === 'result'
                    ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                    : phase === 'playing'
                      ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]'
                }
              >
                {phase === 'menu' ? 'Choose a level' : phase === 'playing' ? `Level ${selectedLevel + 1}` : 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {phase === 'menu'
                  ? 'Scramble the board.'
                  : phase === 'playing'
                    ? `Find ${wordsLeft} more words.`
                    : `Level ${selectedLevel + 1} cleared!`}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {phase === 'menu'
                  ? 'Choose a level from 1 to 10, then connect letters in order to build every hidden word.'
                  : phase === 'playing'
                    ? message
                    : completed
                      ? `You found every word. Score ${resultScore} with a ${result?.timeBonus ?? 0} time bonus.`
                      : 'The puzzle is complete.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Words Left</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{phase === 'playing' ? wordsLeft : currentLevel.words.length}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-white">{phase === 'result' ? resultScore : scoreSoFar}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{selectedLevel + 1}/10</div>
              </div>
            </div>
          </div>

          {phase === 'menu' ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level</div>
                  <div className="mt-2 text-2xl font-black text-white">{selectedLevel + 1}</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">Pick a difficulty from 1 to 10.</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Words</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{currentLevel.words.length}</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">Find every word on the grid.</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Letters</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{currentLevel.letters.length}</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">The circle uses the exact tile set.</div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Level Selector</p>
                    <h3 className="mt-2 text-xl font-black uppercase text-white">Choose your puzzle</h3>
                  </div>
                  <div className="rounded-full border border-[#1a1a2e] bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                    {currentLevel.words.length} words
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {LEVEL_ROWS.map((levelNumber) => {
                    const index = levelNumber - 1;
                    const active = selectedLevel === index;

                    return (
                      <button
                        key={levelNumber}
                        type="button"
                        onClick={() => setSelectedLevel(index)}
                        className={`rounded-2xl border px-0 py-3 text-sm font-black uppercase tracking-[0.18em] transition-all ${
                          active
                            ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060] shadow-[0_0_24px_rgba(212,175,55,0.14)]'
                            : 'border-[#1a1a2e] bg-black/30 text-[#8a8a8a] hover:border-[#d4af37]/25 hover:text-white'
                        }`}
                      >
                        {levelNumber}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startLevel(selectedLevel)}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Start
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                    Words can be horizontal or vertical.
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {phase === 'playing' ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Crossword Grid</p>
                      <h3 className="mt-2 text-xl font-black uppercase text-white">
                        {wordsLeft} word{wordsLeft === 1 ? '' : 's'} left
                      </h3>
                    </div>
                    <div className="rounded-full border border-[#1a1a2e] bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                      {currentLevel.placements.length} slots
                    </div>
                  </div>

                  <div className="mt-5 overflow-auto rounded-[1.4rem] border border-[#1a1a2e] bg-[#09090f] p-4">
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: currentLevel.rows * currentLevel.cols }, (_, index) => {
                        const row = Math.floor(index / currentLevel.cols);
                        const col = index % currentLevel.cols;
                        const cell = currentLevel.grid.find((gridCell) => gridCell.row === row && gridCell.col === col);
                        const isFound = cell ? cell.words.some((word) => foundWordSet.has(word)) : false;
                        const isFlash = cell ? cell.words.includes(flashWord ?? '') : false;

                        if (!cell) {
                          return (
                            <div
                              key={`${row}-${col}`}
                              className="aspect-square rounded-2xl border border-[#101018] bg-[#07070c]"
                            />
                          );
                        }

                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`aspect-square rounded-2xl border text-center text-lg font-black uppercase transition-all sm:text-xl ${
                              isFound
                                ? 'border-[#30d158]/40 bg-[#30d158]/10 text-[#c9fadb] shadow-[0_0_24px_rgba(48,209,88,0.12)]'
                                : 'border-[#1a1a2e] bg-white/[0.02] text-[#0f0f18]'
                            } ${isFlash ? '[animation:wordconnect-flash_650ms_ease-out]' : ''}`}
                          >
                            <div className="flex h-full items-center justify-center">{isFound ? cell.letter : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {currentLevel.words.map((word) => {
                      const found = foundWords.includes(word);

                      return (
                        <span
                          key={word}
                          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] ${
                            found
                              ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                              : 'border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]'
                          }`}
                        >
                          {found ? word : `${word.length} letters`}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Tile Circle</p>
                      <h3 className="mt-2 text-xl font-black uppercase text-white">
                        {currentCandidate.length > 0 ? currentCandidate : 'Tap letters to connect'}
                      </h3>
                    </div>
                    <div className="rounded-full border border-[#1a1a2e] bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                      {tiles.length} tiles
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-5">
                    <div className="relative flex aspect-square w-full max-w-[22rem] items-center justify-center rounded-full border border-[#1a1a2e] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),rgba(255,255,255,0.02)_40%,rgba(9,9,15,1)_72%)] p-5 sm:max-w-[26rem]">
                      <div className="absolute inset-0 rounded-full border border-dashed border-[#d4af37]/10" />
                      <div className="absolute inset-[16%] rounded-full border border-[#1a1a2e] bg-black/25" />

                      <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a]">Current</p>
                        <div className="max-w-[12rem] break-all text-2xl font-black uppercase tracking-[0.22em] text-white sm:text-3xl">
                          {currentCandidate || '—'}
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#8a8a8a]">
                          {phase === 'playing' ? message : 'Ready to start'}
                        </div>
                      </div>

                      {tiles.map((tile, index) => {
                        const angle = (Math.PI * 2 * index) / Math.max(tiles.length, 1) - Math.PI / 2;
                        const radius = tiles.length <= 4 ? 82 : tiles.length <= 6 ? 96 : 108;
                        const selected = selectedTileIds.includes(tile.id);

                        return (
                          <button
                            key={tile.id}
                            type="button"
                            disabled={phase !== 'playing' || selected}
                            onClick={() => handleTileClick(tile.id)}
                            className={`absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-lg font-black uppercase tracking-[0.18em] transition-all sm:h-14 sm:w-14 ${
                              selected
                                ? 'border-[#30d158]/40 bg-[#30d158]/15 text-[#c9fadb] shadow-[0_0_24px_rgba(48,209,88,0.14)]'
                                : 'border-[#d4af37]/30 bg-black/40 text-[#f5f5f5] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 hover:shadow-[0_0_24px_rgba(212,175,55,0.14)]'
                            }`}
                            style={{
                              transform: `translate(-50%, -50%) rotate(${angle}rad) translate(${radius}px) rotate(${-angle}rad)`,
                            }}
                          >
                            {tile.letter}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleShuffle}
                        className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                      >
                        Shuffle
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Level Stats</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Words</div>
                      <div className="mt-1 text-2xl font-black text-white">{currentLevel.words.length}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Letters</div>
                      <div className="mt-1 text-2xl font-black text-[#f5d060]">{currentLevel.letters.length}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Grid</div>
                      <div className="mt-1 text-2xl font-black text-[#30d158]">
                        {currentLevel.cols}x{currentLevel.rows}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Message</div>
                      <div className="mt-1 text-sm font-semibold leading-7 text-[#8a8a9a]">{message}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Found Words</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentLevel.words.map((word) => {
                      const found = foundWords.includes(word);

                      return (
                        <span
                          key={word}
                          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] ${
                            found
                              ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                              : 'border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {phase === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                  <div className="mt-2 text-2xl font-black text-white">{result.score}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Time Bonus</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">+{result.timeBonus}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Elapsed</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{result.elapsedSeconds}s</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Words</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {result.wordsFound}/{result.totalWords}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))] p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">Result</HubBadge>
                    <h3 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl text-white">
                      {completed ? 'Board cleared!' : 'Level complete!'}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                      You found every word on level {selectedLevel + 1}. Challenge a friend to beat your score.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Final Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.score}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startLevel(selectedLevel)}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Challenge a Friend
                  </button>
                  <button
                    type="button"
                    onClick={backToMenu}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Choose Level
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
        gameType="wordconnect"
        playerScore={resultScore}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />

      <style jsx global>{`
        @keyframes wordconnect-flash {
          0% {
            transform: scale(0.96);
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }

          35% {
            transform: scale(1.03);
            box-shadow: 0 0 28px rgba(48, 209, 88, 0.18);
          }

          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
