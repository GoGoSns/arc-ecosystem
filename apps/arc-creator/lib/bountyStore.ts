import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Proposal {
  id: string;
  bountyId: string;
  hunterAddress: string;
  hunterName?: string;
  bidAmount: number;
  coverLetter: string;
  portfolioUrl?: string;
  estimatedDays?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: number;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: 'design' | 'development' | 'content' | 'marketing' | 'research' | 'other';
  budget: number;
  budgetType: 'fixed' | 'flexible';
  deadline: number;
  estimatedHours?: number;
  requiredSkills: string[];
  ownerAddress: string;
  status: 'open' | 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'expired';
  createdAt: number;
  acceptedAt?: number;
  submittedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  acceptedProposalId?: string;
  acceptedHunterAddress?: string;
  finalAmount?: number;
  submissionUrl?: string;
  submissionNote?: string;
  payoutTxHash?: string;
  proposals: Proposal[];
}

interface BountyStore {
  bounties: Bounty[];
  addBounty: (bounty: Bounty) => void;
  updateBounty: (id: string, updates: Partial<Bounty>) => void;
  addProposal: (bountyId: string, proposal: Proposal) => void;
  updateProposal: (bountyId: string, proposalId: string, updates: Partial<Proposal>) => void;
}

export const useBountyStore = create<BountyStore>()(
  persist(
    (set) => ({
      bounties: [],
      addBounty: (bounty) =>
        set((state) => ({ bounties: [bounty, ...state.bounties] })),
      updateBounty: (id, updates) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      addProposal: (bountyId, proposal) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === bountyId
              ? { ...b, proposals: [...b.proposals, proposal] }
              : b
          ),
        })),
      updateProposal: (bountyId, proposalId, updates) =>
        set((state) => ({
          bounties: state.bounties.map((b) =>
            b.id === bountyId
              ? {
                  ...b,
                  proposals: b.proposals.map((p) =>
                    p.id === proposalId ? { ...p, ...updates } : p
                  ),
                }
              : b
          ),
        })),
    }),
    {
      name: 'arccreator:bounties',
    }
  )
);
