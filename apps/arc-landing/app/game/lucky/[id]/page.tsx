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
  Clock3,
  Coins,
  FileText,
  Flame,
  Gem,
  Sparkles,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GameProgressPanel from '@/components/GameProgressPanel';
import { HubBadge, HubCard, HubEmptyState, HubSkeletonCard } from '@/components/HubPrimitives';
import {
  buildGameProgressSnapshot,
  formatGameAmount,
  formatGameTimestamp,
  formatTimeLeft,
  getLuckyPackRarity,
  getLuckyPackRevealLabel,
  resolveLuckyPackStatus,
  useGameStore,
  type LuckyPack,
} from '@/lib/gameStore';
import LuckyPackNotFound from './not-found';

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

function statusTone(status: ReturnType<typeof resolveLuckyPackStatus>) {
  switch (status) {
    case 'opened':
      return 'border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#dbeafe]';
    case 'claimed':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'expired':
      return 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fde68a]';
    case 'pending':
    default:
      return 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]';
  }
}

function rarityTone(rarity: ReturnType<typeof getLuckyPackRarity>) {
  switch (rarity) {
    case 'legendary':
      return 'border-[#a855f7]/35 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(201,168,76,0.08)_55%,rgba(255,255,255,0.02))] shadow-[0_24px_70px_rgba(168,85,247,0.12)]';
    case 'gold':
      return 'border-[#c9a84c]/35 bg-[linear-gradient(135deg,rgba(201,168,76,0.16),rgba(255,255,255,0.02)_55%,rgba(201,168,76,0.08))] shadow-[0_24px_70px_rgba(201,168,76,0.12)]';
    case 'bronze':
    default:
      return 'border-[#8b5e34]/35 bg-[linear-gradient(135deg,rgba(139,94,52,0.16),rgba(255,255,255,0.02)_55%,rgba(139,94,52,0.08))] shadow-[0_24px_70px_rgba(139,94,52,0.12)]';
  }
}

function statusIcon(status: ReturnType<typeof resolveLuckyPackStatus>) {
  switch (status) {
    case 'opened':
      return CircleCheckBig;
    case 'claimed':
      return BadgeCheck;
    case 'expired':
      return TimerReset;
    case 'pending':
    default:
      return CircleDashed;
  }
}

function getCountdownCopy(pack: LuckyPack, now: number) {
  const status = resolveLuckyPackStatus(pack, now);

  if (status === 'pending') {
    return {
      label: 'Expires in',
      value: formatTimeLeft(Math.max(0, pack.expiresAt - now)),
    };
  }

  return {
    label: status === 'expired' ? 'Expired on' : status === 'claimed' ? 'Claimed on' : 'Opened on',
    value: formatGameTimestamp(status === 'expired' ? pack.expiresAt : pack.openedAt ?? pack.claimedAt ?? pack.createdAt),
  };
}

function getProbabilityRows(pack: LuckyPack) {
  const totalWeight = pack.tiers.reduce((sum, tier) => sum + tier.weight, 0);

  return {
    totalWeight,
    rows: pack.tiers.map((tier) => ({
      ...tier,
      chance: totalWeight > 0 ? Math.max(0, Math.round((tier.weight / totalWeight) * 1000) / 10) : 0,
    })),
  };
}

