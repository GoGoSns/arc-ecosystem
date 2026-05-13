import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChallengeStatus = 'open' | 'won' | 'lost' | 'expired';
export type LuckyPackStatus = 'pending' | 'opened' | 'claimed' | 'expired';
export type GameHistoryType = 'challenge' | 'lucky';
export type GameHistoryStatus = 'won' | 'lost' | 'opened' | 'claimed' | 'expired';
export type ChallengeEventKind = 'created' | 'accepted' | 'progress' | 'proof' | 'resolved' | 'claimed';
export type LuckyEventKind = 'created' | 'opened' | 'claimed' | 'expired';

export interface ChallengeTimelineEvent {
  id: string;
  kind: ChallengeEventKind;
  title: string;
  note: string;
  createdAt: number;
}

export interface LuckyPackTimelineEvent {
  id: string;
  kind: LuckyEventKind;
  title: string;
  note: string;
  createdAt: number;
}

export interface Challenge {
  id: string;
  title: string;
  senderName: string;
  receiverName: string;
  amountUsd: number;
  rewardUsd: number;
  game: string;
  targetType: string;
  targetValue: number;
  currentProgress: number;
  progress: number;
  status: ChallengeStatus;
  deadlineAt: number;
  proofNote?: string;
  proofUrl?: string;
  createdAt: number;
  acceptedAt?: number;
  resolvedAt?: number;
  claimedAt?: number;
  timeline: ChallengeTimelineEvent[];
}

export interface LuckyTier {
  amount: number;
  weight: number;
}

export interface LuckyPack {
  id: string;
  title: string;
  senderName: string;
  receiverName: string;
  baseAmount: number;
  tiers: LuckyTier[];
  openedAmount?: number;
  openedTierIndex?: number;
  openedTierWeight?: number;
  openedAt?: number;
  claimedAt?: number;
  status: LuckyPackStatus;
  expiresAt: number;
  createdAt: number;
  timeline: LuckyPackTimelineEvent[];
}

export interface GameHistoryItem {
  id: string;
  type: GameHistoryType;
  entityId: string;
  title: string;
  amount: number;
  status: GameHistoryStatus;
  createdAt: number;
  subtitle?: string;
}

export interface LuckyReveal {
  packId: string;
  amount: number;
  tier: LuckyTier;
  tierIndex: number;
  rarity: 'bronze' | 'gold' | 'legendary';
}

export interface GameStore {
  challenges: Challenge[];
  luckyPacks: LuckyPack[];
  history: GameHistoryItem[];
  createChallenge: (input: CreateChallengeInput) => Challenge;
  acceptChallenge: (challengeId: string, receiverName?: string) => boolean;
  updateChallengeProgress: (challengeId: string, amount?: number) => void;
  submitChallengeProof: (challengeId: string, proofNote: string, proofUrl?: string) => boolean;
  setChallengeOutcome: (challengeId: string, outcome: Exclude<ChallengeStatus, 'open'>) => boolean;
  claimChallengeReward: (challengeId: string) => boolean;
  createLuckyPack: (input: CreateLuckyPackInput) => LuckyPack;
  openLuckyPack: (packId: string) => LuckyReveal | null;
  claimLuckyPack: (packId: string) => boolean;
}

export interface CreateChallengeInput {
  title: string;
  senderName: string;
  receiverName: string;
  amountUsd: number;
  game: string;
  targetType: string;
  targetValue: number;
  deadlineAt: number;
}

export interface CreateLuckyPackInput {
  title: string;
  senderName: string;
  receiverName: string;
  baseAmount: number;
  tiers: LuckyTier[];
  expiresAt: number;
}

