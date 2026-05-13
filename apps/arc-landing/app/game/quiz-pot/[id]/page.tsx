'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Clock3, Coins, Sparkles, Trophy, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
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

const QUIZ_NAME_KEY = 'arclanding:quiz-pot-name';
const QUIZ_ADDRESS_KEY = 'arclanding:quiz-pot-address';

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
      return 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]';
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
      <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">{countdown.label}</div>
        <div className="mt-3 text-2xl font-black text-white">{countdown.value}</div>
      </div>
    );
  }

  const parts = formatQuizCountdownParts(status === 'live' ? pot.endsAt - now : pot.startsAt - now);

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
        <Clock3 size={14} className="text-[#c9a84c]" aria-hidden="true" />
        {countdown.label}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {parts.map((part) => (
          <div key={part.label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-2 py-3 text-center">
            <div className="text-lg font-black text-white">{part.value}</div>
            <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.22em] text-[#777]">{part.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionReveal({
  result,
  currentScore,
  answeredCount,
  totalQuestions,
  currentQuestionTitle,
}: {
  result: QuizSubmissionResult | null;
  currentScore: number;
  answeredCount: number;
  totalQuestions: number;
  currentQuestionTitle?: string;
}) {
  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-[#2a2a2a] bg-white/[0.015] p-5 text-sm leading-7 text-[#9a9a9a]">
        Submit an answer to reveal your score and move to the next question.
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
        {result.message}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
        <BadgeCheck size={14} className={result.correct ? 'text-[#30d158]' : 'text-[#c9a84c]'} aria-hidden="true" />
        Score reveal
      </div>
      <div className="mt-3 text-sm text-white">{result.correct ? 'Correct answer locked in.' : 'Answer locked in.'}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Current score</div>
          <div className="mt-2 text-lg font-black text-[#c9a84c]">{currentScore}</div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Answered</div>
          <div className="mt-2 text-lg font-black text-white">
            {answeredCount}/{totalQuestions}
          </div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Question</div>
          <div className="mt-2 truncate text-lg font-black text-white">{currentQuestionTitle ?? 'Completed'}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Your answer</div>
          <div className="mt-2 text-sm font-semibold text-white">Option {String.fromCharCode(65 + result.answerIndex)}</div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Correct answer</div>
          <div className="mt-2 text-sm font-semibold text-white">Option {String.fromCharCode(65 + result.correctIndex)}</div>
        </div>
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
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Leaderboard</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Top scores</h2>
        </div>
        <Trophy className="text-[#c9a84c]" size={22} aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-3">
        {leaderboard.length > 0 ? (
          leaderboard.map((participant, index) => {
            const isSelf = participant.address.trim().toLowerCase() === normalizedAddress;
            return (
              <div
                key={participant.address}
                className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3 ${
                  isSelf ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10' : 'border-[#2a2a2a] bg-black/30'
                }`}
              >
                <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {participant.name}
                    {isSelf ? ' (you)' : ''}
                  </div>
                  <div className="truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                    {formatQuizAddressLabel(participant.address)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#c9a84c]">{participant.score}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">Pts</div>
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

      <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-sm text-[#9a9a9a]">
        {activeParticipantIndex >= 0
          ? `Your current rank is #${String(activeParticipantIndex + 1).padStart(2, '0')}.`
          : 'Join the pot to appear on the leaderboard.'}
      </div>
    </HubCard>
  );
}

function PrizePanel({ pot, now }: { pot: QuizPot; now: number }) {
  const leaderboard = sortQuizParticipants(pot.participants);
  const resolvedStatus = resolveQuizPotStatus(pot, now);
  const breakdown = buildQuizPrizeBreakdown(pot, leaderboard);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Prize panel</p>
          <h2 className="mt-2 text-2xl font-black uppercase">Payouts</h2>
        </div>
        <Coins className="text-[#c9a84c]" size={22} aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <HubBadge className={resolvedStatus === 'ended' ? 'border-[#777]/30 bg-white/[0.02] text-[#d8d8d8]' : 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]'}>
          {resolvedStatus === 'ended' ? 'Final payouts' : 'Projected payouts'}
        </HubBadge>
        <HubBadge>{pot.distribution.replace('-', ' ')}</HubBadge>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.length > 0 ? (
          breakdown.map((entry) => (
            <div key={`${entry.place}-${entry.participant.address}`} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                    {entry.place === 1 ? 'Winner' : `${entry.place} place`}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{entry.participant.name}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                    {formatQuizAddressLabel(entry.participant.address)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#c9a84c]">{formatQuizAmount(entry.amountUsd)}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">{entry.share}%</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <HubEmptyState
            icon={Sparkles}
            title="Waiting for participants"
            description="The prize panel will populate once players join the pot."
          />
        )}
      </div>

      {resolvedStatus === 'ended' && breakdown.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-sm leading-7 text-[#9a9a9a]">
          Final winners are locked. Top rankings shown above reflect the ended room.
        </div>
      ) : null}
    </HubCard>
  );
}

function QuizFlowCard({
  pot,
  now,
  address,
  participantExists,
  onSubmit,
  result,
}: {
  pot: QuizPot;
  now: number;
  address: string;
  participantExists: boolean;
  onSubmit: (questionId: string, answerIndex: number) => void;
  result: QuizSubmissionResult | null;
}) {
  const normalizedAddress = address.trim().toLowerCase();
  const participant = pot.participants.find((entry) => entry.address.trim().toLowerCase() === normalizedAddress);
  const answers = useQuizPotStore((state) => state.getQuizPotAnswersForAddress(pot.id, address));
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = pot.questions[answeredCount];
  const currentScore = participant?.score ?? 0;
  const resolvedStatus = resolveQuizPotStatus(pot, now);
  const isJoined = Boolean(participant);
  const isReady = resolvedStatus === 'live' && isJoined;
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [pot.id, answeredCount]);

  if (resolvedStatus === 'ended') {
    return (
      <HubCard as="section" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Quiz flow</p>
            <h2 className="mt-2 text-2xl font-black uppercase">Room ended</h2>
          </div>
          <HubBadge className="border-[#777]/30 bg-white/[0.02] text-[#d8d8d8]">Ended</HubBadge>
        </div>
        <HubEmptyState
          icon={Trophy}
          title="Final round complete"
          description="This quiz pot is over. Review the winners in the prize panel and the final leaderboard on the right."
          className="mt-5"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Your score</div>
            <div className="mt-2 text-2xl font-black text-[#c9a84c]">{currentScore}</div>
          </div>
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Pot status</div>
            <div className="mt-2 text-2xl font-black text-white">{resolvedStatus.toUpperCase()}</div>
          </div>
        </div>
      </HubCard>
    );
  }

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Quiz flow</p>
          <h2 className="mt-2 text-2xl font-black uppercase">One question at a time</h2>
        </div>
        <HubBadge className={resolvedStatus === 'live' ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]'}>
          {resolvedStatus === 'live' ? 'Live' : 'Open'}
        </HubBadge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Answered</div>
          <div className="mt-2 text-2xl font-black text-white">
            {answeredCount}/{pot.questions.length}
          </div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Your score</div>
          <div className="mt-2 text-2xl font-black text-[#c9a84c]">{currentScore}</div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Next question</div>
          <div className="mt-2 truncate text-sm font-semibold text-white">
            {currentQuestion ? `#${answeredCount + 1}` : 'Completed'}
          </div>
        </div>
      </div>

      {!isJoined ? (
        <HubEmptyState
          icon={Users}
          title="Join first"
          description="Enter your name in the join section to unlock the quiz flow."
          className="mt-5"
        />
      ) : !isReady ? (
        <div className="mt-5 rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Waiting for start</div>
          <div className="mt-3 text-lg font-semibold text-white">
            The pot is not live yet. You are joined and ready when the countdown expires.
          </div>
          <div className="mt-4 text-sm leading-7 text-[#9a9a9a]">
            Use the time to review the prize panel and leaderboard before the room opens.
          </div>
        </div>
      ) : currentQuestion ? (
        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedOption === null) {
              return;
            }
            onSubmit(currentQuestion.id, selectedOption);
          }}
        >
          <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
              <Sparkles size={14} className="text-[#c9a84c]" aria-hidden="true" />
              Question {answeredCount + 1} of {pot.questions.length}
            </div>
            <p className="mt-4 text-2xl font-black uppercase leading-tight">{currentQuestion.prompt}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index);
                const active = selectedOption === index;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm leading-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                      active
                        ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-white shadow-[0_0_0_1px_rgba(201,168,76,0.08)]'
                        : 'border-[#2a2a2a] bg-black/30 text-[#d8d8d8] hover:border-[#c9a84c]/25 hover:bg-[#c9a84c]/5'
                    }`}
                    onClick={() => setSelectedOption(index)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2a2a] bg-white/[0.02] font-mono text-[10px] uppercase tracking-[0.18em] text-[#c9a84c]">
                        {optionLetter}
                      </span>
                      <span className="min-w-0 flex-1">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" className="primary-button" disabled={!participantExists || selectedOption === null}>
                Submit Answer
              </button>
              <div className="text-sm text-[#777]">
                {participantExists
                  ? selectedOption === null
                    ? 'Select an option to continue.'
                    : `Selected option ${String.fromCharCode(65 + selectedOption)}.`
                  : 'Join the pot to submit answers.'}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Completed</div>
          <div className="mt-3 text-2xl font-black text-[#c9a84c]">Quiz cleared</div>
          <div className="mt-3 text-sm leading-7 text-[#9a9a9a]">
            You have answered every question in this pot. Review the score reveal below or keep checking the leaderboard as the room closes.
          </div>
        </div>
      )}

      <div className="mt-5">
        <SubmissionReveal
          result={result}
          currentScore={currentScore}
          answeredCount={answeredCount}
          totalQuestions={pot.questions.length}
          currentQuestionTitle={currentQuestion?.prompt}
        />
      </div>
    </HubCard>
  );
}

export default function QuizPotDetailPage() {
  const params = useParams<{ id?: string }>();
  const potId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
  const { hydrated, now } = useHydratedNow();
  const { ready: identityReady, name, setName, address } = useStoredQuizIdentity();
  const pot = useQuizPotStore((state) => (potId ? state.getQuizPotById(potId) : undefined));
  const joinQuizPot = useQuizPotStore((state) => state.joinQuizPot);
  const submitQuizAnswer = useQuizPotStore((state) => state.submitQuizAnswer);
  const [joinMessage, setJoinMessage] = useState('');
  const [submission, setSubmission] = useState<QuizSubmissionResult | null>(null);

  useEffect(() => {
    setSubmission(null);
    setJoinMessage('');
  }, [potId]);

  const normalizedAddress = address.trim().toLowerCase();
  const participant = pot?.participants.find((entry) => entry.address.trim().toLowerCase() === normalizedAddress);
  const answers = useQuizPotStore((state) => (pot ? state.getQuizPotAnswersForAddress(pot.id, address) : {}));
  const answeredCount = Object.keys(answers).length;
  const leaderboard = useMemo(() => (pot ? sortQuizParticipants(pot.participants) : []), [pot]);
  const resolvedStatus = pot ? resolveQuizPotStatus(pot, now) : 'ended';
  const isJoined = Boolean(participant);
  const currentScore = participant?.score ?? 0;

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pot) {
      return;
    }

    const result = joinQuizPot(pot.id, address, name);
    setJoinMessage(result.message);
  };

  const handleSubmit = (questionId: string, answerIndex: number) => {
    if (!pot) {
      return;
    }

    const result = submitQuizAnswer(pot.id, address, questionId, answerIndex);
    setSubmission(result);
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
            description="The selected quiz pot does not exist in the local store. Return to the hub and pick another room."
          >
            <Link href="/game/quiz-pot" className="primary-button">
              Back to Quiz Pot
            </Link>
          </HubEmptyState>
        </div>
      </section>
    );
  }

  const countdown = getCountdownText(pot, now);
  const participantCount = pot.participants.length;
  const currentQuestion = pot.questions[answeredCount];
  const questionProgress = Math.min(answeredCount, pot.questions.length);

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(resolvedStatus)}>{resolvedStatus.toUpperCase()}</HubBadge>
            <HubBadge>{pot.hostName}</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-white">{pot.distribution.replace('-', ' ')}</HubBadge>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Link href="/game/quiz-pot" className="nav-link text-[10px] uppercase tracking-[0.24em] text-[#777]">
                  Quiz Hub
                </Link>
              </div>
              <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
                {pot.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
                Hosted by {pot.hostName}. Join the room, answer each question once, and watch the leaderboard and prize panel update locally.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Pot</div>
                <div className="mt-2 text-3xl font-black text-[#c9a84c]">{formatQuizAmount(pot.potUsd)}</div>
              </div>
              <CountdownTile pot={pot} now={now} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubBadge className="justify-center border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-white">
            {pot.questionCount} questions
          </HubBadge>
          <HubBadge className="justify-center border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-white">
            {participantCount} participants
          </HubBadge>
          <HubBadge className="justify-center border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-white">
            {pot.durationHours} hour room
          </HubBadge>
          <HubBadge className="justify-center border-[#2a2a2a] bg-white/[0.02] px-4 py-3 text-white">
            {questionProgress}/{pot.questions.length} answered
          </HubBadge>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Join section</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Enter the room</h2>
                </div>
                <HubBadge className={isJoined ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]'}>
                  {isJoined ? 'Joined' : 'Not joined'}
                </HubBadge>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleJoin}>
                <div className="space-y-2">
                  <label className={hubLabelClass} htmlFor="quiz-name">
                    Display name
                  </label>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className={hubLabelClass}>Participant address</div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#aaa]">
                      {formatQuizAddressLabel(address)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={hubLabelClass}>Current score</div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-2xl font-black text-[#c9a84c]">
                      {currentScore}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="primary-button w-full sm:w-auto">
                    {isJoined ? 'Update Join' : 'Join Mock'}
                  </button>
                  <Link href="/game/quiz-pot" className="secondary-button w-full justify-center sm:w-auto">
                    Back to Hub
                  </Link>
                </div>

                <p className="min-h-6 text-sm text-[#d8d8d8]" aria-live="polite">
                  {joinMessage || (resolvedStatus === 'ended' ? 'This room has closed.' : 'No backend, wallet, or contract is involved in this join action.')}
                </p>
              </form>
            </HubCard>

            <QuizFlowCard
              pot={pot}
              now={now}
              address={address}
              participantExists={isJoined}
              onSubmit={handleSubmit}
              result={submission}
            />
          </div>

          <div className="space-y-6">
            <LeaderboardCard pot={pot} address={address} />
            <PrizePanel pot={pot} now={now} />
          </div>
        </div>
      </div>
    </section>
  );
}
