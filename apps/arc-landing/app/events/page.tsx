'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
  Users,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import BrandLogo from '@/components/BrandLogo';
import SiteHeader from '@/components/SiteHeader';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  HubSkeletonCard,
  hubLabelClass,
  hubSelectClass,
} from '@/components/HubPrimitives';
import {
  buildEventCalendarLinks,
  formatElapsedBrief,
  formatEventDateRange,
  formatEventTime,
  formatEventTiming,
  formatMonthLabel,
  getEventLocationLabel,
  getEventMonthKey,
  getEventStatusLabel,
  getEventTypeLabel,
  resolveEventStatus,
  EVENTS_REFERENCE_NOW,
  useEventsStore,
  type Event as CalendarEvent,
  EVENT_LOCATION_TYPES,
  EVENT_TYPES,
} from '@/lib/eventsStore';

type ViewMode = 'list' | 'calendar';
type NoticeTone = 'success' | 'error' | 'info';

const EVENT_TYPE_ACCENTS: Record<CalendarEvent['type'], { gradient: string; badge: string; monogram: string }> = {
  ama: {
    gradient: 'from-[#d4af37]/80 via-[#d4af37]/20 to-transparent',
    badge: 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]',
    monogram: 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]',
  },
  hackathon: {
    gradient: 'from-emerald-400/80 via-emerald-400/20 to-transparent',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
    monogram: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  },
  workshop: {
    gradient: 'from-sky-400/80 via-sky-400/20 to-transparent',
    badge: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
    monogram: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  },
  meetup: {
    gradient: 'from-fuchsia-400/80 via-fuchsia-400/20 to-transparent',
    badge: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-100',
    monogram: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100',
  },
};

const EVENT_STATUS_STYLES: Record<ReturnType<typeof resolveEventStatus>, string> = {
  upcoming: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  ongoing: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
  past: 'border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]',
};