export interface GameProgressSnapshot {
  xp: number;
  level: number;
  levelProgress: number;
  xpToNextLevel: number;
  streak: number;
  winRate: number;
  activeChallenges: number;
  completedChallenges: number;
  openLuckyPacks: number;
  totalWon: number;
  recentTitle: string;
  recentSubtitle: string;
  badgeLabel: string;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const FIXED_NOW = Date.parse('2026-05-13T12:00:00Z');
const NOW = FIXED_NOW;

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-streak-surge',
    title: 'Streak Surge',
    senderName: 'Nova Host',
    receiverName: 'Guest Runner',
    amountUsd: 180,
    rewardUsd: 180,
    game: 'Arc Runner',
    targetType: 'rounds',
    targetValue: 12,
    currentProgress: 7,
    progress: 7,
    status: 'open',
    deadlineAt: NOW + DAY_MS * 2,
    createdAt: NOW - HOUR_MS * 10,
    acceptedAt: NOW - HOUR_MS * 7,
    timeline: [
      {
        id: 'challenge-streak-surge-created',
        kind: 'created',
        title: 'Challenge created',
        note: 'Nova Host published a local challenge for Arc Runner.',
        createdAt: NOW - HOUR_MS * 10,
      },
      {
        id: 'challenge-streak-surge-accepted',
        kind: 'accepted',
        title: 'Challenge accepted',
        note: 'Guest Runner accepted the challenge and started the run.',
        createdAt: NOW - HOUR_MS * 7,
      },
      {
        id: 'challenge-streak-surge-progress',
        kind: 'progress',
        title: 'Progress updated',
        note: '7 of 12 rounds completed in the mock flow.',
        createdAt: NOW - HOUR_MS * 2,
      },
    ],
  },
  {
    id: 'challenge-vault-pressure',
    title: 'Vault Pressure',
    senderName: 'Arc Desk',
    receiverName: 'Orbit Ops',
    amountUsd: 240,
    rewardUsd: 240,
    game: 'Arc Vault',
    targetType: 'vault opens',
    targetValue: 20,
    currentProgress: 16,
    progress: 16,
    status: 'open',
    deadlineAt: NOW + DAY_MS,
    createdAt: NOW - HOUR_MS * 15,
    acceptedAt: NOW - HOUR_MS * 12,
    timeline: [
      {
        id: 'challenge-vault-pressure-created',
        kind: 'created',
        title: 'Challenge created',
        note: 'Arc Desk created a vault opening target.',
        createdAt: NOW - HOUR_MS * 15,
      },
      {
        id: 'challenge-vault-pressure-accepted',
        kind: 'accepted',
        title: 'Challenge accepted',
        note: 'Orbit Ops joined the challenge from the detail view.',
        createdAt: NOW - HOUR_MS * 12,
      },
      {
        id: 'challenge-vault-pressure-progress',
        kind: 'progress',
        title: 'Progress updated',
        note: '16 opens were tracked locally.',
        createdAt: NOW - HOUR_MS * 3,
      },
    ],
  },
  {
    id: 'challenge-signal-hunter',
    title: 'Signal Hunter',
    senderName: 'Signal Desk',
    receiverName: 'Northwind',
    amountUsd: 320,
    rewardUsd: 320,
    game: 'Arc Pulse',
    targetType: 'wins',
    targetValue: 18,
    currentProgress: 18,
    progress: 18,
    status: 'won',
    deadlineAt: NOW - DAY_MS,
    proofNote: 'Proof attached with a short screen recording and score summary.',
    proofUrl: 'https://example.com/proof/signal-hunter',
    createdAt: NOW - DAY_MS * 2,
    acceptedAt: NOW - DAY_MS * 2 + HOUR_MS,
    resolvedAt: NOW - DAY_MS,
    claimedAt: NOW - DAY_MS + HOUR_MS / 2,
    timeline: [
      {
        id: 'challenge-signal-hunter-created',
        kind: 'created',
        title: 'Challenge created',
        note: 'Signal Desk seeded the challenge on Arc Pulse.',
        createdAt: NOW - DAY_MS * 2,
      },
      {
        id: 'challenge-signal-hunter-accepted',
        kind: 'accepted',
        title: 'Challenge accepted',
        note: 'Northwind accepted the challenge.',
        createdAt: NOW - DAY_MS * 2 + HOUR_MS,
      },
      {
        id: 'challenge-signal-hunter-proof',
        kind: 'proof',
        title: 'Proof submitted',
        note: 'Proof note and link were added for the mock settlement.',
        createdAt: NOW - DAY_MS * 1.5,
      },
      {
        id: 'challenge-signal-hunter-resolved',
        kind: 'resolved',
        title: 'Marked passed',
        note: 'Admin toggle marked the challenge as won.',
        createdAt: NOW - DAY_MS + HOUR_MS,
      },
      {
        id: 'challenge-signal-hunter-claimed',
        kind: 'claimed',
        title: 'Reward claimed',
        note: 'Reward was claimed after the win.',
        createdAt: NOW - DAY_MS + HOUR_MS / 2,
      },
    ],
  },
  {
    id: 'challenge-drift-control',
    title: 'Drift Control',
    senderName: 'Drift Lab',
    receiverName: 'Flux Unit',
    amountUsd: 125,
    rewardUsd: 125,
    game: 'Arc Drift',
    targetType: 'combos',
    targetValue: 10,
    currentProgress: 6,
    progress: 6,
    status: 'expired',
    deadlineAt: NOW - DAY_MS * 2,
    createdAt: NOW - DAY_MS * 4,
    acceptedAt: NOW - DAY_MS * 3,
    resolvedAt: NOW - DAY_MS * 2,
    timeline: [
      {
        id: 'challenge-drift-control-created',
        kind: 'created',
        title: 'Challenge created',
        note: 'Drift Lab opened the challenge for Arc Drift.',
        createdAt: NOW - DAY_MS * 4,
      },
      {
        id: 'challenge-drift-control-accepted',
        kind: 'accepted',
        title: 'Challenge accepted',
        note: 'Flux Unit accepted the challenge.',
        createdAt: NOW - DAY_MS * 3,
      },
      {
        id: 'challenge-drift-control-resolved',
        kind: 'resolved',
        title: 'Deadline missed',
        note: 'The deadline elapsed before the target was hit.',
        createdAt: NOW - DAY_MS * 2,
      },
    ],
  },
  {
    id: 'challenge-ember-loss',
    title: 'Ember Loss',
    senderName: 'Ember Lab',
    receiverName: 'Dune Crew',
    amountUsd: 95,
    rewardUsd: 95,
    game: 'Arc Ember',
    targetType: 'captures',
    targetValue: 9,
    currentProgress: 4,
    progress: 4,
    status: 'lost',
    deadlineAt: NOW - DAY_MS * 3,
    createdAt: NOW - DAY_MS * 5,
    acceptedAt: NOW - DAY_MS * 4,
    resolvedAt: NOW - DAY_MS * 3,
    timeline: [
      {
        id: 'challenge-ember-loss-created',
        kind: 'created',
        title: 'Challenge created',
        note: 'Ember Lab created a capture challenge.',
        createdAt: NOW - DAY_MS * 5,
      },
      {
        id: 'challenge-ember-loss-accepted',
        kind: 'accepted',
        title: 'Challenge accepted',
        note: 'Dune Crew joined the challenge.',
        createdAt: NOW - DAY_MS * 4,
      },
      {
        id: 'challenge-ember-loss-resolved',
        kind: 'resolved',
        title: 'Marked failed',
        note: 'Admin toggle marked the challenge as lost.',
        createdAt: NOW - DAY_MS * 3,
      },
    ],
  },
];

