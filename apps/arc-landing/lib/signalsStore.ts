import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SignalCategory =
  | 'market'
  | 'community'
  | 'product'
  | 'launch'
  | 'security'
  | 'growth';

export type SignalBias = 'bullish' | 'bearish' | 'neutral';
export type SignalTimeframe = 'now' | '24h' | '7d' | '30d';

export interface SignalItem {
  id: string;
  title: string;
  summary: string;
  category: SignalCategory;
  bias: SignalBias;
  confidence: number;
  source: string;
  timeframe: SignalTimeframe;
  tags: string[];
  boostedBy: string[];
  bookmarkedBy: string[];
  createdAt: number;
}

interface SignalsStore {
  signals: SignalItem[];
  addSignal: (signal: Omit<SignalItem, 'id' | 'boostedBy' | 'bookmarkedBy' | 'createdAt'>) => void;
  toggleBoost: (signalId: string, address: string) => void;
  toggleBookmark: (signalId: string, address: string) => void;
  getSignalById: (signalId: string) => SignalItem | undefined;
}

const INITIAL_SIGNALS: SignalItem[] = [
  {
    id: 'signal-payments-growth',
    title: 'Arc Pay payment volume is climbing',
    summary: 'Checkout flows and batch transfers are contributing to stronger payment activity across the network.',
    category: 'market',
    bias: 'bullish',
    confidence: 92,
    source: 'Arc Pay analytics',
    timeframe: '24h',
    tags: ['payments', 'volume', 'usdc'],
    boostedBy: ['0xsignal001', '0xsignal004'],
    bookmarkedBy: ['0xsignal002'],
    createdAt: Date.now() - 86_400_000 * 1,
  },
  {
    id: 'signal-forum-activity',
    title: 'Forum engagement is still trending up',
    summary: 'Showcase threads and feedback posts are creating more discussion depth than the previous cycle.',
    category: 'community',
    bias: 'bullish',
    confidence: 86,
    source: 'Community board',
    timeframe: '7d',
    tags: ['forum', 'engagement', 'threads'],
    boostedBy: ['0xsignal005'],
    bookmarkedBy: ['0xsignal006', '0xsignal009'],
    createdAt: Date.now() - 86_400_000 * 3,
  },
  {
    id: 'signal-node-latency',
    title: 'Node latency remains stable under load',
    summary: 'Monitoring data suggests the current infrastructure baseline is holding through burst traffic.',
    category: 'security',
    bias: 'neutral',
    confidence: 74,
    source: 'Node monitor',
    timeframe: 'now',
    tags: ['nodes', 'latency', 'monitoring'],
    boostedBy: [],
    bookmarkedBy: ['0xsignal011'],
    createdAt: Date.now() - 86_400_000 * 5,
  },
  {
    id: 'signal-creator-bounty',
    title: 'Creator bounty submissions are accelerating',
    summary: 'Bounty creation and marketplace listings are both showing stronger activity week over week.',
    category: 'growth',
    bias: 'bullish',
    confidence: 88,
    source: 'Creator dashboard',
    timeframe: '30d',
    tags: ['creator', 'bounties', 'marketplace'],
    boostedBy: ['0xsignal013', '0xsignal014'],
    bookmarkedBy: [],
    createdAt: Date.now() - 86_400_000 * 2,
  },
  {
    id: 'signal-launch-pulse',
    title: 'Launch posts are peaking before releases',
    summary: 'Roadmap visibility and launch planning pages receive more visits ahead of public updates.',
    category: 'launch',
    bias: 'bullish',
    confidence: 79,
    source: 'Roadmap analytics',
    timeframe: '7d',
    tags: ['launch', 'roadmap', 'views'],
    boostedBy: ['0xsignal010'],
    bookmarkedBy: ['0xsignal003'],
    createdAt: Date.now() - 86_400_000 * 4,
  },
  {
    id: 'signal-product-feedback',
    title: 'Wallet score UX still needs refinement',
    summary: 'Search and submit flows look healthy, but a few friction points remain in the scoring workflow.',
    category: 'product',
    bias: 'bearish',
    confidence: 67,
    source: 'Value feedback',
    timeframe: '24h',
    tags: ['ux', 'feedback', 'value'],
    boostedBy: ['0xsignal007'],
    bookmarkedBy: ['0xsignal008'],
    createdAt: Date.now() - 86_400_000 * 6,
  },
];

export const useSignalsStore = create<SignalsStore>()(
  persist(
    (set, get) => ({
      signals: INITIAL_SIGNALS,
      addSignal: (signal) => {
        const newSignal: SignalItem = {
          ...signal,
          id: `signal-${Math.random().toString(36).slice(2, 10)}`,
          boostedBy: [],
          bookmarkedBy: [],
          createdAt: Date.now(),
        };
        set((state) => ({ signals: [newSignal, ...state.signals] }));
      },
      toggleBoost: (signalId, address) =>
        set((state) => ({
          signals: state.signals.map((signal) => {
            if (signal.id !== signalId) return signal;
            const boosted = signal.boostedBy.includes(address);
            return {
              ...signal,
              boostedBy: boosted
                ? signal.boostedBy.filter((entry) => entry !== address)
                : [...signal.boostedBy, address],
            };
          }),
        })),
      toggleBookmark: (signalId, address) =>
        set((state) => ({
          signals: state.signals.map((signal) => {
            if (signal.id !== signalId) return signal;
            const bookmarked = signal.bookmarkedBy.includes(address);
            return {
              ...signal,
              bookmarkedBy: bookmarked
                ? signal.bookmarkedBy.filter((entry) => entry !== address)
                : [...signal.bookmarkedBy, address],
            };
          }),
        })),
      getSignalById: (signalId) => get().signals.find((signal) => signal.id === signalId),
    }),
    {
      name: 'arclanding:signals',
    },
  ),
);
