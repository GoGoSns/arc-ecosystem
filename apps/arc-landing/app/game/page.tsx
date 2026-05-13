'use client';

import Link from 'next/link';
import { ArrowRight, Coins, Clock3, Percent, Sparkles, Trophy, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard, HubMetricCard, HubBrackets, HubSkeletonCard } from '@/components/HubPrimitives';
import {
  formatGameAmount,
  formatTimeLeft,
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
      className="group relative block overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[linear-gradient(135deg,rgba(201,168,76,0.08),transparent_38%),rgba(255,255,255,0.02)] p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#c9a84c]/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <HubBrackets />
      <div className="flex items-start justify-between gap-4">
        <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f0d79e]">{badge}</HubBadge>
        <Icon size={20} className="shrink-0 text-[#c9a84c]" />
      </div>
      <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 min-h-24 text-sm leading-7 text-[#9a9a9a]">{description}</p>
      <div className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white">
        <span>{meta}</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function GameHubHomePage() {
  const { challenges, luckyPacks, history } = useGameStore();
  const { hydrated, now } = useHydratedNow();

  const stats = useMemo(() => {
    const activeChallenges = challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'open');
    const openLuckyPacks = luckyPacks.filter((pack) => pack.status === 'pending');
    const totalWon = history.reduce((sum, item) => sum + (item.status === 'lost' ? 0 : item.amount), 0);
    const resolvedHistory = history.filter((item) => item.status === 'won' || item.status === 'lost' || item.status === 'opened');
    const winRate = resolvedHistory.length === 0 ? 0 : Math.round((resolvedHistory.filter((item) => item.status !== 'lost').length / resolvedHistory.length) * 100);

    return {
      activeChallenges,
      openLuckyPacks,
      totalWon,
      winRate,
    };
  }, [challenges, history, luckyPacks, now]);

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
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">// phase 1</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Demo store only</HubBadge>
          </div>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Arc Game Hub
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            A premium game surface for challenge tracking, weighted lucky drops, and a local outcome archive.
            Everything on this page is powered by mock data, persisted in the browser, and designed to stay
            readable on mobile.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/game/challenges" className="primary-button">
              Open Challenges
              <ArrowRight size={15} />
            </Link>
            <Link href="/game/lucky" className="secondary-button">
              Try Lucky
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Active Challenges" value={stats.activeChallenges.length} icon={Trophy} />
          <HubMetricCard label="Open Lucky Packs" value={stats.openLuckyPacks.length} icon={Sparkles} />
          <HubMetricCard label="Total Won" value={formatGameAmount(stats.totalWon)} icon={Coins} />
          <HubMetricCard label="Win Rate" value={`${stats.winRate}%`} icon={Percent} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <GameLinkCard
            href="/game/challenges"
            badge={`${stats.activeChallenges.length} live`}
            title="Challenges"
            description="Push progress bars toward their target values, watch the countdowns, and claim rewards when a run is ready to settle."
            meta="Manage missions"
            icon={Trophy}
          />
          <GameLinkCard
            href="/game/lucky"
            badge={`${stats.openLuckyPacks.length} pending`}
            title="Lucky"
            description="Open weighted lucky cards, inspect the reveal amount, and keep the result in your local demo archive."
            meta="Open cards"
            icon={Sparkles}
          />
          <GameLinkCard
            href="/game/history"
            badge={`${history.length} events`}
            title="History"
            description="Review challenge wins, losses, and lucky opens in a compact timeline that stays responsive on small screens."
            meta="View archive"
            icon={Clock3}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <HubCard as="section" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Phase scope</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Local only, no backend calls</h2>
              </div>
              <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f0d79e]">Demo only</HubBadge>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9a9a9a]">
              This first phase keeps all challenge progress, lucky reveals, and historical events inside the
              browser store so the hub can be exercised without auth, wallets, contracts, or API dependencies.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                'Progress updates are mocked',
                'Lucky reveals use tier weights',
                'History survives refreshes locally',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm text-[#d8d8d8]">
                  {item}
                </div>
              ))}
            </div>
          </HubCard>

          <HubCard as="aside" className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Quick read</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Current snapshot</h2>
              </div>
              <span className="inline-flex rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa]">
                live
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                <span className="text-sm text-[#777]">Best active window</span>
                <span className="text-sm font-semibold text-white">
                  {stats.activeChallenges[0]
                    ? `${stats.activeChallenges[0].title} - ${formatTimeLeft(Math.max(0, stats.activeChallenges[0].deadlineAt - now))}`
                    : 'No active challenge'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                <span className="text-sm text-[#777]">Recent archive item</span>
                <span className="text-sm font-semibold text-white">
                  {history[0] ? history[0].title : 'No history yet'}
                </span>
              </div>
            </div>
          </HubCard>
        </div>
      </div>
    </section>
  );
}