const INITIAL_LUCKY_PACKS: LuckyPack[] = [
  {
    id: 'lucky-midnight-pack',
    title: 'Midnight Pack',
    senderName: 'Night Market',
    receiverName: 'Open Drawer',
    baseAmount: 15,
    tiers: [
      { amount: 15, weight: 55 },
      { amount: 30, weight: 25 },
      { amount: 60, weight: 15 },
      { amount: 150, weight: 5 },
    ],
    status: 'pending',
    expiresAt: NOW + DAY_MS,
    createdAt: NOW - HOUR_MS * 6,
    timeline: [
      {
        id: 'lucky-midnight-pack-created',
        kind: 'created',
        title: 'Pack created',
        note: 'Night Market seeded a new lucky card.',
        createdAt: NOW - HOUR_MS * 6,
      },
    ],
  },
  {
    id: 'lucky-solar-pack',
    title: 'Solar Pack',
    senderName: 'Solar Deck',
    receiverName: 'Open Drawer',
    baseAmount: 25,
    tiers: [
      { amount: 25, weight: 50 },
      { amount: 45, weight: 30 },
      { amount: 90, weight: 15 },
      { amount: 200, weight: 5 },
    ],
    status: 'pending',
    expiresAt: NOW + DAY_MS * 2,
    createdAt: NOW - HOUR_MS * 4,
    timeline: [
      {
        id: 'lucky-solar-pack-created',
        kind: 'created',
        title: 'Pack created',
        note: 'Solar Deck added a weighted pack to the queue.',
        createdAt: NOW - HOUR_MS * 4,
      },
    ],
  },
  {
    id: 'lucky-aurora-pack',
    title: 'Aurora Pack',
    senderName: 'Aurora House',
    receiverName: 'Northwind',
    baseAmount: 40,
    tiers: [
      { amount: 40, weight: 45 },
      { amount: 80, weight: 30 },
      { amount: 160, weight: 20 },
      { amount: 320, weight: 5 },
    ],
    openedAmount: 80,
    openedTierIndex: 1,
    openedTierWeight: 30,
    openedAt: NOW - HOUR_MS * 3,
    status: 'opened',
    expiresAt: NOW + HOUR_MS * 4,
    createdAt: NOW - HOUR_MS * 8,
    timeline: [
      {
        id: 'lucky-aurora-pack-created',
        kind: 'created',
        title: 'Pack created',
        note: 'Aurora House created the pack.',
        createdAt: NOW - HOUR_MS * 8,
      },
      {
        id: 'lucky-aurora-pack-opened',
        kind: 'opened',
        title: 'Card opened',
        note: 'The weighted reveal landed on 80 USDC.',
        createdAt: NOW - HOUR_MS * 3,
      },
    ],
  },
  {
    id: 'lucky-crown-pack',
    title: 'Crown Pack',
    senderName: 'Crown Relay',
    receiverName: 'Arc Collector',
    baseAmount: 60,
    tiers: [
      { amount: 60, weight: 50 },
      { amount: 120, weight: 30 },
      { amount: 240, weight: 15 },
      { amount: 480, weight: 5 },
    ],
    openedAmount: 240,
    openedTierIndex: 2,
    openedTierWeight: 15,
    openedAt: NOW - DAY_MS * 2,
    claimedAt: NOW - DAY_MS * 2 + HOUR_MS,
    status: 'claimed',
    expiresAt: NOW + DAY_MS * 3,
    createdAt: NOW - DAY_MS * 3,
    timeline: [
      {
        id: 'lucky-crown-pack-created',
        kind: 'created',
        title: 'Pack created',
        note: 'Crown Relay created a premium pack.',
        createdAt: NOW - DAY_MS * 3,
      },
      {
        id: 'lucky-crown-pack-opened',
        kind: 'opened',
        title: 'Card opened',
        note: 'The reveal landed on 240 USDC.',
        createdAt: NOW - DAY_MS * 2,
      },
      {
        id: 'lucky-crown-pack-claimed',
        kind: 'claimed',
        title: 'Reward claimed',
        note: 'Arc Collector claimed the reward.',
        createdAt: NOW - DAY_MS * 2 + HOUR_MS,
      },
    ],
  },
];

const INITIAL_HISTORY: GameHistoryItem[] = [
  {
    id: 'history-signal-hunter',
    type: 'challenge',
    entityId: 'challenge-signal-hunter',
    title: 'Signal Hunter',
    amount: 320,
    status: 'won',
    createdAt: NOW - DAY_MS,
    subtitle: 'Reward claimed after a passed challenge',
  },
  {
    id: 'history-ember-loss',
    type: 'challenge',
    entityId: 'challenge-ember-loss',
    title: 'Ember Loss',
    amount: 0,
    status: 'lost',
    createdAt: NOW - DAY_MS * 2,
    subtitle: 'Marked failed in the admin toggle',
  },
  {
    id: 'history-aurora-pack',
    type: 'lucky',
    entityId: 'lucky-aurora-pack',
    title: 'Aurora Pack',
    amount: 80,
    status: 'opened',
    createdAt: NOW - Math.round(DAY_MS * 1.5),
    subtitle: 'Opened from the local weighted draw',
  },
  {
    id: 'history-crown-pack',
    type: 'lucky',
    entityId: 'lucky-crown-pack',
    title: 'Crown Pack',
    amount: 240,
    status: 'claimed',
    createdAt: NOW - DAY_MS * 4,
    subtitle: 'Claimed after the reveal settled',
  },
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

function clampProgress(value: number, targetValue: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(targetValue, Math.round(value)));
}

function isChallengeStatus(value: unknown): value is ChallengeStatus {
  return value === 'open' || value === 'won' || value === 'lost' || value === 'expired';
}

function isLuckyStatus(value: unknown): value is LuckyPackStatus {
  return value === 'pending' || value === 'opened' || value === 'claimed' || value === 'expired';
}

function isGameHistoryStatus(value: unknown): value is GameHistoryStatus {
  return value === 'won' || value === 'lost' || value === 'opened' || value === 'claimed' || value === 'expired';
}

function createChallengeEvent(kind: ChallengeEventKind, title: string, note: string, createdAt = Date.now()): ChallengeTimelineEvent {
  return {
    id: makeId(`challenge-${kind}`),
    kind,
    title,
    note,
    createdAt,
  };
}

function createLuckyEvent(kind: LuckyEventKind, title: string, note: string, createdAt = Date.now()): LuckyPackTimelineEvent {
  return {
    id: makeId(`lucky-${kind}`),
    kind,
    title,
    note,
    createdAt,
  };
}

