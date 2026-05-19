import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAddress } from 'viem';

export type RoadmapStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';
export type RoadmapQuarter = 'Q1-2026' | 'Q2-2026' | 'Q3-2026' | 'Q4-2026' | 'Q1-2027';
export type RoadmapCategory = 'feature' | 'infrastructure' | 'community' | 'integration';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  quarter: RoadmapQuarter;
  category: RoadmapCategory;
  votes: string[];
  createdAt: number;
}

const INITIAL_ROADMAP: RoadmapItem[] = [
  // Q1-2026 (current, in progress)
  { id: 'r1', title: 'Arc Pay Launch', description: 'USDC payments, QR, split, invoice, payroll, escrow', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'feature', createdAt: Date.now() - 90*86400000 },
  { id: 'r2', title: 'Arc Creator Launch', description: 'Tip jar, subscriptions, bounties, marketplace', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'feature', createdAt: Date.now() - 80*86400000 },
  { id: 'r3', title: 'Arc Play Launch', description: 'Portfolio, predictions, raffles, games, launchpad', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'feature', createdAt: Date.now() - 70*86400000 },
  { id: 'r4', title: 'AI Assistant', description: 'Voice + text AI helper across all apps', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'feature', createdAt: Date.now() - 60*86400000 },
  { id: 'r5', title: 'Community Forum', description: 'Reddit-style discussion with voting', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'community', createdAt: Date.now() - 50*86400000 },
  { id: 'r6', title: 'Node Operator Hub', description: 'Setup guides, RPC monitor, validator waitlist', status: 'completed', quarter: 'Q1-2026', votes: [], category: 'infrastructure', createdAt: Date.now() - 40*86400000 },
  
  // Q2-2026
  { id: 'r7', title: 'Smart Contract Migration', description: 'Move MVP features (escrow, prediction, raffle) to smart contracts', status: 'in-progress', quarter: 'Q2-2026', votes: [], category: 'infrastructure', createdAt: Date.now() - 30*86400000 },
  { id: 'r8', title: 'Mobile App (iOS + Android)', description: 'Native mobile apps for Arc Pay', status: 'in-progress', quarter: 'Q2-2026', votes: [], category: 'feature', createdAt: Date.now() - 25*86400000 },
  { id: 'r9', title: 'Mainnet Launch', description: 'Move from testnet to Arc Mainnet', status: 'planned', quarter: 'Q2-2026', votes: [], category: 'infrastructure', createdAt: Date.now() - 20*86400000 },
  { id: 'r10', title: 'Arc SDK v1', description: 'npm package for third-party developers', status: 'planned', quarter: 'Q2-2026', votes: [], category: 'integration', createdAt: Date.now() - 15*86400000 },
  
  // Q3-2026
  { id: 'r11', title: 'Arc DAO', description: 'Governance with token voting', status: 'planned', quarter: 'Q3-2026', votes: [], category: 'community', createdAt: Date.now() - 10*86400000 },
  { id: 'r12', title: 'Cross-chain Bridge', description: 'Bridge USDC from Ethereum to Arc', status: 'planned', quarter: 'Q3-2026', votes: [], category: 'integration', createdAt: Date.now() - 8*86400000 },
  { id: 'r13', title: 'Native ARC Token', description: 'Ecosystem token launch', status: 'planned', quarter: 'Q3-2026', votes: [], category: 'feature', createdAt: Date.now() - 5*86400000 },
  { id: 'r14', title: 'Validator Program', description: 'Public validator onboarding (50+ validators)', status: 'planned', quarter: 'Q3-2026', votes: [], category: 'infrastructure', createdAt: Date.now() - 3*86400000 },
  
  // Q4-2026
  { id: 'r15', title: 'Arc Lending', description: 'USDC lending and borrowing protocol', status: 'planned', quarter: 'Q4-2026', votes: [], category: 'feature', createdAt: Date.now() - 2*86400000 },
  { id: 'r16', title: 'Arc Identity', description: 'Decentralized identity layer', status: 'planned', quarter: 'Q4-2026', votes: [], category: 'infrastructure', createdAt: Date.now() - 1*86400000 },
  { id: 'r17', title: 'Major Partnerships', description: 'Integration with top exchanges and dApps', status: 'planned', quarter: 'Q4-2026', votes: [], category: 'integration', createdAt: Date.now() },
];

interface RoadmapStore {
  items: RoadmapItem[];
  toggleVote: (id: string, address: string) => void;
  addItem: (item: RoadmapItem) => void;  // admin only
  updateStatus: (id: string, status: RoadmapStatus) => void;  // admin only
}

export const ADMIN_ADDRESS = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      items: INITIAL_ROADMAP,
      toggleVote: (id, address) => set((state) => ({
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          const votes = item.votes.includes(address)
            ? item.votes.filter((a) => a !== address)
            : [...item.votes, address];
          return { ...item, votes };
        })
      })),
      addItem: (item) => set((state) => ({
        items: [item, ...state.items]
      })),
      updateStatus: (id, status) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id ? { ...item, status } : item
        )
      })),
    }),
    {
      name: 'arclanding:roadmap',
    }
  )
);
