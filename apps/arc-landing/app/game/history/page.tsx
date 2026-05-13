'use client';

import { Coins, History, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard, HubEmptyState, HubMetricCard, HubSkeletonCard } from '@/components/HubPrimitives';
import { formatGameAmount, formatGameTimestamp, useGameStore } from '@/lib/gameStore';

type HistoryFilter = 'all' | 'challenge' | 'lucky';

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function badgeTone(status: string) {
  switch (status) {
    case 'won':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'claimed':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'lost':
      return 'border-[#f87171]/30 bg-[#f87171]/10 text-[#fecaca]';
    case 'opened':
      return 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]';
    case 'expired':
      return 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fde68a]';
    default:
      return 'border-[#2a2a2a] bg-white/[0.02] text-[#aaa]';
  }
}

export default function GameHistoryPage() {
  const { history } = useGameStore();
  const hydrated = useHydrated();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.createdAt - a.createdAt);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') {
      return sortedHistory;
    }

    return sortedHistory.filter((item) => item.type === filter);
  }, [filter, sortedHistory]);

  const stats = useMemo(() => {
    const challengeWins = history.filter((item) => item.type === 'challenge' && (item.status === 'won' || item.status === 'claimed')).length;
    const luckyOpens = history.filter((item) => item.type === 'lucky' && (item.status === 'opened' || item.status === 'claimed')).length;
    const totalWon = history.reduce((sum, item) => sum + (item.status === 'lost' || item.status === 'expired' ? 0 : item.amount), 0);

    return {
      total: history.length,
      challengeWins,
      luckyOpens,
      totalWon,
    };
  }, [history]);

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
          <HubSkeletonCard lines={5} className="min-h-[360px]" />
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">History</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">Timeline + table</HubBadge>
          </div>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
            Game history
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
            Filter the local archive by challenge or lucky outcome and review the mock events in a responsive
            table-style timeline.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Events" value={stats.total} icon={History} />
          <HubMetricCard label="Challenge Wins" value={stats.challengeWins} icon={Trophy} />
          <HubMetricCard label="Lucky Opens" value={stats.luckyOpens} icon={Sparkles} />
          <HubMetricCard label="Total Won" value={formatGameAmount(stats.totalWon)} icon={Coins} />
        </div>

        <div className="mt-6">
          <HubCard as="section" className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-[#2a2a2a] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Archive filter</p>
                <h2 className="mt-2 text-2xl font-black uppercase">Outcome timeline</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  ['all', 'All'],
                  ['challenge', 'Challenges'],
                  ['lucky', 'Lucky'],
                ] as const).map(([value, label]) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        active
                          ? 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]'
                          : 'border-[#2a2a2a] bg-white/[0.02] text-[#aaa] hover:border-[#c9a84c]/25 hover:text-[#f0d79e]'
                      }`}
                      onClick={() => setFilter(value)}
                      aria-pressed={active}
                      aria-label={`Filter history by ${label.toLowerCase()}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="divide-y divide-[#2a2a2a]">
                {filteredHistory.map((item) => {
                  const amountText = item.amount > 0 ? `${formatGameAmount(item.amount)} USDC` : '-';
                  const typeLabel = item.type === 'challenge' ? 'Challenge' : 'Lucky';

                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 px-5 py-4 md:grid-cols-[160px_110px_minmax(0,1fr)_140px_120px] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777] md:hidden">When</p>
                        <div className="text-sm font-semibold text-white">{formatGameTimestamp(item.createdAt)}</div>
                        <div className="mt-1 text-xs text-[#777]">Recorded locally</div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777] md:hidden">Type</p>
                        <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#aaa]">
                          {typeLabel}
                        </HubBadge>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777] md:hidden">Event</p>
                        <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-xs leading-6 text-[#777]">
                          {item.type === 'challenge' ? 'Challenge outcome' : 'Lucky card reveal'}
                        </div>
                      </div>

                      <div className="min-w-0 md:text-right">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777] md:hidden">Amount</p>
                        <div className="text-sm font-black text-[#c9a84c]">{amountText}</div>
                      </div>

                      <div className="min-w-0 md:text-right">
                        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777] md:hidden">Status</p>
                        <HubBadge className={badgeTone(item.status)}>{item.status.toUpperCase()}</HubBadge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <HubEmptyState
                icon={History}
                title="No matching events"
                description="The selected filter does not match any mock history items. Switch to another filter to view the archive."
                className="m-5"
              />
            )}
          </HubCard>
        </div>
      </div>
    </section>
  );
}