function normalizeChallengeTimelineEvent(event: unknown, fallbackKind: ChallengeEventKind, fallbackTitle: string, fallbackNote: string): ChallengeTimelineEvent {
  const candidate = event && typeof event === 'object' ? (event as Partial<ChallengeTimelineEvent>) : {};
  const kind = candidate.kind && ['created', 'accepted', 'progress', 'proof', 'resolved', 'claimed'].includes(candidate.kind)
    ? candidate.kind
    : fallbackKind;

  return {
    id: normalizeText(candidate.id, makeId(`challenge-${kind}`)),
    kind,
    title: normalizeText(candidate.title, fallbackTitle),
    note: normalizeText(candidate.note, fallbackNote),
    createdAt: normalizeNumber(candidate.createdAt, Date.now()),
  };
}

function normalizeLuckyTimelineEvent(event: unknown, fallbackKind: LuckyEventKind, fallbackTitle: string, fallbackNote: string): LuckyPackTimelineEvent {
  const candidate = event && typeof event === 'object' ? (event as Partial<LuckyPackTimelineEvent>) : {};
  const kind = candidate.kind && ['created', 'opened', 'claimed', 'expired'].includes(candidate.kind) ? candidate.kind : fallbackKind;

  return {
    id: normalizeText(candidate.id, makeId(`lucky-${kind}`)),
    kind,
    title: normalizeText(candidate.title, fallbackTitle),
    note: normalizeText(candidate.note, fallbackNote),
    createdAt: normalizeNumber(candidate.createdAt, Date.now()),
  };
}

function normalizeChallengeTimeline(timeline: unknown, title: string, createdAt: number): ChallengeTimelineEvent[] {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [createChallengeEvent('created', 'Challenge created', `${title} was created locally.`, createdAt)];
  }

  return timeline.map((event) => normalizeChallengeTimelineEvent(event, 'progress', 'Timeline event', `${title} event recorded.`));
}

function normalizeLuckyTimeline(timeline: unknown, title: string, createdAt: number): LuckyPackTimelineEvent[] {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [createLuckyEvent('created', 'Pack created', `${title} was created locally.`, createdAt)];
  }

  return timeline.map((event) => normalizeLuckyTimelineEvent(event, 'opened', 'Timeline event', `${title} event recorded.`));
}

function normalizeChallengeRecord(record: unknown): Challenge | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const candidate = record as Partial<Challenge> & { rewardUsd?: unknown; amountUsd?: unknown; progress?: unknown; currentProgress?: unknown };
  const id = normalizeText(candidate.id, '');
  if (!id) {
    return null;
  }

  const title = normalizeText(candidate.title, 'Untitled Challenge');
  const amountUsd = Math.max(0, normalizeNumber(candidate.amountUsd ?? candidate.rewardUsd, 0));
  const targetValue = Math.max(1, normalizeNumber(candidate.targetValue, 1));
  const currentProgress = clampProgress(normalizeNumber(candidate.currentProgress ?? candidate.progress, 0), targetValue);
  const status = isChallengeStatus(candidate.status) ? candidate.status : 'open';
  const createdAt = normalizeNumber(candidate.createdAt, Date.now());
  const deadlineAt = normalizeNumber(candidate.deadlineAt, createdAt + DAY_MS);
  const proofNote = typeof candidate.proofNote === 'string' && candidate.proofNote.trim() ? candidate.proofNote.trim() : undefined;
  const proofUrl = typeof candidate.proofUrl === 'string' && candidate.proofUrl.trim() ? candidate.proofUrl.trim() : undefined;

  return {
    id,
    title,
    senderName: normalizeText(candidate.senderName, 'Arc Sender'),
    receiverName: normalizeText(candidate.receiverName, 'Open slot'),
    amountUsd,
    rewardUsd: amountUsd,
    game: normalizeText(candidate.game, 'Arc Game'),
    targetType: normalizeText(candidate.targetType, 'actions'),
    targetValue,
    currentProgress,
    progress: currentProgress,
    status,
    deadlineAt,
    proofNote,
    proofUrl,
    createdAt,
    acceptedAt: typeof candidate.acceptedAt === 'number' && Number.isFinite(candidate.acceptedAt) ? candidate.acceptedAt : undefined,
    resolvedAt: typeof candidate.resolvedAt === 'number' && Number.isFinite(candidate.resolvedAt) ? candidate.resolvedAt : undefined,
    claimedAt: typeof candidate.claimedAt === 'number' && Number.isFinite(candidate.claimedAt) ? candidate.claimedAt : undefined,
    timeline: normalizeChallengeTimeline(candidate.timeline, title, createdAt),
  };
}

function normalizeLuckyPackRecord(record: unknown): LuckyPack | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const candidate = record as Partial<LuckyPack> & { openedTierIndex?: unknown; openedTierWeight?: unknown };
  const id = normalizeText(candidate.id, '');
  if (!id) {
    return null;
  }

  const title = normalizeText(candidate.title, 'Untitled Pack');
  const createdAt = normalizeNumber(candidate.createdAt, Date.now());
  const expiresAt = normalizeNumber(candidate.expiresAt, createdAt + DAY_MS * 2);
  const baseAmount = Math.max(0, normalizeNumber(candidate.baseAmount, 0));
  const status = isLuckyStatus(candidate.status) ? candidate.status : 'pending';

  return {
    id,
    title,
    senderName: normalizeText(candidate.senderName, 'Arc Host'),
    receiverName: normalizeText(candidate.receiverName, 'Open drawer'),
    baseAmount,
    tiers: Array.isArray(candidate.tiers)
      ? candidate.tiers
          .map((tier) => ({
            amount: Math.max(0, normalizeNumber((tier as LuckyTier).amount, baseAmount)),
            weight: Math.max(0, normalizeNumber((tier as LuckyTier).weight, 0)),
          }))
          .filter((tier) => tier.weight > 0)
      : [{ amount: baseAmount, weight: 100 }],
    openedAmount: typeof candidate.openedAmount === 'number' && Number.isFinite(candidate.openedAmount) ? candidate.openedAmount : undefined,
    openedTierIndex: typeof candidate.openedTierIndex === 'number' && Number.isFinite(candidate.openedTierIndex) ? Math.max(0, Math.round(candidate.openedTierIndex)) : undefined,
    openedTierWeight: typeof candidate.openedTierWeight === 'number' && Number.isFinite(candidate.openedTierWeight) ? Math.max(0, Math.round(candidate.openedTierWeight)) : undefined,
    openedAt: typeof candidate.openedAt === 'number' && Number.isFinite(candidate.openedAt) ? candidate.openedAt : undefined,
    claimedAt: typeof candidate.claimedAt === 'number' && Number.isFinite(candidate.claimedAt) ? candidate.claimedAt : undefined,
    status,
    expiresAt,
    createdAt,
    timeline: normalizeLuckyTimeline(candidate.timeline, title, createdAt),
  };
}

