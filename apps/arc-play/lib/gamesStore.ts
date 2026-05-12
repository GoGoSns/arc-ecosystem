import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameType = 'click-rush' | 'memory' | 'reaction';

export interface GameScore {
  id: string;
  gameType: GameType;
  playerAddress: string;
  score: number; // Raw score for sorting. Higher is better.
  displayScore: string; // Formatted score: "47 clicks", "23.5s", "187ms"
  timestamp: number;
  paidEntry: boolean;
  entryTxHash?: string;
}

export interface GameSession {
  id: string;
  gameType: GameType;
  playerAddress: string;
  startedAt: number;
  completedAt?: number;
  score?: number;
  paid: boolean;
  entryTxHash?: string;
}

interface GamesStore {
  scores: GameScore[];
  sessions: GameSession[];
  payoutAddress: string;
  
  recordScore: (score: Omit<GameScore, 'id' | 'timestamp'>) => GameScore;
  createSession: (session: Omit<GameSession, 'id' | 'startedAt'>) => GameSession;
  completeSession: (sessionId: string, score: number) => void;
  getLeaderboard: (gameType: GameType, period: 'all' | 'week') => GameScore[];
  getMyBestScore: (gameType: GameType, address: string) => GameScore | null;
  getPrizePool: (gameType: GameType, period: 'all' | 'week') => number;
}

export const useGamesStore = create<GamesStore>()(
  persist(
    (set, get) => ({
      scores: [],
      sessions: [],
      payoutAddress: '0x3600000000000000000000000000000000000000', // Placeholder, using USDC address as pool for MVP

      recordScore: (scoreData) => {
        const score: GameScore = {
          ...scoreData,
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          timestamp: Date.now(),
        };
        set((state) => ({ scores: [score, ...state.scores] }));
        return score;
      },

      createSession: (sessionData) => {
        const session: GameSession = {
          ...sessionData,
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          startedAt: Date.now(),
        };
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return session;
      },

      completeSession: (sessionId, score) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, completedAt: Date.now(), score } : s
          ),
        }));
      },

      getLeaderboard: (gameType, period) => {
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const filtered = get().scores.filter((s) => {
          if (s.gameType !== gameType) return false;
          if (period === 'week' && now - s.timestamp > weekMs) return false;
          return s.paidEntry; // Only paid entries on leaderboard
        });

        // Sort by score desc. Note: memory and reaction scores are negative in store to support desc sort
        return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
      },

      getMyBestScore: (gameType, address) => {
        const filtered = get().scores.filter(
          (s) => s.gameType === gameType && s.playerAddress.toLowerCase() === address.toLowerCase()
        );
        if (filtered.length === 0) return null;
        return filtered.sort((a, b) => b.score - a.score)[0];
      },

      getPrizePool: (gameType, period) => {
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const paidScores = get().scores.filter((s) => {
          if (s.gameType !== gameType) return false;
          if (period === 'week' && now - s.timestamp > weekMs) return false;
          return s.paidEntry;
        });
        return paidScores.length; // 1 USDC per entry
      },
    }),
    { name: 'arcplay:games' }
  )
);
