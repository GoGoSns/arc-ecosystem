'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  CircleDashed,
  CircleX,
  Coins,
  FileText,
  Flame,
  LayoutList,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Target,
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
  HubSkeletonCard,
  hubInputClass,
  hubLabelClass,
  hubTextareaClass,
} from '@/components/HubPrimitives';
import { getArcAppUrl, isExternalUrl } from '@/lib/arcAppLinks';
import {
  buildGameProgressSnapshot,
  formatGameAmount,
  formatGameTimestamp,
  formatTargetType,
  formatTimeLeft,
  isChallengeClaimable,
  resolveChallengeStatus,
  useGameStore,
  type Challenge,
} from '@/lib/gameStore';
import { useWallet } from '@/contexts/WalletContext';
import { ShareButtons } from '@/components/ShareButtons';
import { payToAdmin, payFromAdmin, USE_REAL_TRANSFERS, explorerUrl } from '@/lib/usdcTransfer';
import ChallengeNotFound from './not-found';

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

function ChallengeStatusRing({ challenge, status }: { challenge: Challenge; status: ReturnType<typeof resolveChallengeStatus> }) {
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

function TimelineRow({ challenge }: { challenge: Challenge }) {
  const iconByKind: Record<string, typeof BadgeCheck> = {
    created: PencilLine,
    accepted: Users,
    progress: Target,
    proof: FileText,
    resolved: BadgeCheck,
    claimed: Coins,
  };

  return (
    <div className="divide-y divide-[#2a2a2a]">
      {challenge.timeline.map((event) => {
        const Icon = iconByKind[event.kind] ?? Sparkles;
        return (
          <div key={event.id} className="grid gap-3 px-5 py-4 md:grid-cols-[160px_110px_minmax(0,1fr)] md:items-center">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{formatGameTimestamp(event.createdAt)}</div>
              <div className="mt-1 text-xs text-[#555566]">Recorded locally</div>
            </div>
            <div className="min-w-0">
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{event.kind}</HubBadge>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon size={14} className="text-[#d4af37]" aria-hidden="true" />
                {event.title}
              </div>
              <div className="mt-1 text-sm leading-7 text-[#8a8a9a]">{event.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RelatedChallengeCard({ challenge }: { challenge: Challenge }) {
  const status = resolveChallengeStatus(challenge);
  const deadline = getDeadlineCopy(challenge, Date.now());
  const StatusIcon = statusIcon(status);

  return (
    <HubCard as="article" className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {status.toUpperCase()}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{challenge.game}</HubBadge>
          </div>
          <h3 className="text-xl font-black uppercase text-white">{challenge.title}</h3>
          <p className="text-sm leading-6 text-[#555566]">
            {challenge.senderName} to {challenge.receiverName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-[#f0d79e]">{formatGameAmount(challenge.rewardUsd)}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{deadline.label}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-[#8a8a9a]">
          {challenge.currentProgress}/{challenge.targetValue} {formatTargetType(challenge.targetType)}
        </div>
        <Link href={`/game/challenge/${challenge.id}`} className="bracket-button">
          View Challenge
          <ArrowRight size={14} />
        </Link>
      </div>
    </HubCard>
  );
}

export default function ChallengeDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const challengeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { challenges, updateChallengeProgress, submitChallengeProof, setChallengeOutcome, acceptChallenge, claimChallengeReward } = useGameStore();
  const addBalance = useGameStore((state) => state.addBalance);
  const deductBalance = useGameStore((state) => state.deductBalance);
  const { address, isConnected } = useWallet();
  const { hydrated, now } = useHydratedNow();
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [txPending, setTxPending] = useState(false);
  const [joinerName, setJoinerName] = useState('You');
  const [progressStep, setProgressStep] = useState('2');
  const [proofNote, setProofNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');

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

  const challenge = useMemo(
    () => challenges.find((item) => item.id === challengeId) ?? null,
    [challengeId, challenges],
  );

  const relatedChallenges = useMemo(() => {
    if (!challenge) {
      return [];
    }

    return [...challenges]
      .filter((item) => item.id !== challenge.id)
      .sort((a, b) => {
        const aScore = (a.game === challenge.game ? 2 : 0) + (resolveChallengeStatus(a, now) === 'open' ? 1 : 0);
        const bScore = (b.game === challenge.game ? 2 : 0) + (resolveChallengeStatus(b, now) === 'open' ? 1 : 0);
        if (aScore !== bScore) {
          return bScore - aScore;
        }

        return b.createdAt - a.createdAt;
      })
      .slice(0, 3);
  }, [challenge, challenges, now]);

  useEffect(() => {
    setJoinerName(challenge?.receiverName === 'Open slot' ? 'You' : challenge?.receiverName ?? 'You');
    setProgressStep('2');
    setProofNote(challenge?.proofNote ?? '');
    setProofUrl(challenge?.proofUrl ?? '');
  }, [challenge?.id]);

  const status = challenge ? resolveChallengeStatus(challenge, now) : 'open';
  const deadline = challenge ? getDeadlineCopy(challenge, now) : { label: 'Countdown', value: '--' };
  const StatusIcon = statusIcon(status);
  const claimable = challenge ? isChallengeClaimable(challenge, now) : false;
  const arcPayUrl = challenge ? getArcAppUrl('pay', `/game/challenge/${challenge.id}`) : null;
  const arcPayExternal = arcPayUrl ? isExternalUrl(arcPayUrl) : false;

  const handleToast = (tone: 'success' | 'error', message: string) => {
    setToast({ tone, message });
  };

  const handleAccept = async () => {
    if (!challenge) return;
    if (!isConnected || !address) {
      handleToast('error', 'Connect your wallet to accept this challenge.');
      return;
    }
    setTxPending(true);
    
    try {
      const tx = await payToAdmin(challenge.amountUsd);
      setTxPending(false);
      
      if (!tx.success) {
        handleToast('error', tx.error ?? 'Transaction failed. Please try again.');
        return;
      }

      // Update mock balance for UI (happens in both modes as per requirements)
      if (!deductBalance(address, challenge.amountUsd)) {
        if (!USE_REAL_TRANSFERS) {
          handleToast('error', 'Insufficient balance (Demo Mode).');
          return;
        }
      }

      if (acceptChallenge(challenge.id, joinerName.trim() || 'You')) {
        const msg = !USE_REAL_TRANSFERS
          ? 'Challenge accepted! (Demo mode)'
          : `Challenge accepted! View on Arcscan: ${tx.explorerUrl}`;
        handleToast('success', msg);
      } else {
        handleToast('error', 'This challenge can no longer be accepted.');
      }
    } catch (e: any) {
      setTxPending(false);
      handleToast('error', e?.message || 'Transaction failed');
    }
  };

  const handleProgress = () => {
    if (!challenge) {
      return;
    }

    const step = Number(progressStep);
    if (!Number.isFinite(step) || step <= 0) {
      handleToast('error', 'Enter a valid progress step.');
      return;
    }

    updateChallengeProgress(challenge.id, step);
    handleToast('success', 'Progress updated in the local store.');
  };

  const handleProof = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!challenge) {
      return;
    }

    if (!proofNote.trim()) {
      handleToast('error', 'Write a proof note before submitting.');
      return;
    }

    if (submitChallengeProof(challenge.id, proofNote, proofUrl)) {
      handleToast('success', 'Proof saved locally.');
    } else {
      handleToast('error', 'Proof could not be saved for this challenge.');
    }
  };

  const handleSetOutcome = (outcome: 'won' | 'lost') => {
    if (!challenge) {
      return;
    }

    if (setChallengeOutcome(challenge.id, outcome)) {
      handleToast('success', outcome === 'won' ? 'Challenge marked passed.' : 'Challenge marked failed.');
    } else {
      handleToast('error', 'Outcome could not be changed.');
    }
  };

  const handleClaim = async () => {
    if (!challenge) return;
    if (!isConnected || !address) {
      handleToast('error', 'Connect your wallet to claim this reward.');
      return;
    }
    setTxPending(true);
    
    try {
      const tx = await payFromAdmin(address, challenge.rewardUsd);
      setTxPending(false);
      
      if (!tx.success) {
        handleToast('error', tx.error ?? 'Transaction failed. Please try again.');
        return;
      }

      if (claimChallengeReward(challenge.id)) {
        // Update mock balance for UI
        addBalance(address, challenge.rewardUsd);
        
        const msg = !USE_REAL_TRANSFERS
          ? `Reward of $${challenge.rewardUsd} claimed! (Demo mode)`
          : `Reward claimed! View on Arcscan: ${tx.explorerUrl}`;
        handleToast('success', msg);
      } else {
        handleToast('error', 'Reward is not claimable yet.');
      }
    } catch (e: any) {
      setTxPending(false);
      handleToast('error', e?.message || 'Transaction failed');
    }
  };

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubSkeletonCard lines={4} className="min-h-[240px]" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <HubSkeletonCard lines={6} className="min-h-[520px]" />
            <HubSkeletonCard lines={8} className="min-h-[780px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!challenge) {
    return <ChallengeNotFound />;
  }

  const resolvedStatus = resolveChallengeStatus(challenge, now);
  const percent = getProgressPercent(challenge);

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

        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/game/challenge" className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60">
              <ArrowLeft size={14} />
              Back to Challenge
            </Link>
            <HubBadge className={statusTone(resolvedStatus)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {resolvedStatus.toUpperCase()}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{challenge.game}</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">{formatGameAmount(challenge.rewardUsd)} USDC</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Protected checkout (demo)</HubBadge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{challenge.senderName} to {challenge.receiverName}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">{challenge.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              Reach {challenge.targetValue} {formatTargetType(challenge.targetType)} before the deadline, submit proof, and claim the reward when the admin toggle marks the challenge as passed.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ShareButtons title={challenge.title} />
            </div>
          </div>

            <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 px-5 py-4 text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">{deadline.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{deadline.value}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Status card</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Live challenge state</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <HubBadge className={statusTone(resolvedStatus)}>
                    {resolvedStatus === 'won' ? 'Won' : resolvedStatus === 'lost' ? 'Lost' : resolvedStatus === 'expired' ? 'Expired' : 'Open'}
                  </HubBadge>
                  {challenge.acceptedAt ? (
                    <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">Accepted</HubBadge>
                  ) : (
                    <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Awaiting acceptance</HubBadge>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                    <span>
                      Progress {challenge.currentProgress}/{challenge.targetValue}
                    </span>
                    <span>{percent}% complete</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${
                        resolvedStatus === 'won'
                          ? 'bg-[linear-gradient(90deg,#30d158,#9ff0b8)]'
                          : resolvedStatus === 'lost'
                            ? 'bg-[linear-gradient(90deg,#f87171,#fda4af)]'
                            : resolvedStatus === 'expired'
                              ? 'bg-[linear-gradient(90deg,#f59e0b,#fcd34d)]'
                              : 'bg-[linear-gradient(90deg,#d4af37,#f0d79e)]'
                      }`}
                      style={{ width: `${percent}%` }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={challenge.targetValue}
                      aria-valuenow={challenge.currentProgress}
                      aria-label={`${challenge.title} progress`}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Reward</div>
                      <div className="mt-2 text-lg font-black text-[#f0d79e]">{formatGameAmount(challenge.rewardUsd)} USDC</div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Target</div>
                      <div className="mt-2 text-lg font-black text-white">
                        {challenge.targetValue} {formatTargetType(challenge.targetType)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Game</div>
                      <div className="mt-2 text-lg font-black text-white">{challenge.game}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Created</div>
                      <div className="mt-2 text-lg font-black text-white">{formatGameTimestamp(challenge.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <ChallengeStatusRing challenge={challenge} status={resolvedStatus} />
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{deadline.label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{deadline.value}</div>
                  </div>
                  {arcPayUrl ? (
                    <a
                      href={arcPayUrl}
                      target={arcPayExternal ? '_blank' : undefined}
                      rel={arcPayExternal ? 'noopener noreferrer' : undefined}
                      className="primary-button w-full justify-center"
                    >
                      Pay with Arc Pay
                      <ArrowRight size={15} />
                    </a>
                  ) : (
                    <span aria-disabled="true" className="primary-button w-full cursor-not-allowed justify-center opacity-50">
                      Pay with Arc Pay
                      <ArrowRight size={15} />
                    </span>
                  )}
                  <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                      <ShieldCheck size={12} className="text-[#d4af37]" aria-hidden="true" />
                      Protected checkout (demo)
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#8a8a9a]">
                      The Arc Pay handoff stays configurable through environment variables and never hardcodes a local URL.
                    </p>
                  </div>
                </div>
              </div>
            </HubCard>

            <HubCard as="section" className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-4 border-b border-[#1a1a2e] px-5 py-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Timeline</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Challenge events</h2>
                </div>
                <LayoutList size={20} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <TimelineRow challenge={challenge} />
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Metadata</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Challenge details</h2>
                </div>
                <Trophy size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Sender', challenge.senderName],
                  ['Receiver', challenge.receiverName],
                  ['Created', formatGameTimestamp(challenge.createdAt)],
                  ['Resolved', challenge.resolvedAt ? formatGameTimestamp(challenge.resolvedAt) : 'Not yet'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-[#8a8a9a]">
                Proof notes, progress changes, and admin toggles all stay in the browser store. The page keeps keyboard
                focus states and responsive spacing intact so the demo remains readable on mobile.
              </p>
            </HubCard>

            <div className="grid gap-4 md:grid-cols-2">
              {relatedChallenges.length > 0 ? (
                relatedChallenges.map((item) => <RelatedChallengeCard key={item.id} challenge={item} />)
              ) : (
                <HubEmptyState
                  icon={CircleDashed}
                  title="No related challenges"
                  description="There are no other mock challenge cards to link from this record yet."
                  className="md:col-span-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Join challenge</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Accept flow</h2>
                </div>
                <Users size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <label className="mt-6 block">
                <span className={hubLabelClass}>Joiner name</span>
                <input
                  type="text"
                  value={joinerName}
                  onChange={(event) => setJoinerName(event.target.value)}
                  className={`${hubInputClass} mt-2 w-full`}
                  placeholder="You"
                />
              </label>
              <button
                type="button"
                onClick={handleAccept}
                disabled={Boolean(challenge.acceptedAt) || resolvedStatus !== 'open' || txPending}
                className="primary-button mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-45"
              >
                {txPending ? 'Confirming…' : challenge.acceptedAt ? 'Accepted' : 'Accept Challenge'}
                <ArrowRight size={15} />
              </button>
              <p className="mt-3 text-sm leading-7 text-[#555566]">
                Accepting the challenge updates the local timeline and unlocks the progress controls.
              </p>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Progress</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Manual updates</h2>
                </div>
                <Flame size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <label className="mt-6 block">
                <span className={hubLabelClass}>Progress step</span>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={progressStep}
                  onChange={(event) => setProgressStep(event.target.value)}
                  className={`${hubInputClass} mt-2 w-full`}
                />
              </label>
              <button
                type="button"
                onClick={handleProgress}
                disabled={resolvedStatus !== 'open'}
                className="bracket-button mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-45"
              >
                Update Progress
                <ArrowRight size={14} />
              </button>
              <div className="mt-3 rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-sm text-[#8a8a9a]">
                {challenge.acceptedAt ? 'Progress updates are recorded against the accepted challenge.' : 'Accept the challenge first to signal the live run.'}
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Proof</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Submit evidence</h2>
                </div>
                <FileText size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleProof}>
                <label className="block">
                  <span className={hubLabelClass}>Proof note</span>
                  <textarea
                    value={proofNote}
                    onChange={(event) => setProofNote(event.target.value)}
                    className={`${hubTextareaClass} mt-2 w-full`}
                    placeholder="Short proof summary"
                  />
                </label>
                <label className="block">
                  <span className={hubLabelClass}>Proof link</span>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(event) => setProofUrl(event.target.value)}
                    className={`${hubInputClass} mt-2 w-full`}
                    placeholder="https://example.com/proof"
                  />
                </label>
                <button type="submit" className="primary-button w-full justify-center">
                  Submit Proof
                  <Sparkles size={15} />
                </button>
              </form>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Admin</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Outcome toggle</h2>
                </div>
                <BadgeCheck size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSetOutcome('won')}
                  className="primary-button justify-center"
                >
                  Mark Passed
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOutcome('lost')}
                  className="secondary-button justify-center"
                >
                  Mark Failed
                </button>
              </div>
              <div className="mt-3 rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-sm text-[#8a8a9a]">
                Admin toggles are local-only and let you demonstrate both the pass and fail states without any backend dependency.
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Claim</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Reward settlement</h2>
                </div>
                <Coins size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={handleClaim}
                disabled={(!claimable && resolvedStatus !== 'won') || txPending}
                className="mt-6 primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-45"
              >
                {txPending ? 'Confirming…' : 'Claim Reward'}
                <ArrowRight size={15} />
              </button>
              <p className="mt-3 text-sm leading-7 text-[#555566]">
                Claiming updates the local challenge archive and keeps the reward flow inside the browser.
              </p>
            </HubCard>

            <GameProgressPanel
              snapshot={progress}
              description="The same mock store powers the hub, progress panel, and challenge settlement history."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