function normalizeHistoryItem(record: unknown): GameHistoryItem | null {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const candidate = record as Partial<GameHistoryItem>;
  const id = normalizeText(candidate.id, '');
  if (!id) {
    return null;
  }

  const title = normalizeText(candidate.title, 'History item');
  const type = candidate.type === 'challenge' || candidate.type === 'lucky' ? candidate.type : 'challenge';
  const status = isGameHistoryStatus(candidate.status) ? candidate.status : 'opened';

  return {
    id,
    type,
    entityId: normalizeText(candidate.entityId, slugify(title) || id),
    title,
    amount: Math.max(0, normalizeNumber(candidate.amount, 0)),
    status,
    createdAt: normalizeNumber(candidate.createdAt, Date.now()),
    subtitle: typeof candidate.subtitle === 'string' && candidate.subtitle.trim() ? candidate.subtitle.trim() : undefined,
  };
}

function normalizePersistedGameState(state: unknown): PersistedGameState {
  const candidate = state && typeof state === 'object' ? (state as Partial<PersistedGameState>) : {};

  return {
    challenges: Array.isArray(candidate.challenges)
      ? candidate.challenges.map((challenge) => normalizeChallengeRecord(challenge)).filter((challenge): challenge is Challenge => challenge !== null)
      : INITIAL_CHALLENGES,
    luckyPacks: Array.isArray(candidate.luckyPacks)
      ? candidate.luckyPacks.map((pack) => normalizeLuckyPackRecord(pack)).filter((pack): pack is LuckyPack => pack !== null)
      : INITIAL_LUCKY_PACKS,
    history: Array.isArray(candidate.history)
      ? candidate.history.map((item) => normalizeHistoryItem(item)).filter((item): item is GameHistoryItem => item !== null)
      : INITIAL_HISTORY,
  };
}

function chooseLuckyTier(tiers: LuckyTier[]): LuckyTier {
  const validTiers = tiers.filter((tier) => Number.isFinite(tier.amount) && Number.isFinite(tier.weight) && tier.weight > 0);

  if (validTiers.length === 0) {
    return { amount: 0, weight: 0 };
  }

  const totalWeight = validTiers.reduce((sum, tier) => sum + tier.weight, 0);
  const roll = Math.random() * totalWeight;

  let cumulative = 0;
  for (const tier of validTiers) {
    cumulative += tier.weight;
    if (roll <= cumulative) {
      return tier;
    }
  }

  return validTiers[validTiers.length - 1];
}

export function resolveChallengeStatus(challenge: Challenge, now = Date.now()): ChallengeStatus {
  if (challenge.status !== 'open') {
    return challenge.status;
  }

  return now > challenge.deadlineAt ? 'expired' : 'open';
}

export function resolveLuckyPackStatus(pack: LuckyPack, now = Date.now()): LuckyPackStatus {
  if (pack.status === 'claimed' || pack.claimedAt) {
    return 'claimed';
  }

  if (pack.status === 'expired') {
    return 'expired';
  }

  if (pack.status === 'opened') {
    return now > pack.expiresAt ? 'expired' : 'opened';
  }

  return now > pack.expiresAt ? 'expired' : 'pending';
}

export function getChallengeStatusLabel(status: ChallengeStatus): string {
  switch (status) {
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'expired':
      return 'Expired';
    case 'open':
    default:
      return 'Open';
  }
}

export function getChallengeStatusTone(status: ChallengeStatus): 'emerald' | 'amber' | 'red' | 'slate' {
  switch (status) {
    case 'won':
      return 'emerald';
    case 'expired':
      return 'amber';
    case 'lost':
      return 'red';
    case 'open':
    default:
      return 'slate';
  }
}

export function getLuckyPackStatusLabel(status: LuckyPackStatus): string {
  switch (status) {
    case 'opened':
      return 'Opened';
    case 'claimed':
      return 'Claimed';
    case 'expired':
      return 'Expired';
    case 'pending':
    default:
      return 'Pending';
  }
}

export function getLuckyPackStatusTone(status: LuckyPackStatus): 'bronze' | 'gold' | 'emerald' | 'red' {
  switch (status) {
    case 'opened':
      return 'gold';
    case 'claimed':
      return 'emerald';
    case 'expired':
      return 'red';
    case 'pending':
    default:
      return 'bronze';
  }
}

export function getLuckyPackRarity(pack: LuckyPack, reveal?: Pick<LuckyReveal, 'tierIndex' | 'tier'> | null): 'bronze' | 'gold' | 'legendary' {
  const tierIndex = reveal?.tierIndex ?? pack.openedTierIndex ?? -1;
  const tier = reveal?.tier ?? (tierIndex >= 0 ? pack.tiers[tierIndex] : undefined) ?? pack.tiers.find((item) => item.amount === pack.openedAmount && item.weight === pack.openedTierWeight);

  if (!tier) {
    return 'bronze';
  }

  if (tier.weight <= 10 || tier.amount >= Math.max(pack.baseAmount * 6, pack.baseAmount + 200)) {
    return 'legendary';
  }

  if (tier.weight <= 25 || tier.amount >= Math.max(pack.baseAmount * 3, pack.baseAmount + 80)) {
    return 'gold';
  }

  return 'bronze';
}

export function formatGameAmount(amount: number): string {
  return `$${Math.max(0, Math.round(amount)).toLocaleString('en-US')}`;
}

export function formatGameDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatGameTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatTargetType(targetType: string): string {
  return targetType.replace(/[_-]+/g, ' ');
}

