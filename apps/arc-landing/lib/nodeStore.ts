import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAddress } from 'viem';

export type NodeStatus = 'pending' | 'verified' | 'inactive';
export type Region = 'NA' | 'EU' | 'ASIA' | 'OCEANIA' | 'OTHER';
export type ValidatorStatus = 'waitlist' | 'approved' | 'active' | 'rejected';
export type BugStatus = 'reported' | 'triaged' | 'fixed' | 'duplicate' | 'invalid';
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface NodeOperator {
  address: string;
  name?: string;
  region: Region;
  rpcEndpoint?: string;
  registeredAt: number;
  status: NodeStatus;
  uptimePercent?: number;
  notes?: string;
}

export interface ValidatorApplication {
  address: string;
  name?: string;
  email?: string;
  experience: string;
  region: Region;
  appliedAt: number;
  status: ValidatorStatus;
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  reporterAddress: string;
  reporterName?: string;
  rewardAmount?: number;
  cveLink?: string;
  reportedAt: number;
  resolvedAt?: number;
}

export interface RpcProvider {
  id: string;
  name: string;
  url: string;
  region: Region;
  isOfficial: boolean;
  addedAt: number;
  description?: string;
}

interface NodeStore {
  operators: NodeOperator[];
  validators: ValidatorApplication[];
  bugs: BugReport[];
  rpcProviders: RpcProvider[];

  registerOperator: (op: NodeOperator) => void;
  updateOperator: (address: string, updates: Partial<NodeOperator>) => void;

  applyValidator: (app: ValidatorApplication) => void;
  updateValidator: (address: string, updates: Partial<ValidatorApplication>) => void;

  reportBug: (bug: BugReport) => void;
  updateBug: (id: string, updates: Partial<BugReport>) => void;

  addRpc: (rpc: RpcProvider) => void;
  removeRpc: (id: string) => void;
}

export const NODE_ADMIN = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');
export const isNodeAdmin = (address?: string): boolean =>
  !!address && address.toLowerCase() === NODE_ADMIN.toLowerCase();

export const shortenAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const REGION_LABELS: Record<Region, string> = {
  NA: 'North America',
  EU: 'Europe',
  ASIA: 'Asia',
  OCEANIA: 'Oceania',
  OTHER: 'Other',
};

export const useNodeStore = create<NodeStore>()(
  persist(
    (set) => ({
      operators: [],
      validators: [],
      bugs: [],
      rpcProviders: [
        {
          id: 'official',
          name: 'Official Arc RPC',
          url: 'https://rpc.testnet.arc.network',
          region: 'NA',
          isOfficial: true,
          addedAt: Date.now(),
          description: 'Maintained by Circle',
        },
      ],

      registerOperator: (op) =>
        set((state) => ({
          operators: [op, ...state.operators.filter((o) => o.address !== op.address)],
        })),

      updateOperator: (address, updates) =>
        set((state) => ({
          operators: state.operators.map((o) =>
            o.address === address ? { ...o, ...updates } : o
          ),
        })),

      applyValidator: (app) =>
        set((state) => ({
          validators: [app, ...state.validators.filter((v) => v.address !== app.address)],
        })),

      updateValidator: (address, updates) =>
        set((state) => ({
          validators: state.validators.map((v) =>
            v.address === address ? { ...v, ...updates } : v
          ),
        })),

      reportBug: (bug) =>
        set((state) => ({ bugs: [bug, ...state.bugs] })),

      updateBug: (id, updates) =>
        set((state) => ({
          bugs: state.bugs.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      addRpc: (rpc) =>
        set((state) => ({ rpcProviders: [rpc, ...state.rpcProviders] })),

      removeRpc: (id) =>
        set((state) => ({
          rpcProviders: state.rpcProviders.filter((r) => r.id !== id),
        })),
    }),
    { name: 'arclanding:node' }
  )
);
