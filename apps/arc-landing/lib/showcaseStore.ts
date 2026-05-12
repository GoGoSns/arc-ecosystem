import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShowcaseCategory =
  | 'product'
  | 'community'
  | 'launch'
  | 'design'
  | 'ops'
  | 'education';

export interface ShowcaseItem {
  id: string;
  title: string;
  creator: string;
  description: string;
  category: ShowcaseCategory;
  url: string;
  tags: string[];
  likes: string[];
  featured: boolean;
  createdAt: number;
}

interface ShowcaseStore {
  items: ShowcaseItem[];
  addShowcase: (item: Omit<ShowcaseItem, 'id' | 'likes' | 'featured' | 'createdAt'>) => void;
  toggleLike: (itemId: string, address: string) => void;
  toggleFeatured: (itemId: string) => void;
  getShowcaseById: (itemId: string) => ShowcaseItem | undefined;
}

const INITIAL_SHOWCASES: ShowcaseItem[] = [
  {
    id: 'showcase-pay-flow',
    title: 'Arc Pay Flow Gallery',
    creator: 'Studio Arc',
    description: 'A visual recap of the payment journeys that make USDC transfers feel instant, clear, and understandable.',
    category: 'product',
    url: '/value',
    tags: ['payments', 'ux', 'usdc'],
    likes: ['0xshowcase001', '0xshowcase004', '0xshowcase008'],
    featured: true,
    createdAt: Date.now() - 86_400_000 * 4,
  },
  {
    id: 'showcase-forum-spotlight',
    title: 'Community Thread Spotlight',
    creator: 'Arc Community',
    description: 'A curated snapshot of the strongest conversations, ideas, and feedback shared across the forum.',
    category: 'community',
    url: '/forum',
    tags: ['forum', 'community', 'insights'],
    likes: ['0xshowcase002', '0xshowcase006'],
    featured: true,
    createdAt: Date.now() - 86_400_000 * 2,
  },
  {
    id: 'showcase-roadmap-drop',
    title: 'Launch Week Poster',
    creator: 'GoGo Design',
    description: 'A launch visual built around the roadmap theme, showing how the ecosystem phases evolve over time.',
    category: 'launch',
    url: '/roadmap',
    tags: ['launch', 'brand', 'roadmap'],
    likes: ['0xshowcase003'],
    featured: false,
    createdAt: Date.now() - 86_400_000 * 6,
  },
  {
    id: 'showcase-node-ops',
    title: 'Node Operator Stories',
    creator: 'Infra Guild',
    description: 'Operator snapshots that document how teams set up Arc nodes, dashboards, and monitoring flows.',
    category: 'ops',
    url: '/node',
    tags: ['node', 'infra', 'ops'],
    likes: ['0xshowcase005', '0xshowcase007', '0xshowcase009', '0xshowcase011'],
    featured: false,
    createdAt: Date.now() - 86_400_000 * 1,
  },
  {
    id: 'showcase-quest-wall',
    title: 'Quest Badge Shelf',
    creator: 'Arc Labs',
    description: 'A badge wall that maps user progress into a gallery of achievements, streaks, and completion moments.',
    category: 'education',
    url: '/quests',
    tags: ['quests', 'badges', 'progress'],
    likes: ['0xshowcase010', '0xshowcase012'],
    featured: false,
    createdAt: Date.now() - 86_400_000 * 9,
  },
  {
    id: 'showcase-build-notes',
    title: 'Product Notes Archive',
    creator: 'Arc Docs',
    description: 'A documentation-inspired showcase for release notes, design specs, and implementation snapshots.',
    category: 'design',
    url: '/jobs',
    tags: ['docs', 'release', 'systems'],
    likes: ['0xshowcase013'],
    featured: false,
    createdAt: Date.now() - 86_400_000 * 12,
  },
];

export const useShowcaseStore = create<ShowcaseStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_SHOWCASES,
      addShowcase: (item) => {
        const newItem: ShowcaseItem = {
          ...item,
          id: `showcase-${Math.random().toString(36).slice(2, 10)}`,
          likes: [],
          featured: false,
          createdAt: Date.now(),
        };
        set((state) => ({ items: [newItem, ...state.items] }));
      },
      toggleLike: (itemId, address) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            const liked = item.likes.includes(address);
            return {
              ...item,
              likes: liked ? item.likes.filter((like) => like !== address) : [...item.likes, address],
            };
          }),
        })),
      toggleFeatured: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, featured: !item.featured } : item,
          ),
        })),
      getShowcaseById: (itemId) => get().items.find((item) => item.id === itemId),
    }),
    {
      name: 'arclanding:showcase',
    },
  ),
);