export function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function buildGameProgressSnapshot(
  state: Pick<GameStore, 'challenges' | 'luckyPacks' | 'history'>,
  now = Date.now(),
): GameProgressSnapshot {
  const activeChallenges = state.challenges.filter((challenge) => resolveChallengeStatus(challenge, now) === 'open').length;
  const completedChallenges = state.challenges.filter((challenge) => challenge.status === 'won').length;
  const openLuckyPacks = state.luckyPacks.filter((pack) => resolveLuckyPackStatus(pack, now) === 'pending').length;
  const totalWon = state.history.reduce((sum, item) => sum + (item.status === 'lost' || item.status === 'expired' ? 0 : item.amount), 0);
  const positiveEvents = state.history.filter((item) => item.status === 'won' || item.status === 'opened' || item.status === 'claimed').length;
  const winRate = state.history.length === 0 ? 0 : Math.round((positiveEvents / state.history.length) * 100);
  const recentHistory = [...state.history].sort((a, b) => b.createdAt - a.createdAt);

  let streak = 0;
  for (const item of recentHistory) {
    if (item.status === 'lost' || item.status === 'expired') {
      break;
    }

    if (item.status === 'won' || item.status === 'opened' || item.status === 'claimed') {
      streak += 1;
    }
  }

  const historyXp = state.history.reduce((sum, item) => {
    if (item.status === 'won') {
      return sum + 120;
    }

    if (item.status === 'opened') {
      return sum + 80;
    }

    if (item.status === 'claimed') {
      return sum + 100;
    }

    return sum;
  }, 0);

  const challengeXp = state.challenges.reduce((sum, challenge) => {
    const progressRatio = challenge.targetValue > 0 ? challenge.currentProgress / challenge.targetValue : 0;

    switch (challenge.status) {
      case 'won':
        return sum + 180;
      case 'open':
        return sum + Math.round(progressRatio * 90);
      case 'expired':
        return sum + Math.round(progressRatio * 30);
      case 'lost':
      default:
        return sum + 20;
    }
  }, 0);

  const luckyXp = state.luckyPacks.reduce((sum, pack) => {
    switch (pack.status) {
      case 'claimed':
        return sum + 110;
      case 'opened':
        return sum + 70;
      case 'expired':
        return sum + 10;
      case 'pending':
      default:
        return sum + 25;
    }
  }, 0);

  const xp = historyXp + challengeXp + luckyXp + streak * 50;
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const xpIntoLevel = xp % 500;
  const levelProgress = xpIntoLevel / 500;
  const xpToNextLevel = 500 - xpIntoLevel;
  const recent = recentHistory[0];
  const recentTitle = recent ? recent.title : 'No recent activity';
  const recentSubtitle = recent
    ? `${recent.type === 'challenge' ? 'Challenge' : 'Lucky'} - ${recent.status.toUpperCase()} - ${formatGameAmount(recent.amount)}`
    : 'Play a challenge or open a lucky pack to populate this panel.';

  let badgeLabel = 'READY';
  if (streak >= 3) {
    badgeLabel = 'HOT STREAK';
  } else if (level >= 6) {
    badgeLabel = 'ELITE';
  } else if (completedChallenges >= 2 || positiveEvents >= 3) {
    badgeLabel = 'ON A RUN';
  }

  return {
    xp,
    level,
    levelProgress,
    xpToNextLevel,
    streak,
    winRate,
    activeChallenges,
    completedChallenges,
    openLuckyPacks,
    totalWon,
    recentTitle,
    recentSubtitle,
    badgeLabel,
  };
}

export function formatCountdownParts(ms: number): { label: string; value: number }[] {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: 'DAYS', value: days },
    { label: 'HOURS', value: hours },
    { label: 'MINS', value: minutes },
    { label: 'SECS', value: seconds },
  ];
}

export function isChallengeClaimable(challenge: Challenge, now = Date.now()): boolean {
  return resolveChallengeStatus(challenge, now) === 'open' && challenge.currentProgress >= challenge.targetValue;
}

export function getLuckyPackRevealLabel(pack: LuckyPack): string {
  switch (resolveLuckyPackStatus(pack)) {
    case 'claimed':
      return 'Claimed';
    case 'opened':
      return 'Opened';
    case 'expired':
      return 'Expired';
    case 'pending':
    default:
      return 'Pending';
  }
}

function upsertHistoryItem(history: GameHistoryItem[], nextItem: GameHistoryItem): GameHistoryItem[] {
  const existingIndex = history.findIndex((item) => item.type === nextItem.type && item.entityId === nextItem.entityId);

  if (existingIndex < 0) {
    return [nextItem, ...history];
  }

  const nextHistory = [...history];
  nextHistory[existingIndex] = {
    ...nextHistory[existingIndex],
    ...nextItem,
    id: nextHistory[existingIndex].id,
  };
  return nextHistory;
}

function createChallengeHistoryItem(
  challenge: Challenge,
  status: Exclude<ChallengeStatus, 'open'> | 'claimed',
  createdAt: number,
  subtitle: string,
): GameHistoryItem {
  return {
    id: makeId('history-challenge'),
    type: 'challenge',
    entityId: challenge.id,
    title: challenge.title,
    amount: status === 'lost' || status === 'expired' ? 0 : challenge.rewardUsd,
    status,
    createdAt,
    subtitle,
  };
}

function createLuckyHistoryItem(pack: LuckyPack, status: Exclude<GameHistoryStatus, 'won' | 'lost'> | 'opened', createdAt: number, subtitle: string): GameHistoryItem {
  return {
    id: makeId('history-lucky'),
    type: 'lucky',
    entityId: pack.id,
    title: pack.title,
    amount: pack.openedAmount ?? pack.baseAmount,
    status,
    createdAt,
    subtitle,
  };
}

interface PersistedGameState {
  challenges: Challenge[];
  luckyPacks: LuckyPack[];
  history: GameHistoryItem[];
}

