import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

export type RaceCategory = 'transactions' | 'volume' | 'forum-posts' | 'quests' | 'referrals';
export type RaceStatus = 'upcoming' | 'active' | 'ended';
export type RaceLeaderboardSortField = 'score' | 'joinedAt';
export type RaceLeaderboardSortDirection = 'asc' | 'desc';
export type RaceMutationReason =
  | 'not-found'
  | 'inactive'
  | 'duplicate'
  | 'invalid-score'
  | 'invalid-address'
  | 'invalid-race';

export type RaceMutationResult =
  | { ok: true; message: string }
  | { ok: false; reason: RaceMutationReason; message: string };

export interface RaceParticipant {
  address: string;
  name?: string;
  score: number;
  joinedAt: number;
}

export interface Race {
  id: string;
  title: string;
  description: string;
  category: RaceCategory;
  status: RaceStatus;
  prizePool: number; // USDC
  prizes: number[]; // [1st, 2nd, 3rd, 4th, 5th] in USDC
  startDate: number;
  endDate: number;
  participants: RaceParticipant[];
}

export const ADMIN_ADDRESS = '0xB87B774a5b3D77E13a89C68F62810D5a23404365';

export const RACE_CATEGORY_LABELS: Record<RaceCategory, string> = {
  transactions: 'Transactions',
  volume: 'Volume',
  'forum-posts': 'Forum Posts',
  quests: 'Quests',
  referrals: 'Referrals',
};

export const RACE_STATUS_LABELS: Record<RaceStatus, string> = {
  upcoming: 'Upcoming',
  active: 'Active',
  ended: 'Ended',
};

const DAY_MS = 86_400_000;
const NOW = Date.now();

const BASE_RACES: Race[] = [
  {
    id: 'race-active-1',
    title: 'January Champion',
    description: 'The user with the most transactions on Arc Network this month wins the grand prize.',
    category: 'transactions',
    status: 'active',
    prizePool: 500,
    prizes: [250, 125, 75, 30, 20],
    startDate: NOW - DAY_MS * 25,
    endDate: NOW + DAY_MS * 5,
    participants: [
      { address: '0x1234...5678', name: 'Alpha', score: 150, joinedAt: NOW - DAY_MS * 24 },
      { address: '0xabcd...efgh', name: 'Beta', score: 120, joinedAt: NOW - DAY_MS * 20 },
      { address: '0x9876...5432', score: 115, joinedAt: NOW - DAY_MS * 15 },
      { address: '0x5555...4444', name: 'Gamma', score: 95, joinedAt: NOW - DAY_MS * 10 },
      { address: '0x1111...2222', score: 80, joinedAt: NOW - DAY_MS * 5 },
      { address: '0x3333...7777', name: 'Delta', score: 75, joinedAt: NOW - DAY_MS * 2 },
    ],
  },
  {
    id: 'race-upcoming-1',
    title: 'Forum Master',
    description: 'Engage with the community! Most forum posts wins the prize pool.',
    category: 'forum-posts',
    status: 'upcoming',
    prizePool: 200,
    prizes: [100, 50, 25, 15, 10],
    startDate: NOW + DAY_MS * 7,
    endDate: NOW + DAY_MS * 14,
    participants: [],
  },
  {
    id: 'race-past-1',
    title: 'Holiday Volume Sprint',
    description: 'Highest trading volume during the holiday season.',
    category: 'volume',
    status: 'ended',
    prizePool: 1000,
    prizes: [500, 250, 150, 60, 40],
    startDate: NOW - DAY_MS * 45,
    endDate: NOW - DAY_MS * 15,
    participants: [
      { address: '0xwinner...1', name: 'WhaleMain', score: 50000, joinedAt: NOW - DAY_MS * 44 },
      { address: '0xrunner...up', name: 'TraderJoe', score: 42000, joinedAt: NOW - DAY_MS * 40 },
      { address: '0xthird...place', score: 35000, joinedAt: NOW - DAY_MS * 35 },
    ],
  },
  {
    id: 'race-past-2',
    title: 'Quest Marathon',
    description: 'Complete as many quests as possible in one week.',
    category: 'quests',
    status: 'ended',
    prizePool: 300,
    prizes: [150, 75, 40, 25, 10],
    startDate: NOW - DAY_MS * 60,
    endDate: NOW - DAY_MS * 53,
    participants: [
      { address: '0xq1...123', name: 'QuestHero', score: 25, joinedAt: NOW - DAY_MS * 59 },
      { address: '0xq2...456', name: 'Explorer', score: 22, joinedAt: NOW - DAY_MS * 58 },
    ],
  },
  {
    id: 'race-past-3',
    title: 'Referral Rush',
    description: 'Bring your friends to Arc! Most referrals wins.',
    category: 'referrals',
    status: 'ended',
    prizePool: 400,
    prizes: [200, 100, 50, 30, 20],
    startDate: NOW - DAY_MS * 90,
    endDate: NOW - DAY_MS * 83,
    participants: [
      { address: '0xr1...abc', name: 'Networker', score: 45, joinedAt: NOW - DAY_MS * 89 },
      { address: '0xr2...def', score: 38, joinedAt: NOW - DAY_MS * 88 },
    ],
  },
];

