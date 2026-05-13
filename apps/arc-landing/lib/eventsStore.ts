import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventType = 'ama' | 'hackathon' | 'workshop' | 'meetup';
export type EventLocationType = 'online' | 'offline';
export type EventStatus = 'upcoming' | 'ongoing' | 'past';

export const EVENT_TYPES = ['ama', 'hackathon', 'workshop', 'meetup'] as const;
export const EVENT_LOCATION_TYPES = ['online', 'offline'] as const;

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startsAt: number;
  endsAt: number;
  timezone: string;
  locationType: EventLocationType;
  location: string;
  organizer: string;
  speakers: string[];
  tags: string[];
  rsvpCount: number;
  isFeatured: boolean;
  createdAt: number;
}

export interface EventAgendaItem {
  time: string;
  title: string;
  note: string;
}

export interface EventsStore {
  events: Event[];
  rsvpedEventIds: string[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  rsvpEvent: (eventId: string) => boolean;
}

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
export const EVENTS_REFERENCE_NOW = Date.parse('2026-05-13T12:00:00Z');

function toTimestamp(value: string): number {
  return Date.parse(value);
}

function formatCalendarStamp(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function getTimeZoneLabel(timeZone: string, timestamp = EVENTS_REFERENCE_NOW): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });

    const parts = formatter.formatToParts(new Date(timestamp));
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

function formatDatePart(timestamp: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  }
}

function formatTimePart(timestamp: number, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(timestamp));
  }
}

function formatMonthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function buildAgendaTemplate(type: EventType): { title: string; note: string; offset: number }[] {
  switch (type) {
    case 'hackathon':
      return [
        {
          title: 'Check-in and team matching',
          note: 'Badge pickup, team matching, and the local demo space open first.',
          offset: 0,
        },
        {
          title: 'Kickoff briefing',
          note: 'Hosts explain the challenge surface, scoring, and builder expectations.',
          offset: 0.1,
        },
        {
          title: 'Build sprint',
          note: 'Teams work through the Arc flow with mentor checkpoints and updates.',
          offset: 0.45,
        },
        {
          title: 'Demo round and wrap-up',
          note: 'Teams show their output and close the session with prizes and notes.',
          offset: 0.95,
        },
      ];
    case 'workshop':
      return [
        {
          title: 'Welcome and setup',
          note: 'A short intro, checklist, and browser-ready setup for every attendee.',
          offset: 0,
        },
        {
          title: 'Live walkthrough',
          note: 'The host demonstrates the core flow with the same mock UI used here.',
          offset: 0.25,
        },
        {
          title: 'Hands-on build',
          note: 'Attendees follow along and test the flow in their own local browser state.',
          offset: 0.6,
        },
        {
          title: 'Q&A and recap',
          note: 'Questions, takeaways, and next steps for the Arc builder path.',
          offset: 0.9,
        },
      ];
    case 'meetup':
      return [
        {
          title: 'Doors open',
          note: 'Arrivals, badge scans, and a quick look at the live schedule board.',
          offset: 0,
        },
        {
          title: 'Opening remarks',
          note: 'The organizer sets the context for the meetup and the local community update.',
          offset: 0.2,
        },
        {
          title: 'Talks and discussion',
          note: 'Short talks, questions, and networking between session blocks.',
          offset: 0.55,
        },
        {
          title: 'Close and networking',
          note: 'Wrap-up, intros, and an open networking window before the meetup ends.',
          offset: 0.9,
        },
      ];
    case 'ama':
    default:
      return [
        {
          title: 'Welcome and agenda',
          note: 'The host frames the discussion and sets expectations for the session.',
          offset: 0,
        },
        {
          title: 'Arc update',
          note: 'A short product and ecosystem update before the live questions begin.',
          offset: 0.22,
        },
        {
          title: 'Live Q&A',
          note: 'Attendees ask questions and the speakers answer them in real time.',
          offset: 0.6,
        },
        {
          title: 'Wrap-up and next steps',
          note: 'The team closes with takeaways, links, and follow-up actions.',
          offset: 0.92,
        },
      ];
  }
}

