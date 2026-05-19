'use client';

import Link from 'next/link';
import { AlertTriangle, BadgeCheck, Check, Clock3, Coins, Copy, Link2, Sparkles, Trophy, Users, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import GameProgressPanel from '@/components/GameProgressPanel';
import { HubBadge, HubCard, HubEmptyState, HubSkeletonCard, hubInputClass, hubLabelClass } from '@/components/HubPrimitives';
import {
  buildQuizPrizeBreakdown,
  formatQuizAddressLabel,
  formatQuizAmount,
  formatQuizCountdownParts,
  formatQuizDate,
  formatQuizTimeLeft,
  resolveQuizPotStatus,
  sortQuizParticipants,
  useQuizPotStore,
  type QuizPot,
  type QuizSubmissionResult,
} from '@/lib/quizPotStore';
import { buildGameProgressSnapshot, useGameStore } from '@/lib/gameStore';
import { useWallet } from '@/contexts/WalletContext';
import { ShareButtons } from '@/components/ShareButtons';
import { GameToast } from '@/components/GameToast';
import { payToAdmin, payFromAdmin, USE_REAL_TRANSFERS, explorerUrl } from '@/lib/usdcTransfer';

const QUIZ_NAME_KEY = 'arclanding:quiz-pot-name';
const QUIZ_ADDRESS_KEY = 'arclanding:quiz-pot-address';
const EMPTY_ANSWERS: Record<string, number> = {};
const QUESTION_TIMER = 15;

function useHydratedNow() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return { hydrated, now } as const;
}

function makeDemoQuizAddress(): string {
  return `0xquiz${Math.random().toString(16).slice(2, 10).padEnd(8, '0')}`;
}

function useStoredQuizIdentity() {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Quiz Runner');
  const [address, setAddress] = useState('');

  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem(QUIZ_NAME_KEY)?.trim();
      const savedAddress = window.localStorage.getItem(QUIZ_ADDRESS_KEY)?.trim();

      if (savedName) {
        setName(savedName);
      }

      if (savedAddress) {
        setAddress(savedAddress);
      } else {
        const generated = makeDemoQuizAddress();
        setAddress(generated);
        window.localStorage.setItem(QUIZ_ADDRESS_KEY, generated);
      }
    } catch {
      setAddress(makeDemoQuizAddress());
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(QUIZ_NAME_KEY, name.trim() || 'Quiz Runner');
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [name, ready]);

  useEffect(() => {
    if (!ready || !address) {
      return;
    }

    try {
      window.localStorage.setItem(QUIZ_ADDRESS_KEY, address);
    } catch {
      // Ignore storage failures and keep in-memory state.
    }
  }, [address, ready]);

  return { ready, name, setName, address } as const;
}

function statusTone(status: ReturnType<typeof resolveQuizPotStatus>) {
  switch (status) {
    case 'live':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'ended':
      return 'border-[#777]/30 bg-white/[0.02] text-[#d8d8d8]';
    default:
      return 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]';
  }
}

function getCountdownText(pot: QuizPot, now: number) {
  const status = resolveQuizPotStatus(pot, now);

  if (status === 'live') {
    return {
      label: 'Ends in',
      value: formatQuizTimeLeft(Math.max(0, pot.endsAt - now)),
    };
  }

  if (status === 'open') {
    return {
      label: 'Starts in',
      value: formatQuizTimeLeft(Math.max(0, pot.startsAt - now)),
    };
  }

  return {
    label: 'Ended on',
    value: formatQuizDate(pot.endsAt),
  };
}

