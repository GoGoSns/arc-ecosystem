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
import { useWallet } from '@/contexts/WalletContext';
import { ShareButtons } from '@/components/ShareButtons';
import { GameToast } from '@/components/GameToast';
import { payFromAdmin, USE_REAL_TRANSFERS, explorerUrl } from '@/lib/usdcTransfer';
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

function ProbabilityPanel({ pack }: { pack: LuckyPack }) {
  const { totalWeight, rows } = useMemo(() => getProbabilityRows(pack), [pack]);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Probability</p>
          <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Disclosure panel</h2>
        </div>
        <Sparkles size={18} className="text-[#d4af37]" aria-hidden="true" />
      </div>
      <div className="mt-6 space-y-3">
        {rows.map((tier, index) => (
          <div key={`${pack.id}-${tier.amount}-${tier.weight}`} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Tier {index + 1}</div>
              <div className="text-sm font-semibold text-[#f0d79e]">{formatGameAmount(tier.amount)} USDC</div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Weight {tier.weight}%</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Chance {tier.chance}%</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
                Weighted against {totalWeight || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-7 text-[#8a8a9a]">
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
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
          </div>
          <h3 className="text-xl font-black uppercase text-white">{pack.title}</h3>
          <p className="text-sm leading-6 text-[#555566]">
            {pack.senderName} to {pack.receiverName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-[#f0d79e]">{formatGameAmount(pack.openedAmount ?? pack.baseAmount)}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
            {resolveLuckyPackStatus(pack) === 'pending' ? 'Pending' : 'Revealed'}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-[#8a8a9a]">
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
  const addBalance = useGameStore((state) => state.addBalance);
  const { address, isConnected } = useWallet();
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

  const [isFlipping, setIsFlipping] = useState(false);
  const [txPending, setTxPending] = useState(false);

  const challenges = useGameStore((state) => state.challenges);
  const history = useGameStore((state) => state.history);
  const progress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history }, now),
    [challenges, luckyPacks, history, now],
  );

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
    if (!isConnected || !address) {
      showToast('info', 'Connect Wallet', 'Connect your wallet to open this pack.');
      return;
    }
    
    setIsFlipping(true);
    
    setTimeout(() => {
      const reveal = openLuckyPack(pack.id);
      if (reveal) {
        const isHighTier = reveal.amount >= 90;
        showToast(
          isHighTier ? 'win' : 'info', 
          isHighTier ? 'BIG WIN!' : 'Revealed', 
          `${formatGameAmount(reveal.amount)} USDC revealed! Claim it now.`,
          String(reveal.amount)
        );
      }
      setIsFlipping(false);
    }, 1500);
  };

  const handleClaim = async () => {
    if (!isConnected || !address) {
      showToast('info', 'Connect Wallet', 'Connect your wallet to claim this reward.');
      return;
    }
    const openedAmount = pack.openedAmount ?? 0;
    setTxPending(true);
    
    try {
      const tx = await payFromAdmin(address, openedAmount);
      setTxPending(false);
      
      if (!tx.success) {
        showToast('loss', 'Transaction Failed', tx.error ?? 'Transaction failed. Please try again.');
        return;
      }

      if (claimLuckyPack(pack.id)) {
        // Update mock balance for UI (happens in both modes as per requirements)
        addBalance(address, openedAmount);
        
        const msg = !USE_REAL_TRANSFERS
          ? `Reward of $${openedAmount} claimed! (Demo mode)`
          : `Reward claimed! View on Arcscan: ${tx.explorerUrl}`;
        showToast('win', 'Reward Claimed!', msg, String(openedAmount));
      }
    } catch (e: any) {
      setTxPending(false);
      showToast('loss', 'Transaction Failed', e?.message || 'Transaction failed');
    }
  };

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

        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/game/lucky" className="inline-flex items-center gap-2 rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60">
              <ArrowLeft size={14} />
              Back to Lucky
            </Link>
            <HubBadge className={statusTone(status)}>
              <StatusIcon size={12} className="mr-1" aria-hidden="true" />
              {status.toUpperCase()}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">
              {rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'}
            </HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">Base {formatGameAmount(pack.baseAmount)} USDC</HubBadge>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{pack.senderName} to {pack.receiverName}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">{pack.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
                Open the card to reveal the weighted amount, review the probability disclosure, and claim the reward once
                the pack has been opened.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('info', 'Copied!', 'Link copied to clipboard.');
                  }}
                  className="flex items-center gap-2 border border-[#1a1a2e] rounded-xl px-4 py-2 text-sm hover:border-[#d4af37]/50 transition-colors"
                >
                  <ArrowRight size={14} className="rotate-45" />
                  Copy Link
                </button>
                <button 
                  onClick={() => {
                    const url = `https://twitter.com/intent/tweet?text=I'm opening a ${pack.title} on Arc!&url=${encodeURIComponent(window.location.href)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 border border-[#1a1a2e] rounded-xl px-4 py-2 text-sm hover:border-[#d4af37]/50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 px-5 py-4 text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#555566]">{countdown.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{countdown.value}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">
            <HubCard as="section" className={`p-6 sm:p-8 min-h-[400px] ${rarityTone(rarity)}`}>
              <div className={`card-flip h-full`}>
                <div className={`card-flip-inner h-full ${isFlipping || status !== 'pending' ? 'flipped' : ''}`}>
                  {/* Front: Mystery */}
                  <div className="card-front flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-32 h-32 bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-8 border-2 border-[#d4af37]/30 pulse-gold">
                      <Gem size={48} className="text-[#d4af37]" />
                    </div>
                    <h2 className="text-3xl font-black uppercase mb-4">Mystery Pack</h2>
                    <p className="text-[#8a8a9a] max-w-xs mb-8">
                      {isFlipping ? 'Revealing your prize...' : 'Click the button below to reveal your prize from the weighted tiers.'}
                    </p>
                    {canOpen && (
                      <button 
                        onClick={handleOpen}
                        disabled={isFlipping}
                        className="primary-button pulse-gold h-16 px-12 rounded-2xl text-xl"
                      >
                        {isFlipping ? 'REVEALING...' : 'OPEN PACK'}
                      </button>
                    )}
                  </div>

                  {/* Back: Reveal */}
                  <div className="card-back flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Reveal result</p>
                        <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">{pack.title} Result</h2>
                      </div>
                      <HubBadge className={statusTone(status)}>
                        {status.toUpperCase()}
                      </HubBadge>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-center flex-1">
                      <div className="animate-win text-center">
                        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#8a8a9a] mb-4">You have revealed</p>
                        <div className="text-6xl sm:text-8xl font-black text-[#d4af37] mb-4 tracking-tighter">
                          {formatGameAmount(revealAmount)} <span className="text-2xl text-[#8a8a9a]">USDC</span>
                        </div>
                        <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e] py-1.5 px-4 text-sm">
                          {rarity.toUpperCase()} REVEAL
                        </HubBadge>
                      </div>

                      <div className="mt-12 w-full max-w-sm">
                        {canClaim ? (
                          <button onClick={handleClaim} disabled={txPending} className="primary-button w-full justify-center h-14 text-lg pulse-gold disabled:opacity-60">
                            {txPending ? 'Confirming…' : 'Claim Reward'}
                            <ArrowRight size={18} />
                          </button>
                        ) : status === 'claimed' ? (
                          <div className="bg-[#30d158]/10 border border-[#30d158]/30 text-[#a6f4bf] rounded-2xl py-4 text-center font-bold">
                            ✓ REWARD CLAIMED
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-[#1a1a2e] text-[#555566] rounded-2xl py-4 text-center">
                            {status === 'expired' ? 'PACK EXPIRED' : 'AWAITING CLAIM'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HubCard>

            <HubCard as="section" className="overflow-hidden p-0">
              <div className="flex items-center justify-between gap-4 border-b border-[#1a1a2e] px-5 py-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Timeline</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Pack events</h2>
                </div>
                <Clock3 size={20} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <TimelineRow pack={pack} />
            </HubCard>

            <ProbabilityPanel pack={pack} />

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Pack details</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Metadata</h2>
                </div>
                <Coins size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Sender', pack.senderName],
                  ['Receiver', pack.receiverName],
                  ['Status', getLuckyPackRevealLabel(pack)],
                  ['Expires', formatGameTimestamp(pack.expiresAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{label}</div>
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Overview</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Lucky snapshot</h2>
                </div>
                <Flame size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['Amount', formatGameAmount(revealAmount)],
                  ['Base', formatGameAmount(pack.baseAmount)],
                  ['Status', getLuckyPackRevealLabel(pack)],
                  ['Rarity', rarity === 'legendary' ? 'Legendary' : rarity === 'gold' ? 'Gold' : 'Bronze'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                    <span className="text-sm text-[#555566]">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Draw rules</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Open and claim</h2>
                </div>
                <Sparkles size={18} className="text-[#d4af37]" aria-hidden="true" />
              </div>
              <div className="mt-6 flex flex-col gap-3">
                {canOpen ? (
                  <button type="button" onClick={handleOpen} className="primary-button w-full justify-center">
                    Open Card
                    <ArrowRight size={15} />
                  </button>
                ) : null}
                {canClaim ? (
                  <button type="button" onClick={handleClaim} disabled={txPending} className="primary-button w-full justify-center disabled:opacity-60">
                    {txPending ? 'Confirming…' : 'Claim Reward'}
                    <ArrowRight size={15} />
                  </button>
                ) : null}
                {!canOpen && !canClaim ? (
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/20 px-4 py-3 text-center text-sm text-[#555566]">
                    {status === 'claimed' ? 'Reward already claimed.' : status === 'expired' ? 'This pack expired.' : 'Open the pack first to reveal the prize.'}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-sm text-[#8a8a9a]">
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
