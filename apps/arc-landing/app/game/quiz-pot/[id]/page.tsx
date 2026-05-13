'use client';

import Link from 'next/link';
import { AlertTriangle, BadgeCheck, Check, Clock3, Coins, Copy, Link2, Sparkles, Trophy, Users } from 'lucide-react';
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

type InviteToastState = {
  tone: 'success' | 'error';
  message: string;
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
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
  rankEstimate,
  payoutEligible,
  projectedPayout,
  payoutShare,
  payoutLabel,
}: {
  result: QuizSubmissionResult | null;
  currentScore: number;
  answeredCount: number;
  totalQuestions: number;
  currentQuestionTitle?: string;
  rankEstimate: number | null;
  payoutEligible: boolean;
  projectedPayout: number;
  payoutShare: number;
  payoutLabel: string;
}) {
  const [pulse, setPulse] = useState(false);
  const resultKey = result?.ok ? result.questionId : undefined;

  useEffect(() => {
    if (!result?.ok) {
      setPulse(false);
      return;
    }

    setPulse(false);
    const frame = window.requestAnimationFrame(() => {
      setPulse(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [result?.ok, resultKey]);

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
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 transition-all duration-500 ${
        pulse
          ? 'border-[#c9a84c]/35 bg-[linear-gradient(135deg,rgba(201,168,76,0.14),rgba(48,209,88,0.05)_50%,rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(201,168,76,0.08),0_22px_70px_rgba(0,0,0,0.45)]'
          : 'border-[#2a2a2a] bg-black/30'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
          <BadgeCheck size={14} className={result.correct ? 'text-[#30d158]' : 'text-[#c9a84c]'} aria-hidden="true" />
          Score reveal
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-white">
            {rankEstimate ? `Rank #${String(rankEstimate).padStart(2, '0')}` : 'Rank pending'}
          </HubBadge>
          <HubBadge className={payoutEligible ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]'}>
            {payoutEligible ? 'Payout eligible' : 'Outside payout zone'}
          </HubBadge>
        </div>
      </div>

      <div className="mt-4 text-sm text-white">{result.correct ? 'Correct answer locked in.' : 'Answer locked in.'}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Payout mode</div>
          <div className="mt-2 text-sm font-semibold text-white">{payoutLabel}</div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Projected payout</div>
          <div className="mt-2 text-lg font-black text-[#f0d79e]">{formatQuizAmount(projectedPayout)}</div>
        </div>
        <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Share</div>
          <div className="mt-2 text-lg font-black text-white">{payoutShare}%</div>
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
  const isSplit = pot.distribution === 'top3-split';
  const winner = breakdown[0];
  const splitBreakdown = breakdown.slice(0, 3);

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
        <HubBadge>{isSplit ? '50 / 30 / 20 split' : 'Winner takes all'}</HubBadge>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.length > 0 ? (
          isSplit ? (
            splitBreakdown.map((entry) => (
              <div key={`${entry.place}-${entry.participant.address}`} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                      {entry.place === 1 ? '1st place' : `${entry.place} place`}
                    </div>
                    <div className="mt-2 truncate text-sm font-semibold text-white">{entry.participant.name}</div>
                    <div className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                      {formatQuizAddressLabel(entry.participant.address)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#c9a84c]">{formatQuizAmount(entry.amountUsd)}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">{entry.share}%</div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#c9a84c_0%,#f0d79e_100%)]"
                    style={{ width: `${entry.share}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-[#c9a84c]/25 bg-[linear-gradient(135deg,rgba(201,168,76,0.16),rgba(255,255,255,0.02))] p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#f0d79e]">
                <Trophy size={14} aria-hidden="true" />
                Winner takes all
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Current leader</div>
                  <div className="mt-2 truncate text-lg font-semibold text-white">{winner?.participant.name ?? 'No winner yet'}</div>
                  <div className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                    {winner ? formatQuizAddressLabel(winner.participant.address) : 'Waiting for participants'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#f0d79e]">{winner ? formatQuizAmount(winner.amountUsd) : '$0'}</div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">100% of pot</div>
                </div>
              </div>
              <div className="mt-4 text-sm leading-7 text-[#d8d8d8]">
                {resolvedStatus === 'ended'
                  ? 'Final winner locked. The full pot pays out to the top rank.'
                  : 'Projected payout updates as scores change. The top rank takes everything.'}
              </div>
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

      {resolvedStatus === 'ended' && isSplit && splitBreakdown.length > 0 ? (
        <div className="mt-5 rounded-3xl border border-[#2a2a2a] bg-black/25 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Podium view</div>
              <div className="mt-2 text-sm font-semibold text-white">Top 3 winners and payout split</div>
            </div>
            <HubBadge>50 / 30 / 20</HubBadge>
          </div>
          <div className="mt-4 grid grid-cols-3 items-end gap-3">
            {[
              { label: '2nd', entry: splitBreakdown[1], heightClass: 'min-h-36' },
              { label: '1st', entry: splitBreakdown[0], heightClass: 'min-h-44' },
              { label: '3rd', entry: splitBreakdown[2], heightClass: 'min-h-28' },
            ].map((slot) => (
              <div
                key={slot.label}
                className={`rounded-3xl border border-[#2a2a2a] bg-black/30 p-4 text-center ${slot.heightClass}`}
              >
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{slot.label}</div>
                {slot.entry ? (
                  <>
                    <div className="mt-3 truncate text-sm font-semibold text-white">{slot.entry.participant.name}</div>
                    <div className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                      {formatQuizAddressLabel(slot.entry.participant.address)}
                    </div>
                    <div className="mt-4 text-lg font-black text-[#c9a84c]">{formatQuizAmount(slot.entry.amountUsd)}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">{slot.entry.share}%</div>
                  </>
                ) : (
                  <div className="mt-6 text-sm leading-7 text-[#777]">Waiting for a finalist</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
  const leaderboard = sortQuizParticipants(pot.participants);
  const payoutBreakdown = buildQuizPrizeBreakdown(pot, leaderboard);
  const rankEstimate = participant ? leaderboard.findIndex((entry) => entry.address.trim().toLowerCase() === normalizedAddress) + 1 : null;
  const payoutSlotCount = pot.distribution === 'winner-takes-all' ? 1 : 3;
  const payoutEligible = rankEstimate !== null && rankEstimate > 0 && rankEstimate <= payoutSlotCount;
  const payoutEntry = payoutBreakdown.find((entry) => entry.participant.address.trim().toLowerCase() === normalizedAddress);
  const projectedPayout = payoutEntry?.amountUsd ?? 0;
  const payoutShare = payoutEntry?.share ?? 0;
  const payoutLabel = pot.distribution === 'winner-takes-all' ? 'Winner takes all' : 'Top 3 split';
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
          rankEstimate={rankEstimate}
          payoutEligible={payoutEligible}
          projectedPayout={projectedPayout}
          payoutShare={payoutShare}
          payoutLabel={payoutLabel}
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
  const gameStore = useGameStore((state) => ({
    challenges: state.challenges,
    luckyPacks: state.luckyPacks,
    history: state.history,
  }));
  const gameProgress = useMemo(() => buildGameProgressSnapshot(gameStore, now), [gameStore, now]);
  const pot = useQuizPotStore((state) => (potId ? state.getQuizPotById(potId) : undefined));
  const joinQuizPot = useQuizPotStore((state) => state.joinQuizPot);
  const submitQuizAnswer = useQuizPotStore((state) => state.submitQuizAnswer);
  const [joinMessage, setJoinMessage] = useState('');
  const [submission, setSubmission] = useState<QuizSubmissionResult | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteToast, setInviteToast] = useState<InviteToastState | null>(null);

  useEffect(() => {
    setSubmission(null);
    setJoinMessage('');
  }, [potId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setInviteLink(`${window.location.origin}${window.location.pathname}`);
    setInviteToast(null);
  }, [potId]);

  useEffect(() => {
    if (!inviteToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setInviteToast(null);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [inviteToast]);

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

  const handleCopyInviteLink = async () => {
    if (!inviteLink) {
      setInviteToast({
        tone: 'error',
        message: 'Invite link is not ready yet.',
      });
      return;
    }

    const success = await copyTextToClipboard(inviteLink);
    setInviteToast(
      success
        ? {
            tone: 'success',
            message: 'Invite link copied to clipboard.',
          }
        : {
            tone: 'error',
            message: 'Copy failed. Use the visible route link instead.',
        },
    );
  };

  const inviteRoute = inviteLink ? inviteLink.replace(/^https?:\/\/[^/]+/, '') : 'Preparing current route...';

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
      {inviteToast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
            inviteToast.tone === 'success'
              ? 'border-[#30d158]/30 bg-[#07160d]/95 text-[#d8ffe5]'
              : 'border-red-500/30 bg-[#21090a]/95 text-red-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
                inviteToast.tone === 'success' ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-red-500/30 bg-red-500/10 text-red-100'
              }`}
            >
              {inviteToast.tone === 'success' ? <Check size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{inviteToast.message}</div>
              <div className="mt-1 truncate text-xs text-[#9a9a9a]">{inviteRoute}</div>
            </div>
          </div>
        </div>
      ) : null}
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
              <div className="rounded-3xl border border-[#c9a84c]/20 bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(48,209,88,0.04)_55%,rgba(255,255,255,0.02))] p-5 sm:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
                      <Link2 size={14} className="text-[#c9a84c]" aria-hidden="true" />
                      Invite link
                    </div>
                    <div className="mt-2 truncate text-sm font-semibold text-white">{inviteRoute}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                      Mock share link from the current route
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#f0d79e] transition-colors hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    {inviteToast?.tone === 'success' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {inviteToast?.tone === 'success' ? 'Copied' : 'Copy Invite Link'}
                  </button>
                </div>
                <p
                  className={`mt-3 text-xs leading-6 ${
                    inviteToast?.tone === 'error' ? 'text-red-100' : inviteToast?.tone === 'success' ? 'text-[#a6f4bf]' : 'text-[#9a9a9a]'
                  }`}
                  aria-live="polite"
                >
                  {inviteToast ? inviteToast.message : 'Share the current room with another player without leaving the page.'}
                </p>
              </div>
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
            <GameProgressPanel
              snapshot={gameProgress}
              description="Shared Arc game momentum carries into the quiz room. XP, streaks, and wins update from the same mock store."
            />
            <LeaderboardCard pot={pot} address={address} />
            <PrizePanel pot={pot} now={now} />
          </div>
        </div>
      </div>
    </section>
  );
}
