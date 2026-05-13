'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
  Users,
  Timer,
  ShieldCheck,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import { HubBadge, HubCard, HubEmptyState, HubSkeletonCard } from '@/components/HubPrimitives';
import {
  buildEventAgenda,
  buildEventCalendarLinks,
  formatEventDate,
  formatEventDateRange,
  formatEventDateTime,
  formatEventTiming,
  getEventLocationLabel,
  getEventStatusLabel,
  getEventTypeLabel,
  resolveEventStatus,
  EVENTS_REFERENCE_NOW,
  useEventsStore,
  type Event as CalendarEvent,
} from '@/lib/eventsStore';

type NoticeTone = 'success' | 'error' | 'info';

const EVENT_TYPE_ACCENTS: Record<CalendarEvent['type'], { gradient: string; badge: string; monogram: string }> = {
  ama: {
    gradient: 'from-[#c9a84c]/80 via-[#c9a84c]/20 to-transparent',
    badge: 'border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f4dc9f]',
    monogram: 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#f4dc9f]',
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
  past: 'border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]',
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
        : 'border-[#c9a84c]/20 bg-[#c9a84c]/10 text-[#f4dc9f]';

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
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function getEventMonogram(type: CalendarEvent['type']): string {
  return getEventTypeLabel(type).slice(0, 4).toUpperCase();
}

function RelatedEventCard({ event, now }: { event: CalendarEvent; now: number }) {
  const status = resolveEventStatus(event, now);
  const accents = EVENT_TYPE_ACCENTS[event.type];

  return (
    <HubCard as="article" className="overflow-hidden p-0">
      <div className={`h-1.5 bg-gradient-to-r ${accents.gradient}`} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <HubBadge className={accents.badge}>{getEventTypeLabel(event.type)}</HubBadge>
          <HubBadge className={EVENT_STATUS_STYLES[status]}>{getEventStatusLabel(status)}</HubBadge>
        </div>
        <div className="mt-4 flex items-start gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-3xl border ${accents.monogram} font-mono text-sm font-bold uppercase tracking-[0.24em]`}>
            {getEventMonogram(event.type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">{event.organizer}</p>
            <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">{event.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#9a9a9a]">{event.description}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[#777]">
          <span className="rounded-full border border-[#2a2a2a] px-3 py-1">{formatEventTiming(event, now)}</span>
          <span className="rounded-full border border-[#2a2a2a] px-3 py-1">{event.locationType === 'online' ? 'Online' : 'Offline'}</span>
          <span className="rounded-full border border-[#2a2a2a] px-3 py-1">{event.rsvpCount.toLocaleString('en-US')} RSVPs</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-xs leading-6 text-[#777]">
            {formatEventDateRange(event.startsAt, event.endsAt, event.timezone)}
          </div>
          <Link href={`/events/${event.id}`} className="bracket-button shrink-0">
            View
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </HubCard>
  );
}

function SpeakerCard({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-3xl border border-[#2a2a2a] bg-black/30 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/10 font-mono text-sm font-bold uppercase tracking-[0.22em] text-[#f4dc9f]">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#777]">Speaker</div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId ?? '';

  const events = useEventsStore((state) => state.events);
  const rsvpedEventIds = useEventsStore((state) => state.rsvpedEventIds);
  const hasHydrated = useEventsStore((state) => state.hasHydrated);
  const rsvpEvent = useEventsStore((state) => state.rsvpEvent);
  const now = useHydratedNow();
  useRevealObserver();

  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const event = useMemo<CalendarEvent | null>(() => {
    return events.find((entry) => entry.id === eventId) ?? null;
  }, [eventId, events]);

  const relatedEvents = useMemo(() => {
    if (!event) {
      return [];
    }

    return [...events]
      .filter((entry) => entry.id !== event.id)
      .sort((a, b) => {
        const aScore = (a.type === event.type ? 2 : 0) + (a.organizer === event.organizer ? 1 : 0) + (a.locationType === event.locationType ? 1 : 0);
        const bScore = (b.type === event.type ? 2 : 0) + (b.organizer === event.organizer ? 1 : 0) + (b.locationType === event.locationType ? 1 : 0);

        if (aScore !== bScore) {
          return bScore - aScore;
        }

        const aStatus = resolveEventStatus(a, now);
        const bStatus = resolveEventStatus(b, now);
        const order = { ongoing: 0, upcoming: 1, past: 2 } as const;

        if (order[aStatus] !== order[bStatus]) {
          return order[aStatus] - order[bStatus];
        }

        return a.startsAt - b.startsAt;
      })
      .slice(0, 3);
  }, [event, events, now]);

  const agenda = useMemo(() => {
    return event ? buildEventAgenda(event) : [];
  }, [event]);

  if (!hasHydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-6">
          <HubSkeletonCard lines={4} className="min-h-[320px]" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
            <HubSkeletonCard lines={5} className="min-h-[420px]" />
            <HubSkeletonCard lines={4} className="min-h-[420px]" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <HubSkeletonCard lines={4} className="min-h-[280px]" />
            <HubSkeletonCard lines={4} className="min-h-[280px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!event) {
    notFound();
  }

  const status = resolveEventStatus(event, now);
  const accents = EVENT_TYPE_ACCENTS[event.type];
  const links = buildEventCalendarLinks(event);
  const isRsvped = rsvpedEventIds.includes(event.id);

  const handleRsvp = () => {
    if (status === 'past') {
      setNotice({ tone: 'error', message: 'RSVPs are closed for past events.' });
      return;
    }

    if (isRsvped) {
      setNotice({ tone: 'info', message: `You are already RSVP'd to ${event.title}.` });
      return;
    }

    const success = rsvpEvent(event.id);
    setNotice(
      success
        ? { tone: 'success', message: `RSVP saved for ${event.title}. Your choice is now stored locally.` }
        : { tone: 'error', message: 'That RSVP could not be updated.' },
    );
  };

  return (
    <section className="section pt-24 sm:pt-28">
      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="mx-auto max-w-7xl">
        <div className="reveal space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-white/[0.02] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#bdbdbd] transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
            >
              <ArrowRight size={14} className="rotate-180" />
              Back to Events
            </Link>
            <HubBadge className={accents.badge}>Event detail</HubBadge>
            <HubBadge className={EVENT_STATUS_STYLES[status]}>{getEventStatusLabel(status)}</HubBadge>
            <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
              {event.locationType === 'online' ? 'Online' : 'Offline'}
            </HubBadge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_340px] lg:items-start">
            <HubCard as="section" className="overflow-hidden p-0">
              <div className={`h-1.5 bg-gradient-to-r ${accents.gradient}`} aria-hidden="true" />
              <div className="p-6 sm:p-8">
                <div className="flex gap-4">
                  <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl border ${accents.monogram} font-mono text-base font-bold uppercase tracking-[0.26em]`}>
                    {getEventMonogram(event.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <HubBadge className={accents.badge}>{getEventTypeLabel(event.type)}</HubBadge>
                      <HubBadge className={EVENT_STATUS_STYLES[status]}>{getEventStatusLabel(status)}</HubBadge>
                      <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#cfcfcf]">{event.organizer}</HubBadge>
                    </div>
                    <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.92] sm:text-5xl lg:text-7xl">
                      {event.title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-[#9a9a9a] sm:text-lg">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <HubBadge key={tag} className="border-[#2a2a2a] bg-white/[0.02] text-[#d8d8d8]">
                      {tag}
                    </HubBadge>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">When</div>
                    <div className="mt-2 text-sm font-semibold text-white">{formatEventDateRange(event.startsAt, event.endsAt, event.timezone)}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Location</div>
                    <div className="mt-2 text-sm font-semibold text-white">{event.location}</div>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">RSVPs</div>
                    <div className="mt-2 text-sm font-semibold text-white">{event.rsvpCount.toLocaleString('en-US')}</div>
                  </div>
                </div>
              </div>
            </HubCard>

            <div className="space-y-6 lg:sticky lg:top-24">
              <HubCard as="aside" className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">RSVP state</p>
                    <h2 className="mt-2 text-2xl font-black uppercase text-white">{formatEventTiming(event, now)}</h2>
                  </div>
                  <div className="rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-3 py-2 text-right">
                    <div className="text-xl font-black text-[#f4dc9f]">{event.rsvpCount.toLocaleString('en-US')}</div>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">RSVPs</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={handleRsvp}
                    disabled={status === 'past' || isRsvped}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60 ${
                      status === 'past'
                        ? 'cursor-not-allowed border-[#2a2a2a] bg-white/[0.01] text-[#555]'
                        : isRsvped
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                          : 'border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f4dc9f] hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/15'
                    }`}
                  >
                    {status === 'past' ? 'RSVP closed' : isRsvped ? 'RSVP saved' : 'RSVP now'}
                  </button>
                  <div className="grid gap-2 text-[10px] uppercase tracking-[0.18em] text-[#777]">
                    <a
                      href={links.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] px-4 py-3 transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
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
                      className="flex items-center justify-between rounded-2xl border border-[#2a2a2a] px-4 py-3 transition-colors hover:border-[#c9a84c]/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={12} aria-hidden="true" />
                        Download ICS
                      </span>
                      <span className="text-[#bdbdbd]">.ics</span>
                    </a>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
                    <ShieldCheck size={12} className="text-[#c9a84c]" aria-hidden="true" />
                    Protected checkout (demo)
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                    RSVP state stays local to the browser. This detail page never calls a backend, wallet, or contract.
                  </p>
                </div>
              </HubCard>

              <HubCard as="aside" className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Event facts</p>
                    <h2 className="mt-2 text-2xl font-black uppercase text-white">Details at a glance</h2>
                  </div>
                  <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                    <MapPin size={10} className="mr-1 inline-block" aria-hidden="true" />
                    {getEventLocationLabel(event.locationType)}
                  </HubBadge>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    ['Start', formatEventDateTime(event.startsAt, event.timezone)],
                    ['End', formatEventDateTime(event.endsAt, event.timezone)],
                    ['Timezone', event.timezone],
                    ['Organizer', event.organizer],
                    ['Created', formatEventDate(event.createdAt, event.timezone)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{label}</div>
                      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </HubCard>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Agenda</p>
                  <h2 className="mt-2 text-2xl font-black uppercase text-white">Timeline block</h2>
                </div>
                <HubBadge className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#f4dc9f]">
                  <Timer size={10} className="mr-1 inline-block" aria-hidden="true" />
                  {agenda.length} steps
                </HubBadge>
              </div>

              <div className="mt-6 space-y-4">
                {agenda.map((item, index) => (
                  <div key={`${item.time}-${index}`} className="relative pl-8">
                    <span className="absolute left-1.5 top-3 h-3 w-3 rounded-full bg-[#c9a84c]" aria-hidden="true" />
                    {index !== agenda.length - 1 ? (
                      <span className="absolute bottom-0 left-[0.56rem] top-8 w-px bg-[#2a2a2a]" aria-hidden="true" />
                    ) : null}
                    <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">{item.time}</div>
                        <div className="rounded-full border border-[#2a2a2a] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-[#aaa]">
                          Step {index + 1}
                        </div>
                      </div>
                      <h3 className="mt-3 text-lg font-black uppercase text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Speakers</p>
                  <h2 className="mt-2 text-2xl font-black uppercase text-white">Guest list</h2>
                </div>
                <HubBadge className="border-[#2a2a2a] bg-white/[0.02] text-[#bdbdbd]">
                  <Users size={10} className="mr-1 inline-block" aria-hidden="true" />
                  {event.speakers.length}
                </HubBadge>
              </div>

              <div className="mt-6 grid gap-3">
                {event.speakers.map((speaker) => (
                  <SpeakerCard key={speaker} name={speaker} />
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#777]">
                  <Sparkles size={12} className="text-[#c9a84c]" aria-hidden="true" />
                  RSVP state
                </div>
                <p className="mt-2 text-sm leading-7 text-[#9a9a9a]">
                  {isRsvped
                    ? 'Your RSVP is saved in this browser. Refreshing the page keeps the state intact.'
                    : status === 'past'
                      ? 'This event is in the archive. RSVP is closed.'
                      : 'Tap RSVP now to increment the mock count and mark this event as going locally.'}
                </p>
              </div>
            </HubCard>
          </div>

          <HubCard as="section" className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Related</p>
                <h2 className="mt-2 text-2xl font-black uppercase text-white">Related events</h2>
              </div>
              <Link href="/events" className="bracket-button shrink-0">
                Back to events
                <ArrowRight size={15} />
              </Link>
            </div>

            {relatedEvents.length === 0 ? (
              <div className="mt-6">
                <HubEmptyState
                  icon={Sparkles}
                  title="No related events"
                  description="The mock store does not have enough overlapping events to build a related list right now."
                >
                  <Link href="/events" className="primary-button">
                    Back to Events
                  </Link>
                </HubEmptyState>
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {relatedEvents.map((relatedEvent) => (
                  <RelatedEventCard key={relatedEvent.id} event={relatedEvent} now={now} />
                ))}
              </div>
            )}
          </HubCard>
        </div>
      </div>

      <nav className="mt-16 border-t border-[#2a2a2a] bg-black/40 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
            <Link href="/events" className="text-white">
              Events
            </Link>
            <Link href="/game" className="nav-link">
              Game
            </Link>
            <Link href="/market" className="nav-link">
              Market
            </Link>
          </div>
          <AppSwitcher />
        </div>
      </nav>
    </section>
  );
}
