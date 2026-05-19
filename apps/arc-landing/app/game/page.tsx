'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Coins, Clock3, Gamepad2, Percent, Sparkles, Star, Trophy, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard, HubMetricCard, HubBrackets, HubSkeletonCard } from '@/components/HubPrimitives';
import GameProgressPanel from '@/components/GameProgressPanel';
import VoiceTour from '@/components/VoiceTour';
import {
  buildGameProgressSnapshot,
  formatGameAmount,
  formatTimeLeft,
  resolveChallengeStatus,
  resolveLuckyPackStatus,
  useGameStore,
} from '@/lib/gameStore';
import type { VoiceTourSectionId } from '@/lib/voiceTourStore';
import { ShareButtons } from '@/components/ShareButtons';

const gameVoiceTourSections = [
  { id: 'gameHub' },
] satisfies { id: VoiceTourSectionId; href?: string }[];

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

function GameLinkCard({
  href,
  badge,
  title,
  description,
  meta,
  icon: Icon,
}: {
  href: string;
  badge: string;
  title: string;
  description: string;
  meta: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="bracket-card group relative block overflow-hidden p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <HubBrackets />
      <div className="flex items-start justify-between gap-4">
        <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">{badge}</HubBadge>
        <Icon size={20} className="shrink-0 text-[#d4af37]" />
      </div>
      <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 min-h-24 text-sm leading-7 text-[#8a8a9a]">{description}</p>
      <div className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
        <span>{meta}</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function GameHubHomePage() {
  const challenges = useGameStore((s) => s.challenges);
  const luckyPacks = useGameStore((s) => s.luckyPacks);
  const history = useGameStore((s) => s.history);
  const bonusXp = useGameStore((s) => s.bonusXp);
  const dailyPackClaimedAt = useGameStore((s) => s.dailyPackClaimedAt);
  const claimDailyPack = useGameStore((s) => s.claimDailyPack);
  const arcadeBests = useGameStore((s) => s.arcadeBests);
  const { hydrated, now } = useHydratedNow();

  const [dailyToast, setDailyToast] = useState<{ isVisible: boolean; message: string }>({ isVisible: false, message: '' });

  const isDailyAvailable = useMemo(() => {
    if (!dailyPackClaimedAt) return true;
    const todayDay = Math.floor(now / 86_400_000);
    const lastDay = Math.floor(dailyPackClaimedAt / 86_400_000);
    return todayDay > lastDay;
  }, [now, dailyPackClaimedAt]);

  const handleDailyClaim = () => {
    const result = claimDailyPack('hub-user');
    setDailyToast({
      isVisible: true,
      message: result.alreadyClaimed
        ? 'Already claimed today. Come back tomorrow!'
        : `+${result.xpGained} XP + 5 USDC added to mock balance!`,
    });
    setTimeout(() => setDailyToast((p) => ({ ...p, isVisible: false })), 3000);
  };

  const stats = useMemo(() => {
    const activeChallenges = [...challenges]
      .filter((challenge) => resolveChallengeStatus(challenge, now) === 'open')
      .sort((a, b) => a.deadlineAt - b.deadlineAt || a.title.localeCompare(b.title));
    const openLuckyPacks = luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'pending');
    const totalWon = history.reduce((sum, item) => sum + (item.status === 'lost' || item.status === 'expired' ? 0 : item.amount), 0);
    const resolvedHistory = history.filter((item) => ['won', 'lost', 'opened', 'claimed', 'expired'].includes(item.status));
    const positiveHistory = resolvedHistory.filter((item) => item.status === 'won' || item.status === 'opened' || item.status === 'claimed');
    const winRate = resolvedHistory.length === 0 ? 0 : Math.round((positiveHistory.length / resolvedHistory.length) * 100);

    return {
      activeChallenges,
      openLuckyPacks,
      totalWon,
      winRate,
    };
  }, [challenges, history, luckyPacks, now]);

  const progress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history, bonusXp }, now),
    [challenges, history, luckyPacks, bonusXp, now],
  );

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[280px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <HubSkeletonCard lines={3} className="min-h-[320px]" />
            <HubSkeletonCard lines={3} className="min-h-[320px]" />
            <HubSkeletonCard lines={3} className="min-h-[320px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">

        {/* XP / Level / Streak bar */}
        <div className="reveal mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ transitionDelay: '0ms' }}>
          <div className="sm:col-span-3 lg:col-span-2 rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/5 px-5 py-4 flex items-center gap-4">
            <Star size={20} className="shrink-0 text-[#d4af37]" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a9a]">Level {progress.level}</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[#1a1a2e]">
                <div className="h-full rounded-full bg-[#d4af37] transition-all" style={{ width: `${Math.round(progress.levelProgress * 100)}%` }} />
              </div>
              <div className="mt-1 text-xs text-[#8a8a9a]">{progress.xp} XP · {progress.xpToNextLevel} to next</div>
            </div>
          </div>
          <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 px-5 py-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Streak</div>
            <div className="mt-1 text-2xl font-black text-[#f5d060]">{progress.streak}🔥</div>
          </div>
          <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 px-5 py-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Win Rate</div>
            <div className="mt-1 text-2xl font-black text-white">{progress.winRate}%</div>
          </div>
          <div className="rounded-3xl border border-[#1a1a2e] bg-black/30 px-5 py-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Arcade Best</div>
            <div className="mt-1 text-2xl font-black text-[#30d158]">{arcadeBests.tapGold + arcadeBests.memoryMatch}</div>
          </div>
          <div className="rounded-3xl border border-[#30d158]/20 bg-[#30d158]/5 px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Daily Pack</div>
              <div className="mt-1 text-xs text-[#8a8a9a]">{isDailyAvailable ? '+50 XP + 5 USDC' : 'Come back tomorrow'}</div>
            </div>
            <button
              onClick={handleDailyClaim}
              className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${isDailyAvailable ? 'border-[#30d158]/40 bg-[#30d158]/10 text-[#a6f4bf] hover:bg-[#30d158]/20' : 'border-[#1a1a2e] bg-black/30 text-[#555566] cursor-not-allowed'}`}
            >
              {isDailyAvailable ? 'Claim' : 'Done'}
            </button>
          </div>
        </div>

        {dailyToast.isVisible && (
          <div className="mb-4 rounded-2xl border border-[#30d158]/30 bg-[#30d158]/10 px-4 py-3 text-sm text-[#a6f4bf]">
            {dailyToast.message}
          </div>
        )}

        <div className="reveal grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start" style={{ transitionDelay: '40ms' }}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">// phase 2</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Demo store only</HubBadge>
            </div>
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
              Arc Game Hub
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              A premium game surface for challenge tracking, weighted lucky drops, and a local outcome archive.
              Everything on this page is powered by mock data, persisted in the browser, and designed to stay
              readable on mobile.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/game/challenge" className="primary-button">
                Open Challenge Pay
                <ArrowRight size={15} />
              </Link>
              <Link href="/game/lucky" className="secondary-button">
                Try Lucky
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ShareButtons title="Arc Game Hub" />
            </div>

            <div className="pt-2">
              <VoiceTour sections={gameVoiceTourSections} compact />
            </div>
          </div>

          <HubCard as="aside" className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a9a]">Command deck</p>
                <h2 className="mt-2 text-2xl font-black uppercase leading-tight sm:text-3xl">
                  Local gameplay, premium shell
                </h2>
              </div>
              <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">Mock store</HubBadge>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
              Move between the active game loops without leaving browser state. Every route is designed to read
              cleanly on mobile and keep the controls obvious.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/game/challenge" className="feature-link">
                <span>Challenge</span>
                <span className="ml-auto text-[#8a8a9a]">{stats.activeChallenges.length} live</span>
              </Link>
              <Link href="/game/lucky" className="feature-link">
                <span>Lucky Card</span>
                <span className="ml-auto text-[#8a8a9a]">{stats.openLuckyPacks.length} pending</span>
              </Link>
              <Link href="/game/quiz-pot" className="feature-link">
                <span>Quiz Pot</span>
                <span className="ml-auto text-[#8a8a9a]">Trivia</span>
              </Link>
              <Link href="/game/arcade" className="feature-link">
                <span>Arcade</span>
                <span className="ml-auto text-[#8a8a9a]">Free · XP</span>
              </Link>
              <Link href="/roulette" className="feature-link">
                <span>Roulette</span>
                <span className="ml-auto text-[#8a8a9a]">Spin &amp; win</span>
              </Link>
              <Link href="/game/history" className="feature-link">
                <span>History</span>
                <span className="ml-auto text-[#8a8a9a]">{history.length} events</span>
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#8a8a9a]">Active</div>
                <div className="mt-2 text-lg font-black text-white">{stats.activeChallenges.length}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#8a8a9a]">Lucky</div>
                <div className="mt-2 text-lg font-black text-white">{stats.openLuckyPacks.length}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#8a8a9a]">Win rate</div>
                <div className="mt-2 text-lg font-black text-[#f5d060]">{stats.winRate}%</div>
              </div>
            </div>
          </HubCard>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Active Challenges" value={stats.activeChallenges.length} icon={Trophy} />
          <HubMetricCard label="Open Lucky Packs" value={stats.openLuckyPacks.length} icon={Sparkles} />
          <HubMetricCard label="Total Won" value={formatGameAmount(stats.totalWon)} icon={Coins} />
          <HubMetricCard label="Win Rate" value={`${stats.winRate}%`} icon={Percent} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <GameLinkCard
            href="/game/challenge"
            badge={`${stats.activeChallenges.length} live`}
            title="Challenge"
            description="Create a USDC challenge, accept it, update progress, submit proof, and settle the reward."
            meta="Manage missions"
            icon={Trophy}
          />
          <GameLinkCard
            href="/game/quiz-pot"
            badge="Trivia"
            title="Quiz Pot"
            description="Join trivia rooms, answer Web3 questions, and earn XP or split the prize pot."
            meta="Play trivia"
            icon={BadgeCheck}
          />
          <GameLinkCard
            href="/game/lucky"
            badge={`${stats.openLuckyPacks.length} pending`}
            title="Lucky Card"
            description="Open weighted lucky packs, reveal your USDC amount, and keep the result in your archive."
            meta="Open cards"
            icon={Sparkles}
          />
          <GameLinkCard
            href="/game/arcade"
            badge="Free · XP"
            title="Arcade"
            description="Tap The Gold and Memory Match — two free mini-games that earn XP every time you play."
            meta="Play now"
            icon={Gamepad2}
          />
          <GameLinkCard
            href="/game/history"
            badge={`${history.length} events`}
            title="History"
            description="Review challenge wins, losses, and lucky opens in a compact timeline."
            meta="View archive"
            icon={Clock3}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <HubCard as="section" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Phase scope</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Local only, no backend calls</h2>
              </div>
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Demo only</HubBadge>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8a8a9a]">
              This first phase keeps all challenge progress, lucky reveals, and historical events inside the
              browser store so the hub can be exercised without auth, wallets, contracts, or API dependencies.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                'Progress updates are mocked',
                'Lucky reveals use tier weights',
                'History survives refreshes locally',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-sm text-[#d8d8d8]">
                  {item}
                </div>
              ))}
            </div>
          </HubCard>

          <div className="space-y-6">
            <GameProgressPanel
              snapshot={progress}
              description="XP, streaks, and recent wins are derived from the same mock challenge and lucky store that powers the hub."
            />

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Quick read</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Current snapshot</h2>
                </div>
                <span className="inline-flex rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                  live
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                  <span className="text-sm text-[#555566]">Best active window</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.activeChallenges[0]
                      ? `${stats.activeChallenges[0].title} - ${formatTimeLeft(Math.max(0, stats.activeChallenges[0].deadlineAt - now))}`
                      : 'No active challenge'}
                  </span>
                </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <span className="text-sm text-[#555566]">Recent archive item</span>
                <span className="text-sm font-semibold text-white">
                    {[...history].sort((a, b) => b.createdAt - a.createdAt)[0]?.title ?? 'No history yet'}
                </span>
              </div>
            </div>
          </HubCard>
          </div>
        </div>
      </div>
    </section>
  );
}