interface GameState extends GameStore {}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      challenges: INITIAL_CHALLENGES,
      luckyPacks: INITIAL_LUCKY_PACKS,
      history: INITIAL_HISTORY,
      createChallenge: (input) => {
        const now = Date.now();
        const id = makeId('challenge');
        const targetValue = Math.max(1, Number.isFinite(input.targetValue) ? Math.round(input.targetValue) : 1);
        const amountUsd = Math.max(0, Number.isFinite(input.amountUsd) ? Math.round(input.amountUsd) : 0);
        const createdAt = now;
        const deadlineInput = Number.isFinite(input.deadlineAt) ? Math.round(input.deadlineAt) : createdAt + DAY_MS;
        const deadlineAt = Math.max(createdAt + HOUR_MS, deadlineInput);

        const challenge: Challenge = {
          id,
          title: normalizeText(input.title, 'Untitled Challenge'),
          senderName: normalizeText(input.senderName, 'Arc Sender'),
          receiverName: normalizeText(input.receiverName, 'Open slot'),
          amountUsd,
          rewardUsd: amountUsd,
          game: normalizeText(input.game, 'Arc Game'),
          targetType: normalizeText(input.targetType, 'actions'),
          targetValue,
          currentProgress: 0,
          progress: 0,
          status: 'open',
          deadlineAt,
          createdAt,
          timeline: [
            createChallengeEvent(
              'created',
              'Challenge created',
              `${normalizeText(input.title, 'Untitled Challenge')} was created locally.`,
              createdAt,
            ),
          ],
        };

        set((state) => ({
          challenges: [challenge, ...state.challenges],
        }));

        return challenge;
      },
      acceptChallenge: (challengeId, receiverName) => {
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current || resolveChallengeStatus(current, now) !== 'open') {
          return false;
        }

        const nextReceiverName = normalizeText(receiverName, current.receiverName);

        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id !== challengeId) {
              return challenge;
            }

            const acceptedAt = challenge.acceptedAt ?? now;
            const timeline = challenge.acceptedAt
              ? challenge.timeline
              : [
                  ...challenge.timeline,
                  createChallengeEvent(
                    'accepted',
                    'Challenge accepted',
                    `${nextReceiverName} accepted the challenge locally.`,
                    now,
                  ),
                ];

            return {
              ...challenge,
              receiverName: nextReceiverName,
              acceptedAt,
              timeline,
            };
          }),
        }));

        return true;
      },
      updateChallengeProgress: (challengeId, amount = 1) => {
        const nextAmount = Math.max(1, Math.round(amount));
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current || resolveChallengeStatus(current, now) !== 'open') {
          return;
        }

        const nextProgress = clampProgress(current.currentProgress + nextAmount, current.targetValue);

        if (nextProgress === current.currentProgress) {
          return;
        }

        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  currentProgress: nextProgress,
                  progress: nextProgress,
                  timeline: [
                    ...challenge.timeline,
                    createChallengeEvent(
                      'progress',
                      'Progress updated',
                      `${nextProgress} of ${challenge.targetValue} ${formatTargetType(challenge.targetType)} completed.`,
                      now,
                    ),
                  ],
                }
              : challenge,
          ),
        }));
      },
      submitChallengeProof: (challengeId, proofNote, proofUrl) => {
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current) {
          return false;
        }

        const resolvedStatus = resolveChallengeStatus(current, now);
        if (resolvedStatus === 'lost' || resolvedStatus === 'expired') {
          return false;
        }

        const note = normalizeText(proofNote, '');
        if (!note) {
          return false;
        }

        const url = typeof proofUrl === 'string' && proofUrl.trim() ? proofUrl.trim() : undefined;

        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  proofNote: note,
                  proofUrl: url,
                  timeline: [
                    ...challenge.timeline,
                    createChallengeEvent('proof', 'Proof submitted', url ? `${note} Proof link attached.` : note, now),
                  ],
                }
              : challenge,
          ),
        }));

        return true;
      },
      setChallengeOutcome: (challengeId, outcome) => {
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current) {
          return false;
        }

        const nextProgress = outcome === 'won' ? Math.max(current.currentProgress, current.targetValue) : current.currentProgress;
        const subtitle = outcome === 'won'
          ? 'Marked passed from the mock admin toggle.'
          : 'Marked failed from the mock admin toggle.';

        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id !== challengeId) {
              return challenge;
            }

            return {
              ...challenge,
              status: outcome,
              currentProgress: nextProgress,
              progress: nextProgress,
              resolvedAt: now,
              claimedAt: outcome === 'lost' ? undefined : challenge.claimedAt,
              timeline: [
                ...challenge.timeline,
                createChallengeEvent(
                  'resolved',
                  outcome === 'won' ? 'Marked passed' : 'Marked failed',
                  subtitle,
                  now,
                ),
              ],
            };
          }),
          history: upsertHistoryItem(
            state.history,
            createChallengeHistoryItem(
              {
                ...current,
                status: outcome,
                currentProgress: nextProgress,
                progress: nextProgress,
                resolvedAt: now,
              },
              outcome,
              now,
              subtitle,
            ),
          ),
        }));

        return true;
      },
      claimChallengeReward: (challengeId) => {
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current) {
          return false;
        }

        const resolvedStatus = resolveChallengeStatus(current, now);
        if (resolvedStatus === 'lost' || resolvedStatus === 'expired') {
          return false;
        }

        if (current.status === 'open' && current.currentProgress < current.targetValue) {
          return false;
        }

        if (current.claimedAt) {
          return true;
        }

        const nextProgress = Math.max(current.currentProgress, current.targetValue);

        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  status: 'won',
                  currentProgress: nextProgress,
                  progress: nextProgress,
                  resolvedAt: challenge.resolvedAt ?? now,
                  claimedAt: now,
                  timeline: [
                    ...challenge.timeline,
                    createChallengeEvent('claimed', 'Reward claimed', 'Reward claimed from the mock challenge payout.', now),
                  ],
                }
              : challenge,
          ),
          history: upsertHistoryItem(
            state.history,
            createChallengeHistoryItem(
              {
                ...current,
                status: 'won',
                currentProgress: nextProgress,
                progress: nextProgress,
                resolvedAt: current.resolvedAt ?? now,
                claimedAt: now,
              },
              'claimed',
              now,
              'Reward claimed from the mock challenge payout.',
            ),
          ),
        }));

        return true;
      },
      createLuckyPack: (input) => {
        const now = Date.now();
        const id = makeId('lucky');
        const baseAmount = Math.max(0, Number.isFinite(input.baseAmount) ? Math.round(input.baseAmount) : 0);
        const tiers = Array.isArray(input.tiers)
          ? input.tiers
              .map((tier) => ({
                amount: Math.max(0, Math.round(tier.amount)),
                weight: Math.max(0, Math.round(tier.weight)),
              }))
              .filter((tier) => tier.weight > 0)
          : [];

        const luckyPack: LuckyPack = {
          id,
          title: normalizeText(input.title, 'Untitled Pack'),
          senderName: normalizeText(input.senderName, 'Arc Host'),
          receiverName: normalizeText(input.receiverName, 'Open drawer'),
          baseAmount,
          tiers: tiers.length > 0 ? tiers : [{ amount: baseAmount, weight: 100 }],
          status: 'pending',
          expiresAt: Math.max(now + HOUR_MS, Number.isFinite(input.expiresAt) ? Math.round(input.expiresAt) : now + DAY_MS * 2),
          createdAt: now,
          timeline: [
            createLuckyEvent(
              'created',
              'Pack created',
              `${normalizeText(input.title, 'Untitled Pack')} was created locally.`,
              now,
            ),
          ],
        };

        set((state) => ({
          luckyPacks: [luckyPack, ...state.luckyPacks],
        }));

        return luckyPack;
      },
      openLuckyPack: (packId) => {
        const now = Date.now();
        const current = get().luckyPacks.find((pack) => pack.id === packId);

        if (!current) {
          return null;
        }

        const resolvedStatus = resolveLuckyPackStatus(current, now);
        if (resolvedStatus === 'claimed' || resolvedStatus === 'opened') {
          if (current.openedAmount === undefined) {
            return null;
          }

          const tierIndex = current.openedTierIndex ?? current.tiers.findIndex((tier) => tier.amount === current.openedAmount && tier.weight === current.openedTierWeight);
          const tier = tierIndex >= 0 ? current.tiers[tierIndex] : { amount: current.openedAmount, weight: current.openedTierWeight ?? 0 };

          return {
            packId: current.id,
            amount: current.openedAmount,
            tier,
            tierIndex: tierIndex >= 0 ? tierIndex : 0,
            rarity: getLuckyPackRarity(current, { tierIndex: tierIndex >= 0 ? tierIndex : 0, tier }),
          };
        }

        if (resolvedStatus === 'expired') {
          return null;
        }

        const selectedTier = chooseLuckyTier(current.tiers.length > 0 ? current.tiers : [{ amount: current.baseAmount, weight: 1 }]);
        const tierIndex = current.tiers.findIndex((tier) => tier.amount === selectedTier.amount && tier.weight === selectedTier.weight);
        const amount = selectedTier.amount > 0 ? selectedTier.amount : current.baseAmount;
        const rarity = getLuckyPackRarity(
          {
            ...current,
            openedAmount: amount,
            openedTierIndex: tierIndex >= 0 ? tierIndex : 0,
            openedTierWeight: selectedTier.weight,
          },
          { tierIndex: tierIndex >= 0 ? tierIndex : 0, tier: selectedTier },
        );

        set((state) => ({
          luckyPacks: state.luckyPacks.map((pack) =>
            pack.id === packId
              ? {
                  ...pack,
                  openedAmount: amount,
                  openedTierIndex: tierIndex >= 0 ? tierIndex : 0,
                  openedTierWeight: selectedTier.weight,
                  openedAt: now,
                  status: 'opened',
                  timeline: [
                    ...pack.timeline,
                    createLuckyEvent(
                      'opened',
                      'Card opened',
                      `${pack.title} revealed ${formatGameAmount(amount)} USDC from the weighted tier pool.`,
                      now,
                    ),
                  ],
                }
              : pack,
          ),
          history: upsertHistoryItem(
            state.history,
            createLuckyHistoryItem(
              {
                ...current,
                openedAmount: amount,
                openedTierIndex: tierIndex >= 0 ? tierIndex : 0,
                openedTierWeight: selectedTier.weight,
                openedAt: now,
                status: 'opened',
              },
              'opened',
              now,
              `Opened for ${formatGameAmount(amount)} from the weighted tier pool.`,
            ),
          ),
        }));

        return {
          packId: current.id,
          amount,
          tier: selectedTier,
          tierIndex: tierIndex >= 0 ? tierIndex : 0,
          rarity,
        };
      },
      claimLuckyPack: (packId) => {
        const now = Date.now();
        const current = get().luckyPacks.find((pack) => pack.id === packId);

        if (!current) {
          return false;
        }

        const resolvedStatus = resolveLuckyPackStatus(current, now);
        if (resolvedStatus === 'expired' || resolvedStatus === 'pending') {
          return false;
        }

        if (current.claimedAt) {
          return true;
        }

        const openedAmount = current.openedAmount ?? current.baseAmount;

        set((state) => ({
          luckyPacks: state.luckyPacks.map((pack) =>
            pack.id === packId
              ? {
                  ...pack,
                  status: 'claimed',
                  claimedAt: now,
                  timeline: [
                    ...pack.timeline,
                    createLuckyEvent('claimed', 'Reward claimed', `${pack.title} reward claimed after the reveal.`, now),
                  ],
                }
              : pack,
          ),
          history: upsertHistoryItem(
            state.history,
            createLuckyHistoryItem(
              {
                ...current,
                status: 'claimed',
                claimedAt: now,
                openedAmount,
              },
              'claimed',
              now,
              'Reward claimed after the lucky reveal.',
            ),
          ),
        }));

        return true;
      },
    }),
    {
      name: 'arclanding:game-hub',
      version: 2,
      partialize: (state): PersistedGameState => ({
        challenges: state.challenges,
        luckyPacks: state.luckyPacks,
        history: state.history,
      }),
      migrate: (persistedState) => normalizePersistedGameState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedGameState(persistedState),
      }),
    },
  ),
);