function TimelineRow({ pack }: { pack: LuckyPack }) {
  const iconByKind: Record<string, typeof FileText> = {
    created: FileText,
    opened: Sparkles,
    claimed: BadgeCheck,
    expired: TimerReset,
  };

  return (
    <div className="divide-y divide-[#2a2a2a]">
      {pack.timeline.map((event) => {
        const Icon = iconByKind[event.kind] ?? FileText;
        return (
          <div key={event.id} className="grid gap-3 px-5 py-4 md:grid-cols-[160px_110px_minmax(0,1fr)] md:items-center">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{formatGameTimestamp(event.createdAt)}</div>
              <div className="mt-1 text-xs text-[#777]">Recorded locally</div>
            </div>
            <div className="min-w-0">
              <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">{event.kind}</HubBadge>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Icon size={14} className="text-[#c9a84c]" aria-hidden="true" />
                {event.title}
              </div>
              <div className="mt-1 text-sm leading-7 text-[#9a9a9a]">{event.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProbabilityPanel({ pack }: { pack: LuckyPack }) {
  const { totalWeight, rows } = useMemo(() => getProbabilityRows(pack), [pack]);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Probability</p>
          <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Disclosure panel</h2>
        </div>
        <Sparkles size={18} className="text-[#c9a84c]" aria-hidden="true" />
      </div>
      <div className="mt-6 space-y-3">
        {rows.map((tier, index) => (
          <div key={`${pack.id}-${tier.amount}-${tier.weight}`} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Tier {index + 1}</div>
              <div className="text-sm font-semibold text-[#f0d79e]">{formatGameAmount(tier.amount)} USDC</div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Weight {tier.weight}%</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Chance {tier.chance}%</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                Weighted against {totalWeight || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-7 text-[#9a9a9a]">
        The weighted reveal uses the configured tier weights only. No contract execution or wallet dependency is involved.
      </p>
    </HubCard>
  );
}

function RelatedPackCard({ pack }: { pack: LuckyPack }) {
  const status = resolveLuckyPackStatus(pack);
  const rarity = getLuckyPackRarity(pack);
  const StatusIcon = statusIcon(status);

  return (
    <HubCard as="article" className={`p-5 ${rarityTone(rarity)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {getLuckyPackRevealLabel(pack)}
            </HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
          </div>
          <h3 className="text-xl font-black uppercase text-white">{pack.title}</h3>
          <p className="text-sm leading-6 text-[#777]">
            {pack.senderName} to {pack.receiverName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-[#f0d79e]">{formatGameAmount(pack.openedAmount ?? pack.baseAmount)}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
            {resolveLuckyPackStatus(pack) === 'pending' ? 'Pending' : 'Revealed'}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-[#9a9a9a]">
          {pack.tiers.length} tiers · {formatGameTimestamp(pack.createdAt)}
        </div>
        <Link href={`/game/lucky/${pack.id}`} className="bracket-button">
          View Pack
          <ArrowRight size={14} />
        </Link>
      </div>
    </HubCard>
  );
}

export default function LuckyDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const packId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { luckyPacks, openLuckyPack, claimLuckyPack } = useGameStore();
  const { hydrated, now } = useHydratedNow();
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const gameStore = useGameStore((state) => ({
    challenges: state.challenges,
    luckyPacks: state.luckyPacks,
    history: state.history,
  }));
  const progress = useMemo(() => buildGameProgressSnapshot(gameStore, now), [gameStore, now]);

  const pack = useMemo(() => luckyPacks.find((item) => item.id === packId) ?? null, [luckyPacks, packId]);

  const relatedPacks = useMemo(() => {
    if (!pack) {
      return [];
    }

    return [...luckyPacks]
      .filter((item) => item.id !== pack.id)
      .sort((a, b) => {
        const aScore = (getLuckyPackRarity(a) === getLuckyPackRarity(pack) ? 2 : 0) + (resolveLuckyPackStatus(a, now) === 'pending' ? 1 : 0);
        const bScore = (getLuckyPackRarity(b) === getLuckyPackRarity(pack) ? 2 : 0) + (resolveLuckyPackStatus(b, now) === 'pending' ? 1 : 0);
        if (aScore !== bScore) {
          return bScore - aScore;
        }

        return b.createdAt - a.createdAt;
      })
      .slice(0, 3);
  }, [luckyPacks, pack, now]);

  useEffect(() => {
    setFlash(false);
    if (!pack) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setFlash(true);
    });

    const timer = window.setTimeout(() => setFlash(false), 1200);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pack?.openedAt, pack?.claimedAt, pack?.id]);

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubSkeletonCard lines={4} className="min-h-[240px]" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <HubSkeletonCard lines={6} className="min-h-[520px]" />
            <HubSkeletonCard lines={8} className="min-h-[760px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!pack) {
    return <LuckyPackNotFound />;
  }

  const status = resolveLuckyPackStatus(pack, now);
  const rarity = getLuckyPackRarity(pack);
  const countdown = getCountdownCopy(pack, now);
  const StatusIcon = statusIcon(status);
  const revealAmount = pack.openedAmount ?? pack.baseAmount;
  const canOpen = status === 'pending';
  const canClaim = status === 'opened';

  const handleOpen = () => {
    const reveal = openLuckyPack(pack.id);
    if (reveal) {
      setToast({
        tone: 'success',
        message: `${formatGameAmount(reveal.amount)} revealed locally with a ${reveal.rarity} tier.`,
      });
    } else {
      setToast({ tone: 'error', message: 'This card can no longer be opened.' });
    }
  };

  const handleClaim = () => {
    if (claimLuckyPack(pack.id)) {
      setToast({ tone: 'success', message: 'Lucky reward claimed locally.' });
    } else {
      setToast({ tone: 'error', message: 'Lucky reward is not claimable yet.' });
    }
  };

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
            <Link href="/game/lucky" className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60">
              <ArrowLeft size={14} />
              Back to Lucky
            </Link>
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {status.toUpperCase()}
            </HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-white">Base {formatGameAmount(pack.baseAmount)} USDC</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Weighted reveal + claim flow</HubBadge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{pack.senderName} to {pack.receiverName}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">{pack.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
                Open the card to reveal the weighted amount, review the probability disclosure, and claim the reward once
                the pack has been opened.
              </p>
            </div>

            <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 px-5 py-4 text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">{countdown.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{countdown.value}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            <HubCard as="section" className={`p-6 sm:p-8 ${rarityTone(rarity)} ${flash ? 'ring-1 ring-[#c9a84c]/25' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Reveal card</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Strong result state</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <HubBadge className={statusTone(status)}>
                    {status === 'pending' ? 'Pending' : status === 'opened' ? 'Opened' : status === 'claimed' ? 'Claimed' : 'Expired'}
                  </HubBadge>
                  <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                    {pack.tiers.length} weighted tiers
                  </HubBadge>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-6 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Result</div>
                    <div className={`mt-4 text-4xl font-black sm:text-5xl ${status === 'pending' ? 'text-white' : 'text-[#f0d79e]'}`}>
                      {formatGameAmount(revealAmount)} USDC
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                        {status === 'pending' ? 'Waiting to open' : `Tier ${pack.openedTierIndex !== undefined ? pack.openedTierIndex + 1 : 1}`}
                      </HubBadge>
                      <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                        {status === 'pending' ? 'Unrevealed' : `${rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'} rarity`}
                      </HubBadge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Countdown</div>
                      <div className="mt-2 text-sm font-semibold text-white">{countdown.value}</div>
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Created</div>
                      <div className="mt-2 text-sm font-semibold text-white">{formatGameTimestamp(pack.createdAt)}</div>
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Opened</div>
                      <div className="mt-2 text-sm font-semibold text-white">{pack.openedAt ? formatGameTimestamp(pack.openedAt) : 'Not yet'}</div>
                    </div>
                    <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Claimed</div>
                      <div className="mt-2 text-sm font-semibold text-white">{pack.claimedAt ? formatGameTimestamp(pack.claimedAt) : 'Not yet'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-6 text-center">
                    <Gem size={32} className="mx-auto text-[#c9a84c]" aria-hidden="true" />
                    <div className="mt-4 text-xs font-mono uppercase tracking-[0.28em] text-[#777]">Rarity</div>
                    <div className="mt-2 text-2xl font-black uppercase text-white">
                      {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canOpen ? (
                      <button type="button" className="primary-button flex-1 justify-center" onClick={handleOpen}>
                        Open Card
                      </button>
                    ) : null}
                    {canClaim ? (
                      <button type="button" className="primary-button flex-1 justify-center" onClick={handleClaim}>
                        Claim Reward
                      </button>
                    ) : null}
                    {!canOpen && !canClaim ? (
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/20 px-4 py-3 text-center text-sm text-[#777]">
                        {status === 'claimed' ? 'Reward already claimed.' : status === 'expired' ? 'This pack expired.' : 'Open the card to reveal the amount.'}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
                      <ShieldCheck size={12} className="text-[#c9a84c]" aria-hidden="true" />
                      Demo only
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                      All results, claim states, and history entries remain local to the browser store for this feature pack.
                    </p>
                  </div>
                </div>
              </div>
            </HubCard>

            <HubCard as="section" className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-4 border-b border-[#2a2a2a] px-5 py-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Timeline</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Pack events</h2>
                </div>
                <Clock3 size={20} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <TimelineRow pack={pack} />
            </HubCard>

            <ProbabilityPanel pack={pack} />

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Pack details</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Metadata</h2>
                </div>
                <Coins size={18} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Sender', pack.senderName],
                  ['Receiver', pack.receiverName],
                  ['Status', getLuckyPackRevealLabel(pack)],
                  ['Expires', formatGameTimestamp(pack.expiresAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            </HubCard>

            <div className="grid gap-4 md:grid-cols-2">
              {relatedPacks.length > 0 ? (
                relatedPacks.map((item) => <RelatedPackCard key={item.id} pack={item} />)
              ) : (
                <HubEmptyState
                  icon={CircleDashed}
                  title="No related packs"
                  description="There are no other mock lucky cards in the store yet."
                  className="md:col-span-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Overview</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Lucky snapshot</h2>
                </div>
                <Flame size={18} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['Amount', formatGameAmount(revealAmount)],
                  ['Base', formatGameAmount(pack.baseAmount)],
                  ['Status', getLuckyPackRevealLabel(pack)],
                  ['Rarity', rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <span className="text-sm text-[#777]">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Draw rules</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Open and claim</h2>
                </div>
                <Sparkles size={18} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 flex flex-col gap-3">
                {canOpen ? (
                  <button type="button" onClick={handleOpen} className="primary-button w-full justify-center">
                    Open Card
                    <ArrowRight size={15} />
                  </button>
                ) : null}
                {canClaim ? (
                  <button type="button" onClick={handleClaim} className="primary-button w-full justify-center">
                    Claim Reward
                    <ArrowRight size={15} />
                  </button>
                ) : null}
                {!canOpen && !canClaim ? (
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/20 px-4 py-3 text-center text-sm text-[#777]">
                    {status === 'claimed' ? 'Reward already claimed.' : status === 'expired' ? 'This pack expired.' : 'Open the pack first to reveal the prize.'}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm text-[#9a9a9a]">
                The reveal uses the weighted tiers defined when the pack was created. The open result is kept in local state so the demo stays responsive.
              </div>
            </HubCard>

            <GameProgressPanel
              snapshot={progress}
              description="Lucky pack opens, claims, and streaks are shared across the whole Arc game hub."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
