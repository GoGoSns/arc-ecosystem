'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Coins,
  Flame,
  Info,
  Medal,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  hubInputClass,
  hubLabelClass,
} from '@/components/HubPrimitives';
import { translations, type Lang } from '@/lib/translations';
import SiteHeader from '@/components/SiteHeader';
import {
  formatRaceAddress,
  formatRaceDate,
  formatRacePrize,
  getRaceOrdinal,
  getRacePreviewParticipants,
  getRaceWinner,
  normalizeRaceAddress,
  readStoredRaceDemoAddress,
  useRaceStore,
  writeStoredRaceDemoAddress,
  type Race,
} from '@/lib/raceStore';

type RaceCopy = typeof translations.en.race;

function formatRaceCountDown(ms: number, units: RaceCopy['countdownUnits']): { value: number; label: string }[] {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { value: days, label: units.days },
    { value: hours, label: units.hours },
    { value: minutes, label: units.minutes },
    { value: seconds, label: units.seconds },
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
  labels,
  countdownUnits,
}: {
  status: Race['status'];
  targetDate: number;
  labels: RaceCopy['labels'];
  countdownUnits: RaceCopy['countdownUnits'];
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
      <div className="space-y-1 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">{labels.finalised}</p>
        <p className="text-2xl font-black text-white">{labels.finalised} {formatRaceDate(targetDate)}</p>
      </div>
    );
  }

  const remaining = Math.max(0, targetDate - now);

  if (remaining === 0) {
    return (
      <div className="space-y-1 text-center" aria-live="polite">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#777]">
          {labels.countdown}
        </p>
        <p className="text-2xl font-black text-[#c9a84c]">
          {status === 'active' ? labels.wrappingUp : labels.startingNow}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
      {formatRaceCountDown(remaining, countdownUnits).map((part) => (
        <div key={part.label} className="rounded-2xl border border-[#2a2a2a] bg-black/40 px-2 py-3 text-center">
          <div className="text-xl font-black text-white sm:text-2xl">{part.value}</div>
          <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.24em] text-[#777]">{part.label}</div>
        </div>
      ))}
    </div>
  );
}

