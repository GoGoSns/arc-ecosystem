import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChallengeStatus = 'open' | 'won' | 'lost' | 'expired';
export type LuckyPackStatus = 'pending' | 'opened' | 'claimed';
export type GameHistoryType = 'challenge' | 'lucky';
export type GameHistoryStatus = 'won' | 'lost' | 'opened';

export interface Challenge {
  id: string;
  title: string;
  game: string;
  rewardUsd: number;
  targetType: string;
  targetValue: number;
  progress: number;
  status: ChallengeStatus;
  deadlineAt: number;
}

export interface LuckyTier {
  amount: number;
  weight: number;
}

export interface LuckyPack {
  id: string;
  title: string;
  baseAmount: number;
  tiers: LuckyTier[];
  openedAmount?: number;
  status: LuckyPackStatus;
}

export interface GameHistoryItem {
  id: string;
  type: GameHistoryType;
  title: string;
  amount: number;
  status: GameHistoryStatus;
  createdAt: number;
}

export interface LuckyReveal {
  packId: string;
  amount: number;
  tier: LuckyTier;
}

export interface GameStore {
  challenges: Challenge[];
  luckyPacks: LuckyPack[];
  history: GameHistoryItem[];
  updateChallengeProgress: (challengeId: string, amount?: number) => void;
  claimChallengeReward: (challengeId: string) => boolean;
  openLuckyPack: (packId: string) => LuckyReveal | null;
  claimLuckyPack: (packId: string) => boolean;
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
const NOW = Date.now();

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-streak-surge',
    title: 'Streak Surge',
    game: 'Arc Runner',
    rewardUsd: 180,
    targetType: 'rounds',
    targetValue: 12,
    progress: 7,
    status: 'open',
    deadlineAt: NOW + DAY_MS * 2,
  },
  {
    id: 'challenge-vault-pressure',
    title: 'Vault Pressure',
    game: 'Arc Vault',
    rewardUsd: 240,
    targetType: 'vault opens',
    targetValue: 20,
    progress: 16,
    status: 'open',
    deadlineAt: NOW + DAY_MS,
  },
  {
    id: 'challenge-signal-hunter',
    title: 'Signal Hunter',
    game: 'Arc Pulse',
    rewardUsd: 320,
    targetType: 'wins',
    targetValue: 18,
    progress: 18,
    status: 'won',
    deadlineAt: NOW - DAY_MS,
  },
  {
    id: 'challenge-drift-control',
    title: 'Drift Control',
    game: 'Arc Drift',
    rewardUsd: 125,
    targetType: 'combos',
    targetValue: 10,
    progress: 6,
    status: 'expired',
    deadlineAt: NOW - DAY_MS * 2,
  },
  {
    id: 'challenge-ember-loss',
    title: 'Ember Loss',
    game: 'Arc Ember',
    rewardUsd: 95,
    targetType: 'captures',
    targetValue: 9,
    progress: 4,
    status: 'lost',
    deadlineAt: NOW - DAY_MS * 3,
  },
];

const INITIAL_LUCKY_PACKS: LuckyPack[] = [
  {
    id: 'lucky-midnight-pack',
    title: 'Midnight Pack',
    baseAmount: 15,
    tiers: [
      { amount: 15, weight: 55 },
      { amount: 30, weight: 25 },
      { amount: 60, weight: 15 },
      { amount: 150, weight: 5 },
    ],
    status: 'pending',
  },
  {
    id: 'lucky-solar-pack',
    title: 'Solar Pack',
    baseAmount: 25,
    tiers: [
      { amount: 25, weight: 50 },
      { amount: 45, weight: 30 },
      { amount: 90, weight: 15 },
      { amount: 200, weight: 5 },
    ],
    status: 'pending',
  },
  {
    id: 'lucky-aurora-pack',
    title: 'Aurora Pack',
    baseAmount: 40,
    tiers: [
      { amount: 40, weight: 45 },
      { amount: 80, weight: 30 },
      { amount: 160, weight: 20 },
      { amount: 320, weight: 5 },
    ],
    openedAmount: 80,
    status: 'opened',
  },
  {
    id: 'lucky-crown-pack',
    title: 'Crown Pack',
    baseAmount: 60,
    tiers: [
      { amount: 60, weight: 50 },
      { amount: 120, weight: 30 },
      { amount: 240, weight: 15 },
      { amount: 480, weight: 5 },
    ],
    openedAmount: 240,
    status: 'claimed',
  },
];