function CountdownTile({
  pot,
  now,
}: {
  pot: QuizPot;
  now: number;
}) {
  const status = resolveQuizPotStatus(pot, now);
  const countdown = getCountdownText(pot, now);

  if (status === 'ended') {
    return (
      <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">{countdown.label}</div>
        <div className="mt-3 text-2xl font-black text-white">{countdown.value}</div>
      </div>
    );
  }

  const parts = formatQuizCountdownParts(status === 'live' ? pot.endsAt - now : pot.startsAt - now);

  return (
    <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 p-5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">
        <Clock3 size={14} className="text-[#d4af37]" aria-hidden="true" />
        {countdown.label}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {parts.map((part) => (
          <div key={part.label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-2 py-3 text-center">
            <div className="text-lg font-black text-white">{part.value}</div>
            <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-[#555566]">{part.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardCard({
  pot,
  address,
}: {
  pot: QuizPot;
  address: string;
}) {
  const leaderboard = sortQuizParticipants(pot.participants);
  const normalizedAddress = address.trim().toLowerCase();
  const activeParticipantIndex = leaderboard.findIndex((participant) => participant.address.trim().toLowerCase() === normalizedAddress);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#555566]">Leaderboard</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Top scores</h2>
        </div>
        <Trophy className="text-[#d4af37]" size={22} aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.map((participant, index) => {
            const isSelf = participant.address.trim().toLowerCase() === normalizedAddress;
            return (
              <div
                key={participant.address}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3 ${
                  isSelf ? 'border-[#d4af37]/40 bg-[#d4af37]/10' : 'border-[#1a1a2e] bg-black/30'
                }`}
              >
                <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {participant.name}
                    {isSelf ? ' (you)' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#d4af37]">{participant.score}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">Pts</div>
                </div>
              </div>
            );
          })
        ) : (
          <HubEmptyState
            icon={Users}
            title="No participants yet"
            description="Join the pot and answer a few questions to populate the leaderboard."
          />
        )}
      </div>
    </HubCard>
  );
}

function PrizePanel({ pot, now }: { pot: QuizPot; now: number }) {
  const leaderboard = sortQuizParticipants(pot.participants);
  const resolvedStatus = resolveQuizPotStatus(pot, now);
  const breakdown = buildQuizPrizeBreakdown(pot, leaderboard);
  const isSplit = pot.distribution === 'top3-split';
  const winner = breakdown[0];
  const splitBreakdown = breakdown.slice(0, 3);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#555566]">Prize panel</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Payouts</h2>
        </div>
        <Coins className="text-[#d4af37]" size={22} aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <HubBadge className={resolvedStatus === 'ended' ? 'border-[#777]/30 bg-white/[0.02] text-[#d8d8d8]' : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]'}>
          {resolvedStatus === 'ended' ? 'Final payouts' : 'Projected payouts'}
        </HubBadge>
        <HubBadge>{isSplit ? '50 / 30 / 20 split' : 'Winner takes all'}</HubBadge>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.length > 0 ? (
          isSplit ? (
            splitBreakdown.map((entry) => (
              <div key={`${entry.place}-${entry.participant.address}`} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                      {entry.place === 1 ? '1st place' : `${entry.place} place`}
                    </div>
                    <div className="mt-2 truncate text-sm font-semibold text-white">{entry.participant.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#d4af37]">{formatQuizAmount(entry.amountUsd)}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">{entry.share}%</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212, 175, 55,0.16),rgba(255,255,255,0.02))] p-5 text-center">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#f0d79e] mb-2">Winner takes all</div>
              <div className="text-3xl font-black text-[#f0d79e]">{winner ? formatQuizAmount(winner.amountUsd) : '$0'}</div>
              <div className="mt-2 truncate text-sm font-semibold text-white">{winner?.participant.name ?? 'No winner yet'}</div>
            </div>
          )
        ) : (
          <HubEmptyState
            icon={Sparkles}
            title="Waiting for participants"
            description="The prize panel will populate once players join the pot."
          />
        )}
      </div>
    </HubCard>
  );
}

function QuizFlowCard({
  pot,
  now,
  address,
  onSubmit,
  result,
}: {
  pot: QuizPot;
  now: number;
  address: string;
  onSubmit: (questionId: string, answerIndex: number) => void;
  result: QuizSubmissionResult | null;
}) {
  const normalizedAddress = address.trim().toLowerCase();
  const participant = pot.participants.find((entry) => entry.address.trim().toLowerCase() === normalizedAddress);
  const answers = useQuizPotStore(
    (state) => state.answersByPot[pot.id]?.[address.trim().toLowerCase()] ?? EMPTY_ANSWERS,
  );
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = pot.questions[answeredCount];
  const currentScore = participant?.score ?? 0;
  const resolvedStatus = resolveQuizPotStatus(pot, now);
  const leaderboard = sortQuizParticipants(pot.participants);
  const rankEstimate = participant ? leaderboard.findIndex((entry) => entry.address.trim().toLowerCase() === normalizedAddress) + 1 : null;
  const isJoined = Boolean(participant);
  const isReady = resolvedStatus === 'live' && isJoined;
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (isReady && currentQuestion && !showFeedback) {
      setTimeLeft(QUESTION_TIMER);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isReady, answeredCount, showFeedback, currentQuestion]);

  const handleOptionClick = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || !currentQuestion) return;
    
    onSubmit(currentQuestion.id, selectedOption);
    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
    }, 3000);
  };

  if (resolvedStatus === 'ended') {
    return (
      <HubCard as="section" className="p-12 text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-[#d4af37]/10 rounded-full flex items-center justify-center border-2 border-[#d4af37]/30">
          <Trophy size={48} className="text-[#d4af37]" />
        </div>
        <h2 className="text-4xl font-black uppercase mb-4">Quiz Ended</h2>
        <p className="text-[#8a8a9a] mb-8 max-w-sm mx-auto">Check the final leaderboard and prize panel to see the winners.</p>
        <div className="flex justify-center gap-4">
          <div className="bg-black/30 border border-[#1a1a2e] rounded-2xl p-6 min-w-[140px]">
            <div className="text-[10px] font-mono text-[#555566] uppercase mb-2">Final Score</div>
            <div className="text-3xl font-black text-[#d4af37]">{currentScore}</div>
          </div>
          <div className="bg-black/30 border border-[#1a1a2e] rounded-2xl p-6 min-w-[140px]">
            <div className="text-[10px] font-mono text-[#555566] uppercase mb-2">Final Rank</div>
            <div className="text-3xl font-black text-white">#{rankEstimate || '-'}</div>
          </div>
        </div>
      </HubCard>
    );
  }

  if (!isJoined) {
    return (
      <HubCard as="section" className="p-12 text-center border-dashed border-2 border-[#1a1a2e] bg-transparent">
        <Users size={48} className="mx-auto text-[#555566] mb-6" />
        <h3 className="text-2xl font-black uppercase mb-2">Ready to Play?</h3>
        <p className="text-[#8a8a9a] mb-8 max-w-sm mx-auto">Join the quiz pot above to start answering questions and compete for the prize.</p>
      </HubCard>
    );
  }

  if (!isReady) {
    return (
      <HubCard as="section" className="p-12 text-center">
        <Clock3 size={48} className="mx-auto text-[#d4af37] mb-6 animate-pulse" />
        <h3 className="text-2xl font-black uppercase mb-2">Waiting for Start</h3>
        <p className="text-[#8a8a9a] mb-4 max-w-sm mx-auto">The quiz room is opening soon. Get ready!</p>
        <HubBadge className="mx-auto border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">
          Joined and Ready
        </HubBadge>
      </HubCard>
    );
  }

  if (!currentQuestion) {
    return (
      <HubCard as="section" className="p-12 text-center bg-[linear-gradient(135deg,rgba(212,175,55,0.1),transparent)]">
        <div className="animate-win">
          <Sparkles size={64} className="mx-auto text-[#d4af37] mb-8" />
          <h2 className="text-4xl font-black uppercase mb-4">Quiz Complete!</h2>
          <p className="text-[#8a8a9a] mb-8">You've answered all questions. Waiting for the pot to close.</p>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="bg-black/30 border border-[#d4af37]/30 rounded-2xl p-4">
              <div className="text-[10px] font-mono text-[#555566] mb-1">FINAL SCORE</div>
              <div className="text-2xl font-black text-[#d4af37]">{currentScore}</div>
            </div>
            <div className="bg-black/30 border border-[#1a1a2e] rounded-2xl p-4">
              <div className="text-[10px] font-mono text-[#555566] mb-1">RANK</div>
              <div className="text-2xl font-black text-white">#{rankEstimate || '-'}</div>
            </div>
          </div>
        </div>
      </HubCard>
    );
  }

  return (
    <HubCard as="section" className="p-6 sm:p-10 relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/40">
        <div 
          className="h-full bg-[#d4af37] transition-all duration-500 ease-out"
          style={{ width: `${(answeredCount / pot.questions.length) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center mb-10 mt-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#555566] uppercase tracking-widest">Question</span>
          <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e] px-3">
            {answeredCount + 1} / {pot.questions.length}
          </HubBadge>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          <Clock3 size={16} />
          {timeLeft}s
        </div>
      </div>

      <h2 className="text-3xl sm:text-4xl font-black uppercase mb-10 leading-tight">
        {currentQuestion.prompt}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {currentQuestion.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedOption === index;
          const isCorrect = showFeedback && index === currentQuestion.correctIndex;
          const isWrong = showFeedback && isSelected && index !== currentQuestion.correctIndex;
          
          return (
            <button
              key={index}
              disabled={showFeedback}
              onClick={() => handleOptionClick(index)}
              className={`group relative p-6 rounded-3xl border-2 text-left transition-all duration-200
                ${isCorrect ? 'border-[#30d158] bg-[#30d158]/10 scale-[1.02]' : 
                  isWrong ? 'border-red-500 bg-red-500/10' :
                  isSelected ? 'border-[#d4af37] bg-[#d4af37]/10' : 
                  'border-[#1a1a2e] bg-black/40 hover:border-[#2a2a4a] hover:bg-black/60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-colors
                  ${isCorrect ? 'bg-[#30d158] text-black' : 
                    isWrong ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-[#d4af37] text-black' : 
                    'bg-[#1a1a2e] text-[#555566] group-hover:text-white'}`}>
                  {letter}
                </div>
                <div className="flex-1 font-bold text-lg">
                  {option}
                </div>
                {isCorrect && <Check className="text-[#30d158]" size={24} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          {showFeedback && (
            <div className={`animate-win p-4 rounded-2xl border ${result?.ok && result.correct ? 'border-[#30d158]/30 bg-[#30d158]/5 text-[#30d158]' : 'border-red-500/30 bg-red-500/5 text-red-400'}`}>
              <div className="font-black uppercase text-xs mb-1">
                {result?.ok && result.correct ? 'Awesome!' : 'Oops!'}
              </div>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null || showFeedback}
          className={`primary-button h-16 px-12 rounded-2xl text-xl transition-all
            ${selectedOption !== null && !showFeedback ? 'pulse-gold' : 'opacity-50 cursor-not-allowed'}`}
        >
          CONFIRM ANSWER
        </button>
      </div>
    </HubCard>
  );
}

export default function QuizPotDetailPage() {
  const params = useParams<{ id?: string }>();
  const potId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
  const { hydrated, now } = useHydratedNow();
  const { ready: identityReady, name, setName, address } = useStoredQuizIdentity();
  const { isConnected } = useWallet();
  
  const [toast, setToast] = useState<{ isVisible: boolean; type: 'win' | 'loss' | 'info'; title: string; message: string; amount?: string }>({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showToast = (type: 'win' | 'loss' | 'info', title: string, message: string, amount?: string) => {
    setToast({ isVisible: true, type, title, message, amount });
  };

  const closeToast = () => setToast(prev => ({ ...prev, isVisible: false }));

  const { challenges, luckyPacks, history, addBalance, deductBalance } = useGameStore();
  const gameProgress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history }, now),
    [challenges, luckyPacks, history, now],
  );
  
  const pot = useQuizPotStore((state) => (potId ? state.getQuizPotById(potId) : undefined));
  const joinQuizPot = useQuizPotStore((state) => state.joinQuizPot);
  const submitQuizAnswer = useQuizPotStore((state) => state.submitQuizAnswer);
  const [submission, setSubmission] = useState<QuizSubmissionResult | null>(null);
  const [txPending, setTxPending] = useState(false);

  const normalizedAddress = address.trim().toLowerCase();
  const participant = pot?.participants.find((entry) => entry.address.trim().toLowerCase() === normalizedAddress);
  const resolvedStatus = pot ? resolveQuizPotStatus(pot, now) : 'ended';
  const isJoined = Boolean(participant);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pot) return;

    if (!isConnected || !address) {
      showToast('info', 'Connect Wallet', 'Please connect your wallet to join.');
      return;
    }

    const entryFee = Math.max(1, Math.round(pot.potUsd / 10));
    setTxPending(true);
    
    try {
      const tx = await payToAdmin(entryFee);
      setTxPending(false);
      
      if (!tx.success) {
        showToast('info', 'Transaction Failed', tx.error ?? 'Transaction failed. Please try again.');
        return;
      }

      // Update mock balance for UI (happens in both modes as per requirements)
      if (!deductBalance(address, entryFee)) {
        if (!USE_REAL_TRANSFERS) {
          showToast('info', 'Insufficient Balance', `Insufficient balance (Demo Mode).`);
          return;
        }
      }

      const result = joinQuizPot(pot.id, address, name);
      if (result.ok) {
        const msg = !USE_REAL_TRANSFERS
          ? 'Joined Pot! (Demo mode)'
          : `Entry fee paid! View on Arcscan: ${tx.explorerUrl}`;
        showToast('info', 'Joined Pot', msg);
      } else {
        showToast('info', 'Join Status', result.message);
      }
    } catch (e: any) {
      setTxPending(false);
      showToast('info', 'Transaction Failed', e?.message || 'Transaction failed');
    }
  };

  const handleSubmit = (questionId: string, answerIndex: number) => {
    if (!pot) return;

    const result = submitQuizAnswer(pot.id, address, questionId, answerIndex);
    setSubmission(result);

    // Check if finished
    const answers = useQuizPotStore.getState().answersByPot[pot.id]?.[normalizedAddress] ?? {};
    if (Object.keys(answers).length === pot.questions.length) {
      setTimeout(async () => {
        const finalLeaderboard = sortQuizParticipants([...pot.participants]);
        const rank = finalLeaderboard.findIndex(p => p.address.toLowerCase() === normalizedAddress) + 1;
        const score = participant?.score || 0;

        const isWinner = rank === 1;
        if (isWinner) {
          const breakdown = buildQuizPrizeBreakdown(pot, finalLeaderboard);
          const prize = breakdown.find(e => e.place === 1)?.amountUsd ?? 0;
          if (prize > 0) {
            try {
              const tx = await payFromAdmin(address, prize);
              
              // Update mock balance for UI
              addBalance(address, prize);
              
              const msg = !USE_REAL_TRANSFERS
                ? `You Won! Prize: $${prize} claimed! (Demo mode)`
                : `You Won! Reward claimed! View on Arcscan: ${tx.explorerUrl}`;
              showToast('win', 'You Won!', msg, String(prize));
              return;
            } catch (e: any) {
              showToast('info', 'Payout Error', e?.message || 'Transaction failed');
            }
          }
        }

        showToast(isWinner ? 'win' : 'info', isWinner ? 'You Won!' : 'Quiz Finished!', `Final Score: ${score}. Rank: #${rank}`, String(score));
      }, 3500);
    }
  };

  if (!hydrated || !identityReady) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[260px]" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <HubSkeletonCard lines={8} className="min-h-[520px]" />
            <HubSkeletonCard lines={8} className="min-h-[520px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!pot) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-5xl">
          <HubEmptyState
            icon={Trophy}
            title="Quiz pot not found"
            description="The selected quiz pot does not exist in the local store."
          >
            <Link href="/game/quiz-pot" className="primary-button">
              Back to Quiz Pot
            </Link>
          </HubEmptyState>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <GameToast
          isVisible={toast.isVisible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          amount={toast.amount}
          onClose={closeToast}
        />

        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(resolvedStatus)}>{resolvedStatus.toUpperCase()}</HubBadge>
            <HubBadge>{pot.hostName}</HubBadge>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link href="/game/quiz-pot" className="inline-flex items-center gap-2 border border-[#1a1a2e] rounded-full px-4 py-1.5 text-[10px] uppercase font-mono tracking-widest text-[#555566] hover:text-white transition-colors">
                  <ArrowRight className="rotate-180" size={14} />
                  Quiz Hub
                </Link>
              </div>
              <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
                {pot.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('info', 'Copied!', 'Invite link copied to clipboard.');
                  }}
                  className="flex items-center gap-2 border border-[#1a1a2e] rounded-xl px-4 py-2 text-sm hover:border-[#d4af37]/50 transition-colors"
                >
                  <Copy size={14} />
                  Copy Link
                </button>
                <button 
                  onClick={() => {
                    const url = `https://twitter.com/intent/tweet?text=I'm playing ${pot.title} on Arc!&url=${encodeURIComponent(window.location.href)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 border border-[#1a1a2e] rounded-xl px-4 py-2 text-sm hover:border-[#d4af37]/50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X
                </button>
              </div>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">Pot</div>
                <div className="mt-2 text-3xl font-black text-[#d4af37]">{formatQuizAmount(pot.potUsd)}</div>
              </div>
              <CountdownTile pot={pot} now={now} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <QuizFlowCard
              pot={pot}
              now={now}
              address={address}
              onSubmit={handleSubmit}
              result={submission}
            />

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#555566]">Participant Info</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Your Identity</h2>
                </div>
                <HubBadge className={isJoined ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]'}>
                  {isJoined ? 'Joined' : 'Not joined'}
                </HubBadge>
              </div>

              <form className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" onSubmit={handleJoin}>
                <div className="space-y-2">
                  <label className={hubLabelClass} htmlFor="quiz-name">Display name</label>
                  <input
                    id="quiz-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={`w-full ${hubInputClass}`}
                    placeholder="Quiz Runner"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <div className={hubLabelClass}>Address</div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#8a8a9a] truncate">
                    {formatQuizAddressLabel(address)}
                  </div>
                </div>

                <div className="flex items-end">
                  <button type="submit" disabled={txPending} className="primary-button w-full justify-center h-12 disabled:opacity-60">
                    {txPending ? 'Confirming…' : isJoined ? 'Update Name' : 'Join Room'}
                  </button>
                </div>
              </form>
            </HubCard>
          </div>

          <div className="space-y-6">
            <LeaderboardCard pot={pot} address={address} />
            <PrizePanel pot={pot} now={now} />
            <GameProgressPanel
              snapshot={gameProgress}
              description="Shared Arc game momentum carries into the quiz room."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
