'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  CircleDashed,
  CircleX,
  Clock3,
  Coins,
  Flame,
  Plus,
  Sparkles,
  TimerReset,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type CSSProperties } from 'react';
import GameProgressPanel from '@/components/GameProgressPanel';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  HubSkeletonCard,
  hubInputClass,
  hubLabelClass,
} from '@/components/HubPrimitives';
import {
  buildGameProgressSnapshot,
  formatGameAmount,
  formatGameTimestamp,
  formatTargetType,
  formatTimeLeft,
  resolveChallengeStatus,
  useGameStore,
  type Challenge,
  type CreateChallengeInput,
} from '@/lib/gameStore';
import { useWallet } from '@/contexts/WalletContext';
import { ShareButtons } from '@/components/ShareButtons';
import { payToAdmin, USE_REAL_TRANSFERS, explorerUrl } from '@/lib/usdcTransfer';

const DAY_MS = 86_400_000;

function useHydratedNow() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return { hydrated, now } as const;
}

function toDatetimeLocalValue(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): number | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function statusTone(status: ReturnType<typeof resolveChallengeStatus>) {
  switch (status) {
    case 'won':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'lost':
      return 'border-[#f87171]/30 bg-[#f87171]/10 text-[#fecaca]';
    case 'expired':
      return 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fde68a]';
    case 'open':
    default:
      return 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]';
  }
}

function statusIcon(status: ReturnType<typeof resolveChallengeStatus>) {
  switch (status) {
    case 'won':
      return CircleCheckBig;
    case 'lost':
      return CircleX;
    case 'expired':
      return TimerReset;
    case 'open':
    default:
      return CircleDashed;
  }
}

function getDeadlineCopy(challenge: Challenge, now: number) {
  const status = resolveChallengeStatus(challenge, now);

  if (status === 'open') {
    return {
      label: challenge.acceptedAt ? 'Countdown' : 'Waiting to accept',
      value: challenge.acceptedAt ? formatTimeLeft(Math.max(0, challenge.deadlineAt - now)) : 'Ready to accept',
    };
  }

  return {
    label: status === 'expired' ? 'Expired on' : 'Resolved on',
    value: formatGameTimestamp(challenge.resolvedAt ?? challenge.deadlineAt),
  };
}

function getProgressPercent(challenge: Challenge) {
  if (challenge.targetValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((challenge.currentProgress / challenge.targetValue) * 100));
}

