import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EscrowStatus =
  | 'CREATED'
  | 'FUNDED'
  | 'WORK_DELIVERED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface ActivityEntry {
  action: string;
  by: string;
  at: number;
}

export interface EscrowDeal {
  id: string;
  title: string;
  description?: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  deadline: string;
  status: EscrowStatus;
  txHash?: string;
  createdAt: number;
  updatedAt: number;
  activity: ActivityEntry[];
}

interface EscrowStore {
  deals: Record<string, EscrowDeal>;
  addDeal: (deal: EscrowDeal) => void;
  updateDeal: (id: string, updates: Partial<Omit<EscrowDeal, 'id' | 'createdAt'>>) => void;
}

export const useEscrowStore = create<EscrowStore>()(
  persist(
    (set) => ({
      deals: {},
      addDeal: (deal) =>
        set((s) => ({ deals: { ...s.deals, [deal.id]: deal } })),
      updateDeal: (id, updates) =>
        set((s) => {
          const existing = s.deals[id];
          if (!existing) return s;
          return {
            deals: {
              ...s.deals,
              [id]: { ...existing, ...updates, updatedAt: Date.now() },
            },
          };
        }),
    }),
    { name: 'arcpay:escrow' }
  )
);

// ─── Shared helpers ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  EscrowStatus,
  { label: string; color: string; bg: string }
> = {
  CREATED:        { label: 'Created',   color: 'var(--fg)', bg: 'rgba(128,128,128,0.12)' },
  FUNDED:         { label: 'Funded',    color: '#60a5fa',   bg: 'rgba(96,165,250,0.12)'  },
  WORK_DELIVERED: { label: 'Delivered', color: '#f59e0b',   bg: 'rgba(245,158,11,0.12)'  },
  RELEASED:       { label: 'Released',  color: '#4ade80',   bg: 'rgba(74,222,128,0.12)'  },
  DISPUTED:       { label: 'Disputed',  color: '#f87171',   bg: 'rgba(248,113,113,0.12)' },
  CANCELLED:      { label: 'Cancelled', color: 'var(--fg)', bg: 'rgba(128,128,128,0.08)' },
};

const ACTIVE_STATUSES: EscrowStatus[] = ['CREATED', 'FUNDED', 'WORK_DELIVERED'];

export function getDaysLeft(deadline: string): number {
  const end = new Date(deadline + 'T23:59:59').getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}

export function deadlineLabel(deal: EscrowDeal): { text: string; overdue: boolean } {
  if (!ACTIVE_STATUSES.includes(deal.status)) return { text: '', overdue: false };
  const days = getDaysLeft(deal.deadline);
  if (days < 0) {
    const n = Math.abs(days);
    return { text: `Overdue by ${n} day${n !== 1 ? 's' : ''}`, overdue: true };
  }
  if (days === 0) return { text: 'Due today', overdue: false };
  return { text: `Due in ${days} day${days !== 1 ? 's' : ''}`, overdue: false };
}

export function shortenAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtTs(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
