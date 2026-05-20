import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type GameType =
  | 'quiz'
  | 'minesweeper'
  | 'solitaire'
  | 'penalty'
  | 'wordconnect'
  | 'redball'
  | 'bubble'
  | 'candycrush'
  | 'fruitninja'
  | 'bomberman'
  | 'bilbakalim';

export interface GameChallenge {
  id: string;
  gameType: GameType;
  creatorAddress: string;
  creatorName?: string;
  creatorScore: number;
  targetScore: number;
  usdcAmount: number;
  status: 'open' | 'completed' | 'expired';
  challengerAddress?: string;
  challengerScore?: number;
  winner?: string;
  createdAt: number;
  expiresAt: number;
}

export interface CreateGameChallengeInput {
  gameType: GameType;
  creatorAddress: string;
  creatorName?: string;
  creatorScore: number;
  targetScore: number;
  usdcAmount: number;
}

type ChallengeRole = 'creator' | 'challenger';

interface ChallengeStore {
  challenges: GameChallenge[];
  createChallenge: (challenge: CreateGameChallengeInput) => string;
  acceptChallenge: (id: string, address: string) => void;
  completeChallenge: (id: string, score: number) => void;
  getChallengeById: (id: string) => GameChallenge | undefined;
  getOpenChallenges: () => GameChallenge[];
}

interface ChallengeMetric {
  label: string;
  unit: string;
  lowerIsBetter: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const ADDRESS_STORAGE_KEYS: Record<ChallengeRole, string> = {
  creator: 'arclanding:challenge-address:creator',
  challenger: 'arclanding:challenge-address:challenger',
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const GAME_TITLES: Record<GameType, string> = {
  quiz: 'Arc Quiz',
  minesweeper: 'Minesweeper',
  solitaire: 'Solitaire',
  penalty: 'Penalty',
  wordconnect: 'Word Connect',
  redball: 'Red Ball',
  bubble: 'Bubble Shooter',
  candycrush: 'Candy Crush',
  fruitninja: 'Fruit Ninja',
  bomberman: 'Bomberman',
  bilbakalim: 'Bil Bakalım',
};

const LOWER_BETTER_GAMES = new Set<GameType>(['minesweeper', 'solitaire']);

function createPseudoAddress(): string {
  const bytes = new Uint8Array(20);

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function isExpiredChallenge(challenge: GameChallenge): boolean {
  return challenge.status === 'open' && challenge.expiresAt <= Date.now();
}

function refreshChallenge(challenge: GameChallenge): GameChallenge {
  if (!isExpiredChallenge(challenge)) {
    return challenge;
  }

  return {
    ...challenge,
    status: 'expired',
  };
}

function getCurrentChallengeAddress(role: ChallengeRole): string {
  if (typeof window === 'undefined') {
    return role === 'creator'
      ? '0x000000000000000000000000000000000000cRea'
      : '0x000000000000000000000000000000000000cHaL';
  }

  const storageKey = ADDRESS_STORAGE_KEYS[role];
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const created = createPseudoAddress();
  window.localStorage.setItem(storageKey, created);
  return created;
}

function getMetricForGame(gameType: GameType): ChallengeMetric {
  switch (gameType) {
    case 'minesweeper':
      return { label: 'time', unit: 's', lowerIsBetter: true };
    case 'solitaire':
      return { label: 'moves', unit: '', lowerIsBetter: true };
    case 'penalty':
      return { label: 'goals', unit: '', lowerIsBetter: false };
    case 'quiz':
      return { label: 'score', unit: '', lowerIsBetter: false };
    default:
      return { label: 'score', unit: '', lowerIsBetter: false };
  }
}

function isWinningScore(gameType: GameType, playerScore: number, targetScore: number): boolean {
  const metric = getMetricForGame(gameType);
  return metric.lowerIsBetter ? playerScore <= targetScore : playerScore >= targetScore;
}

export function getChallengeParticipantAddress(role: ChallengeRole): string {
  return getCurrentChallengeAddress(role);
}

export function getChallengeGameTitle(gameType: GameType): string {
  return GAME_TITLES[gameType];
}

export function getChallengeMetric(gameType: GameType): ChallengeMetric {
  return getMetricForGame(gameType);
}

export function formatChallengeAmount(amountUsd: number): string {
  const safeAmount = Number.isFinite(amountUsd) ? amountUsd : 0;
  return `$${safeAmount} USDC`;
}

export function formatChallengeScore(gameType: GameType, value: number): string {
  const metric = getMetricForGame(gameType);
  return `${value}${metric.unit}`;
}

export function doesScoreBeatTarget(gameType: GameType, playerScore: number, targetScore: number): boolean {
  return isWinningScore(gameType, playerScore, targetScore);
}

export function truncateAddress(address: string): string {
  const trimmed = normalizeAddress(address);
  if (!trimmed) {
    return 'Unknown';
  }

  if (trimmed.length <= 10) {
    return trimmed;
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

export const useChallengeStore = create<ChallengeStore>()(
  persist(
    (set, get) => ({
      challenges: [],
      createChallenge: (challenge) => {
        const now = Date.now();
        const id = `challenge-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        const nextChallenge: GameChallenge = {
          id,
          gameType: challenge.gameType,
          creatorAddress: challenge.creatorAddress,
          creatorName: challenge.creatorName,
          creatorScore: Math.max(0, Math.round(challenge.creatorScore)),
          targetScore: Math.max(0, Math.round(challenge.targetScore)),
          usdcAmount: Math.max(1, Math.round(challenge.usdcAmount)),
          status: 'open',
          createdAt: now,
          expiresAt: now + DAY_MS,
        };

        set((state) => ({
          challenges: [nextChallenge, ...state.challenges],
        }));

        return id;
      },
      acceptChallenge: (id, address) => {
        const normalizedAddress = normalizeAddress(address);
        if (!normalizedAddress) {
          return;
        }

        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id !== id) {
              return challenge;
            }

            const current = refreshChallenge(challenge);
            if (current.status !== 'open') {
              return current;
            }

            return {
              ...current,
              challengerAddress: normalizedAddress,
            };
          }),
        }));
      },
      completeChallenge: (id, score) => {
        const finalScore = Math.max(0, Math.round(score));

        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id !== id) {
              return challenge;
            }

            const current = refreshChallenge(challenge);
            if (current.status !== 'open') {
              return current;
            }

            const challengerAddress = current.challengerAddress ?? getCurrentChallengeAddress('challenger');
            const challengerWon = isWinningScore(current.gameType, finalScore, current.targetScore);

            return {
              ...current,
              status: 'completed',
              challengerAddress,
              challengerScore: finalScore,
              winner: challengerWon ? challengerAddress : current.creatorAddress,
            };
          }),
        }));
      },
      getChallengeById: (id) => {
        const challenge = get().challenges.find((entry) => entry.id === id);
        return challenge ? refreshChallenge(challenge) : undefined;
      },
      getOpenChallenges: () => {
        return get()
          .challenges.map(refreshChallenge)
          .filter((challenge) => challenge.status === 'open')
          .sort((left, right) => right.createdAt - left.createdAt);
      },
    }),
    {
      name: 'arclanding:challenges',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : window.localStorage)),
      partialize: (state) => ({
        challenges: state.challenges,
      }),
    },
  ),
);