function ChallengeStatusRing({
  challenge,
  status,
}: {
  challenge: Challenge;
  status: ReturnType<typeof resolveChallengeStatus>;
}) {
  const percent = getProgressPercent(challenge);

  const ringClass =
    status === 'won'
      ? 'from-[#30d158] via-[#9ff0b8] to-[#30d158]'
      : status === 'lost'
        ? 'from-[#f87171] via-[#fda4af] to-[#f87171]'
        : status === 'expired'
          ? 'from-[#f59e0b] via-[#fcd34d] to-[#f59e0b]'
          : 'from-[#d4af37] via-[#f0d79e] to-[#d4af37]';

  return (
    <div className="relative mx-auto grid h-40 w-40 place-items-center">
      <div
        className={`absolute inset-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] ${ringClass}`}
        style={
          {
            '--tw-gradient-stops': `#111 0deg, #111 ${percent * 3.6}deg, rgba(255,255,255,0.06) ${percent * 3.6}deg, rgba(255,255,255,0.06) 360deg`,
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <div className="absolute inset-3 rounded-full border border-[#1a1a2e] bg-[#050505] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
      <div className="relative text-center">
        <div className="text-4xl font-black text-white">{percent}%</div>
        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">Progress</div>
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  now,
  onClaim,
}: {
  challenge: Challenge;
  now: number;
  onClaim: (challengeId: string) => void;
}) {
  const status = resolveChallengeStatus(challenge, now);
  const deadline = getDeadlineCopy(challenge, now);
  const percent = getProgressPercent(challenge);
  const StatusIcon = statusIcon(status);
  const claimable = status === 'open' && challenge.currentProgress >= challenge.targetValue;
  const claimReady = claimable || status === 'won';

  return (
    <HubCard as="article" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {status.toUpperCase()}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{challenge.game}</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">
              {formatGameAmount(challenge.rewardUsd)} USDC
            </HubBadge>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase sm:text-3xl">{challenge.title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#8a8a9a]">
              {challenge.senderName} challenged {challenge.receiverName}. Reach {challenge.targetValue}{' '}
              {formatTargetType(challenge.targetType)} before the deadline to unlock the reward.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{deadline.label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{deadline.value}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px]">
        <div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
            <span>
              Progress {challenge.currentProgress}/{challenge.targetValue}
            </span>
            <span>{challenge.acceptedAt ? 'Accepted' : 'Awaiting acceptance'}</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                status === 'won'
                  ? 'bg-[linear-gradient(90deg,#30d158,#9ff0b8)]'
                  : status === 'lost'
                    ? 'bg-[linear-gradient(90deg,#f87171,#fda4af)]'
                    : status === 'expired'
                      ? 'bg-[linear-gradient(90deg,#f59e0b,#fcd34d)]'
                      : 'bg-[linear-gradient(90deg,#d4af37,#f0d79e)]'
              }`}
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-label={`${challenge.title} progress`}
              aria-valuemin={0}
              aria-valuemax={challenge.targetValue}
              aria-valuenow={challenge.currentProgress}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Game</div>
              <div className="mt-2 text-sm font-semibold text-white">{challenge.game}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Target</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {challenge.targetValue} {formatTargetType(challenge.targetType)}
              </div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Reward</div>
              <div className="mt-2 text-sm font-semibold text-[#f0d79e]">{formatGameAmount(challenge.rewardUsd)} USDC</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Created</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatGameTimestamp(challenge.createdAt)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ChallengeStatusRing challenge={challenge} status={status} />
          <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{deadline.label}</div>
            <div className="mt-2 text-sm font-semibold text-white">{deadline.value}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/game/challenge/${challenge.id}`} className="bracket-button flex-1 justify-center">
              View Challenge
              <ArrowRight size={14} />
            </Link>
            {claimReady ? (
              <button type="button" className="primary-button flex-1 justify-center" onClick={() => onClaim(challenge.id)}>
                Claim Reward
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {challenge.timeline.slice(-3).map((event) => (
          <HubBadge key={event.id} className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
            {event.kind}
          </HubBadge>
        ))}
      </div>
    </HubCard>
  );
}

export default function GameChallengePage() {
  const { challenges, createChallenge, claimChallengeReward } = useGameStore();
  const deductBalance = useGameStore((state) => state.deductBalance);
  const { address, isConnected } = useWallet();
  const { hydrated, now } = useHydratedNow();
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [txPending, setTxPending] = useState(false);
  const [title, setTitle] = useState('Streak Surge');
  const [senderName, setSenderName] = useState('Nova Host');
  const [receiverName, setReceiverName] = useState('Open slot');
  const [amountUsd, setAmountUsd] = useState('180');
  const [game, setGame] = useState('Arc Runner');
  const [targetType, setTargetType] = useState('rounds');
  const [targetValue, setTargetValue] = useState('12');
  const [deadlineAt, setDeadlineAt] = useState(toDatetimeLocalValue(Date.now() + DAY_MS * 2));

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const luckyPacks = useGameStore((state) => state.luckyPacks);
  const history = useGameStore((state) => state.history);
  const progress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history }, now),
    [challenges, luckyPacks, history, now],
  );

  const sortedChallenges = useMemo(() => {
    const rank: Record<string, number> = {
      open: 0,
      won: 1,
      expired: 2,
      lost: 3,
    };

    return [...challenges].sort((a, b) => {
      const statusDiff = rank[resolveChallengeStatus(a, now)] - rank[resolveChallengeStatus(b, now)];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return b.createdAt - a.createdAt || a.title.localeCompare(b.title);
    });
  }, [challenges, now]);

  const stats = useMemo(() => {
    const active = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'open').length;
    const won = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'won').length;
    const expired = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'expired').length;
    const rewardPool = challenges.reduce((sum, challenge) => sum + challenge.rewardUsd, 0);
    const accepted = challenges.filter((challenge) => Boolean(challenge.acceptedAt)).length;

    return {
      active,
      won,
      expired,
      rewardPool,
      accepted,
    };
  }, [challenges, now]);

  const quickLinks = [
    { href: '/game/quiz-pot', label: 'Quiz Pot', description: 'Trivia rooms with local scoring.' },
    { href: '/game/lucky', label: 'Lucky', description: 'Weighted card reveals and claims.' },
    { href: '/game/history', label: 'History', description: 'Read the local archive.' },
  ];

  const handleCreateChallenge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !address) {
      setToast({ tone: 'error', message: 'Connect your wallet to create a challenge.' });
      return;
    }

    const parsedDeadlineAt = fromDatetimeLocalValue(deadlineAt);
    const parsedAmount = Number(amountUsd);
    const parsedTargetValue = Number(targetValue);

    if (!title.trim() || !senderName.trim() || !game.trim() || !targetType.trim()) {
      setToast({ tone: 'error', message: 'Fill in the required challenge fields before creating a new challenge.' });
      return;
    }

    if (!Number.isFinite(parsedDeadlineAt) || parsedDeadlineAt === null) {
      setToast({ tone: 'error', message: 'Choose a valid deadline for the challenge.' });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !Number.isFinite(parsedTargetValue) || parsedTargetValue <= 0) {
      setToast({ tone: 'error', message: 'Amount and target value must be greater than zero.' });
      return;
    }

    setTxPending(true);
    let txHash: string | undefined;
    if (USE_REAL_TRANSFERS) {
      const tx = await payToAdmin(parsedAmount);
      setTxPending(false);
      if (!tx.success) {
        setToast({ tone: 'error', message: tx.error ?? 'Transaction failed. Please try again.' });
        return;
      }
      txHash = tx.txHash;
    } else {
      setTxPending(false);
      if (!deductBalance(address, parsedAmount)) {
        setToast({ tone: 'error', message: `Insufficient balance. Top up your wallet to wager $${parsedAmount}.` });
        return;
      }
    }

    const created = createChallenge({
      title: title.trim(),
      senderName: senderName.trim(),
      receiverName: receiverName.trim() || 'Open slot',
      amountUsd: parsedAmount,
      game: game.trim(),
      targetType: targetType.trim(),
      targetValue: parsedTargetValue,
      deadlineAt: parsedDeadlineAt,
    } satisfies CreateChallengeInput);

    const successMsg = txHash
      ? `${created.title} created! View tx: ${explorerUrl(txHash)}`
      : `${created.title} was added to Challenge Pay.`;
    setToast({ tone: 'success', message: successMsg });
    setTitle('Streak Surge');
    setSenderName('Nova Host');
    setReceiverName('Open slot');
    setAmountUsd('180');
    setGame('Arc Runner');
    setTargetType('rounds');
    setTargetValue('12');
    setDeadlineAt(toDatetimeLocalValue(Date.now() + DAY_MS * 2));
  };

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[260px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <HubSkeletonCard lines={6} className="min-h-[420px]" />
            <HubSkeletonCard lines={8} className="min-h-[560px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={`fixed right-4 top-24 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${
              toast.tone === 'success'
                ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#d2f8de]'
                : 'border-[#f87171]/30 bg-[#f87171]/10 text-[#fee2e2]'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Challenge Pay</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Mock escrow + proof flow</HubBadge>
          </div>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">Arc Challenge Pay</h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
            Create local challenges, accept them, update progress, attach proof, and settle rewards in the browser
            only. No backend or wallet wiring is involved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/game/lucky" className="secondary-button">
              Open Lucky
              <ArrowRight size={15} />
            </Link>
            <Link href="/game/quiz-pot" className="secondary-button">
              Quiz Pot
            </Link>
            <Link href="/game/history" className="secondary-button">
              History
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ShareButtons title="Arc Challenge Pay" />
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <HubMetricCard label="Active" value={stats.active} icon={Clock3} />
          <HubMetricCard label="Won" value={stats.won} icon={BadgeCheck} />
          <HubMetricCard label="Expired" value={stats.expired} icon={TimerReset} />
          <HubMetricCard label="Accepted" value={stats.accepted} icon={Users} />
          <HubMetricCard label="Reward Pool" value={formatGameAmount(stats.rewardPool)} icon={Coins} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            {sortedChallenges.length > 0 ? (
              sortedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  now={now}
                  onClaim={(challengeId) => {
                    if (claimChallengeReward(challengeId)) {
                      setToast({ tone: 'success', message: 'Reward claimed and archived locally.' });
                    }
                  }}
                />
              ))
            ) : (
              <HubEmptyState
                icon={CircleDashed}
                title="No challenges yet"
                description="The local store is empty. Use the create form to add the first mock challenge and start the flow."
              />
            )}
          </div>

          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Create challenge</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">New mock challenge</h2>
                </div>
                <Plus size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCreateChallenge}>
                <label className="block">
                  <span className={hubLabelClass}>Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={`${hubInputClass} mt-2 w-full`}
                    placeholder="Streak Surge"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={hubLabelClass}>Sender</span>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(event) => setSenderName(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                      placeholder="Nova Host"
                    />
                  </label>
                  <label className="block">
                    <span className={hubLabelClass}>Receiver</span>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(event) => setReceiverName(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                      placeholder="Open slot"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={hubLabelClass}>Amount USD</span>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={amountUsd}
                      onChange={(event) => setAmountUsd(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                    />
                  </label>
                  <label className="block">
                    <span className={hubLabelClass}>Deadline</span>
                    <input
                      type="datetime-local"
                      value={deadlineAt}
                      onChange={(event) => setDeadlineAt(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={hubLabelClass}>Game</span>
                    <input
                      type="text"
                      value={game}
                      onChange={(event) => setGame(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                      placeholder="Arc Runner"
                    />
                  </label>
                  <label className="block">
                    <span className={hubLabelClass}>Target Type</span>
                    <input
                      type="text"
                      value={targetType}
                      onChange={(event) => setTargetType(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                      placeholder="rounds"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={hubLabelClass}>Target Value</span>
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={targetValue}
                    onChange={(event) => setTargetValue(event.target.value)}
                    className={`${hubInputClass} mt-2 w-full`}
                  />
                </label>

                <button type="submit" disabled={txPending} className="primary-button w-full justify-center disabled:opacity-60">
                  {txPending ? 'Confirming transaction…' : 'Create Challenge'}
                  <Sparkles size={15} />
                </button>
              </form>
            </HubCard>

            <GameProgressPanel
              snapshot={progress}
              description="XP, streaks, and archive totals are derived from the same local challenge and lucky card store."
            />

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Game links</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Move across the hub</h2>
                </div>
                <Flame size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 transition-colors hover:border-[#d4af37]/30 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{link.label}</span>
                      <span className="block text-xs leading-6 text-[#555566]">{link.description}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-[#d4af37]" />
                  </Link>
                ))}
              </div>
            </HubCard>
          </div>
        </div>
      </div>
    </section>
  );
}
