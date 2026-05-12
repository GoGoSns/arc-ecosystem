import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VaultCategory =
  | 'brand'
  | 'playbook'
  | 'template'
  | 'ops'
  | 'education'
  | 'asset';

export type VaultAccess = 'open' | 'gated' | 'private';

export interface VaultItem {
  id: string;
  title: string;
  description: string;
  category: VaultCategory;
  access: VaultAccess;
  format: string;
  size: string;
  url: string;
  tags: string[];
  unlockedBy: string[];
  accessCount: number;
  featured: boolean;
  createdAt: number;
}

interface VaultStore {
  items: VaultItem[];
  addVaultItem: (item: Omit<VaultItem, 'id' | 'unlockedBy' | 'accessCount' | 'featured' | 'createdAt'>) => void;
  toggleUnlock: (itemId: string, address: string) => void;
  trackAccess: (itemId: string) => void;
  getVaultItemById: (itemId: string) => VaultItem | undefined;
}

const INITIAL_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'vault-brand-kit',
    title: 'Arc Brand Kit',
    description: 'Logo exports, color references, and typography samples that keep the ecosystem visually aligned.',
    category: 'brand',
    access: 'open',
    format: 'ZIP',
    size: '12 MB',
    url: '/',
    tags: ['brand', 'design', 'assets'],
    unlockedBy: [],
    accessCount: 184,
    featured: true,
    createdAt: Date.now() - 86_400_000 * 2,
  },
  {
    id: 'vault-payments-playbook',
    title: 'Payments Playbook',
    description: 'A step-by-step walkthrough for building USDC payment flows with Arc Pay and related ecosystem pages.',
    category: 'playbook',
    access: 'gated',
    format: 'MDX',
    size: '6 MB',
    url: '/value',
    tags: ['payments', 'ux', 'usdc'],
    unlockedBy: ['0xvault001'],
    accessCount: 126,
    featured: true,
    createdAt: Date.now() - 86_400_000 * 5,
  },
  {
    id: 'vault-creator-templates',
    title: 'Creator Offer Templates',
    description: 'Landing copy, offer cards, and pricing examples that help creators launch quickly.',
    category: 'template',
    access: 'gated',
    format: 'FIG',
    size: '18 MB',
    url: '/jobs',
    tags: ['creator', 'pricing', 'templates'],
    unlockedBy: ['0xvault004', '0xvault009'],
    accessCount: 91,
    featured: false,
    createdAt: Date.now() - 86_400_000 * 8,
  },
  {
    id: 'vault-node-checklist',
    title: 'Node Ops Checklist',
    description: 'A practical runbook for setting up, monitoring, and maintaining Arc nodes in production.',
    category: 'ops',
    access: 'gated',
    format: 'TXT',
    size: '2 MB',
    url: '/node',
    tags: ['node', 'infra', 'checklist'],
    unlockedBy: [],
    accessCount: 74,
    featured: false,
    createdAt: Date.now() - 86_400_000 * 1,
  },
  {
    id: 'vault-education-pack',
    title: 'Learning Path Pack',
    description: 'A curated set of tutorials, lesson outlines, and onboarding notes for new Arc contributors.',
    category: 'education',
    access: 'open',
    format: 'PDF',
    size: '9 MB',
    url: '/quests',
    tags: ['learning', 'onboarding', 'tutorials'],
    unlockedBy: [],
    accessCount: 213,
    featured: false,
    createdAt: Date.now() - 86_400_000 * 11,
  },
  {
    id: 'vault-signal-schema',
    title: 'Signals Data Schema',
    description: 'Reference fields and payload structure for the internal signal board and analytics views.',
    category: 'asset',
    access: 'private',
    format: 'JSON',
    size: '1 MB',
    url: '/roadmap',
    tags: ['schema', 'data', 'signals'],
    unlockedBy: ['0xvault007'],
    accessCount: 45,
    featured: false,
    createdAt: Date.now() - 86_400_000 * 14,
  },
];

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_VAULT_ITEMS,
      addVaultItem: (item) => {
        const newItem: VaultItem = {
          ...item,
          id: `vault-${Math.random().toString(36).slice(2, 10)}`,
          unlockedBy: [],
          accessCount: 0,
          featured: false,
          createdAt: Date.now(),
        };
        set((state) => ({ items: [newItem, ...state.items] }));
      },
      toggleUnlock: (itemId, address) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            if (item.access === 'open') return item;
            const unlocked = item.unlockedBy.includes(address);
            return {
              ...item,
              unlockedBy: unlocked
                ? item.unlockedBy.filter((entry) => entry !== address)
                : [...item.unlockedBy, address],
            };
          }),
        })),
      trackAccess: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, accessCount: item.accessCount + 1 } : item,
          ),
        })),
      getVaultItemById: (itemId) => get().items.find((item) => item.id === itemId),
    }),
    {
      name: 'arclanding:vault',
    },
  ),
);
