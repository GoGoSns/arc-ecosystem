import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Category = 'crypto' | 'politics' | 'sports' | 'tech' | 'other';

export interface Bet {
  id: string;
  marketId: string;
  bettor: string;
  side: 'yes' | 'no';
  amount: number;
  txHash: string;
  claimTxHash?: string;
  timestamp: number;
  claimed: boolean;
  payout?: number;
}

export interface Market {
  id: string;
  question: string;
  description: string;
  category: Category;
  endsAt: number;
  resolveBy: number;
  creatorAddress: string;
  status: 'active' | 'closed' | 'resolved' | 'cancelled';
  outcome?: 'yes' | 'no' | 'invalid';
  yesPool: number;
  noPool: number;
  bets: Bet[];
  createdAt: number;
  resolvedAt?: number;
  resolutionNote?: string;
}

export const CATEGORIES: Category[] = ['crypto', 'politics', 'sports', 'tech', 'other'];

export const CATEGORY_LABELS: Record<Category, string> = {
  crypto: 'Crypto',
  politics: 'Politics',
  sports: 'Sports',
  tech: 'Tech',
  other: 'Other',
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function formatTimeLeft(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return 'Ended';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (s < 86400) return `${h}h ${m}m`;
  const d = Math.floor(s / 86400);
  const hh = Math.floor((s % 86400) / 3600);
  return hh > 0 ? `${d}d ${hh}h` : `${d}d`;
}

export function formatTimeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return 'Just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shorten(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Market math ──────────────────────────────────────────────────────────────

export function getMarketOdds(market: Market): { yesPercent: number; noPercent: number } {
  const total = market.yesPool + market.noPool;
  if (total === 0) return { yesPercent: 50, noPercent: 50 };
  const yp = Math.round((market.yesPool / total) * 100);
  return { yesPercent: yp, noPercent: 100 - yp };
}

export function calcPotentialPayout(amount: number, side: 'yes' | 'no', market: Market): number {
  if (amount <= 0) return 0;
  const newYes = side === 'yes' ? market.yesPool + amount : market.yesPool;
  const newNo = side === 'no' ? market.noPool + amount : market.noPool;
  const total = newYes + newNo;
  const winPool = side === 'yes' ? newYes : newNo;
  if (winPool === 0) return amount;
  return (amount / winPool) * total;
}

export function calcWinPayout(
  bet: Bet,
  market: Market & { outcome: 'yes' | 'no' | 'invalid' },
): number {
  if (market.outcome === 'invalid') return bet.amount;
  const winningSidePool = market.outcome === 'yes' ? market.yesPool : market.noPool;
  if (winningSidePool === 0) return 0;
  return (bet.amount / winningSidePool) * (market.yesPool + market.noPool);
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function getMarketsByStatus(
  markets: Record<string, Market>,
  status: Market['status'] | 'all',
): Market[] {
  return Object.values(markets)
    .filter((m) => status === 'all' || m.status === status)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getMyBets(
  markets: Record<string, Market>,
  address: string,
): Array<{ bet: Bet; market: Market }> {
  const result: Array<{ bet: Bet; market: Market }> = [];
  for (const market of Object.values(markets)) {
    for (const bet of market.bets) {
      if (bet.bettor.toLowerCase() === address.toLowerCase()) {
        result.push({ bet, market });
      }
    }
  }
  return result.sort((a, b) => b.bet.timestamp - a.bet.timestamp);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface PredictionStore {
  markets: Record<string, Market>;
  createMarket(
    data: Omit<Market, 'id' | 'status' | 'yesPool' | 'noPool' | 'bets' | 'createdAt'>,
  ): Market;
  placeBet(
    marketId: string,
    side: 'yes' | 'no',
    amount: number,
    txHash: string,
    bettor: string,
  ): Bet | null;
  closeMarket(marketId: string): void;
  resolveMarket(
    marketId: string,
    outcome: 'yes' | 'no' | 'invalid',
    note: string,
    resolverAddress: string,
  ): void;
  cancelMarket(marketId: string): void;
  claimPayout(marketId: string, betId: string, txHash: string): void;
}

export const usePredictionStore = create<PredictionStore>()(
  persist(
    (set, get) => ({
      markets: {},

      createMarket(data) {
        const market: Market = {
          ...data,
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          status: 'active',
          yesPool: 0,
          noPool: 0,
          bets: [],
          createdAt: Date.now(),
        };
        set((s) => ({ markets: { ...s.markets, [market.id]: market } }));
        return market;
      },

      placeBet(marketId, side, amount, txHash, bettor) {
        const market = get().markets[marketId];
        if (!market || market.status !== 'active' || market.endsAt < Date.now()) return null;
        const bet: Bet = {
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          marketId,
          bettor,
          side,
          amount,
          txHash,
          timestamp: Date.now(),
          claimed: false,
        };
        set((s) => {
          const m = s.markets[marketId];
          if (!m) return s;
          return {
            markets: {
              ...s.markets,
              [marketId]: {
                ...m,
                yesPool: side === 'yes' ? m.yesPool + amount : m.yesPool,
                noPool: side === 'no' ? m.noPool + amount : m.noPool,
                bets: [...m.bets, bet],
              },
            },
          };
        });
        return bet;
      },

      closeMarket(marketId) {
        set((s) => {
          const m = s.markets[marketId];
          if (!m || m.status !== 'active') return s;
          return { markets: { ...s.markets, [marketId]: { ...m, status: 'closed' } } };
        });
      },

      resolveMarket(marketId, outcome, note, resolverAddress) {
        set((s) => {
          const m = s.markets[marketId];
          if (!m) return s;
          if (m.creatorAddress.toLowerCase() !== resolverAddress.toLowerCase()) return s;
          if (m.status === 'resolved' || m.status === 'cancelled') return s;
          const updatedBets = m.bets.map((bet) => {
            if (outcome === 'invalid') return { ...bet, payout: bet.amount };
            if (bet.side === outcome)
              return { ...bet, payout: calcWinPayout(bet, { ...m, outcome }) };
            return { ...bet, payout: 0 };
          });
          return {
            markets: {
              ...s.markets,
              [marketId]: {
                ...m,
                status: 'resolved',
                outcome,
                resolutionNote: note,
                resolvedAt: Date.now(),
                bets: updatedBets,
              },
            },
          };
        });
      },

      cancelMarket(marketId) {
        set((s) => {
          const m = s.markets[marketId];
          if (!m || m.status === 'resolved' || m.status === 'cancelled') return s;
          const updatedBets = m.bets.map((bet) => ({ ...bet, payout: bet.amount }));
          return {
            markets: {
              ...s.markets,
              [marketId]: { ...m, status: 'cancelled', bets: updatedBets },
            },
          };
        });
      },

      claimPayout(marketId, betId, txHash) {
        set((s) => {
          const m = s.markets[marketId];
          if (!m) return s;
          const updatedBets = m.bets.map((bet) =>
            bet.id === betId ? { ...bet, claimed: true, claimTxHash: txHash } : bet,
          );
          return { markets: { ...s.markets, [marketId]: { ...m, bets: updatedBets } } };
        });
      },
    }),
    { name: 'arcplay:prediction:markets' },
  ),
);
