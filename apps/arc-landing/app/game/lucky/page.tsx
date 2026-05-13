'use client';

import { ArrowRight, BadgeCheck, Clock3, Coins, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard, HubEmptyState, HubMetricCard, HubSkeletonCard } from '@/components/HubPrimitives';
import {
  formatGameAmount,
  getLuckyPackRevealLabel,
  useGameStore,
} from '@/lib/gameStore';
import type { LuckyReveal } from '@/lib/gameStore';

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function getPackTierSummary(tiers: { amount: number; weight: number }[]): string {
  return tiers
    .map((tier) => `${formatGameAmount(tier.amount)} - ${tier.weight}%`)
    .join(' / ');
}

export default function GameLuckyPage() {
  const { luckyPacks, openLuckyPack, claimLuckyPack } = useGameStore();
  const hydrated = useHydrated();
  const [lastReveal, setLastReveal] = useState<LuckyReveal | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const sortedPacks = useMemo(() => {
    const rank: Record<string, number> = {
      pending: 0,
      opened: 1,
      claimed: 2,
    };

    return [...luckyPacks].sort((a, b) => rank[a.status] - rank[b.status] || b.baseAmount - a.baseAmount || a.title.localeCompare(b.title));
  }, [luckyPacks]);

  const initialRevealPack = useMemo(() => {
    return sortedPacks.find((pack) => pack.status !== 'pending' || typeof pack.openedAmount === 'number') ?? null;
  }, [sortedPacks]);

  const revealPack = useMemo(() => {
    if (selectedPackId) {
      return luckyPacks.find((pack) => pack.id === selectedPackId) ?? null;
    }

    return initialRevealPack;
  }, [initialRevealPack, luckyPacks, selectedPackId]);

  const revealData = useMemo<LuckyReveal | null>(() => {
    if (lastReveal) {
      return lastReveal;
    }

    if (revealPack?.openedAmount !== undefined) {
      return {
        packId: revealPack.id,
        amount: revealPack.openedAmount,
        tier: { amount: revealPack.openedAmount, weight: 0 },
      };
    }

    return null;
  }, [lastReveal, revealPack]);

  const stats = useMemo(() => {
    const pending = luckyPacks.filter((pack) => pack.status === 'pending');
    const opened = luckyPacks.filter((pack) => pack.status === 'opened');
    const claimed = luckyPacks.filter((pack) => pack.status === 'claimed');
    const highestReveal = luckyPacks.reduce((max, pack) => Math.max(max, pack.openedAmount ?? 0), 0);

    return {
      pending: pending.length,
      opened: opened.length,
      claimed: claimed.length,
      highestReveal,
    };
  }, [luckyPacks]);

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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <HubSkeletonCard lines={5} className="min-h-[360px]" />
            <HubSkeletonCard lines={4} className="min-h-[360px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">Lucky</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Weighted reveal</HubBadge>
          </div>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
            Lucky cards
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            Open a card, let the tier weights decide the reveal amount, and keep the result in the local mock
            store. The experience is purely demo-only.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Pending" value={stats.pending} icon={Sparkles} />
          <HubMetricCard label="Opened" value={stats.opened} icon={Clock3} />
          <HubMetricCard label="Claimed" value={stats.claimed} icon={BadgeCheck} />
          <HubMetricCard label="Highest Reveal" value={formatGameAmount(stats.highestReveal)} icon={Coins} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            {sortedPacks.length > 0 ? (
              sortedPacks.map((pack) => {
                const isPending = pack.status === 'pending';
                const isOpened = pack.status === 'opened';
                const isClaimed = pack.status === 'claimed';

                return (
                  <HubCard key={pack.id} as="article" className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <HubBadge
                            className={
                              isPending
                                ? 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]'
                                : isOpened
                                  ? 'border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#dbeafe]'
                                  : 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                            }
                          >
                            {getLuckyPackRevealLabel(pack)}
                          </HubBadge>
                          <HubBadge>{pack.title}</HubBadge>
                          <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-white">
                            Base {formatGameAmount(pack.baseAmount)} USDC
                          </HubBadge>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black uppercase sm:text-3xl">{pack.title}</h2>
                          <p className="max-w-3xl text-sm leading-7 text-[#9a9a9a]">
                            The weights below control the reveal. Higher weights appear more often while the card stays fully local.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-right">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Status</p>
                        <p className="mt-1 text-sm font-semibold text-white">{pack.status.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Tier pool</div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          {pack.tiers.map((tier) => (
                            <div
                              key={`${pack.id}-${tier.amount}`}
                              className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-3 py-3"
                            >
                              <div className="text-sm font-semibold text-white">{formatGameAmount(tier.amount)} USDC</div>
                              <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                                Weight {tier.weight}%
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-xs leading-6 text-[#777]">
                          Weighted summary: {getPackTierSummary(pack.tiers)}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          type="button"
                          className="bracket-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-45"
                          onClick={() => {
                            const reveal = openLuckyPack(pack.id);
                            if (reveal) {
                              setSelectedPackId(pack.id);
                              setLastReveal(reveal);
                            }
                          }}
                          disabled={!isPending}
                          aria-label={`Open lucky card ${pack.title}`}
                        >
                          Open Card <ArrowRight size={14} />
                        </button>
                        {isOpened ? (
                          <button
                            type="button"
                            className="primary-button w-full"
                            onClick={() => claimLuckyPack(pack.id)}
                            aria-label={`Claim lucky card ${pack.title}`}
                          >
                            Claim Reward
                          </button>
                        ) : isClaimed ? (
                          <div className="rounded-2xl border border-[#30d158]/20 bg-[#30d158]/10 px-4 py-3 text-center text-sm text-[#a6f4bf]">
                            Claimed
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-[#2a2a2a] bg-black/20 px-4 py-3 text-center text-sm text-[#777]">
                            Open this card to reveal the weighted amount.
                          </div>
                        )}
                      </div>
                    </div>
                  </HubCard>
                );
              })
            ) : (
              <HubEmptyState
                icon={Sparkles}
                title="No lucky cards"
                description="There are no mock lucky packs in the store yet. Add a local pack collection and the list will render here."
              />
            )}
          </div>

          <HubCard as="aside" className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Reveal panel</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Result card</h2>
              </div>
              <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f0d79e]">Demo only</HubBadge>
            </div>

            {revealData && revealPack ? (
              <div className="mt-6 rounded-3xl border border-[#2a2a2a] bg-black/30 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Open result</p>
                <h3 className="mt-4 text-4xl font-black uppercase text-[#c9a84c] sm:text-5xl">
                  {formatGameAmount(revealData.amount)} USDC
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#9a9a9a]">
                  {revealPack.title} returned {formatGameAmount(revealData.amount)} from the weighted tier pool.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Tier hit</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {formatGameAmount(revealData.tier.amount)} USDC
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Card status</div>
                    <div className="mt-2 text-sm font-semibold text-white">{revealPack.status.toUpperCase()}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <HubBadge>{revealPack.title}</HubBadge>
                  <HubBadge>{revealPack.baseAmount} base</HubBadge>
                  <HubBadge>{revealData.tier.weight === 0 ? 'Stored reveal' : `Weight ${revealData.tier.weight}%`}</HubBadge>
                </div>
                {revealPack.status === 'opened' ? (
                  <button
                    type="button"
                    className="primary-button mt-6 w-full"
                    onClick={() => claimLuckyPack(revealPack.id)}
                    aria-label={`Claim reward for ${revealPack.title}`}
                  >
                    Claim Reward
                  </button>
                ) : null}
              </div>
            ) : (
              <HubEmptyState
                icon={Sparkles}
                title="Open a card"
                description="Pick any pending pack on the left to reveal the weighted result. The amount appears here immediately after the draw."
                className="mt-6"
              />
            )}

            <p className="mt-5 text-sm leading-7 text-[#777]">
              Demo only. No real funds, backend calls, or contract interactions are used in this phase.
            </p>
          </HubCard>
        </div>
      </div>
    </section>
  );
}
