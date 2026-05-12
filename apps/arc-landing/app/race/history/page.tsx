'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ChevronRight, Coins, History, Trophy, Users } from 'lucide-react';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  hubLabelClass,
  hubSelectClass,
} from '@/components/HubPrimitives';
import {
  RACE_CATEGORY_LABELS,
  formatRaceAddress,
  formatRaceDate,
  formatRacePrize,
  getRaceWinner,
  useRaceStore,
  type Race,
  type RaceCategory,
} from '@/lib/raceStore';

type CategoryFilter = RaceCategory | 'all';

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All categories' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'volume', label: 'Volume' },
  { id: 'forum-posts', label: 'Forum Posts' },
  { id: 'quests', label: 'Quests' },
  { id: 'referrals', label: 'Referrals' },
];

export default function RaceHistoryPage() {
  const { races } = useRaceStore();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const archivedRaces = useMemo(
    () =>
      races
        .filter((race) => race.status === 'ended')
        .sort((a, b) => b.endDate - a.endDate || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    [races],
  );

  const years = useMemo(() => {
    const values = new Set(archivedRaces.map((race) => new Date(race.endDate).getFullYear().toString()));
    return ['all', ...Array.from(values).sort((a, b) => Number(b) - Number(a))];
  }, [archivedRaces]);

  const filteredRaces = useMemo(() => {
    return archivedRaces.filter((race) => {
      const yearMatches = selectedYear === 'all' || new Date(race.endDate).getFullYear().toString() === selectedYear;
      const categoryMatches = activeCategory === 'all' || race.category === activeCategory;
      return yearMatches && categoryMatches;
    });
  }, [archivedRaces, activeCategory, selectedYear]);

  const uniqueWinners = useMemo(() => {
    const addresses = new Set(
      archivedRaces
        .map((race) => getRaceWinner(race)?.address)
        .filter((address): address is string => typeof address === 'string' && address.trim().length > 0),
    );

    return addresses.size;
  }, [archivedRaces]);

  const totalPrize = useMemo(() => archivedRaces.reduce((sum, race) => sum + race.prizePool, 0), [archivedRaces]);
  const latestYear = years.find((year) => year !== 'all') ?? '—';

  const clearFilters = () => {
    setActiveCategory('all');
    setSelectedYear('all');
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/race" className="flex min-w-0 items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            <span className="truncate">Arc Race</span>
          </Link>
          <div className="hidden items-center gap-8 overflow-x-auto whitespace-nowrap font-mono text-xs uppercase text-[#777] md:flex" aria-label="Race navigation">
            <Link href="/race" className="nav-link">
              HUB
            </Link>
            <Link href="/race/history" className="text-white">
              HISTORY
            </Link>
          </div>
          <Link href="/race" className="bracket-button">
            BACK TO HUB
          </Link>
        </div>
      </nav>

      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link href="/race" className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#777] transition-colors hover:text-[#c9a84c]">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Hub
          </Link>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">// archives</HubBadge>
              <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">{filteredRaces.length} filtered results</HubBadge>
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
              Race history with stable winner records, prize totals, and archive filters.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
              Review ended competitions across categories and years. Filters combine cleanly, and winner and prize formatting stays consistent across the archive.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <HubMetricCard label="ARCHIVED RACES" value={archivedRaces.length} icon={History} />
            <HubMetricCard label="UNIQUE WINNERS" value={uniqueWinners} icon={Trophy} />
            <HubMetricCard label="TOTAL PRIZE" value={formatRacePrize(totalPrize)} icon={Coins} />
            <HubMetricCard label="LATEST YEAR" value={latestYear} icon={CalendarDays} />
          </div>

          <HubCard as="section" className="mt-6 p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <label className={hubLabelClass} htmlFor="race-history-category">
                  Category
                </label>
                <select
                  id="race-history-category"
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value as CategoryFilter)}
                  className={`w-full ${hubSelectClass}`}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={hubLabelClass} htmlFor="race-history-year">
                  Year
                </label>
                <select
                  id="race-history-year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className={`w-full ${hubSelectClass}`}
                >
                  <option value="all">All years</option>
                  {years
                    .filter((year) => year !== 'all')
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-end">
                <button type="button" onClick={clearFilters} className="secondary-button w-full justify-center lg:w-auto">
                  CLEAR FILTERS
                </button>
              </div>
            </div>
          </HubCard>

          <div className="mt-6">
            {filteredRaces.length === 0 ? (
              <HubEmptyState
                icon={History}
                title="No matching races"
                description={
                  archivedRaces.length === 0
                    ? 'There are no completed races in the local archive yet.'
                    : 'No archived races match the active category and year filters. Clear the filters to review the full archive.'
                }
              >
                <button type="button" onClick={clearFilters} className="primary-button">
                  CLEAR FILTERS
                </button>
                <Link href="/race" className="secondary-button">
                  BACK TO HUB
                </Link>
              </HubEmptyState>
            ) : (
              <HubCard as="section" className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[840px] w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                        <th scope="col" className="px-6 py-4">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Race
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Winner
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Grand prize
                        </th>
                        <th scope="col" className="px-6 py-4 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {filteredRaces.map((race) => {
                        const winner = getRaceWinner(race);
                        return (
                          <tr key={race.id} className="transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-4 text-sm text-[#9a9a9a]">{formatRaceDate(race.endDate)}</td>
                            <td className="px-6 py-4">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white">{race.title}</div>
                                <div className="mt-1 max-w-[32rem] truncate text-xs text-[#777]">{race.description}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <HubBadge>{RACE_CATEGORY_LABELS[race.category]}</HubBadge>
                            </td>
                            <td className="px-6 py-4">
                              {winner ? (
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white">{winner.name ?? formatRaceAddress(winner.address)}</div>
                                  <div className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                                    {winner.address}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-[#777]">No winner recorded</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-black text-[#c9a84c]">{formatRacePrize(race.prizes[0] ?? 0)}</div>
                              <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                                {race.participants.length} participants
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                href={`/race/${race.id}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a2a] text-[#9a9a9a] transition-colors hover:border-[#c9a84c]/50 hover:text-[#c9a84c]"
                                aria-label={`Open ${race.title}`}
                              >
                                <ChevronRight size={16} aria-hidden="true" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </HubCard>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
