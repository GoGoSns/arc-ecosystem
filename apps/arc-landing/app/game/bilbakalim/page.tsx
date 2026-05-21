'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type GamePhase = 'menu' | 'playing' | 'result';

type WordEntry = {
  word: string;
  cat: string;
};

type ResultState = {
  won: boolean;
  word: string;
  score: number;
} | null;

type FlashState = {
  letter: string;
  kind: 'correct' | 'wrong';
} | null;

const WORDS: WordEntry[] = [
  { word: 'BLOCKCHAIN', cat: 'Technology' },
  { word: 'VALIDATOR', cat: 'Arc Network' },
  { word: 'STAKING', cat: 'DeFi' },
  { word: 'WALLET', cat: 'Crypto' },
  { word: 'ETHEREUM', cat: 'Blockchain' },
  { word: 'BITCOIN', cat: 'Crypto' },
  { word: 'DEFI', cat: 'DeFi' },
  { word: 'TOKEN', cat: 'Crypto' },
  { word: 'MINING', cat: 'Blockchain' },
  { word: 'BRIDGE', cat: 'DeFi' },
  { word: 'ORACLE', cat: 'DeFi' },
  { word: 'LEDGER', cat: 'Crypto' },
  { word: 'CONSENSUS', cat: 'Blockchain' },
  { word: 'METAMASK', cat: 'Wallet' },
  { word: 'SOLIDITY', cat: 'Development' },
  { word: 'POLYGON', cat: 'Blockchain' },
  { word: 'ARBITRUM', cat: 'Blockchain' },
  { word: 'USDC', cat: 'Stablecoin' },
  { word: 'AIRDROP', cat: 'Crypto' },
  { word: 'MAINNET', cat: 'Network' },
  { word: 'TESTNET', cat: 'Network' },
  { word: 'GASLESS', cat: 'Arc Network' },
  { word: 'ESCROW', cat: 'DeFi' },
  { word: 'PAYROLL', cat: 'Arc Pay' },
  { word: 'LAUNCHPAD', cat: 'Arc Play' },
  { word: 'BOUNTY', cat: 'Arc Creator' },
  { word: 'RAFFLE', cat: 'Arc Play' },
  { word: 'FAUCET', cat: 'Testnet' },
  { word: 'LIQUIDITY', cat: 'DeFi' },
  { word: 'GOVERNANCE', cat: 'DAO' },
];

const LETTER_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z'],
] as const;

