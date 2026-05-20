'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type QuizQuestion = {
  q: string;
  a: [string, string, string, string];
  c: number;
};

type QuizPhase = 'menu' | 'playing' | 'result';

type QuizFeedback = {
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  timedOut: boolean;
} | null;

type QuizState = {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  timeLeft: number;
  feedback: QuizFeedback;
};

type QuizStats = {
  bestScore: number;
  totalGames: number;
  loaded: boolean;
};

const STORAGE_KEY = 'arc-quiz-stats-v1';
const QUIZ_LENGTH = 5;
const ROUND_SECONDS = 10;

const QUESTIONS: QuizQuestion[] = [
  { q: 'What chain ID does Arc Testnet use?', a: ['1', '5042002', '137', '42161'], c: 1 },
  { q: 'What does USDC stand for?', a: ['US Dollar Coin', 'USD Coin', 'United States Digital Currency', 'Universal Stable Coin'], c: 1 },
  { q: 'What is a smart contract?', a: ['Legal document', 'Self-executing blockchain code', 'Wallet type', 'Mining tool'], c: 1 },
  { q: 'What does DeFi mean?', a: ['Decentralized Finance', 'Digital Finance', 'Defined Finance', 'Distributed Finance'], c: 0 },
  { q: 'What is gas in blockchain?', a: ['Fuel type', 'Transaction fee', 'Token name', 'Wallet address'], c: 1 },
  { q: 'What does NFT stand for?', a: ['New File Transfer', 'Non-Fungible Token', 'Network Fee Token', 'Next Finance Tech'], c: 1 },
  { q: 'What is MetaMask?', a: ['Social media', 'Crypto wallet extension', 'Exchange', 'Mining software'], c: 1 },
  { q: 'What is HODL?', a: ['A typo for HOLD', 'A token', 'A protocol', 'A wallet'], c: 0 },
  { q: 'What is a blockchain?', a: ['Database', 'Distributed ledger', 'Website', 'Programming language'], c: 1 },
  { q: 'What is Web3?', a: ['Browser', 'Decentralized internet', 'Social media', 'Cloud service'], c: 1 },
  { q: 'What is staking?', a: ['Cooking method', 'Locking tokens for rewards', 'Buying tokens', 'Selling tokens'], c: 1 },
  { q: 'What is a DEX?', a: ['Dinosaur', 'Decentralized Exchange', 'Digital Executor', 'Data Explorer'], c: 1 },
  { q: 'What is a DAO?', a: ['Decentralized Autonomous Organization', 'Digital Asset Owner', 'Data Access Object', 'Direct Action Order'], c: 0 },
  { q: 'What is a seed phrase?', a: ['Garden term', 'Wallet recovery words', 'Password', 'Username'], c: 1 },
  { q: 'What is a validator?', a: ['Password checker', 'Node verifying transactions', 'Token type', 'Wallet app'], c: 1 },
];

const CONFETTI_COLORS = ['#d4af37', '#f5d060', '#30d158', '#ffffff', '#f59e0b'];

const initialQuizState: QuizState = {
  phase: 'menu',
  questions: [],
  currentIndex: 0,
  score: 0,
  timeLeft: ROUND_SECONDS,
  feedback: null,
};

function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, index) => index);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  return indices;
}

