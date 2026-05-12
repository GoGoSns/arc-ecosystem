import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RouletteResult = 'loss' | 'win-2x' | 'win-5x' | 'win-50x';

export interface Spin {
  id: string;
  address: string;
  bet: number;
  result: RouletteResult;
  payout: number;
  netResult: number;
  timestamp: number;
}

interface RouletteStore {
  spins: Spin[];
  userBalance: Record<string, number>; // address → balance
  addSpin: (spin: Spin) => void;
  topUp: (address: string, amount: number) => void;
  getBalance: (address: string) => number;
}

export const useRouletteStore = create<RouletteStore>()(
  persist(
    (set, get) => ({
      spins: [],
      userBalance: {},
      addSpin: (spin) => {
        set((state) => ({
          spins: [spin, ...state.spins].slice(0, 100), // Keep last 100 spins
          userBalance: {
            ...state.userBalance,
            [spin.address.toLowerCase()]: (state.userBalance[spin.address.toLowerCase()] || 10) + spin.netResult,
          },
        }));
      },
      topUp: (address, amount) => {
        const addr = address.toLowerCase();
        set((state) => ({
          userBalance: {
            ...state.userBalance,
            [addr]: (state.userBalance[addr] || 10) + amount,
          },
        }));
      },
      getBalance: (address) => {
        const addr = address.toLowerCase();
        const balance = get().userBalance[addr];
        return balance === undefined ? 10 : balance;
      },
    }),
    {
      name: 'arclanding:roulette',
    }
  )
);