function pickRandomWord(): WordEntry {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function buildRevealedWord(word: string, guessedLetters: string[]): string {
  return word
    .split('')
    .map((letter) => (guessedLetters.includes(letter) ? letter : '_'))
    .join(' ');
}

function buildScore(word: string, wrongGuesses: number): number {
  return Math.max(0, (6 - wrongGuesses) * 10 + word.length * 5);
}

function isWordSolved(word: string, guessedLetters: string[]): boolean {
  return Array.from(new Set(word.split(''))).every((letter) => guessedLetters.includes(letter));
}

function HangmanArt({ wrongGuesses }: { wrongGuesses: number }) {
  return (
    <svg viewBox="0 0 120 160" className="h-full w-full">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 146h84" stroke="rgba(255,255,255,0.16)" strokeWidth="4" />
        <path d="M34 146V18h40" stroke="rgba(255,255,255,0.16)" strokeWidth="4" />
        <path d="M74 18v12" stroke="rgba(255,255,255,0.16)" strokeWidth="4" />
        <circle
          cx="74"
          cy="42"
          r="12"
          stroke={wrongGuesses >= 1 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
          fill={wrongGuesses >= 1 ? 'rgba(245,208,96,0.08)' : 'none'}
        />
        <line
          x1="74"
          y1="54"
          x2="74"
          y2="88"
          stroke={wrongGuesses >= 2 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
        />
        <line
          x1="74"
          y1="60"
          x2="56"
          y2="76"
          stroke={wrongGuesses >= 3 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
        />
        <line
          x1="74"
          y1="60"
          x2="92"
          y2="76"
          stroke={wrongGuesses >= 4 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
        />
        <line
          x1="74"
          y1="88"
          x2="58"
          y2="112"
          stroke={wrongGuesses >= 5 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
        />
        <line
          x1="74"
          y1="88"
          x2="90"
          y2="112"
          stroke={wrongGuesses >= 6 ? '#f5d060' : 'rgba(255,255,255,0.18)'}
          strokeWidth="4"
        />
      </g>
    </svg>
  );
}

export default function BilBakalimPage() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [activeWord, setActiveWord] = useState<WordEntry>(() => pickRandomWord());
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [result, setResult] = useState<ResultState>(null);
  const [flash, setFlash] = useState<FlashState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);

  const resetGameState = () => {
    setActiveWord(pickRandomWord());
    setGuessedLetters([]);
    setWrongLetters([]);
    setWrongGuesses(0);
    setResult(null);
    setFlash(null);
    setChallengeOpen(false);
  };

  const startGame = () => {
    resetGameState();
    setPhase('playing');
  };

  const finishGame = (won: boolean, nextWrongGuesses: number) => {
    const score = buildScore(activeWord.word, nextWrongGuesses);

    if (won) {
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      setBestStreak((previous) => Math.max(previous, nextStreak));
    } else {
      setCurrentStreak(0);
    }

    setResult({
      won,
      word: activeWord.word,
      score,
    });
    setPhase('result');
  };

  const handleLetterGuess = (letter: string) => {
    const upper = letter.toUpperCase();

    if (phase !== 'playing' || guessedLetters.includes(upper)) {
      return;
    }

    const nextGuessedLetters = [...guessedLetters, upper];
    const isCorrect = activeWord.word.includes(upper);

    setGuessedLetters(nextGuessedLetters);
    setFlash({ letter: upper, kind: isCorrect ? 'correct' : 'wrong' });

    if (isCorrect) {
      if (isWordSolved(activeWord.word, nextGuessedLetters)) {
        finishGame(true, wrongGuesses);
      }
      return;
    }

    const nextWrongGuesses = wrongGuesses + 1;
    const nextWrongLetters = [...wrongLetters, upper];
    setWrongLetters(nextWrongLetters);
    setWrongGuesses(nextWrongGuesses);

    if (nextWrongGuesses >= 6) {
      finishGame(false, nextWrongGuesses);
    }
  };

  const revealedWord = buildRevealedWord(activeWord.word, guessedLetters);
  const score = phase === 'result' && result ? result.score : 0;
  const livesLeft = phase === 'playing' ? Math.max(6 - wrongGuesses, 0) : 6;
  const winDisplay = phase === 'result' && result?.won;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Word Guess</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a9a]">Hangman Word Guess</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">30 words</HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Word Guess</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              Guess the hidden Web3 word, keep your streak alive, and beat the hangman before all six lives are gone.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="bilbakalim" playerScore={phase === 'result' && result ? result.score : undefined} />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={`${
                  phase === 'result'
                    ? result?.won
                      ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      : 'border-red-500/30 bg-red-500/10 text-red-200'
                    : phase === 'playing'
                      ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-white/[0.02] text-[#8a8a9a]'
                }`}
              >
                {phase === 'menu' ? 'Ready to Play' : phase === 'playing' ? 'Guessing' : 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {phase === 'menu'
                  ? 'Guess the hidden word.'
                  : phase === 'playing'
                    ? 'Unlock the word.'
                    : winDisplay
                      ? `Correct! The word was ${result?.word}`
                      : `The word was ${result?.word}`}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {phase === 'menu'
                  ? 'Every round picks a new Arc-friendly word. Correct letters reveal the full word and wrong guesses cost a life.'
                  : phase === 'playing'
                    ? `Category hint: ${activeWord.cat}. Keep going until the full word is revealed.`
                    : winDisplay
                      ? `You cracked it. Score ${score} and keep the streak moving.`
                      : `Out of lives. Score ${score} and try a fresh word.`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Streak</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{bestStreak}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives</div>
                <div className="mt-1 text-lg font-black text-[#30d158]">
                  {'❤️'.repeat(livesLeft)}
                  {phase === 'playing' ? <span className="text-[#333]">{'❤️'.repeat(wrongGuesses)}</span> : null}
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-white">{score}</div>
              </div>
            </div>
          </div>

          {phase === 'menu' ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Streak</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{bestStreak}</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">Highest win run in this session.</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Word Pool</div>
                  <div className="mt-2 text-2xl font-black text-white">{WORDS.length}</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">Thirty Arc and Web3 words to guess.</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">6</div>
                  <div className="mt-2 text-sm text-[#8a8a8a]">Six misses ends the round.</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Start Game
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                  Guess letters, not the whole word at once.
                </span>
              </div>
            </div>
          ) : null}

          {phase === 'playing' ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Hidden Word</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-2xl font-black tracking-[0.24em] text-white sm:text-3xl">
                        {activeWord.word.split('').map((letter, index) => (
                          <span
                            key={`${letter}-${index}`}
                            className={`min-w-11 rounded-2xl border px-3 py-3 text-center transition-all sm:min-w-14 sm:px-4 ${
                              guessedLetters.includes(letter)
                                ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#b9f6cd]'
                                : 'border-[#1a1a2e] bg-black/25 text-[#5d5d6f]'
                            } ${
                              flash?.letter === letter && flash.kind === 'correct'
                                ? '[animation:bilbakalim-flash_550ms_ease-out]'
                                : ''
                            }`}
                          >
                            {guessedLetters.includes(letter) ? letter : '_'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Category</div>
                      <div className="mt-1 text-lg font-black text-[#f5d060]">{activeWord.cat}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startGame()}
                      className="rounded-full border border-[#1a1a2e] bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    >
                      New Word
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#8a8a8a]">
                      {revealedWord}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Keyboard</p>
                      <h3 className="mt-2 text-xl font-black uppercase text-white">Pick a letter</h3>
                    </div>
                    <div className="rounded-full border border-[#1a1a2e] bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                      Wrong: {wrongLetters.length}/6
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {LETTER_ROWS.map((row, rowIndex) => (
                      <div key={`row-${rowIndex}`} className="grid grid-cols-7 gap-2">
                        {row.map((letter) => {
                          const wasCorrect = guessedLetters.includes(letter) && activeWord.word.includes(letter);
                          const wasWrong = wrongLetters.includes(letter);
                          const selected = wasCorrect || wasWrong;

                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={selected}
                              onClick={() => handleLetterGuess(letter)}
                              className={`min-h-12 rounded-2xl border text-sm font-black uppercase tracking-[0.2em] transition-all sm:min-h-14 ${
                                selected
                                  ? wasCorrect
                                    ? `border-[#30d158]/45 bg-[#30d158]/15 text-[#b9f6cd] shadow-[0_0_24px_rgba(48,209,88,0.14)] ${
                                        flash?.letter === letter && flash.kind === 'correct'
                                          ? '[animation:bilbakalim-flash_550ms_ease-out]'
                                          : ''
                                      }`
                                    : 'border-[#2a2a3d] bg-white/[0.02] text-[#7c7c8d]'
                                  : 'border-[#d4af37]/25 bg-white/[0.02] text-[#f5f5f5] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 hover:shadow-[0_0_24px_rgba(212,175,55,0.14)]'
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Wrong guesses</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#f5d060]">
                      {wrongLetters.length > 0 ? wrongLetters.map((letter) => <span key={letter} className="rounded-full border border-[#1a1a2e] bg-white/[0.03] px-3 py-1">{letter}</span>) : (
                        <span className="text-[#5d5d6f]">None yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Hangman</p>
                      <h3 className="mt-2 text-xl font-black uppercase text-white">Six misses max</h3>
                    </div>
                    <div className="rounded-full border border-[#1a1a2e] bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                      {6 - wrongGuesses} left
                    </div>
                  </div>
                  <div className="mt-4 aspect-[3/4] rounded-[1.4rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,rgba(212,175,55,0.07),rgba(255,255,255,0.02))] p-3">
                    <HangmanArt wrongGuesses={wrongGuesses} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Word Length</div>
                    <div className="mt-2 text-2xl font-black text-white">{activeWord.word.length}</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Category Hint</div>
                    <div className="mt-2 text-lg font-black text-[#f5d060]">{activeWord.cat}</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Current Streak</div>
                    <div className="mt-2 text-2xl font-black text-[#30d158]">{currentStreak}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {phase === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Final Score</div>
                  <div className="mt-2 text-2xl font-black text-white">{result.score}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Streak</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{bestStreak}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives Lost</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{wrongGuesses}</div>
                </div>
              </div>

              <div
                className={`rounded-[1.6rem] border p-6 sm:p-8 ${
                  result.won
                    ? 'border-[#30d158]/30 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))]'
                    : 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        result.won
                          ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                          : 'border-red-500/30 bg-red-500/10 text-red-200'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3 className={`mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl ${result.won ? 'text-[#a6f4bf]' : 'text-white'}`}>
                      {result.won ? `Correct! The word was ${result.word}` : `The word was ${result.word}`}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                      {result.won
                        ? `You solved it in this round and scored ${result.score} points.`
                        : `You ran out of lives. Score ${result.score} still goes on the board.`}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.score}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startGame}
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
                    onClick={() => {
                      resetGameState();
                      setPhase('menu');
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Back to Menu
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
        gameType="bilbakalim"
        playerScore={result?.score ?? 0}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />

      <style jsx global>{`
        @keyframes bilbakalim-flash {
          0% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }

          35% {
            transform: translateY(-2px) scale(1.04);
            box-shadow: 0 0 30px rgba(48, 209, 88, 0.16);
          }

          100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
