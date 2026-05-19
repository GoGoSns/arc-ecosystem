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
import { useWallet } from '@/contexts/WalletContext';
import { ShareButtons } from '@/components/ShareButtons';
import { GameToast } from '@/components/GameToast';
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
      return 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]';
  }
}

function rarityTone(rarity: ReturnType<typeof getLuckyPackRarity>) {
  switch (rarity) {
    case 'legendary':
      return 'border-[#a855f7]/35 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(212, 175, 55,0.08)_55%,rgba(255,255,255,0.02))] shadow-[0_24px_70px_rgba(168,85,247,0.12)]';
    case 'gold':
      return 'border-[#d4af37]/35 bg-[linear-gradient(135deg,rgba(212, 175, 55,0.16),rgba(255,255,255,0.02)_55%,rgba(212, 175, 55,0.08))] shadow-[0_24px_70px_rgba(212, 175, 55,0.12)]';
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

function LuckyPackCard({ pack, now }: { pack: LuckyPack; now: number }) {
  const status = resolveLuckyPackStatus(pack, now);
  const rarity = getLuckyPackRarity(pack);
  const countdown = getCountdownCopy(pack, now);
  const StatusIcon = statusIcon(status);
  const revealAmount = pack.openedAmount ?? pack.baseAmount;
  const totalWeight = pack.tiers.reduce((sum, tier) => sum + tier.weight, 0);
  const isPending = status === 'pending';

  return (
    <HubCard as="article" className={`p-6 sm:p-8 overflow-hidden ${rarityTone(rarity)} transition-all duration-300`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {getCardLabel(status, rarity)}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">
              Base {formatGameAmount(pack.baseAmount)} USDC
            </HubBadge>
          </div>
          <h2 className="text-2xl font-black uppercase sm:text-3xl">{pack.title}</h2>
          <p className="text-sm leading-7 text-[#8a8a9a]">{pack.senderName} → {pack.receiverName}</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{countdown.label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{countdown.value}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 grid-cols-2 xl:grid-cols-4">
        {pack.tiers.map((tier, idx) => (
          <div
            key={`${pack.id}-${tier.amount}-${tier.weight}`}
            className={`rounded-2xl border px-3 py-3 ${pack.openedTierIndex === idx ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-[#1a1a2e] bg-black/30'}`}
          >
            <div className="text-sm font-semibold text-white">{formatGameAmount(tier.amount)} USDC</div>
            <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">
              {getProbabilityLabel(tier.weight, totalWeight)}
            </div>
          </div>
        ))}
      </div>

      {!isPending && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-5 py-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
            {status === 'claimed' ? 'Claimed' : 'Revealed'}
          </span>
          <span className="text-xl font-black text-[#d4af37]">{formatGameAmount(revealAmount)} USDC</span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {pack.timeline.slice(-1).map((event) => (
            <HubBadge key={event.id} className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
              {event.kind}
            </HubBadge>
          ))}
        </div>
        <Link
          href={`/game/lucky/${pack.id}`}
          className={isPending ? 'primary-button pulse-gold' : 'bracket-button'}
        >
          {isPending ? 'Open Pack' : status === 'opened' ? 'Claim Reward' : 'View Pack'}
          <ArrowRight size={14} />
        </Link>
      </div>
    </HubCard>
  );
}

export default function GameLuckyPage() {
  const { luckyPacks, createLuckyPack } = useGameStore();
  const deductBalance = useGameStore((state) => state.deductBalance);
  const { address, isConnected } = useWallet();
  const [txPending, setTxPending] = useState(false);
  const { hydrated, now } = useHydratedNow();
  
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

  const challenges = useGameStore((state) => state.challenges);
  const history = useGameStore((state) => state.history);
  const progress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history }, now),
    [challenges, luckyPacks, history, now],
  );

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

  const handleCreatePack = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConnected || !address) {
      showToast('info', 'Connect Wallet', 'Please connect your wallet to create a lucky pack.');
      return;
    }

    const parsedBaseAmount = Number(baseAmount);
    const parsedExpiresAt = new Date(expiresAt).getTime();

    if (!title.trim() || !senderName.trim()) {
      showToast('info', 'Missing Info', 'Fill in the title and sender before creating a pack.');
      return;
    }

    if (!Number.isFinite(parsedBaseAmount) || parsedBaseAmount <= 0 || Number.isNaN(parsedExpiresAt)) {
      showToast('info', 'Invalid Input', 'Base amount and expiry must be valid values.');
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

    setTxPending(true);
    
    try {
      const tx = await payToAdmin(parsedBaseAmount);
      setTxPending(false);
      
      if (!tx.success) {
        showToast('info', 'Transaction Failed', tx.error ?? 'Transaction failed. Please try again.');
        return;
      }

      // Update mock balance for UI (happens in both modes as per requirements)
      if (!deductBalance(address, parsedBaseAmount)) {
        if (!USE_REAL_TRANSFERS) {
          showToast('info', 'Insufficient Balance', `Insufficient balance (Demo Mode).`);
          return;
        }
      }

      const created = createLuckyPack({
        title: title.trim(),
        senderName: senderName.trim(),
        receiverName: receiverName.trim() || 'Open drawer',
        baseAmount: parsedBaseAmount,
        tiers: tiers.length > 0 ? tiers : [{ amount: parsedBaseAmount, weight: 100 }],
        expiresAt: parsedExpiresAt,
      } satisfies CreateLuckyPackInput);

      const successMsg = !USE_REAL_TRANSFERS
        ? `${created.title} created! (Demo mode)`
        : `${created.title} created! View on Arcscan: ${tx.explorerUrl}`;
      showToast('win', 'Pack Created!', successMsg);
      
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
    } catch (e: any) {
      setTxPending(false);
      showToast('info', 'Transaction Failed', e?.message || 'Transaction failed');
    }
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
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Lucky Card</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Weighted reveal + claim flow</HubBadge>
          </div>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">Arc Lucky Card</h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
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
          <div className="flex flex-wrap items-center gap-3">
            <ShareButtons title="Arc Lucky Card" />
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
                />
              ))
            ) : (
              <HubCard className="p-12 text-center border-dashed border-2 border-[#1a1a2e] bg-transparent">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#0d0d12] rounded-3xl flex items-center justify-center border border-[#1a1a2e]">
                  <CircleDashed size={32} className="text-[#555566]" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">No lucky packs yet</h3>
                <p className="text-[#8a8a9a] mb-8 max-w-sm mx-auto">The local store is empty. Use the form to create your first Lucky Pack and start revealing prizes.</p>
                <button 
                  onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="primary-button mx-auto"
                >
                  Create Your First Pack
                </button>
              </HubCard>
            )}
          </div>

          <div className="space-y-6">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Create pack</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Weighted lucky deck</h2>
                </div>
                <Gem size={18} className="text-[#d4af37]" aria-hidden="true" />
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

                <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className={hubLabelClass}>Weighted tiers</span>
                    <Sparkles size={14} className="text-[#d4af37]" aria-hidden="true" />
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

                <button type="submit" disabled={txPending} className="primary-button w-full justify-center disabled:opacity-60">
                  {txPending ? 'Confirming transaction…' : 'Create Pack'}
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Quick links</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Move across the hub</h2>
                </div>
                <Flame size={18} className="text-[#d4af37]" aria-hidden="true" />
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