const INITIAL_HISTORY: GameHistoryItem[] = [
  {
    id: 'history-signal-hunter',
    type: 'challenge',
    title: 'Signal Hunter',
    amount: 320,
    status: 'won',
    createdAt: NOW - DAY_MS,
  },
  {
    id: 'history-ember-loss',
    type: 'challenge',
    title: 'Ember Loss',
    amount: 0,
    status: 'lost',
    createdAt: NOW - DAY_MS * 2,
  },
  {
    id: 'history-aurora-pack',
    type: 'lucky',
    title: 'Aurora Pack',
    amount: 80,
    status: 'opened',
    createdAt: NOW - Math.round(DAY_MS * 1.5),
  },
  {
    id: 'history-crown-pack',
    type: 'lucky',
    title: 'Crown Pack',
    amount: 240,
    status: 'opened',
    createdAt: NOW - DAY_MS * 4,
  },
];

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampProgress(value: number, targetValue: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(targetValue, Math.round(value)));
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
  const openLuckyPacks = state.luckyPacks.filter((pack) => pack.status === 'pending').length;
  const totalWon = state.history.reduce((sum, item) => sum + (item.status === 'lost' ? 0 : item.amount), 0);
  const positiveEvents = state.history.filter((item) => item.status !== 'lost').length;
  const winRate = state.history.length === 0 ? 0 : Math.round((positiveEvents / state.history.length) * 100);
  const recentHistory = [...state.history].sort((a, b) => b.createdAt - a.createdAt);

  let streak = 0;
  for (const item of recentHistory) {
    if (item.status === 'lost') {
      break;
    }

    if (item.status === 'won' || item.status === 'opened') {
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

    return sum;
  }, 0);

  const challengeXp = state.challenges.reduce((sum, challenge) => {
    const progressRatio = challenge.targetValue > 0 ? challenge.progress / challenge.targetValue : 0;

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
    ? `${recent.type === 'challenge' ? 'Challenge' : 'Lucky'} · ${recent.status.toUpperCase()} · ${formatGameAmount(recent.amount)}`
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
  return resolveChallengeStatus(challenge, now) === 'open' && challenge.progress >= challenge.targetValue;
}

export function getLuckyPackRevealLabel(pack: LuckyPack): string {
  if (pack.status === 'claimed') {
    return 'Claimed';
  }

  if (pack.status === 'opened') {
    return 'Opened';
  }

  return 'Pending';
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
      updateChallengeProgress: (challengeId, amount = 1) => {
        const nextAmount = Math.max(1, Math.round(amount));
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current || resolveChallengeStatus(current, now) !== 'open') {
          return;
        }

        const nextProgress = clampProgress(current.progress + nextAmount, current.targetValue);

        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  progress: nextProgress,
                }
              : challenge,
          ),
        }));
      },
      claimChallengeReward: (challengeId) => {
        const now = Date.now();
        const current = get().challenges.find((challenge) => challenge.id === challengeId);

        if (!current || !isChallengeClaimable(current, now)) {
          return false;
        }

        set((state) => ({
          challenges: state.challenges.map((challenge) =>
            challenge.id === challengeId
              ? {
                  ...challenge,
                  status: 'won',
                  progress: Math.max(challenge.progress, challenge.targetValue),
                }
              : challenge,
          ),
          history: [
            {
              id: makeId('history-challenge'),
              type: 'challenge',
              title: current.title,
              amount: current.rewardUsd,
              status: 'won',
              createdAt: Date.now(),
            },
            ...state.history,
          ],
        }));

        return true;
      },
      openLuckyPack: (packId) => {
        const current = get().luckyPacks.find((pack) => pack.id === packId);

        if (!current || current.status !== 'pending') {
          if (current?.openedAmount !== undefined) {
            return {
              packId: current.id,
              amount: current.openedAmount,
              tier: { amount: current.openedAmount, weight: 0 },
            };
          }

          return null;
        }

        const selectedTier = chooseLuckyTier(current.tiers.length > 0 ? current.tiers : [{ amount: current.baseAmount, weight: 1 }]);
        const amount = selectedTier.amount > 0 ? selectedTier.amount : current.baseAmount;

        set((state) => ({
          luckyPacks: state.luckyPacks.map((pack) =>
            pack.id === packId
              ? {
                  ...pack,
                  openedAmount: amount,
                  status: 'opened',
                }
              : pack,
          ),
          history: [
            {
              id: makeId('history-lucky'),
              type: 'lucky',
              title: current.title,
              amount,
              status: 'opened',
              createdAt: Date.now(),
            },
            ...state.history,
          ],
        }));

        return {
          packId: current.id,
          amount,
          tier: selectedTier,
        };
      },
      claimLuckyPack: (packId) => {
        const current = get().luckyPacks.find((pack) => pack.id === packId);

        if (!current || current.status !== 'opened') {
          return false;
        }

        set((state) => ({
          luckyPacks: state.luckyPacks.map((pack) =>
            pack.id === packId
              ? {
                  ...pack,
                  status: 'claimed',
                }
              : pack,
          ),
        }));

        return true;
      },
    }),
    {
      name: 'arclanding:game-hub',
      partialize: (state): PersistedGameState => ({
        challenges: state.challenges,
        luckyPacks: state.luckyPacks,
        history: state.history,
      }),
    },
  ),
);