const INITIAL_EVENTS: Event[] = [
  {
    id: 'event-arc-ama-stablecoin-rails',
    title: 'Arc AMA: Stablecoin Rails on Arc',
    description:
      'A live AMA on how Arc keeps stablecoin payments fast, readable, and ready for builder workflows across the ecosystem.',
    type: 'ama',
    startsAt: toTimestamp('2026-05-14T16:00:00Z'),
    endsAt: toTimestamp('2026-05-14T17:00:00Z'),
    timezone: 'UTC',
    locationType: 'online',
    location: 'Arc Discord Stage',
    organizer: 'Arc Network',
    speakers: ['Mina K.', 'Owen S.'],
    tags: ['AMA', 'Arc Pay', 'USDC'],
    rsvpCount: 284,
    isFeatured: true,
    createdAt: toTimestamp('2026-05-11T10:00:00Z'),
  },
  {
    id: 'event-arc-hackathon-live-build',
    title: 'Arc Hackathon: Live Build Weekend',
    description:
      'A two-day build sprint where teams prototype Arc apps, refine checkout flows, and share demos with the community.',
    type: 'hackathon',
    startsAt: toTimestamp('2026-05-13T09:00:00Z'),
    endsAt: toTimestamp('2026-05-14T18:00:00Z'),
    timezone: 'Europe/Istanbul',
    locationType: 'offline',
    location: 'Arc Loft, Istanbul',
    organizer: 'Arc Builder Guild',
    speakers: ['Aylin R.', 'Jonas P.', 'Lea M.'],
    tags: ['Hackathon', 'Builders', 'Arc Pay'],
    rsvpCount: 196,
    isFeatured: false,
    createdAt: toTimestamp('2026-05-12T09:00:00Z'),
  },
  {
    id: 'event-arc-workshop-pay-flow',
    title: 'Arc Workshop: Payment Flow Patterns',
    description:
      'A hands-on workshop covering checkout handoffs, local demo state, and production-minded UI patterns for Arc Pay.',
    type: 'workshop',
    startsAt: toTimestamp('2026-05-16T13:00:00Z'),
    endsAt: toTimestamp('2026-05-16T15:00:00Z'),
    timezone: 'UTC',
    locationType: 'online',
    location: 'Arc Zoom Room',
    organizer: 'Arc Academy',
    speakers: ['Nina T.', 'Leo C.'],
    tags: ['Workshop', 'Payments', 'Integration'],
    rsvpCount: 97,
    isFeatured: false,
    createdAt: toTimestamp('2026-05-12T16:00:00Z'),
  },
  {
    id: 'event-arc-meetup-istanbul',
    title: 'Arc Community Meetup: Istanbul',
    description:
      'A local community meetup focused on product feedback, creator tools, and the next round of Arc launches.',
    type: 'meetup',
    startsAt: toTimestamp('2026-04-28T15:00:00Z'),
    endsAt: toTimestamp('2026-04-28T18:00:00Z'),
    timezone: 'Europe/Istanbul',
    locationType: 'offline',
    location: 'Galata Workspace, Istanbul',
    organizer: 'Arc Community',
    speakers: ['Sara J.', 'Amin H.'],
    tags: ['Meetup', 'Community', 'Networking'],
    rsvpCount: 168,
    isFeatured: false,
    createdAt: toTimestamp('2026-04-20T11:00:00Z'),
  },
  {
    id: 'event-arc-ama-security',
    title: 'Arc AMA: Security, Wallet Safety, and Trust',
    description:
      'A replay-friendly AMA focused on security questions, wallet safety, and how the demo surfaces stay safe by design.',
    type: 'ama',
    startsAt: toTimestamp('2026-05-01T18:00:00Z'),
    endsAt: toTimestamp('2026-05-01T19:30:00Z'),
    timezone: 'UTC',
    locationType: 'online',
    location: 'Arc Live Stream',
    organizer: 'Arc Security',
    speakers: ['Dr. Emre K.', 'Yara S.'],
    tags: ['AMA', 'Security', 'Wallet Safety'],
    rsvpCount: 245,
    isFeatured: false,
    createdAt: toTimestamp('2026-04-26T14:00:00Z'),
  },
  {
    id: 'event-arc-hackathon-play-ops',
    title: 'Arc Hackathon: Play Ops Sprint',
    description:
      'A community hackathon around game mechanics, challenge flows, and the local history surfaces in the Arc hub.',
    type: 'hackathon',
    startsAt: toTimestamp('2026-06-06T08:00:00Z'),
    endsAt: toTimestamp('2026-06-07T20:00:00Z'),
    timezone: 'Europe/Berlin',
    locationType: 'offline',
    location: 'Arc Studio, Berlin',
    organizer: 'Arc Play',
    speakers: ['Hana W.', 'Kaito S.'],
    tags: ['Hackathon', 'Game Hub', 'Arc Play'],
    rsvpCount: 512,
    isFeatured: false,
    createdAt: toTimestamp('2026-05-08T12:00:00Z'),
  },
  {
    id: 'event-arc-workshop-creator-growth',
    title: 'Arc Workshop: Creator Growth Systems',
    description:
      'A structured workshop on tips, subscriptions, and how creators can frame the Arc Creator surface for supporters.',
    type: 'workshop',
    startsAt: toTimestamp('2026-06-14T12:00:00Z'),
    endsAt: toTimestamp('2026-06-14T14:00:00Z'),
    timezone: 'UTC',
    locationType: 'online',
    location: 'Arc YouTube Live',
    organizer: 'Arc Creator',
    speakers: ['Mina K.', 'Tariq N.'],
    tags: ['Workshop', 'Creator', 'Monetization'],
    rsvpCount: 84,
    isFeatured: false,
    createdAt: toTimestamp('2026-05-10T11:00:00Z'),
  },
  {
    id: 'event-arc-meetup-global-builders',
    title: 'Arc Meetup: Global Builders Night',
    description:
      'An international meetup for builders, contributors, and community members to compare launch playbooks and project notes.',
    type: 'meetup',
    startsAt: toTimestamp('2026-06-20T17:00:00Z'),
    endsAt: toTimestamp('2026-06-20T20:00:00Z'),
    timezone: 'Asia/Singapore',
    locationType: 'offline',
    location: 'Marina Bay Studio, Singapore',
    organizer: 'Arc Global',
    speakers: ['Priya R.', 'Samir D.'],
    tags: ['Meetup', 'Global', 'Builders'],
    rsvpCount: 167,
    isFeatured: false,
    createdAt: toTimestamp('2026-05-04T13:00:00Z'),
  },
];