const INITIAL_RACES = BASE_RACES;

type PersistedRaceState = {
  races: Race[];
};

export function normalizeRaceAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function formatRaceAddress(address: string): string {
  const normalized = address.trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= 12) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

export const RACE_DEMO_ADDRESS_STORAGE_KEY = 'arclanding:race-demo-address';

export function readStoredRaceDemoAddress(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(RACE_DEMO_ADDRESS_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeStoredRaceDemoAddress(address: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const normalized = address.trim();
    if (normalized) {
      window.localStorage.setItem(RACE_DEMO_ADDRESS_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(RACE_DEMO_ADDRESS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and fall back to in-memory state.
  }
}

function isRaceCategory(value: unknown): value is RaceCategory {
  return (
    value === 'transactions' ||
    value === 'volume' ||
    value === 'forum-posts' ||
    value === 'quests' ||
    value === 'referrals'
  );
}

function isRaceStatus(value: unknown): value is RaceStatus {
  return value === 'upcoming' || value === 'active' || value === 'ended';
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatRacePrize(amount: number): string {
  return `$${Math.max(0, Math.round(amount)).toLocaleString('en-US')} USDC`;
}

export function formatRaceDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function getRaceOrdinal(place: number): string {
  if (place % 100 >= 11 && place % 100 <= 13) {
    return `${place}th`;
  }

  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

export function normalizeParticipant(participant: unknown): RaceParticipant | null {
  if (!participant || typeof participant !== 'object') {
    return null;
  }

  const candidate = participant as Partial<RaceParticipant>;
  const address = typeof candidate.address === 'string' ? candidate.address.trim() : '';

  if (!address) {
    return null;
  }

  return {
    address,
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : undefined,
    score: Math.max(0, Math.round(toFiniteNumber(candidate.score, 0))),
    joinedAt: Math.max(0, Math.round(toFiniteNumber(candidate.joinedAt, NOW))),
  };
}

function normalizeParticipants(participants: unknown): RaceParticipant[] {
  if (!Array.isArray(participants)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: RaceParticipant[] = [];

  for (const entry of participants) {
    const participant = normalizeParticipant(entry);
    if (!participant) {
      continue;
    }

    const key = normalizeRaceAddress(participant.address);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(participant);
  }

  return normalized;
}

export function normalizeRace(race: unknown): Race | null {
  if (!race || typeof race !== 'object') {
    return null;
  }

  const candidate = race as Partial<Race>;
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';

  if (!id) {
    return null;
  }

  const startDate = Math.max(0, Math.round(toFiniteNumber(candidate.startDate, NOW)));
  const endDate = Math.max(startDate, Math.round(toFiniteNumber(candidate.endDate, startDate)));
  const prizesSource = Array.isArray(candidate.prizes) ? candidate.prizes : [];
  const prizes = Array.from({ length: 5 }, (_, index) => Math.max(0, Math.round(toFiniteNumber(prizesSource[index], 0))));

  return {
    id,
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : 'Untitled Race',
    description:
      typeof candidate.description === 'string' && candidate.description.trim()
        ? candidate.description.trim()
        : 'A race from the Arc Ecosystem archive.',
    category: isRaceCategory(candidate.category) ? candidate.category : 'transactions',
    status: isRaceStatus(candidate.status) ? candidate.status : 'upcoming',
    prizePool: Math.max(0, Math.round(toFiniteNumber(candidate.prizePool, 0))),
    prizes,
    startDate,
    endDate,
    participants: normalizeParticipants(candidate.participants),
  };
}

function normalizeRaceCollection(races: unknown): Race[] {
  if (!Array.isArray(races)) {
    return [];
  }

  return races.map((race) => normalizeRace(race)).filter((race): race is Race => race !== null);
}

export function compareParticipants(
  a: RaceParticipant,
  b: RaceParticipant,
  sortField: RaceLeaderboardSortField = 'score',
  sortDir: RaceLeaderboardSortDirection = 'desc',
): number {
  const primaryMultiplier = sortDir === 'asc' ? 1 : -1;
  const primary =
    sortField === 'joinedAt'
      ? (a.joinedAt - b.joinedAt) * primaryMultiplier
      : (a.score - b.score) * primaryMultiplier;

  if (primary !== 0) {
    return primary;
  }

  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.joinedAt !== b.joinedAt) {
    return a.joinedAt - b.joinedAt;
  }

  const nameDiff = (a.name ?? '').localeCompare(b.name ?? '', 'en', { sensitivity: 'base' });
  if (nameDiff !== 0) {
    return nameDiff;
  }

  return normalizeRaceAddress(a.address).localeCompare(normalizeRaceAddress(b.address), 'en', { sensitivity: 'base' });
}

export function sortParticipants(
  participants: RaceParticipant[],
  sortField: RaceLeaderboardSortField = 'score',
  sortDir: RaceLeaderboardSortDirection = 'desc',
): RaceParticipant[] {
  return [...participants].sort((a, b) => compareParticipants(a, b, sortField, sortDir));
}

export function getRaceWinner(race: Race): RaceParticipant | undefined {
  return sortParticipants(race.participants)[0];
}

export function getRacePreviewParticipants(race: Race, limit = 5): RaceParticipant[] {
  return sortParticipants(race.participants).slice(0, limit);
}

export function getRaceById(races: Race[], id: string): Race | undefined {
  return races.find((race) => race.id === id.trim());
}

const safeRaceStorage: PersistStorage<PersistedRaceState> = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(name);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as {
        state?: PersistedRaceState;
        races?: Race[];
        version?: number;
      };

      const state = parsed && typeof parsed === 'object' && 'state' in parsed ? parsed.state : parsed;
      const races = normalizeRaceCollection(state?.races);

      return {
        state: { races },
        version: typeof parsed.version === 'number' ? parsed.version : 1,
      };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Ignore storage failures and fall back to in-memory state.
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage failures and fall back to in-memory state.
    }
  },
};

interface RaceStore {
  races: Race[];
  joinRace: (raceId: string, address: string, name?: string) => RaceMutationResult;
  updateScore: (raceId: string, address: string, score: number) => RaceMutationResult;
  createRace: (race: Race) => RaceMutationResult;
  endRace: (raceId: string) => RaceMutationResult;
}

export const useRaceStore = create<RaceStore>()(
  persist(
    (set, get) => ({
      races: INITIAL_RACES,
      joinRace: (raceId, address, name) => {
        const normalizedAddress = normalizeRaceAddress(address);
        if (!normalizedAddress) {
          return {
            ok: false,
            reason: 'invalid-address',
            message: 'A valid wallet address is required to join this race.',
          };
        }

        const currentRace = get().races.find((race) => race.id === raceId);
        if (!currentRace) {
          return { ok: false, reason: 'not-found', message: 'Race not found.' };
        }

        if (currentRace.status !== 'active') {
          return {
            ok: false,
            reason: 'inactive',
            message: 'This race is not open for joins right now.',
          };
        }

        if (currentRace.participants.some((participant) => normalizeRaceAddress(participant.address) === normalizedAddress)) {
          return {
            ok: false,
            reason: 'duplicate',
            message: 'You already joined this race.',
          };
        }

        const nextParticipant: RaceParticipant = {
          address: address.trim(),
          name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
          score: 0,
          joinedAt: Date.now(),
        };

        set((state) => ({
          races: state.races.map((race) =>
            race.id === raceId
              ? { ...race, participants: [...race.participants, nextParticipant] }
              : race,
          ),
        }));

        return { ok: true, message: 'You joined the race.' };
      },
      updateScore: (raceId, address, score) => {
        if (!Number.isFinite(score) || score < 0) {
          return {
            ok: false,
            reason: 'invalid-score',
            message: 'Scores must be a finite number greater than or equal to zero.',
          };
        }

        const normalizedAddress = normalizeRaceAddress(address);
        const nextScore = Math.max(0, Math.round(score));
        const currentRace = get().races.find((race) => race.id === raceId);

        if (!currentRace) {
          return { ok: false, reason: 'not-found', message: 'Race not found.' };
        }

        if (currentRace.status !== 'active') {
          return {
            ok: false,
            reason: 'inactive',
            message: 'Only active races can accept score updates.',
          };
        }

        if (!currentRace.participants.some((participant) => normalizeRaceAddress(participant.address) === normalizedAddress)) {
          return {
            ok: false,
            reason: 'not-found',
            message: 'Join the race before updating your score.',
          };
        }

        set((state) => ({
          races: state.races.map((race) =>
            race.id === raceId
              ? {
                  ...race,
                  participants: race.participants.map((participant) =>
                    normalizeRaceAddress(participant.address) === normalizedAddress
                      ? { ...participant, score: nextScore }
                      : participant,
                  ),
                }
              : race,
          ),
        }));

        return { ok: true, message: 'Score updated.' };
      },
      createRace: (race) => {
        const normalized = normalizeRace(race);
        if (!normalized) {
          return {
            ok: false,
            reason: 'invalid-race',
            message: 'The race data is invalid.',
          };
        }

        set((state) => ({
          races: [normalized, ...state.races.filter((existing) => existing.id !== normalized.id)],
        }));

        return { ok: true, message: 'Race created.' };
      },
      endRace: (raceId) => {
        const currentRace = get().races.find((race) => race.id === raceId);
        if (!currentRace) {
          return { ok: false, reason: 'not-found', message: 'Race not found.' };
        }

        if (currentRace.status === 'ended') {
          return { ok: false, reason: 'inactive', message: 'This race has already ended.' };
        }

        set((state) => ({
          races: state.races.map((race) =>
            race.id === raceId ? { ...race, status: 'ended' } : race,
          ),
        }));

        return { ok: true, message: 'Race ended.' };
      },
    }),
    {
      name: 'arclanding:race',
      storage: safeRaceStorage,
      partialize: (state) => ({ races: state.races }),
      version: 1,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedRaceState> | undefined;
        const races = persisted && Array.isArray(persisted.races) ? normalizeRaceCollection(persisted.races) : currentState.races;

        return {
          ...currentState,
          races,
        };
      },
    },
  ),
);
