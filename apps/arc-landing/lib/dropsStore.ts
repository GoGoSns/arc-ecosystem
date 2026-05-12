import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DropStatus = 'upcoming' | 'active' | 'ended';
export type EntryRequirement = 'twitter-follow' | 'twitter-retweet' | 'forum-post' | 'wallet-connect' | 'discord-join';
export type PrizeType = 'usdc' | 'nft' | 'token';

export interface DropEntry {
  address: string;
  name?: string;
  enteredAt: number;
  completed: EntryRequirement[];
}

export interface Drop {
  id: string;
  title: string;
  description: string;
  status: DropStatus;
  prizeType: PrizeType;
  prizeAmount: number;     // USDC amount or NFT count
  prizeImage?: string;
  winnerCount: number;
  requirements: EntryRequirement[];
  twitterUrl?: string;
  discordUrl?: string;
  startDate: number;
  endDate: number;
  entries: DropEntry[];
  winners: string[];  // addresses
  createdAt: number;
}

export const ADMIN_ADDRESS = '0xB87B774a5b3D77E13a89C68F62810D5a23404365';

interface DropsStore {
  drops: Drop[];
  addEntry: (dropId: string, entry: DropEntry) => void;
  selectWinners: (dropId: string) => void;
  updateDropStatus: (dropId: string, status: DropStatus) => void;
}

const INITIAL_DROPS: Drop[] = [
  {
    id: 'diamond-drop',
    title: 'Diamond Drop',
    description: 'The ultimate USDC giveaway for the Arc community. Join now for a chance to win a share of $1,000 USDC. Ten lucky winners will be selected at random.',
    status: 'active',
    prizeType: 'usdc',
    prizeAmount: 1000,
    winnerCount: 10,
    requirements: ['wallet-connect', 'twitter-follow', 'twitter-retweet'],
    twitterUrl: 'https://twitter.com/arcnetwork_',
    startDate: Date.now() - 86400000,
    endDate: Date.now() + 86400000 * 3,
    entries: [],
    winners: [],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'og-nft-drop',
    title: 'OG NFT Drop',
    description: 'Exclusive Arc OG NFTs for our most engaged users. These 5 unique digital assets grant special privileges within the ecosystem.',
    status: 'active',
    prizeType: 'nft',
    prizeAmount: 5,
    winnerCount: 5,
    requirements: ['wallet-connect', 'discord-join', 'forum-post'],
    discordUrl: 'https://discord.gg/arcnetwork',
    startDate: Date.now() - 86400000 * 2,
    endDate: Date.now() + 86400000 * 7,
    entries: [],
    winners: [],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'mainnet-launch',
    title: 'Mainnet Launch Drop',
    description: 'Celebrating the upcoming Arc Mainnet launch with a massive $5,000 USDC prize pool. 50 winners will be selected.',
    status: 'upcoming',
    prizeType: 'usdc',
    prizeAmount: 5000,
    winnerCount: 50,
    requirements: ['wallet-connect', 'twitter-follow', 'discord-join'],
    twitterUrl: 'https://twitter.com/arcnetwork_',
    discordUrl: 'https://discord.gg/arcnetwork',
    startDate: Date.now() + 86400000 * 14,
    endDate: Date.now() + 86400000 * 21,
    entries: [],
    winners: [],
    createdAt: Date.now(),
  },
  {
    id: 'genesis-drop',
    title: 'Genesis Drop',
    description: 'Our first ever ecosystem drop. A retrospective giveaway for early adopters.',
    status: 'ended',
    prizeType: 'usdc',
    prizeAmount: 500,
    winnerCount: 5,
    requirements: ['wallet-connect'],
    startDate: Date.now() - 86400000 * 30,
    endDate: Date.now() - 86400000 * 25,
    entries: [
      { address: '0x123...abc', enteredAt: Date.now() - 86400000 * 28, completed: ['wallet-connect'] },
      { address: '0x456...def', enteredAt: Date.now() - 86400000 * 27, completed: ['wallet-connect'] },
      { address: '0x789...ghi', enteredAt: Date.now() - 86400000 * 26, completed: ['wallet-connect'] },
    ],
    winners: ['0x123...abc', '0x456...def', '0x789...ghi', '0xabc...123', '0xdef...456'],
    createdAt: Date.now() - 86400000 * 31,
  }
];

export const useDropsStore = create<DropsStore>()(
  persist(
    (set) => ({
      drops: INITIAL_DROPS,
      addEntry: (dropId, entry) => {
        set((state) => ({
          drops: state.drops.map((drop) =>
            drop.id === dropId
              ? { ...drop, entries: [entry, ...drop.entries] }
              : drop
          ),
        }));
      },
      selectWinners: (dropId) => {
        set((state) => ({
          drops: state.drops.map((drop) => {
            if (drop.id === dropId && drop.entries.length > 0) {
              const shuffled = [...drop.entries].sort(() => 0.5 - Math.random());
              const winners = shuffled.slice(0, drop.winnerCount).map((e) => e.address);
              return { ...drop, winners, status: 'ended' };
            }
            return drop;
          }),
        }));
      },
      updateDropStatus: (dropId, status) => {
        set((state) => ({
          drops: state.drops.map((drop) =>
            drop.id === dropId ? { ...drop, status } : drop
          ),
        }));
      },
    }),
    {
      name: 'arclanding:drops',
    }
  )
);
