'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Coins,
  Info,
  Medal,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  hubInputClass,
  hubLabelClass,
} from '@/components/HubPrimitives';
import {
  ADMIN_ADDRESS,
  RACE_CATEGORY_LABELS,
  RACE_STATUS_LABELS,
  formatRaceAddress,
  formatRaceDate,
  formatRacePrize,
  getRaceOrdinal,
  normalizeRaceAddress,
  readStoredRaceDemoAddress,
  sortParticipants,
  useRaceStore,
  writeStoredRaceDemoAddress,
  type Race,
  type RaceLeaderboardSortDirection,
  type RaceLeaderboardSortField,
} from '@/lib/raceStore';

type NoticeTone = 'success' | 'error' | 'info';

function formatCountdownParts(ms: number): { value: number; label: string }[] {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];
}

function useStoredDemoAddress() {
  const [value, setValue] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(readStoredRaceDemoAddress());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeStoredRaceDemoAddress(value);
  }, [hydrated, value]);

  return [value, setValue] as const;
}

function RaceCountdown({
  status,
  targetDate,
}: {
  status: Race['status'];
  targetDate: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status === 'ended') {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status, targetDate]);

  if (status === 'ended') {
    return (
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">Finalised</p>
        <p className="mt-2 text-2xl font-black text-white">Ended on {formatRaceDate(targetDate)}</p>
      </div>
    );
  }

  const remaining = Math.max(0, targetDate - now);

  if (remaining === 0) {
    return (
      <div className="text-center" aria-live="polite">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
          {status === 'active' ? 'Closing now' : 'Opening now'}
        </p>
        <p className="mt-2 text-2xl font-black text-[#c9a84c]">
          {status === 'active' ? 'Race is wrapping up' : 'Race is starting'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
      {formatCountdownParts(remaining).map((part) => (
        <div key={part.label} className="rounded-2xl border border-[#2a2a2a] bg-black/40 px-2 py-3 text-center">
          <div className="text-xl font-black text-white sm:text-2xl">{part.value}</div>
          <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.24em] text-[#777]">{part.label}</div>
        </div>
      ))}
    </div>
  );
}

function FeedbackBanner({ notice }: { notice: { tone: NoticeTone; message: string } | null }) {
  if (!notice) {
    return null;
  }

  const toneClass =
    notice.tone === 'error'
      ? 'border-red-500/20 bg-red-500/10 text-red-100'
      : notice.tone === 'success'
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
        : 'border-[#c9a84c]/20 bg-[#c9a84c]/10 text-[#f5e1aa]';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`} role={notice.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {notice.message}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isPodium = rank <= 3;

  return (
    <span
      className={`inline-flex min-w-16 items-center justify-center gap-1 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] ${
        isPodium ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#f3dfaa]' : 'border-[#2a2a2a] bg-white/[0.02] text-white'
      }`}
      aria-label={`${getRaceOrdinal(rank)} place`}
    >
      {isPodium ? <Medal size={11} aria-hidden="true" /> : null}
      {getRaceOrdinal(rank)}
    </span>
  );
}

function NotFoundState({ raceId }: { raceId: string }) {
  return (
    <HubEmptyState
      icon={ShieldAlert}
      title="Race not found"
      description={
        raceId
          ? `No race matching "${raceId}" exists in the local archive. The id may be invalid, or the race may have been removed.`
          : 'The requested race id is missing or invalid.'
      }
      tone="error"
    >
      <Link href="/race" className="primary-button">
        BACK TO HUB
      </Link>
      <Link href="/race/history" className="secondary-button">
        VIEW HISTORY
      </Link>
    </HubEmptyState>
  );
}

function SortButton({
  active,
  direction,
  children,
  onClick,
  label,
}: {
  active: boolean;
  direction: RaceLeaderboardSortDirection;
  children: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1 transition-colors hover:text-white focus-visible:text-white"
    >
      <span>{children}</span>
      {active ? direction === 'asc' ? <ChevronUp size={10} aria-hidden="true" /> : <ChevronDown size={10} aria-hidden="true" /> : null}
    </button>
  );
}

export default function RaceDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const raceId = Array.isArray(rawId) ? rawId[0] : rawId ?? '';

  const { races, joinRace, updateScore, endRace } = useRaceStore();
  const [demoAddress, setDemoAddress] = useStoredDemoAddress();
  const [participantName, setParticipantName] = useState('');
  const [scoreValue, setScoreValue] = useState('');
  const [sortField, setSortField] = useState<RaceLeaderboardSortField>('score');
  const [sortDirection, setSortDirection] = useState<RaceLeaderboardSortDirection>('desc');
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const race = useMemo(() => races.find((entry) => entry.id === raceId), [races, raceId]);

  const leaderboard = useMemo(() => {
    if (!race) {
      return [];
    }

    return sortParticipants(race.participants, sortField, sortDirection);
  }, [race, sortDirection, sortField]);

  const normalizedDemoAddress = normalizeRaceAddress(demoAddress);
  const currentParticipant = useMemo(() => {
    if (!race || !normalizedDemoAddress) {
      return undefined;
    }

    return race.participants.find((participant) => normalizeRaceAddress(participant.address) === normalizedDemoAddress);
  }, [race, normalizedDemoAddress]);

  const isJoined = !!currentParticipant;
  const isAdmin = normalizedDemoAddress === normalizeRaceAddress(ADMIN_ADDRESS);

  useEffect(() => {
    if (!race) {
      return;
    }

    if (currentParticipant) {
      setScoreValue(currentParticipant.score.toString());
    }
  }, [currentParticipant, race]);

  if (!race) {
    return (
      <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
        <section className="section pt-32">
          <div className="mx-auto max-w-3xl">
            <NotFoundState raceId={raceId} />
          </div>
        </section>
      </main>
    );
  }

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const address = demoAddress.trim();
    if (!address) {
      setNotice({ tone: 'error', message: 'Enter a demo address before joining this race.' });
      return;
    }

    const result = joinRace(race.id, address, participantName.trim() || undefined);
    setNotice(result.ok ? { tone: 'success', message: result.message } : { tone: 'error', message: result.message });

    if (result.ok) {
      setDemoAddress(address);
      setParticipantName('');
      const joinedParticipant = race.participants.find((participant) => normalizeRaceAddress(participant.address) === normalizeRaceAddress(address));
      setScoreValue(joinedParticipant?.score.toString() ?? '0');
    }
  };

  const handleScoreUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const address = demoAddress.trim();
    if (!address) {
      setNotice({ tone: 'error', message: 'Enter the same demo address used to join this race.' });
      return;
    }

    const parsedScore = Number(scoreValue);
    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
      setNotice({ tone: 'error', message: 'Score must be a finite number greater than or equal to zero.' });
      return;
    }

    const result = updateScore(race.id, address, parsedScore);
    setNotice(result.ok ? { tone: 'success', message: result.message } : { tone: 'error', message: result.message });

    if (result.ok) {
      setDemoAddress(address);
      setScoreValue(Math.max(0, Math.round(parsedScore)).toString());
    }
  };

  const handleEndRace = () => {
    const result = endRace(race.id);
    setNotice(result.ok ? { tone: 'success', message: result.message } : { tone: 'error', message: result.message });
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
            <Link href="/race/history" className="nav-link">
              HISTORY
            </Link>
          </div>
          <Link href="/race/history" className="bracket-button">
            ARCHIVE
          </Link>
        </div>
      </nav>

      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link href="/race" className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#777] transition-colors hover:text-[#c9a84c]">
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Hub
          </Link>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <HubCard as="section" className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <HubBadge className={race.status === 'active' ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : race.status === 'upcoming' ? 'border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#cfe6ff]' : 'border-[#777]/20 bg-white/5 text-[#cfcfcf]'}>
                    {race.status.toUpperCase()}
                  </HubBadge>
                  <HubBadge>{race.category.replace('-', ' ')}</HubBadge>
                  <HubBadge>{RACE_CATEGORY_LABELS[race.category]}</HubBadge>
                  <HubBadge>{race.participants.length} participants</HubBadge>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Race detail</p>
                  <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">{race.title}</h1>
                  <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">{race.description}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Prize pool</div>
                    <div className="mt-2 text-xl font-black text-[#c9a84c]">{formatRacePrize(race.prizePool)}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Start</div>
                    <div className="mt-2 text-sm font-semibold text-white">{formatRaceDate(race.startDate)}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">End</div>
                    <div className="mt-2 text-sm font-semibold text-white">{formatRaceDate(race.endDate)}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Leader</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {leaderboard[0] ? leaderboard[0].name ?? formatRaceAddress(leaderboard[0].address) : 'No entries yet'}
                    </div>
                  </div>
                </div>
              </HubCard>

              <HubCard as="section" className="p-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2a2a] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Medal className="text-[#c9a84c]" size={18} aria-hidden="true" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Leaderboard</p>
                      <h2 className="mt-1 text-xl font-black uppercase">Stable rankings</h2>
                    </div>
                  </div>
                  <HubBadge>{sortedParticipantsLabel(race.participants.length)}</HubBadge>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#2a2a2a] text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                        <th scope="col" className="px-6 py-4">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Participant
                        </th>
                        <th scope="col" className="px-6 py-4" aria-sort={sortField === 'score' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                          <SortButton
                            active={sortField === 'score'}
                            direction={sortDirection}
                            label={`Sort leaderboard by score ${sortField === 'score' && sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                            onClick={() => {
                              if (sortField === 'score') {
                                setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
                                return;
                              }

                              setSortField('score');
                              setSortDirection('desc');
                            }}
                          >
                            Score
                          </SortButton>
                        </th>
                        <th scope="col" className="px-6 py-4" aria-sort={sortField === 'joinedAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                          <SortButton
                            active={sortField === 'joinedAt'}
                            direction={sortDirection}
                            label={`Sort leaderboard by join date ${sortField === 'joinedAt' && sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                            onClick={() => {
                              if (sortField === 'joinedAt') {
                                setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
                                return;
                              }

                              setSortField('joinedAt');
                              setSortDirection('desc');
                            }}
                          >
                            Joined
                          </SortButton>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                      {leaderboard.length > 0 ? (
                        leaderboard.map((participant, index) => {
                          const rank = index + 1;
                          const isCurrentUser = normalizedDemoAddress && normalizeRaceAddress(participant.address) === normalizedDemoAddress;

                          return (
                            <tr
                              key={participant.address}
                              aria-current={isCurrentUser ? 'true' : undefined}
                              className={`transition-colors ${
                                isCurrentUser ? 'bg-[#c9a84c]/10 ring-1 ring-inset ring-[#c9a84c]/20' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <RankBadge rank={rank} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-sm font-semibold ${isCurrentUser ? 'text-[#f3dfaa]' : 'text-white'}`}>
                                      {participant.name ?? formatRaceAddress(participant.address)}
                                    </span>
                                    {isCurrentUser ? <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f3dfaa]">YOU</HubBadge> : null}
                                  </div>
                                  <div className="mt-1 truncate text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                                    {participant.address}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-mono text-sm font-black text-white">{participant.score.toLocaleString()}</div>
                                <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#777]">current score</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-[#9a9a9a]">{formatRaceDate(participant.joinedAt)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12">
                            <div className="rounded-3xl border border-dashed border-[#2a2a2a] bg-black/20 px-5 py-10 text-center">
                              <Users className="mx-auto text-[#333]" size={40} aria-hidden="true" />
                              <p className="mt-4 text-sm font-semibold text-white">No participants yet</p>
                              <p className="mt-2 text-sm text-[#9a9a9a]">The leaderboard will populate as competitors join this race.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </HubCard>

              <div className="grid gap-6 md:grid-cols-2">
                <HubCard as="section" className="p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
                    <Info size={14} className="text-[#c9a84c]" aria-hidden="true" />
                    Race rules
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-[#9a9a9a]">
                    <p>Participants must join while the race is active to appear in the live leaderboard.</p>
                    <p>Scores are stored locally and sorted deterministically by score, then join time, then address.</p>
                    <p>Top five finishers receive prize allocations from the published payout pool.</p>
                    <p>Ended races remain readable in the archive for historical review and winner lookup.</p>
                  </div>
                </HubCard>

                <HubCard as="section" className="p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
                    <Coins size={14} className="text-[#c9a84c]" aria-hidden="true" />
                    Prize breakdown
                  </div>
                  <div className="mt-4 space-y-3">
                    {race.prizes.map((prize, index) => (
                      <div key={`${race.id}-prize-${index}`} className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm">
                        <span className="text-[#9a9a9a]">{getRaceOrdinal(index + 1)} place</span>
                        <span className="font-black text-[#c9a84c]">{formatRacePrize(prize)}</span>
                      </div>
                    ))}
                  </div>
                </HubCard>
              </div>
            </div>

            <div className="space-y-6">
              <HubCard as="aside" className="p-6">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
                  <CalendarDays size={14} className="text-[#c9a84c]" aria-hidden="true" />
                  Countdown
                </div>
                <div className="mt-4 rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
                  <p className="text-center text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
                    {race.status === 'active' ? 'Ends In' : race.status === 'upcoming' ? 'Starts In' : 'Finalised'}
                  </p>
                  <div className="mt-4">
                    <RaceCountdown status={race.status} targetDate={race.status === 'upcoming' ? race.startDate : race.endDate} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Status</div>
                    <div className="mt-2 text-sm font-semibold text-white">{RACE_STATUS_LABELS[race.status]}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Category</div>
                    <div className="mt-2 text-sm font-semibold text-white">{RACE_CATEGORY_LABELS[race.category]}</div>
                  </div>
                </div>
              </HubCard>

              <HubCard as="aside" className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Demo address</p>
                    <h2 className="mt-2 text-2xl font-black uppercase">Join and score</h2>
                  </div>
                  <HubBadge>{demoAddress ? formatRaceAddress(demoAddress) : 'Not set'}</HubBadge>
                </div>

                <div className="mt-4 space-y-3">
                  <label className={hubLabelClass} htmlFor="race-demo-address">
                    Participant address
                  </label>
                  <input
                    id="race-demo-address"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={demoAddress}
                    onChange={(event) => setDemoAddress(event.target.value)}
                    placeholder="0x1234...abcd"
                    className={`w-full ${hubInputClass}`}
                  />
                  <label className={hubLabelClass} htmlFor="race-participant-name">
                    Display name
                  </label>
                  <input
                    id="race-participant-name"
                    type="text"
                    autoComplete="nickname"
                    value={participantName}
                    onChange={(event) => setParticipantName(event.target.value)}
                    placeholder="Optional label"
                    className={`w-full ${hubInputClass}`}
                  />
                </div>

                <div className="mt-5 space-y-4">
                  <FeedbackBanner notice={notice} />

                  {race.status === 'active' && !isJoined ? (
                    <form className="space-y-4" onSubmit={handleJoin}>
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4 text-sm text-[#9a9a9a]">
                        Join the race with your local demo address. The entry is saved only in your browser.
                      </div>
                      <button type="submit" className="primary-button w-full justify-center">
                        JOIN RACE
                        <ArrowRight size={15} />
                      </button>
                    </form>
                  ) : race.status === 'active' && isJoined ? (
                    <form className="space-y-4" onSubmit={handleScoreUpdate}>
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Current score</div>
                        <div className="mt-2 text-3xl font-black text-[#c9a84c]">{currentParticipant?.score.toLocaleString() ?? '0'}</div>
                        <p className="mt-2 text-sm text-[#9a9a9a]">
                          This address is already in the leaderboard. Update the score below to reflect a new local result.
                        </p>
                      </div>
                      <div>
                        <label className={hubLabelClass} htmlFor="race-score">
                          New score
                        </label>
                        <input
                          id="race-score"
                          type="number"
                          min="0"
                          step="1"
                          value={scoreValue}
                          onChange={(event) => setScoreValue(event.target.value)}
                          placeholder="0"
                          className={`mt-2 w-full ${hubInputClass}`}
                        />
                      </div>
                      <button type="submit" className="secondary-button w-full justify-center">
                        UPDATE SCORE
                      </button>
                    </form>
                  ) : race.status === 'active' ? (
                    <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-black/20 px-4 py-4 text-sm text-[#9a9a9a]">
                      Enter a demo address above to join the active race and unlock the score update form.
                    </div>
                  ) : race.status === 'ended' && isJoined ? (
                    <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4 text-sm text-[#9a9a9a]">
                      This race has ended. Your archived result remains visible in the leaderboard and winner feed.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4 text-sm text-[#9a9a9a]">
                      This race is not open for participation yet. Watch the countdown for the live join window.
                    </div>
                  )}
                </div>
              </HubCard>

              {isAdmin ? (
                <HubCard as="aside" className="border border-red-500/20 bg-red-500/5 p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-red-200">
                    <ShieldAlert size={14} aria-hidden="true" />
                    Admin tools
                  </div>
                  <h2 className="mt-3 text-2xl font-black uppercase text-red-50">Visible only to the ops address</h2>
                  <p className="mt-2 text-sm leading-7 text-red-100/80">
                    These placeholders are intentionally hidden unless the demo address matches the Arc admin address.
                  </p>
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleEndRace}
                      disabled={race.status === 'ended'}
                      className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      END RACE
                    </button>
                    <div className="rounded-2xl border border-red-500/20 bg-black/30 px-4 py-3 text-sm text-red-100/80">
                      Prize distribution placeholders stay visible only in this admin-only state.
                    </div>
                  </div>
                </HubCard>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function sortedParticipantsLabel(count: number): string {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`;
}
