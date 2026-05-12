import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from './wagmi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RaffleCategory = 'usdc' | 'nft' | 'physical' | 'other';

export interface Ticket {
  id: string; // Sequential per raffle: "001", "002", ...
  raffleId: string;
  buyer: string;
  txHash: string;
  timestamp: number;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  category: RaffleCategory;

  // Prize
  prizeMode: 'fixed' | 'pot';
  prizeUsdc?: number;
  prizeNftImage?: string;
  prizeNftName?: string;
  prizeDescription: string;
  creatorFeePercent?: number;

  // Tickets
  ticketPrice: number;
  maxTickets?: number;
  ticketsSold: number;

  // Time
  endsAt: number;
  drawAt?: number;
  createdAt: number;

  // People
  creatorAddress: string;
  participants: Ticket[];

  // State
  status: 'active' | 'closed' | 'drawn' | 'paid' | 'cancelled';
  winnerTicketId?: string;
  winnerAddress?: string;
  drawBlockNumber?: number;
  drawBlockHash?: string;
  randomnessSeed?: string;

  payoutTxHash?: string;
  cancelledAt?: number;
}

export const RAFFLE_CATEGORIES: RaffleCategory[] = ['usdc', 'nft', 'physical', 'other'];

export const RAFFLE_CATEGORY_LABELS: Record<RaffleCategory, string> = {
  usdc: 'USDC Prize',
  nft: 'NFT Prize',
  physical: 'Physical Item',
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

// ─── Prize helpers ────────────────────────────────────────────────────────────

export function getPrizeDisplay(raffle: Raffle): string {
  if (raffle.prizeMode === 'pot') {
    const pot = raffle.ticketsSold * raffle.ticketPrice;
    const fee = (raffle.creatorFeePercent ?? 0) / 100;
    return `$${(pot * (1 - fee)).toFixed(2)} pot`;
  }
  const parts: string[] = [];
  if (raffle.prizeUsdc) parts.push(`${raffle.prizeUsdc} USDC`);
  if (raffle.prizeNftName) parts.push(raffle.prizeNftName);
  return parts.join(' + ') || raffle.prizeDescription;
}

export function getPotAmount(raffle: Raffle): number {
  const gross = raffle.ticketsSold * raffle.ticketPrice;
  const fee = (raffle.creatorFeePercent ?? 0) / 100;
  return gross * (1 - fee);
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function getRafflesByStatus(
  raffles: Record<string, Raffle>,
  status: Raffle['status'] | 'all',
): Raffle[] {
  return Object.values(raffles)
    .filter((r) => status === 'all' || r.status === status)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getMyTickets(
  raffles: Record<string, Raffle>,
  address: string,
): Array<{ raffle: Raffle; tickets: Ticket[] }> {
  const result: Array<{ raffle: Raffle; tickets: Ticket[] }> = [];
  for (const raffle of Object.values(raffles)) {
    const tickets = raffle.participants.filter(
      (t) => t.buyer.toLowerCase() === address.toLowerCase(),
    );
    if (tickets.length > 0) {
      result.push({ raffle, tickets });
    }
  }
  return result.sort((a, b) => b.raffle.createdAt - a.raffle.createdAt);
}

// ─── Randomness ───────────────────────────────────────────────────────────────

export function selectWinner(blockHash: string, totalTickets: number): number {
  const seed = BigInt(blockHash);
  return Number(seed % BigInt(totalTickets));
}

export function getPublicClient() {
  return createPublicClient({
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface RaffleStore {
  raffles: Record<string, Raffle>;
  createRaffle(
    data: Omit<Raffle, 'id' | 'status' | 'ticketsSold' | 'participants' | 'createdAt'>,
  ): Raffle;
  buyTickets(raffleId: string, buyer: string, txHash: string, quantity: number): Ticket[] | null;
  closeRaffleIfDue(raffleId: string): void;
  drawWinner(raffleId: string, blockNumber: number, blockHash: string): void;
  payWinner(raffleId: string, txHash: string): void;
  cancelRaffle(raffleId: string): void;
}

export const useRaffleStore = create<RaffleStore>()(
  persist(
    (set, get) => ({
      raffles: {},

      createRaffle(data) {
        const raffle: Raffle = {
          ...data,
          id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          status: 'active',
          ticketsSold: 0,
          participants: [],
          createdAt: Date.now(),
        };
        set((s) => ({ raffles: { ...s.raffles, [raffle.id]: raffle } }));
        return raffle;
      },

      buyTickets(raffleId, buyer, txHash, quantity) {
        const raffle = get().raffles[raffleId];
        if (!raffle || raffle.status !== 'active' || raffle.endsAt < Date.now()) return null;
        if (raffle.maxTickets && raffle.ticketsSold + quantity > raffle.maxTickets) return null;

        const base = raffle.ticketsSold;
        const tickets: Ticket[] = Array.from({ length: quantity }, (_, i) => ({
          id: String(base + i + 1).padStart(3, '0'),
          raffleId,
          buyer,
          txHash,
          timestamp: Date.now(),
        }));

        set((s) => {
          const r = s.raffles[raffleId];
          if (!r) return s;
          return {
            raffles: {
              ...s.raffles,
              [raffleId]: {
                ...r,
                ticketsSold: r.ticketsSold + quantity,
                participants: [...r.participants, ...tickets],
              },
            },
          };
        });
        return tickets;
      },

      closeRaffleIfDue(raffleId) {
        set((s) => {
          const r = s.raffles[raffleId];
          if (!r || r.status !== 'active' || r.endsAt > Date.now()) return s;
          return { raffles: { ...s.raffles, [raffleId]: { ...r, status: 'closed' } } };
        });
      },

      drawWinner(raffleId, blockNumber, blockHash) {
        set((s) => {
          const r = s.raffles[raffleId];
          if (!r || r.status !== 'closed') return s;
          if (r.participants.length === 0) {
            return {
              raffles: {
                ...s.raffles,
                [raffleId]: { ...r, status: 'cancelled', cancelledAt: Date.now() },
              },
            };
          }
          const winnerIndex = selectWinner(blockHash, r.participants.length);
          const winner = r.participants[winnerIndex];
          return {
            raffles: {
              ...s.raffles,
              [raffleId]: {
                ...r,
                status: 'drawn',
                winnerTicketId: winner.id,
                winnerAddress: winner.buyer,
                drawBlockNumber: blockNumber,
                drawBlockHash: blockHash,
                randomnessSeed: blockHash,
                drawAt: Date.now(),
              },
            },
          };
        });
      },

      payWinner(raffleId, txHash) {
        set((s) => {
          const r = s.raffles[raffleId];
          if (!r || r.status !== 'drawn') return s;
          return {
            raffles: { ...s.raffles, [raffleId]: { ...r, status: 'paid', payoutTxHash: txHash } },
          };
        });
      },

      cancelRaffle(raffleId) {
        set((s) => {
          const r = s.raffles[raffleId];
          if (!r || r.status === 'drawn' || r.status === 'paid' || r.status === 'cancelled')
            return s;
          return {
            raffles: {
              ...s.raffles,
              [raffleId]: { ...r, status: 'cancelled', cancelledAt: Date.now() },
            },
          };
        });
      },
    }),
    { name: 'arcplay:raffle:raffles' },
  ),
);