function useHydratedNow() {
  const [now, setNow] = useState(EVENTS_REFERENCE_NOW);

  useEffect(() => {
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function useRevealObserver() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.16 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function getEventMonogram(type: CalendarEvent['type']): string {
  return getEventTypeLabel(type).slice(0, 4).toUpperCase();
}

function getDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function expandEventDayKeys(event: CalendarEvent): string[] {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const keys: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    keys.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return keys;
}

function buildMonthGrid(monthKey: string): Date[] {
  const [year, month] = monthKey.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(firstOfMonth);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
}

function NoticeBanner({
  notice,
  onDismiss,
}: {
  notice: { tone: NoticeTone; message: string } | null;
  onDismiss: () => void;
}) {
  if (!notice) {
    return null;
  }

  const toneClass =
    notice.tone === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
      : notice.tone === 'error'
        ? 'border-red-500/20 bg-red-500/10 text-red-100'
        : 'border-[#d4af37]/20 bg-[#d4af37]/10 text-[#f5d060]';

  return (
    <div
      className={`fixed right-4 top-20 z-[60] w-[min(92vw,26rem)] rounded-3xl border px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${toneClass}`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <BadgeCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Event update</p>
          <p className="mt-1 text-xs leading-6 text-current/85">{notice.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof resolveEventStatus> }) {
  return <HubBadge className={EVENT_STATUS_STYLES[status]}>{getEventStatusLabel(status)}</HubBadge>;
}

function EventCard({
  event,
  now,
  isRsvped,
  onRsvp,
}: {
  event: CalendarEvent;
  now: number;
  isRsvped: boolean;
  onRsvp: (event: CalendarEvent) => void;
}) {
  const status = resolveEventStatus(event, now);
  const accents = EVENT_TYPE_ACCENTS[event.type];
  const links = buildEventCalendarLinks(event);

  return (
    <HubCard as="article" className="overflow-hidden p-0">
      <div className={`h-1.5 bg-gradient-to-r ${accents.gradient}`} aria-hidden="true" />
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={accents.badge}>{getEventTypeLabel(event.type)}</HubBadge>
            <HubBadge className={event.locationType === 'online' ? 'border-sky-500/25 bg-sky-500/10 text-sky-100' : 'border-[#1a1a2e] bg-white/[0.02] text-[#cfcfcf]'}>
              {getEventLocationLabel(event.locationType)}
            </HubBadge>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl border ${accents.monogram} font-mono text-sm font-bold uppercase tracking-[0.24em]`}>
              {getEventMonogram(event.type)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{event.organizer}</p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">{event.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8a8a9a]">{event.description}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Schedule</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatEventDateRange(event.startsAt, event.endsAt, event.timezone)}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Location</div>
              <div className="mt-2 text-sm font-semibold text-white">{event.location}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <HubBadge key={tag} className="border-[#1a1a2e] bg-white/[0.02] text-[#d8d8d8]">
              {tag}
            </HubBadge>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-[#1a1a2e] bg-black/25 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <div className="text-sm leading-7 text-[#8a8a9a]">
            {formatEventTiming(event, now)} - {event.speakers.join(' / ')}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
            <Clock3 size={12} className="text-[#d4af37]" aria-hidden="true" />
            {event.rsvpCount.toLocaleString('en-US')} RSVPs
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRsvp(event)}
              disabled={status === 'past' || isRsvped}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                status === 'past'
                  ? 'cursor-not-allowed border-[#1a1a2e] bg-white/[0.01] text-[#555566]'
                  : isRsvped
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                    : 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060] hover:border-[#d4af37]/40 hover:bg-[#d4af37]/15'
              }`}
            >
              {status === 'past' ? 'RSVP closed' : isRsvped ? 'RSVP saved' : 'RSVP'}
            </button>
            <Link href={`/events/${event.id}`} className="bracket-button shrink-0">
              View Event
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#555566]">
          <span className="rounded-full border border-[#1a1a2e] px-3 py-1">{event.locationType === 'online' ? 'Online session' : 'Offline session'}</span>
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-[#1a1a2e] px-3 py-1 transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
          >
            Google Calendar
            <ExternalLink size={10} aria-hidden="true" />
          </a>
          <a
            href={links.ics}
            download={`${event.id}.ics`}
            className="inline-flex items-center gap-1 rounded-full border border-[#1a1a2e] px-3 py-1 transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
          >
            ICS
          </a>
        </div>
      </div>
    </HubCard>
  );
}

function FeaturedEventCard({
  event,
  now,
  isRsvped,
  onRsvp,
}: {
  event: CalendarEvent;
  now: number;
  isRsvped: boolean;
  onRsvp: (event: CalendarEvent) => void;
}) {
  const status = resolveEventStatus(event, now);
  const accents = EVENT_TYPE_ACCENTS[event.type];
  const links = buildEventCalendarLinks(event);

  return (
    <HubCard as="article" className="overflow-hidden p-0">
      <div className={`h-1.5 bg-gradient-to-r ${accents.gradient}`} aria-hidden="true" />
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="min-w-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={accents.badge}>Featured event</HubBadge>
            <HubBadge className={EVENT_STATUS_STYLES[status]}>{getEventStatusLabel(status)}</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#cfcfcf]">Protected mock RSVP</HubBadge>
          </div>
          <div className="mt-5 flex gap-4">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl border ${accents.monogram} font-mono text-base font-bold uppercase tracking-[0.26em]`}>
              {getEventMonogram(event.type)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{event.organizer}</p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">{event.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#8a8a9a] sm:text-base">{event.description}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <HubBadge key={tag} className="border-[#1a1a2e] bg-white/[0.02] text-[#d8d8d8]">
                {tag}
              </HubBadge>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">When</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatEventDateRange(event.startsAt, event.endsAt, event.timezone)}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Where</div>
              <div className="mt-2 text-sm font-semibold text-white">{event.location}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Who</div>
              <div className="mt-2 text-sm font-semibold text-white">{event.speakers.join(' / ')}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1a1a2e] bg-black/35 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Countdown</p>
              <h3 className="mt-2 text-2xl font-black uppercase text-white">{formatEventTiming(event, now)}</h3>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-3 py-2 text-right">
              <div className="text-xl font-black text-[#f5d060]">{event.rsvpCount.toLocaleString('en-US')}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">RSVPs</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Type</div>
              <div className="mt-2 text-sm font-semibold text-white">{getEventTypeLabel(event.type)}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Mode</div>
              <div className="mt-2 text-sm font-semibold text-white">{getEventLocationLabel(event.locationType)}</div>
            </div>
            <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Timezone</div>
              <div className="mt-2 text-sm font-semibold text-white">{event.timezone}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onRsvp(event)}
              disabled={status === 'past' || isRsvped}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                status === 'past'
                  ? 'cursor-not-allowed border-[#1a1a2e] bg-white/[0.01] text-[#555566]'
                  : isRsvped
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                    : 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060] hover:border-[#d4af37]/40 hover:bg-[#d4af37]/15'
              }`}
            >
              {status === 'past' ? 'RSVP closed' : isRsvped ? 'RSVP saved' : 'RSVP now'}
            </button>
            <Link href={`/events/${event.id}`} className="secondary-button">
              View event
            </Link>
          </div>

          <div className="mt-4 space-y-2 text-[10px] uppercase tracking-[0.18em] text-[#555566]">
            <a
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[#1a1a2e] px-4 py-3 transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={12} aria-hidden="true" />
                Add to Google Calendar
              </span>
              <ExternalLink size={10} aria-hidden="true" />
            </a>
            <a
              href={links.ics}
              download={`${event.id}.ics`}
              className="flex items-center justify-between rounded-2xl border border-[#1a1a2e] px-4 py-3 transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={12} aria-hidden="true" />
                Download ICS
              </span>
              <span className="text-[#bdbdbd]">.ics</span>
            </a>
          </div>
        </div>
      </div>
    </HubCard>
  );
}

function CalendarView({
  events,
  monthKey,
  now,
}: {
  events: CalendarEvent[];
  monthKey: string;
  now: number;
}) {
  const days = useMemo(() => buildMonthGrid(monthKey), [monthKey]);
  const dayEventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      expandEventDayKeys(event).forEach((key) => {
        const bucket = map.get(key) ?? [];
        bucket.push(event);
        map.set(key, bucket);
      });
    });

    return map;
  }, [events]);

  const eventCount = events.length;
  const monthLabel = formatMonthLabel(monthKey);

  return (
    <HubCard as="section" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1a1a2e] p-6 sm:p-7">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Calendar view</p>
          <h3 className="mt-2 text-2xl font-black uppercase text-white">{monthLabel}</h3>
          <p className="mt-2 text-sm leading-7 text-[#8a8a9a]">
            A month board for the current mock filter set. Long events are shown on each day they occupy.
          </p>
        </div>
        <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">
          <CalendarDays size={10} className="mr-1 inline-block" aria-hidden="true" />
          {eventCount} events
        </HubBadge>
      </div>

      <div className="grid grid-cols-7 border-b border-[#1a1a2e] bg-black/25 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#555566]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="border-r border-[#1a1a2e] px-2 py-3 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const bucket = dayEventMap.get(key) ?? [];
          const sameMonth = key.slice(0, 7) === monthKey;

          return (
            <div
              key={key}
              className={`min-h-[132px] border-r border-b border-[#1a1a2e] p-3 last:border-r-0 ${sameMonth ? 'bg-black/15' : 'bg-black/5 text-[#555566]'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`text-sm font-black ${sameMonth ? 'text-white' : 'text-[#555566]'}`}>{day.getUTCDate()}</div>
                {bucket.length > 0 ? (
                  <span className="rounded-full border border-[#1a1a2e] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                    {bucket.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {bucket.slice(0, 2).map((event) => {
                  const status = resolveEventStatus(event, now);
                  const accents = EVENT_TYPE_ACCENTS[event.type];
                  const isStartDay = key === getDayKey(event.startsAt);
                  const isEndDay = key === getDayKey(event.endsAt);
                  const label = isStartDay
                    ? `Starts ${formatEventTime(event.startsAt, event.timezone)}`
                    : isEndDay
                      ? `Ends ${formatEventTime(event.endsAt, event.timezone)}`
                      : status === 'ongoing'
                        ? 'Live'
                        : 'Scheduled';

                  return (
                    <Link
                      key={`${event.id}-${key}`}
                      href={`/events/${event.id}`}
                      className={`block rounded-2xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                        status === 'ongoing'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-50'
                          : status === 'past'
                            ? 'border-[#1a1a2e] bg-white/[0.02] text-[#8f8f8f]'
                            : 'border-[#1a1a2e] bg-black/25 text-white hover:border-[#d4af37]/25'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`grid h-6 w-6 place-items-center rounded-lg border text-[9px] font-black uppercase ${accents.monogram}`}>
                          {getEventMonogram(event.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[10px] font-mono uppercase tracking-[0.18em]">{event.title}</div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono uppercase tracking-[0.18em] text-current/75">
                            <span>{label}</span>
                            <span>{getEventLocationLabel(event.locationType)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {bucket.length > 2 ? (
                  <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#8a8a9a]">
                    +{bucket.length - 2} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </HubCard>
  );
}

export default function EventsPage() {
  const events = useEventsStore((state) => state.events);
  const rsvpedEventIds = useEventsStore((state) => state.rsvpedEventIds);
  const hasHydrated = useEventsStore((state) => state.hasHydrated);
  const rsvpEvent = useEventsStore((state) => state.rsvpEvent);
  const now = useHydratedNow();
  useRevealObserver();

  const [typeFilter, setTypeFilter] = useState<'all' | CalendarEvent['type']>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | string>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | CalendarEvent['locationType']>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const featuredEvent = useMemo(() => {
    return [...events].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.startsAt - b.startsAt)[0] ?? null;
  }, [events]);

  const monthOptions = useMemo(() => {
    const keys = new Set(events.map((event) => getEventMonthKey(event.startsAt)));
    return [...keys].sort();
  }, [events]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const metrics = useMemo(() => {
    const upcoming = events.filter((event) => resolveEventStatus(event, now) === 'upcoming').length;
    const ongoing = events.filter((event) => resolveEventStatus(event, now) === 'ongoing').length;
    const online = events.filter((event) => event.locationType === 'online').length;
    const featuredRsvps = featuredEvent ? featuredEvent.rsvpCount : 0;

    return { upcoming, ongoing, online, featuredRsvps, total: events.length };
  }, [events, featuredEvent, now]);

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((event) => (typeFilter === 'all' ? true : event.type === typeFilter))
      .filter((event) => (locationFilter === 'all' ? true : event.locationType === locationFilter))
      .filter((event) => (monthFilter === 'all' ? true : getEventMonthKey(event.startsAt) === monthFilter))
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }

        const statusOrder = { ongoing: 0, upcoming: 1, past: 2 } as const;
        const aStatus = resolveEventStatus(a, now);
        const bStatus = resolveEventStatus(b, now);
        if (statusOrder[aStatus] !== statusOrder[bStatus]) {
          return statusOrder[aStatus] - statusOrder[bStatus];
        }

        if (a.startsAt !== b.startsAt) {
          return a.startsAt - b.startsAt;
        }

        return b.rsvpCount - a.rsvpCount;
      });
  }, [events, locationFilter, monthFilter, now, typeFilter]);

  const calendarMonthKey = useMemo(() => {
    if (monthFilter !== 'all') {
      return monthFilter;
    }

    const referenceEvent =
      filteredEvents.find((event) => resolveEventStatus(event, now) !== 'past') ?? filteredEvents[0] ?? featuredEvent ?? events[0];

    return referenceEvent ? getEventMonthKey(referenceEvent.startsAt) : getEventMonthKey(EVENTS_REFERENCE_NOW);
  }, [events, featuredEvent, filteredEvents, monthFilter, now]);

  const clearFilters = () => {
    setTypeFilter('all');
    setMonthFilter('all');
    setLocationFilter('all');
  };

  const handleRsvp = (event: CalendarEvent) => {
    const status = resolveEventStatus(event, now);

    if (status === 'past') {
      setNotice({ tone: 'error', message: 'RSVPs are closed for past events.' });
      return;
    }

    if (rsvpedEventIds.includes(event.id)) {
      setNotice({ tone: 'info', message: `You are already RSVP'd to ${event.title}.` });
      return;
    }

    const success = rsvpEvent(event.id);
    setNotice(
      success
        ? { tone: 'success', message: `RSVP saved for ${event.title}. It is now stored in your local browser state.` }
        : { tone: 'error', message: 'That event could not be updated.' },
    );
  };

  if (!hasHydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubSkeletonCard lines={4} className="min-h-[320px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <HubSkeletonCard lines={3} className="min-h-[260px]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <HubSkeletonCard lines={4} className="min-h-[320px]" />
            <HubSkeletonCard lines={4} className="min-h-[320px]" />
          </div>
        </div>
      </section>
    );
  }

  const featuredIsRsvped = featuredEvent ? rsvpedEventIds.includes(featuredEvent.id) : false;

  return (
    <section className="page-shell section pt-24 sm:pt-28">
      <SiteHeader />
      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6" style={{ transitionDelay: '40ms' }}>
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">// event calendar</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Mock RSVP state</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">{metrics.total} events seeded</HubBadge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#555566]">Arc calendar</p>
              <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.92] sm:text-5xl lg:text-7xl">
                Arc Events
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
                Browse Arc AMAs, hackathons, workshops, and community meetups. Everything here is powered by local
                mock state, with RSVP counts, calendar links, and a mobile-safe calendar board.
              </p>

              <div className="flex flex-wrap gap-3">
                <a href="#browse" className="primary-button">
                  Browse events
                  <ArrowRight size={15} />
                </a>
                <a href="#calendar" className="secondary-button">
                  Open calendar
                </a>
              </div>
            </div>

            {featuredEvent ? (
              <div className="reveal" style={{ transitionDelay: '140ms' }}>
                <FeaturedEventCard event={featuredEvent} now={now} isRsvped={featuredIsRsvped} onRsvp={handleRsvp} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubMetricCard label="Upcoming" value={metrics.upcoming} icon={CalendarDays} />
          <HubMetricCard label="Live now" value={metrics.ongoing} icon={Sparkles} />
          <HubMetricCard label="Online" value={metrics.online} icon={Clock3} />
          <HubMetricCard label="Featured RSVPs" value={metrics.featuredRsvps.toLocaleString('en-US')} icon={Users} />
        </div>

        <section id="browse" className="mt-6">
          <div className="reveal" style={{ transitionDelay: '120ms' }}>
            <HubCard as="div" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Browse & filters</p>
                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Find an event quickly</h2>
              </div>
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">
                {filteredEvents.length} results
              </HubBadge>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
              <div>
                <label htmlFor="events-type-filter" className={`mb-2 block ${hubLabelClass}`}>
                  Type
                </label>
                <select
                  id="events-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'all' | CalendarEvent['type'])}
                  className={`${hubSelectClass} w-full`}
                >
                  <option value="all">All types</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getEventTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="events-month-filter" className={`mb-2 block ${hubLabelClass}`}>
                  Month
                </label>
                <select
                  id="events-month-filter"
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value as 'all' | string)}
                  className={`${hubSelectClass} w-full`}
                >
                  <option value="all">All months</option>
                  {monthOptions.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {formatMonthLabel(monthKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="events-location-filter" className={`mb-2 block ${hubLabelClass}`}>
                  Location
                </label>
                <select
                  id="events-location-filter"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value as 'all' | CalendarEvent['locationType'])}
                  className={`${hubSelectClass} w-full`}
                >
                  <option value="all">All locations</option>
                  {EVENT_LOCATION_TYPES.map((locationType) => (
                    <option key={locationType} value={locationType}>
                      {getEventLocationLabel(locationType)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2 xl:justify-end">
                <div className="inline-flex rounded-full border border-[#1a1a2e] bg-black/30 p-1" role="tablist" aria-label="Event view mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'list'}
                    aria-label="List view"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                      viewMode === 'list' ? 'bg-[#d4af37]/10 text-[#f5d060]' : 'text-[#8b8b8b] hover:text-white'
                    }`}
                  >
                    <List size={12} aria-hidden="true" />
                    List
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'calendar'}
                    aria-label="Calendar view"
                    onClick={() => setViewMode('calendar')}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                      viewMode === 'calendar' ? 'bg-[#d4af37]/10 text-[#f5d060]' : 'text-[#8b8b8b] hover:text-white'
                    }`}
                  >
                    <LayoutGrid size={12} aria-hidden="true" />
                    Calendar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-[#1a1a2e] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#d4af37]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60"
                >
                  Clear filters
                </button>
              </div>
            </div>
            </HubCard>
          </div>
        </section>

        <div id="calendar" className="reveal mt-6" style={{ transitionDelay: '180ms' }}>
          {filteredEvents.length === 0 ? (
            <HubEmptyState
              icon={CalendarDays}
              title="No events match your filters"
              description="Try a different type, month, or location filter. You can always clear the filters to bring back the full event board."
            >
              <button type="button" onClick={clearFilters} className="primary-button">
                Clear filters
              </button>
              <Link href="/" className="secondary-button">
                Back home
              </Link>
            </HubEmptyState>
          ) : viewMode === 'list' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  now={now}
                  isRsvped={rsvpedEventIds.includes(event.id)}
                  onRsvp={handleRsvp}
                />
              ))}
            </div>
          ) : (
            <CalendarView events={filteredEvents} monthKey={calendarMonthKey} now={now} />
          )}
        </div>
      </div>

      <nav className="mt-16 border-t border-[#1a1a2e] bg-black/40 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <BrandLogo href="/" />
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">
            <Link href="/game" className="nav-link">
              Game
            </Link>
            <Link href="/market" className="nav-link">
              Market
            </Link>
            <Link href="/events" className="text-white">
              Events
            </Link>
            <a href="#calendar" className="nav-link">
              Calendar
            </a>
          </div>
          <AppSwitcher />
        </div>
      </nav>
    </section>
  );
}