function getCalendarLinkBase(event: Event): string {
  const start = formatCalendarStamp(event.startsAt);
  const end = formatCalendarStamp(event.endsAt);
  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(`${event.description}\n\nOrganized by ${event.organizer}`);
  const location = encodeURIComponent(event.location);
  const timezone = encodeURIComponent(event.timezone);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}&ctz=${timezone}`;
}

function getIcsContent(event: Event): string {
  const stamp = formatCalendarStamp(EVENTS_REFERENCE_NOW);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arc Ecosystem//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.id)}@arc-ecosystem.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatCalendarStamp(event.startsAt)}`,
    `DTEND:${formatCalendarStamp(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(`${event.description}\nOrganized by ${event.organizer}\nTags: ${event.tags.join(', ')}`)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

function buildIcsDataUri(event: Event): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(getIcsContent(event))}`;
}

export function resolveEventStatus(event: Pick<Event, 'startsAt' | 'endsAt'>, now = EVENTS_REFERENCE_NOW): EventStatus {
  if (now < event.startsAt) {
    return 'upcoming';
  }

  if (now >= event.startsAt && now < event.endsAt) {
    return 'ongoing';
  }

  return 'past';
}

export function getEventTypeLabel(type: EventType): string {
  switch (type) {
    case 'hackathon':
      return 'Hackathon';
    case 'workshop':
      return 'Workshop';
    case 'meetup':
      return 'Meetup';
    case 'ama':
    default:
      return 'AMA';
  }
}

export function getEventLocationLabel(type: EventLocationType): string {
  return type === 'online' ? 'Online' : 'Offline';
}