function RaceSurface({
  race,
  tone,
  title,
  subtitle,
  targetDate,
  ctaHref,
  ctaLabel,
  previewLabel,
  copy,
}: {
  race: Race | undefined;
  tone: 'active' | 'upcoming';
  title: string;
  subtitle: string;
  targetDate: number;
  ctaHref?: string;
  ctaLabel?: string;
  previewLabel: string;
  copy: RaceCopy;
}) {
  if (!race) {
    return (
      <HubEmptyState
        icon={tone === 'active' ? Flame : CalendarDays}
        title={tone === 'active' ? copy.surfaces.noActiveTitle : copy.surfaces.noUpcomingTitle}
        description={tone === 'active' ? copy.surfaces.noActiveDescription : copy.surfaces.noUpcomingDescription}
      />
    );
  }

  const previewParticipants = getRacePreviewParticipants(race, 5);
  const winner = getRaceWinner(race);

  return (
    <HubCard as="section" className="p-6 sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className={tone === 'active' ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]' : 'border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#cfe6ff]'}>
                {tone === 'active' ? copy.header.live : copy.header.upcoming}
              </HubBadge>
              <HubBadge>{race.category.replace('-', ' ')}</HubBadge>
              <HubBadge>{race.participants.length} {copy.surfaces.participants}</HubBadge>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{title}</p>
              <h2 className="text-3xl font-black uppercase sm:text-4xl">{race.title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-[#9a9a9a] sm:text-base">{subtitle}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/40 px-4 py-3 text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">{copy.surfaces.prizePool}</p>
            <p className="mt-1 text-2xl font-black text-[#c9a84c]">{formatRacePrize(race.prizePool)}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
              <ShieldAlert size={14} className="text-[#c9a84c]" aria-hidden="true" />
              {tone === 'active' ? copy.labels.endsIn : copy.labels.startsIn}
            </div>
            <div className="mt-4">
              <RaceCountdown
                status={race.status}
                targetDate={targetDate}
                labels={copy.labels}
                countdownUnits={copy.countdownUnits}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{copy.labels.start}</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatRaceDate(race.startDate)}</div>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{copy.labels.end}</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatRaceDate(race.endDate)}</div>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{copy.labels.topPrize}</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatRacePrize(race.prizes[0] ?? 0)}</div>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{copy.labels.leader}</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {winner ? winner.name ?? formatRaceAddress(winner.address) : copy.labels.noEntries}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
              <Medal size={14} className="text-[#c9a84c]" aria-hidden="true" />
              {previewLabel}
            </div>
            <div className="mt-4 space-y-3">
              {previewParticipants.length > 0 ? (
                previewParticipants.map((participant, index) => (
                <div
                  key={participant.address}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3"
                >
                    <span className="inline-flex min-w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-white/[0.02] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white">
                      {getRaceOrdinal(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {participant.name ?? formatRaceAddress(participant.address)}
                      </div>
                      <div className="truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#777]">
                        {participant.address}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-[#c9a84c]">{participant.score.toLocaleString()}</div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">{copy.labels.score}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-[#2a2a2a] bg-black/20 px-5 py-8 text-center text-sm text-[#777]">
                  {copy.labels.noParticipantsDescription}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#2a2a2a] bg-white/[0.015] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
              <Sparkles size={14} className="text-[#c9a84c]" aria-hidden="true" />
              {copy.surfaces.quickLink}
            </div>
            <h3 className="mt-3 text-xl font-black uppercase text-white">{copy.surfaces.raceDetails}</h3>
            <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">{race.description}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm">
                <span className="text-[#777]">{copy.surfaces.participants}</span>
                <span className="font-semibold text-white">{race.participants.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm">
                <span className="text-[#777]">{copy.surfaces.prizePool}</span>
                <span className="font-semibold text-white">{formatRacePrize(race.prizePool)}</span>
              </div>
            </div>
            {ctaHref && ctaLabel ? (
              <Link href={ctaHref} className="primary-button mt-5 w-full justify-center">
                {ctaLabel}
                <ArrowRight size={15} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </HubCard>
  );
}

export default function RaceHubPage() {
  const { races } = useRaceStore();
  const [demoAddress, setDemoAddress] = useStoredDemoAddress();
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved === 'tr' || saved === 'en') {
      setLang(saved);
    } else if (typeof navigator !== 'undefined' && navigator.language?.startsWith('tr')) {
      setLang('tr');
    }
  }, []);

  const t = translations[lang];
  const copy = t.race as RaceCopy;

  const activeRaces = useMemo(
    () => races.filter((race) => race.status === 'active').sort((a, b) => a.endDate - b.endDate || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    [races],
  );

  const upcomingRaces = useMemo(
    () =>
      races
        .filter((race) => race.status === 'upcoming')
        .sort((a, b) => a.startDate - b.startDate || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    [races],
  );

  const endedRaces = useMemo(
    () =>
      races
        .filter((race) => race.status === 'ended')
        .sort((a, b) => b.endDate - a.endDate || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    [races],
  );

  const totalPrizePool = useMemo(
    () => races.reduce((sum, race) => sum + race.prizePool, 0),
    [races],
  );

  const totalParticipants = useMemo(
    () => races.reduce((sum, race) => sum + race.participants.length, 0),
    [races],
  );

  const demoAddressKey = normalizeRaceAddress(demoAddress);
  const yourWins = useMemo(() => {
    if (!demoAddressKey) {
      return 0;
    }

    return endedRaces.filter((race) => normalizeRaceAddress(getRaceWinner(race)?.address ?? '') === demoAddressKey).length;
  }, [demoAddressKey, endedRaces]);

  const activeRace = activeRaces[0];
  const upcomingRace = upcomingRaces[0];

  if (races.length === 0) {
    return (
      <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
        <section className="section pt-32">
          <div className="mx-auto max-w-5xl">
            <HubEmptyState
              icon={ShieldAlert}
              title={copy.empty.title}
              description={copy.empty.description}
            >
              <Link href="/" className="primary-button">
                {copy.empty.cta}
              </Link>
            </HubEmptyState>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen overflow-x-clip text-white">
      <SiteHeader currentLang={lang} onLangChange={(nextLang) => { setLang(nextLang); localStorage.setItem('arc-lang', nextLang); }} />

      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="reveal space-y-5" style={{ transitionDelay: '40ms' }}>
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f0d79e]">{copy.header.badge}</HubBadge>
              <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">{copy.header.leaderboard}</HubBadge>
            </div>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
              {copy.hero.description}
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <HubMetricCard label={copy.stats.active} value={activeRaces.length} icon={Flame} />
            <HubMetricCard label={copy.stats.pool} value={formatRacePrize(totalPrizePool)} icon={Coins} />
            <HubMetricCard label={copy.stats.participants} value={totalParticipants} icon={Users} />
            <HubMetricCard label={copy.stats.wins} value={yourWins} icon={Trophy} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <HubCard as="section" className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">{copy.overview.personalize}</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">{copy.overview.demoAddress}</h2>
                </div>
                <HubBadge>{demoAddress ? formatRaceAddress(demoAddress) : copy.overview.notSet}</HubBadge>
              </div>
              <div className="mt-5 space-y-3">
                <label className={hubLabelClass} htmlFor="race-demo-address">
                  {copy.overview.demoHelp}
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
                <p className="text-sm leading-7 text-[#9a9a9a]">
                  {copy.overview.demoNote}
                </p>
              </div>
            </HubCard>

            <HubCard as="section" className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
                <Info size={14} className="text-[#c9a84c]" aria-hidden="true" />
                {copy.overview.archiveTitle}
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                  <span className="text-sm text-[#777]">{copy.overview.ended}</span>
                  <span className="text-sm font-semibold text-white">{endedRaces.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                  <span className="text-sm text-[#777]">{copy.overview.currentWins}</span>
                  <span className="text-sm font-semibold text-[#c9a84c]">{yourWins}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                  <span className="text-sm text-[#777]">{copy.overview.latest}</span>
                  <span className="text-sm font-semibold text-white">{endedRaces[0] ? formatRaceDate(endedRaces[0].endDate) : '—'}</span>
                </div>
              </div>
            </HubCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <RaceSurface
                race={activeRace}
                tone="active"
                title={copy.surfaces.activeTitle}
                subtitle={copy.surfaces.activeSubtitle}
                targetDate={activeRace?.endDate ?? Date.now()}
                ctaHref={activeRace ? `/race/${activeRace.id}` : undefined}
                ctaLabel={activeRace ? copy.surfaces.openLive : undefined}
                previewLabel={copy.surfaces.topPreview}
                copy={copy}
              />

              <RaceSurface
                race={upcomingRace}
                tone="upcoming"
                title={copy.surfaces.upcomingTitle}
                subtitle={copy.surfaces.upcomingSubtitle}
                targetDate={upcomingRace?.startDate ?? Date.now()}
                ctaHref={upcomingRace ? `/race/${upcomingRace.id}` : undefined}
                ctaLabel={upcomingRace ? copy.surfaces.viewUpcoming : undefined}
                previewLabel={copy.surfaces.entrantPreview}
                copy={copy}
              />
            </div>

            <div className="space-y-6">
              <HubCard as="section" className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">{copy.feed.recentWinners}</p>
                    <h2 className="mt-2 text-2xl font-black uppercase">{copy.feed.archiveFeed}</h2>
                  </div>
                  <Medal className="text-[#c9a84c]" size={22} aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-3">
                  {endedRaces.length > 0 ? (
                    endedRaces.slice(0, 5).map((race) => {
                      const winner = getRaceWinner(race);
                      return (
                        <div
                          key={race.id}
                          className="flex items-start justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <HubBadge>{race.category.replace('-', ' ')}</HubBadge>
                              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
                                {formatRaceDate(race.endDate)}
                              </span>
                            </div>
                            <div className="mt-2 truncate text-sm font-semibold text-white">{race.title}</div>
                            <div className="mt-1 truncate text-xs text-[#9a9a9a]">
                              {copy.feed.winner}:{' '}
                              {winner ? winner.name ?? formatRaceAddress(winner.address) : copy.labels.noWinner} · {race.participants.length} {copy.surfaces.participants}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{copy.feed.payout}</div>
                            <div className="mt-2 text-sm font-black text-[#c9a84c]">{formatRacePrize(race.prizes[0] ?? 0)}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <HubEmptyState
                      icon={Trophy}
                      title={copy.feed.noWinnersTitle}
                      description={copy.feed.noWinnersDescription}
                    />
                  )}
                </div>
              </HubCard>

              <HubCard as="section" className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#777]">
                  <CalendarDays size={14} className="text-[#c9a84c]" aria-hidden="true" />
                  {copy.timeline.title}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm text-[#9a9a9a]">
                    {copy.timeline.line1}
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm text-[#9a9a9a]">
                    {copy.timeline.line2}
                  </div>
                </div>
              </HubCard>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


