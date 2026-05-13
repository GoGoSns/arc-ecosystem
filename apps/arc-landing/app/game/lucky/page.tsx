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
  TimerReset,
  Sparkles,
  Gem,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  formatTimeLeft,
  getLuckyPackRarity,
  resolveLuckyPackStatus,
  useGameStore,
  type CreateLuckyPackInput,
  type LuckyPack,
  type LuckyTier,
} from '@/lib/gameStore';

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

function getProbabilityLabel(weight: number, totalWeight: number) {
  if (totalWeight <= 0) {
    return '0%';
  }

  return `${Math.max(0, Math.round((weight / totalWeight) * 1000) / 10)}%`;
}

function getCardLabel(status: ReturnType<typeof resolveLuckyPackStatus>, rarity: ReturnType<typeof getLuckyPackRarity>) {
  if (status === 'claimed') {
    return 'Claimed';
  }

  if (status === 'opened') {
    return 'Opened';
  }

  if (status === 'expired') {
    return 'Expired';
  }

  return rarity === 'legendary' ? 'Legendary Pending' : 'Pending';
}

function LuckyPackCard({
  pack,
  now,
  onOpen,
  onClaim,
}: {
  pack: LuckyPack;
  now: number;
  onOpen: (packId: string) => void;
  onClaim: (packId: string) => void;
}) {
  const status = resolveLuckyPackStatus(pack, now);
  const rarity = getLuckyPackRarity(pack);
  const countdown = getCountdownCopy(pack, now);
  const StatusIcon = statusIcon(status);
  const revealAmount = pack.openedAmount ?? pack.baseAmount;
  const totalWeight = pack.tiers.reduce((sum, tier) => sum + tier.weight, 0);
  const toneClass = rarityTone(rarity);

  return (
    <HubCard as="article" className={`p-6 sm:p-8 ${toneClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {getCardLabel(status, rarity)}
            </HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-white">
              Base {formatGameAmount(pack.baseAmount)} USDC
            </HubBadge>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase sm:text-3xl">{pack.title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#9a9a9a]">
              {pack.senderName} sent this pack to {pack.receiverName}. Open the card to reveal a weighted amount, then
              claim the reward once it has settled.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{countdown.label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{countdown.value}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
            <span>Tier pool</span>
            <span>{pack.tiers.length} weighted tiers</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {pack.tiers.map((tier) => (
              <div key={`${pack.id}-${tier.amount}-${tier.weight}`} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-3 py-3">
                <div className="text-sm font-semibold text-white">{formatGameAmount(tier.amount)} USDC</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                  Weight {tier.weight}% · {getProbabilityLabel(tier.weight, totalWeight)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs leading-6 text-[#777]">
            Weighted summary: {pack.tiers.map((tier) => `${formatGameAmount(tier.amount)} - ${tier.weight}%`).join(' / ')}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-6 text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Reveal</div>
            <div className={`mt-3 text-4xl font-black ${status === 'pending' ? 'text-white' : 'text-[#f0d79e]'}`}>
              {formatGameAmount(revealAmount)} USDC
            </div>
            <div className="mt-2 text-xs font-mono uppercase tracking-[0.22em] text-[#777]">
              {status === 'pending' ? 'Awaiting open' : `Tier ${pack.openedTierIndex !== undefined ? pack.openedTierIndex + 1 : 1}`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/game/lucky/${pack.id}`} className="bracket-button flex-1 justify-center">
              View Pack
              <ArrowRight size={14} />
            </Link>
            {status === 'pending' ? (
              <button type="button" className="primary-button flex-1 justify-center" onClick={() => onOpen(pack.id)}>
                Open Card
              </button>
            ) : null}
            {status === 'opened' ? (
              <button type="button" className="primary-button flex-1 justify-center" onClick={() => onClaim(pack.id)}>
                Claim Reward
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {pack.timeline.slice(-3).map((event) => (
          <HubBadge key={event.id} className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
            {event.kind}
          </HubBadge>
        ))}
      </div>
    </HubCard>
  );
}

export default function GameLuckyPage() {
  const { luckyPacks, createLuckyPack, openLuckyPack, claimLuckyPack } = useGameStore();
  const { hydrated, now } = useHydratedNow();
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [title, setTitle] = useState('Midnight Pack');
  const [senderName, setSenderName] = useState('Night Market');
  const [receiverName, setReceiverName] = useState('Open drawer');
  const [baseAmount, setBaseAmount] = useState('25');
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocalValue(Date.now() + DAY_MS * 2));
  const [tierDrafts, setTierDrafts] = useState([
    { amount: '25', weight: '55' },
    { amount: '45', weight: '25' },
    { amount: '90', weight: '15' },
    { amount: '200', weight: '5' },
  ]);

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

  const sortedPacks = useMemo(() => {
    const rank: Record<string, number> = {
      pending: 0,
      opened: 1,
      claimed: 2,
      expired: 3,
    };

    return [...luckyPacks].sort((a, b) => {
      const statusDiff = rank[resolveLuckyPackStatus(a, now)] - rank[resolveLuckyPackStatus(b, now)];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return b.createdAt - a.createdAt || a.title.localeCompare(b.title);
    });
  }, [luckyPacks, now]);

  const stats = useMemo(() => {
    const pending = luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'pending').length;
    const opened = luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'opened').length;
    const claimed = luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'claimed').length;
    const expired = luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'expired').length;
    const highestReveal = luckyPacks.reduce((max, pack) => Math.max(max, pack.openedAmount ?? 0), 0);

    return {
      pending,
      opened,
      claimed,
      expired,
      highestReveal,
    };
  }, [luckyPacks, now]);

  const handleCreatePack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedBaseAmount = Number(baseAmount);
    const parsedExpiresAt = new Date(expiresAt).getTime();

    if (!title.trim() || !senderName.trim()) {
      setToast({ tone: 'error', message: 'Fill in the title and sender before creating a pack.' });
      return;
    }

    if (!Number.isFinite(parsedBaseAmount) || parsedBaseAmount <= 0 || Number.isNaN(parsedExpiresAt)) {
      setToast({ tone: 'error', message: 'Base amount and expiry must be valid values.' });
      return;
    }

    const tiers: LuckyTier[] = tierDrafts
      .map((tier) => ({
        amount: Number(tier.amount),
        weight: Number(tier.weight),
      }))
      .filter((tier) => Number.isFinite(tier.amount) && Number.isFinite(tier.weight) && tier.weight > 0)
      .map((tier) => ({
        amount: Math.max(0, Math.round(tier.amount)),
        weight: Math.max(0, Math.round(tier.weight)),
      }));

    const created = createLuckyPack({
      title: title.trim(),
      senderName: senderName.trim(),
      receiverName: receiverName.trim() || 'Open drawer',
      baseAmount: parsedBaseAmount,
      tiers: tiers.length > 0 ? tiers : [{ amount: parsedBaseAmount, weight: 100 }],
      expiresAt: parsedExpiresAt,
    } satisfies CreateLuckyPackInput);

    setToast({ tone: 'success', message: `${created.title} was added to the lucky deck.` });
    setTitle('Midnight Pack');
    setSenderName('Night Market');
    setReceiverName('Open drawer');
    setBaseAmount('25');
    setExpiresAt(toDatetimeLocalValue(Date.now() + DAY_MS * 2));
    setTierDrafts([
      { amount: '25', weight: '55' },
      { amount: '45', weight: '25' },
      { amount: '90', weight: '15' },
      { amount: '200', weight: '5' },
    ]);
  };

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[240px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <HubSkeletonCard lines={6} className="min-h-[520px]" />
            <HubSkeletonCard lines={8} className="min-h-[860px]" />
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
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">Lucky Card</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Weighted reveal + claim flow</HubBadge>
          </div>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">Arc Lucky Card</h1>
          <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            Create weighted packs, open them with a local random draw, and claim the reveal once it has settled. Every
            interaction stays inside the browser store.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/game/challenge" className="secondary-button">
              Challenge Pay
              <ArrowRight size={15} />
            </Link>
            <Link href="/game/quiz-pot" className="secondary-button">
              Quiz Pot
            </Link>
            <Link href="/game/history" className="secondary-button">
              History
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <HubMetricCard label="Pending" value={stats.pending} icon={Clock3} />
          <HubMetricCard label="Opened" value={stats.opened} icon={Sparkles} />
          <HubMetricCard label="Claimed" value={stats.claimed} icon={BadgeCheck} />
          <HubMetricCard label="Expired" value={stats.expired} icon={TimerReset} />
          <HubMetricCard label="Highest Reveal" value={formatGameAmount(stats.highestReveal)} icon={Coins} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            {sortedPacks.length > 0 ? (
              sortedPacks.map((pack) => (
                <LuckyPackCard
                  key={pack.id}
                  pack={pack}
                  now={now}
                  onOpen={(packId) => {
                    const reveal = openLuckyPack(packId);
                    if (reveal) {
                      setToast({
                        tone: 'success',
                        message: `${formatGameAmount(reveal.amount)} revealed locally with a ${reveal.rarity} tier.`,
                      });
                    } else {
                      setToast({ tone: 'error', message: 'This card can no longer be opened.' });
                    }
                  }}
                  onClaim={(packId) => {
                    if (claimLuckyPack(packId)) {
                      setToast({ tone: 'success', message: 'Lucky reward claimed locally.' });
                    } else {
                      setToast({ tone: 'error', message: 'Lucky reward is not claimable yet.' });
                    }
                  }}
                />
              ))
            ) : (
              <HubEmptyState
                icon={CircleDashed}
                title="No lucky packs yet"
                description="The local store is empty. Use the create form to add the first mock lucky pack and start the reveal flow."
              />
            )}
          </div>

          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Create pack</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Weighted lucky deck</h2>
                </div>
                <Gem size={18} className="text-[#c9a84c]" aria-hidden="true" />
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCreatePack}>
                <label className="block">
                  <span className={hubLabelClass}>Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={`${hubInputClass} mt-2 w-full`}
                    placeholder="Midnight Pack"
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
                      placeholder="Night Market"
                    />
                  </label>
                  <label className="block">
                    <span className={hubLabelClass}>Receiver</span>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(event) => setReceiverName(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                      placeholder="Open drawer"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={hubLabelClass}>Base amount USD</span>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={baseAmount}
                      onChange={(event) => setBaseAmount(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                    />
                  </label>
                  <label className="block">
                    <span className={hubLabelClass}>Expires at</span>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                      className={`${hubInputClass} mt-2 w-full`}
                    />
                  </label>
                </div>

                <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className={hubLabelClass}>Weighted tiers</span>
                    <Sparkles size={14} className="text-[#c9a84c]" aria-hidden="true" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {tierDrafts.map((tier, index) => (
                      <div key={`tier-${index}`} className="grid gap-3 sm:grid-cols-[1fr_110px_110px] sm:items-center">
                        <div className="text-sm font-semibold text-white">Tier {index + 1}</div>
                        <label className="block">
                          <span className="sr-only">Tier {index + 1} amount</span>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={tier.amount}
                            onChange={(event) =>
                              setTierDrafts((current) =>
                                current.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, amount: event.target.value } : item,
                                ),
                              )
                            }
                            className={`${hubInputClass} w-full`}
                            placeholder="Amount"
                          />
                        </label>
                        <label className="block">
                          <span className="sr-only">Tier {index + 1} weight</span>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={tier.weight}
                            onChange={(event) =>
                              setTierDrafts((current) =>
                                current.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, weight: event.target.value } : item,
                                ),
                              )
                            }
                            className={`${hubInputClass} w-full`}
                            placeholder="Weight"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="primary-button w-full justify-center">
                  Create Pack
                  <ArrowRight size={15} />
                </button>
              </form>
            </HubCard>

            <GameProgressPanel
              snapshot={progress}
              description="Lucky reveal totals, XP, and streaks are shared with the rest of the Arc game hub."
            />

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Quick links</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Move across the hub</h2>
                </div>
                <Flame size={18} className="text-[#c9a84c]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { href: '/game/challenge', label: 'Challenge Pay', description: 'Accept and settle challenge flows.' },
                  { href: '/game/quiz-pot', label: 'Quiz Pot', description: 'Trivia rooms and local leaderboard.' },
                  { href: '/game/history', label: 'History', description: 'Archive the latest mock events.' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 transition-colors hover:border-[#c9a84c]/30 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{link.label}</span>
                      <span className="block text-xs leading-6 text-[#777]">{link.description}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-[#c9a84c]" />
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