function pickRandomQuestions(count: number): QuizQuestion[] {
  return shuffleIndices(QUESTIONS.length)
    .slice(0, count)
    .map((index) => QUESTIONS[index]);
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState<QuizState>(initialQuizState);
  const [stats, setStats] = useState<QuizStats>({ bestScore: 0, totalGames: 0, loaded: false });
  const [challengeOpen, setChallengeOpen] = useState(false);
  const advanceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStats((previous) => ({ ...previous, loaded: true }));
        return;
      }

      const parsed = JSON.parse(raw) as Partial<QuizStats>;
      setStats({
        bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
        totalGames: typeof parsed.totalGames === 'number' ? parsed.totalGames : 0,
        loaded: true,
      });
    } catch {
      setStats((previous) => ({ ...previous, loaded: true }));
    }
  }, []);

  useEffect(() => {
    if (!stats.loaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bestScore: stats.bestScore,
          totalGames: stats.totalGames,
        }),
      );
    } catch {
      // Ignore storage failures and keep the game playable.
    }
  }, [stats.bestScore, stats.totalGames, stats.loaded]);

  useEffect(() => {
    if (quiz.phase !== 'playing' || quiz.feedback !== null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setQuiz((previous) => {
        if (previous.phase !== 'playing' || previous.feedback !== null) {
          return previous;
        }

        return {
          ...previous,
          timeLeft: Math.max(previous.timeLeft - 1, 0),
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [quiz.phase, quiz.currentIndex, quiz.feedback]);

  useEffect(() => {
    if (quiz.phase === 'playing' && quiz.feedback === null && quiz.timeLeft === 0) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.phase, quiz.feedback, quiz.timeLeft]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const clearAdvanceTimeout = () => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  };

  const startQuiz = () => {
    clearAdvanceTimeout();
    setChallengeOpen(false);
    setQuiz({
      phase: 'playing',
      questions: pickRandomQuestions(QUIZ_LENGTH),
      currentIndex: 0,
      score: 0,
      timeLeft: ROUND_SECONDS,
      feedback: null,
    });
  };

  const scheduleAdvance = (isFinalQuestion: boolean, finalScore: number) => {
    clearAdvanceTimeout();

    advanceTimeoutRef.current = window.setTimeout(() => {
      if (isFinalQuestion) {
        setQuiz((previous) => ({
          ...previous,
          phase: 'result',
          feedback: null,
          timeLeft: 0,
        }));
        setStats((previous) => ({
          ...previous,
          bestScore: Math.max(previous.bestScore, finalScore),
          totalGames: previous.totalGames + 1,
        }));
      } else {
        setQuiz((previous) => ({
          ...previous,
          currentIndex: previous.currentIndex + 1,
          timeLeft: ROUND_SECONDS,
          feedback: null,
        }));
      }

      advanceTimeoutRef.current = null;
    }, 1500);
  };

  const handleAnswer = (choiceIndex: number) => {
    const currentQuestion = quiz.questions[quiz.currentIndex];
    if (!currentQuestion || quiz.phase !== 'playing' || quiz.feedback !== null) {
      return;
    }

    const isCorrect = choiceIndex === currentQuestion.c;
    const finalScore = quiz.score + (isCorrect ? 1 : 0);
    const isFinalQuestion = quiz.currentIndex + 1 >= quiz.questions.length;

    setQuiz((previous) => {
      if (previous.phase !== 'playing' || previous.feedback !== null) {
        return previous;
      }

      return {
        ...previous,
        score: finalScore,
        feedback: {
          selectedIndex: choiceIndex,
          correctIndex: currentQuestion.c,
          isCorrect,
          timedOut: false,
        },
      };
    });

    scheduleAdvance(isFinalQuestion, finalScore);
  };

  function handleTimeout() {
    const currentQuestion = quiz.questions[quiz.currentIndex];
    if (!currentQuestion || quiz.phase !== 'playing' || quiz.feedback !== null) {
      return;
    }

    const finalScore = quiz.score;
    const isFinalQuestion = quiz.currentIndex + 1 >= quiz.questions.length;

    setQuiz((previous) => {
      if (previous.phase !== 'playing' || previous.feedback !== null) {
        return previous;
      }

      return {
        ...previous,
        feedback: {
          selectedIndex: null,
          correctIndex: currentQuestion.c,
          isCorrect: false,
          timedOut: true,
        },
      };
    });

    scheduleAdvance(isFinalQuestion, finalScore);
  }

  const currentQuestion = quiz.phase === 'playing' ? quiz.questions[quiz.currentIndex] ?? null : null;
  const totalQuestions = quiz.questions.length || QUIZ_LENGTH;
  const questionNumber = quiz.phase === 'playing' ? quiz.currentIndex + 1 : 0;
  const progressWidth = quiz.phase === 'playing' ? (questionNumber / totalQuestions) * 100 : 0;
  const isPerfectRun = quiz.phase === 'result' && quiz.questions.length === QUIZ_LENGTH && quiz.score === QUIZ_LENGTH;
  const resultHeading =
    quiz.score === 0
      ? 'Better luck next time!'
      : quiz.score === QUIZ_LENGTH
        ? 'PERFECT!'
        : `${quiz.score}/${QUIZ_LENGTH} Correct!`;
  const resultDescription =
    quiz.score === 0
      ? 'One more run and the streak is yours.'
      : quiz.score === QUIZ_LENGTH
        ? 'All five answers were locked in without a miss.'
        : 'A clean run. Hit play again to beat the score.';

  const quizQuestionCards = [
    {
      label: '5 Random Questions',
      value: '5',
      detail: 'Picked from a 15-question pool',
    },
    {
      label: 'Best Score',
      value: `${stats.bestScore}/${QUIZ_LENGTH}`,
      detail: 'Stored locally in the browser',
    },
    {
      label: 'Total Games Played',
      value: String(stats.totalGames),
      detail: 'Across this device and browser',
    },
  ];

  const confettiPieces = isPerfectRun
    ? Array.from({ length: 36 }, (_, index) => ({
        left: `${(index * 7) % 100}%`,
        top: `${(index * 5) % 30}%`,
        delay: `${(index % 12) * 0.08}s`,
        duration: `${2.2 + (index % 5) * 0.18}s`,
        size: `${6 + (index % 4)}px`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      }))
    : [];

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Arc Quiz</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Web3 + Crypto</HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Arc Quiz</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Test your Web3 &amp; Crypto knowledge in quick, punchy 5-question rounds.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="quiz" playerScore={quiz.phase === 'result' ? quiz.score : undefined} />

        <HubCard as="section" className="relative overflow-hidden p-5 sm:p-6 lg:p-8">
          {isPerfectRun ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confettiPieces.map((piece, index) => (
                <span
                  key={`${piece.left}-${index}`}
                  className="absolute rounded-sm opacity-0 [animation:quiz-confetti-fall_2.8s_linear_infinite]"
                  style={{
                    left: piece.left,
                    top: piece.top,
                    width: piece.size,
                    height: `calc(${piece.size} * 1.6)`,
                    backgroundColor: piece.color,
                    animationDelay: piece.delay,
                    animationDuration: piece.duration,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={`${
                  quiz.phase === 'result' && quiz.score === QUIZ_LENGTH
                    ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                }`}
              >
                {quiz.phase === 'menu' ? 'Ready to Play' : quiz.phase === 'playing' ? 'In Round' : 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {quiz.phase === 'menu' ? 'Start the quiz.' : quiz.phase === 'playing' ? 'Think fast.' : resultHeading}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {quiz.phase === 'menu'
                  ? 'Five random questions. One timer. Local stats stay on this device.'
                  : quiz.phase === 'playing'
                    ? 'Pick the right answer before the timer runs out. A lock-in always advances the round.'
                    : resultDescription}
              </p>
            </div>

            {quiz.phase === 'playing' ? (
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Question</div>
                  <div className="mt-1 text-2xl font-black text-white">
                    {questionNumber}/{totalQuestions}
                  </div>
                </div>
                <div
                  className={`rounded-2xl border px-4 py-3 text-right ${
                    quiz.timeLeft <= 3 ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-[#1a1a2e] bg-black/30 text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Timer</div>
                  <div className="mt-1 text-2xl font-black">{quiz.timeLeft}s</div>
                </div>
              </div>
            ) : null}
          </div>

          {quiz.phase === 'menu' ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {quizQuestionCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">{card.label}</div>
                    <div className="mt-2 text-2xl font-black text-white">{card.value}</div>
                    <div className="mt-2 text-sm text-[#8a8a8a]">{card.detail}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Start Quiz
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                  15 questions in the pool
                </span>
              </div>
            </div>
          ) : null}

          {quiz.phase === 'playing' && currentQuestion ? (
            <div className="mt-8">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                      Question {questionNumber}/{totalQuestions}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#d4af37_0%,#f0d79e_45%,#30d158_100%)] transition-[width] duration-300"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] ${
                      quiz.timeLeft <= 3
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]'
                    }`}
                  >
                    {quiz.timeLeft}s
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6 text-center">
                <h3 className="mx-auto max-w-4xl text-xl font-black uppercase leading-tight sm:text-2xl">
                  {currentQuestion.q}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currentQuestion.a.map((answer, index) => {
                    const feedback = quiz.feedback;
                    const isCorrect = feedback !== null && index === feedback.correctIndex;
                    const isWrong = feedback !== null && feedback.selectedIndex === index && !feedback.isCorrect;
                    const locked = feedback !== null;

                    const answerClass = locked
                      ? isCorrect
                        ? 'border-[#30d158]/45 bg-[#30d158]/15 text-[#b9f6cd] shadow-[0_0_24px_rgba(48,209,88,0.14)]'
                        : isWrong
                          ? 'border-red-500/45 bg-red-500/15 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.12)]'
                          : 'border-[#1a1a2e] bg-black/30 text-[#8a8a8a] opacity-80'
                      : 'border-[#d4af37]/25 bg-white/[0.02] text-[#f0f0f5] hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10 hover:shadow-[0_0_26px_rgba(212,175,55,0.16)]';

                    return (
                      <button
                        key={answer}
                        type="button"
                        disabled={locked}
                        onClick={() => handleAnswer(index)}
                        className={`relative min-h-16 rounded-2xl border px-4 py-4 text-left text-base font-semibold transition-all duration-200 ${
                          locked ? 'cursor-default' : 'cursor-pointer'
                        } ${answerClass}`}
                      >
                        {feedback !== null && feedback.isCorrect && index === feedback.correctIndex ? (
                          <span className="absolute right-3 top-3 rounded-full border border-[#30d158]/30 bg-[#30d158]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#a6f4bf] [animation:quiz-score-pop_900ms_ease-out_forwards]">
                            +1
                          </span>
                        ) : null}
                        <span className="block leading-7">{answer}</span>
                      </button>
                    );
                  })}
                </div>

                {quiz.feedback !== null ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      quiz.feedback.timedOut
                        ? 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]'
                        : quiz.feedback.isCorrect
                          ? 'border-[#30d158]/25 bg-[#30d158]/10 text-[#a6f4bf]'
                          : 'border-red-500/25 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {quiz.feedback.timedOut
                      ? 'Time is up. Moving to the next question.'
                      : quiz.feedback.isCorrect
                        ? 'Correct answer locked in. Nice hit.'
                        : 'That one missed. The correct answer is highlighted in green.'}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {quiz.phase === 'result' ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Correct</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {quiz.score}/{QUIZ_LENGTH}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Score</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{stats.bestScore}/{QUIZ_LENGTH}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Games</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{stats.totalGames}</div>
                </div>
              </div>

              <div className={`relative overflow-hidden rounded-[1.6rem] border p-6 sm:p-8 ${isPerfectRun ? 'border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))]' : 'border-[#1a1a2e] bg-black/30'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        isPerfectRun
                          ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                          : 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3
                      className={`mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl ${
                        quiz.score === QUIZ_LENGTH ? 'text-[#f5d060]' : 'text-white'
                      }`}
                    >
                      {resultHeading}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">{resultDescription}</p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">XP earned</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">+{quiz.score * 10}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Hit Rate</div>
                    <div className="mt-2 text-lg font-black text-white">{Math.round((quiz.score / QUIZ_LENGTH) * 100)}%</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Score</div>
                    <div className="mt-2 text-lg font-black text-[#f5d060]">
                      {stats.bestScore}/{QUIZ_LENGTH}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Total Games</div>
                    <div className="mt-2 text-lg font-black text-[#30d158]">{stats.totalGames}</div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Challenge a Friend
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

      <ChallengeModal gameType="quiz" playerScore={quiz.score} isOpen={challengeOpen} onClose={() => setChallengeOpen(false)} />

      <style jsx global>{`
        @keyframes quiz-score-pop {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.85);
          }

          20% {
            opacity: 1;
            transform: translateY(0) scale(1.05);
          }

          100% {
            opacity: 0;
            transform: translateY(-28px) scale(1);
          }
        }

        @keyframes quiz-confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(260px) rotate(540deg);
          }
        }
      `}</style>
    </section>
  );
}
