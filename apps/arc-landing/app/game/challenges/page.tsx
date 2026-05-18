'use client';

import { ArrowRight, BadgeCheck, CircleDashed, Clock3, TimerReset, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard, HubEmptyState, HubMetricCard, HubSkeletonCard } from '@/components/HubPrimitives';
import {
  formatGameAmount,
  formatGameTimestamp,
  formatTargetType,
  formatTimeLeft,
  isChallengeClaimable,
  resolveChallengeStatus,
  useGameStore,
} from '@/lib/gameStore';

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
    default:
      return 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]';
  }
}

export default function GameChallengesPage() {
  const { challenges, updateChallengeProgress, claimChallengeReward } = useGameStore();
  const { hydrated, now } = useHydratedNow();

  const orderedChallenges = useMemo(() => {
    const statusRank: Record<string, number> = {
      open: 0,
      won: 1,
      expired: 2,
      lost: 3,
    };

    return [...challenges].sort((a, b) => {
      const statusDiff = statusRank[resolveChallengeStatus(a, now)] - statusRank[resolveChallengeStatus(b, now)];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return a.deadlineAt - b.deadlineAt || a.title.localeCompare(b.title);
    });
  }, [challenges, now]);

  const stats = useMemo(() => {
    const active = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'open');
    const won = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'won');
    const closed = challenges.filter((challenge) => {
      const status = resolveChallengeStatus(challenge, now);
      return status === 'lost' || status === 'expired' || status === 'won';
    });

    return {
      active: active.length,
      won: won.length,
      closed: closed.length,
      rewardPool: challenges.reduce((sum, challenge) => sum + challenge.rewardUsd, 0),
    };
  }, [challenges, now]);

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[220px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <HubSkeletonCard lines={5} className="min-h-[240px]" />
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Challenges</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Countdown + progress</HubBadge>
          </div>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
            Challenge board
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
            Mock challenge cards with progress bars, deadline countdowns, and claim actions. Update progress
            locally, then claim a reward when the target is reached.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Active" value={stats.active} icon={Clock3} />
          <HubMetricCard label="Won" value={stats.won} icon={BadgeCheck} />
          <HubMetricCard label="Closed" value={stats.closed} icon={TimerReset} />
          <HubMetricCard label="Reward Pool" value={formatGameAmount(stats.rewardPool)} icon={Trophy} />
        </div>

        <div className="mt-6 space-y-5">
          {orderedChallenges.length > 0 ? (
            orderedChallenges.map((challenge) => {
              const resolvedStatus = resolveChallengeStatus(challenge, now);
              const claimable = isChallengeClaimable(challenge, now);
              const ratio = challenge.targetValue > 0 ? Math.min(100, Math.round((challenge.progress / challenge.targetValue) * 100)) : 0;
              const countdown = resolvedStatus === 'open' ? formatTimeLeft(Math.max(0, challenge.deadlineAt - now)) : formatGameTimestamp(challenge.deadlineAt);

              return (
                <HubCard key={challenge.id} as="article" className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <HubBadge className={statusTone(resolvedStatus)}>
                          {resolvedStatus.toUpperCase()}
                        </HubBadge>
                        <HubBadge>{challenge.game}</HubBadge>
                        <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">
                          {formatGameAmount(challenge.rewardUsd)} USDC
                        </HubBadge>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase sm:text-3xl">{challenge.title}</h2>
                        <p className="max-w-3xl text-sm leading-7 text-[#8a8a9a]">
                          Reach {challenge.targetValue} {formatTargetType(challenge.targetType)} to unlock the reward.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                        {resolvedStatus === 'open' ? 'Ends in' : 'Closed'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {resolvedStatus === 'open' ? countdown : countdown}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                        <span>Progress</span>
                        <span>
                          {challenge.progress}/{challenge.targetValue} {formatTargetType(challenge.targetType)}
                        </span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#d4af37,#f0d79e)] transition-[width] duration-300"
                          style={{ width: `${ratio}%` }}
                          role="progressbar"
                          aria-label={`${challenge.title} progress`}
                          aria-valuemin={0}
                          aria-valuemax={challenge.targetValue}
                          aria-valuenow={challenge.progress}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                          Target {formatTargetType(challenge.targetType)}
                        </span>
                        <span className="inline-flex rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                          Reward {formatGameAmount(challenge.rewardUsd)} USDC
                        </span>
                        <span className="inline-flex rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                          Deadline {resolvedStatus === 'open' ? countdown : formatGameTimestamp(challenge.deadlineAt)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        className="bracket-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => updateChallengeProgress(challenge.id, Math.max(1, Math.ceil(challenge.targetValue * 0.2)))}
                        disabled={resolvedStatus !== 'open'}
                        aria-label={`Update progress for ${challenge.title}`}
                      >
                        Update Progress <ArrowRight size={14} />
                      </button>
                      {claimable ? (
                        <button
                          type="button"
                          className="primary-button w-full"
                          onClick={() => claimChallengeReward(challenge.id)}
                          aria-label={`Claim reward for ${challenge.title}`}
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-[#1a1a2e] bg-black/20 px-4 py-3 text-center text-sm text-[#555566]">
                          {resolvedStatus === 'open' ? 'Reward unlocks when the target is met.' : 'Claiming is closed for this challenge.'}
                        </div>
                      )}
                    </div>
                  </div>
                </HubCard>
              );
            })
          ) : (
            <HubEmptyState
              icon={CircleDashed}
              title="No challenges available"
              description="The mock store does not contain any challenge cards yet. Add local challenge records and they will appear here immediately."
            />
          )}
        </div>
      </div>
    </section>
  );
}