export function getEventStatusLabel(status: EventStatus): string {
  switch (status) {
    case 'ongoing':
      return 'Live';
    case 'past':
      return 'Past';
    case 'upcoming':
    default:
      return 'Upcoming';
  }
}

export function getEventStatusTone(status: EventStatus): 'emerald' | 'amber' | 'slate' {
  switch (status) {
    case 'ongoing':
      return 'emerald';
    case 'past':
      return 'slate';
    case 'upcoming':
    default:
      return 'amber';
  }
}

export function formatEventDate(timestamp: number, timeZone = 'UTC'): string {
  return formatDatePart(timestamp, timeZone);
}

export function formatEventTime(timestamp: number, timeZone = 'UTC'): string {
  return formatTimePart(timestamp, timeZone);
}

export function formatEventDateTime(timestamp: number, timeZone = 'UTC'): string {
  return `${formatDatePart(timestamp, timeZone)} - ${formatTimePart(timestamp, timeZone)} - ${getTimeZoneLabel(timeZone, timestamp)}`;
}

export function formatEventDateRange(startsAt: number, endsAt: number, timeZone = 'UTC'): string {
  return `${formatDatePart(startsAt, timeZone)} - ${formatTimePart(startsAt, timeZone)} to ${formatTimePart(endsAt, timeZone)} - ${getTimeZoneLabel(timeZone, startsAt)}`;
}

export function formatCountdownBrief(targetAt: number, now = EVENTS_REFERENCE_NOW): string {
  const diff = Math.max(0, targetAt - now);
  const totalMinutes = Math.max(1, Math.ceil(diff / MINUTE_MS));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

export function formatElapsedBrief(targetAt: number, now = EVENTS_REFERENCE_NOW): string {
  const diff = Math.max(0, now - targetAt);
  const totalMinutes = Math.max(1, Math.ceil(diff / MINUTE_MS));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

export function formatEventTiming(event: Pick<Event, 'startsAt' | 'endsAt'>, now = EVENTS_REFERENCE_NOW): string {
  const status = resolveEventStatus(event, now);

  if (status === 'upcoming') {
    return `Starts in ${formatCountdownBrief(event.startsAt, now)}`;
  }

  if (status === 'ongoing') {
    return `Ends in ${formatCountdownBrief(event.endsAt, now)}`;
  }

  return `Ended ${formatElapsedBrief(event.endsAt, now)} ago`;
}

export function getEventMonthKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  return formatMonthLabelFromKey(monthKey);
}

export function buildEventAgenda(event: Event): EventAgendaItem[] {
  const duration = Math.max(HOUR_MS, event.endsAt - event.startsAt);
  const template = buildAgendaTemplate(event.type);

  return template.map((item) => {
    const offset = Math.min(1, Math.max(0, item.offset));
    const time = formatEventTime(event.startsAt + Math.round(duration * offset), event.timezone);

    return {
      time,
      title: item.title,
      note: item.note,
    };
  });
}

export function buildEventCalendarLinks(event: Event): { google: string; ics: string } {
  return {
    google: getCalendarLinkBase(event),
    ics: buildIcsDataUri(event),
  };
}

interface PersistedEventsState {
  events: Event[];
  rsvpedEventIds: string[];
}

interface EventsState extends EventsStore {}

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: INITIAL_EVENTS,
      rsvpedEventIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      rsvpEvent: (eventId) => {
        let updated = false;

        set((state) => {
          const eventExists = state.events.some((event) => event.id === eventId);
          if (!eventExists || state.rsvpedEventIds.includes(eventId)) {
            return {};
          }

          updated = true;

          return {
            events: state.events.map((event) =>
              event.id === eventId ? { ...event, rsvpCount: event.rsvpCount + 1 } : event,
            ),
            rsvpedEventIds: [...state.rsvpedEventIds, eventId],
          };
        });

        return updated;
      },
    }),
    {
      name: 'arc-events-store',
      partialize: (state): PersistedEventsState => ({
        events: state.events,
        rsvpedEventIds: state.rsvpedEventIds,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
