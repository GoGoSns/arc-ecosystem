import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WalletScoreData {
  address: string;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  breakdown: {
    age: number;        // 0-200
    txCount: number;    // 0-200
    volume: number;     // 0-200
    apps: number;       // 0-200
    nfts: number;       // 0-100
    community: number;  // 0-100
  };
  computedAt: number;
}

interface ValueState {
  cache: Record<string, WalletScoreData>;
  setScore: (data: WalletScoreData) => void;
  getScore: (address: string) => WalletScoreData | null;
  clearCache: () => void;
}

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export const useValueStore = create<ValueState>()(
  persist(
    (set, get) => ({
      cache: {},
      setScore: (data) => {
        const address = data.address.toLowerCase();
        set((state) => ({
          cache: {
            ...state.cache,
            [address]: data,
          },
        }));
      },
      getScore: (address) => {
        const addr = address.toLowerCase();
        const cached = get().cache[addr];
        if (!cached) return null;

        const isExpired = Date.now() - cached.computedAt > CACHE_EXPIRY;
        if (isExpired) {
          // We could remove it here, but keeping it simple for now
          return null;
        }
        return cached;
      },
      clearCache: () => set({ cache: {} }),
    }),
    {
      name: 'arclanding:value',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
