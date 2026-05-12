import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LearnCategory =
  | 'basics'
  | 'payments'
  | 'creator'
  | 'community'
  | 'builder'
  | 'play';

export type LearnLevel = 'intro' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LearnCategory;
  level: LearnLevel;
  xp: number;
  duration: string;
  steps: string[];
  resourceUrl?: string;
  createdAt: number;
}

export interface LearnerProgress {
  address: string;
  completedLessons: string[];
  bookmarkedLessons: string[];
  totalXp: number;
  updatedAt: number;
}

interface LearnStore {
  lessons: Lesson[];
  progressByAddress: Record<string, LearnerProgress>;
  completeLesson: (address: string, lessonId: string) => void;
  toggleBookmark: (address: string, lessonId: string) => void;
  getProgress: (address: string) => LearnerProgress;
}

const DEFAULT_PROGRESS = (address: string): LearnerProgress => ({
  address,
  completedLessons: [],
  bookmarkedLessons: [],
  totalXp: 0,
  updatedAt: Date.now(),
});

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-welcome',
    title: 'Welcome to Arc',
    description: 'Get oriented with the ecosystem layout, the hub navigation, and the stablecoin-first workflow.',
    category: 'basics',
    level: 'intro',
    xp: 10,
    duration: '5 min',
    steps: ['Open the ecosystem home page', 'Review the app switcher', 'Bookmark your next path'],
    resourceUrl: '/',
    createdAt: Date.now() - 86_400_000 * 1,
  },
  {
    id: 'lesson-payments',
    title: 'Send your first payment',
    description: 'Walk through the value tools and understand how payment-related flows tie back to Arc Pay.',
    category: 'payments',
    level: 'intro',
    xp: 20,
    duration: '8 min',
    steps: ['Open the value hub', 'Inspect wallet score inputs', 'Compare on-chain activity'],
    resourceUrl: '/value',
    createdAt: Date.now() - 86_400_000 * 2,
  },
  {
    id: 'lesson-creator',
    title: 'Launch a creator offer',
    description: 'Learn how the creator surface connects bounties, marketplace listings, and monetization ideas.',
    category: 'creator',
    level: 'intermediate',
    xp: 30,
    duration: '10 min',
    steps: ['Review the job and creator pages', 'Draft a clear offer', 'Publish a listing people can act on'],
    resourceUrl: '/jobs',
    createdAt: Date.now() - 86_400_000 * 3,
  },
  {
    id: 'lesson-community',
    title: 'Join the conversation',
    description: 'Practice posting, replying, and using the forum to gather feedback and showcase work.',
    category: 'community',
    level: 'intro',
    xp: 15,
    duration: '6 min',
    steps: ['Browse the forum feed', 'Start a new thread', 'Reply to a post with context'],
    resourceUrl: '/forum/new',
    createdAt: Date.now() - 86_400_000 * 4,
  },
  {
    id: 'lesson-builder',
    title: 'Set up your node',
    description: 'Understand the builder path by reviewing node setup, monitoring, and validator onboarding.',
    category: 'builder',
    level: 'advanced',
    xp: 45,
    duration: '14 min',
    steps: ['Open node setup', 'Review RPC options', 'Inspect monitoring and validator pages'],
    resourceUrl: '/node/setup',
    createdAt: Date.now() - 86_400_000 * 5,
  },
  {
    id: 'lesson-signals',
    title: 'Read the pulse',
    description: 'Use the signals feed to spot strong readings, save important trends, and track confidence.',
    category: 'community',
    level: 'intermediate',
    xp: 25,
    duration: '7 min',
    steps: ['Open the signals board', 'Compare bullish and bearish readings', 'Save a signal worth watching'],
    resourceUrl: '/signals',
    createdAt: Date.now() - 86_400_000 * 6,
  },
  {
    id: 'lesson-quests',
    title: 'Complete a quest chain',
    description: 'Build momentum by finishing quests and seeing how XP, bookmarks, and progress tracking work together.',
    category: 'basics',
    level: 'intermediate',
    xp: 35,
    duration: '9 min',
    steps: ['Open the quest hub', 'Complete a starter quest', 'Check your profile progress'],
    resourceUrl: '/quests',
    createdAt: Date.now() - 86_400_000 * 7,
  },
  {
    id: 'lesson-roadmap',
    title: 'Inspect the roadmap',
    description: 'Learn how roadmap planning ties into feature discovery, release tracking, and ecosystem updates.',
    category: 'builder',
    level: 'advanced',
    xp: 40,
    duration: '12 min',
    steps: ['Review roadmap phases', 'Vote on an item', 'Track a release window'],
    resourceUrl: '/roadmap',
    createdAt: Date.now() - 86_400_000 * 8,
  },
];

export const useLearnStore = create<LearnStore>()(
  persist(
    (set, get) => ({
      lessons: LESSONS,
      progressByAddress: {},
      completeLesson: (address, lessonId) => {
        const addr = address.toLowerCase();
        const lesson = get().lessons.find((item) => item.id === lessonId);
        if (!lesson) return;

        const current = get().getProgress(addr);
        if (current.completedLessons.includes(lessonId)) return;

        const nextProgress: LearnerProgress = {
          ...current,
          address: addr,
          completedLessons: [...current.completedLessons, lessonId],
          totalXp: current.totalXp + lesson.xp,
          updatedAt: Date.now(),
        };

        set((state) => ({
          progressByAddress: {
            ...state.progressByAddress,
            [addr]: nextProgress,
          },
        }));
      },
      toggleBookmark: (address, lessonId) => {
        const addr = address.toLowerCase();
        const current = get().getProgress(addr);
        const bookmarked = current.bookmarkedLessons.includes(lessonId);

        const nextProgress: LearnerProgress = {
          ...current,
          address: addr,
          bookmarkedLessons: bookmarked
            ? current.bookmarkedLessons.filter((item) => item !== lessonId)
            : [...current.bookmarkedLessons, lessonId],
          updatedAt: Date.now(),
        };

        set((state) => ({
          progressByAddress: {
            ...state.progressByAddress,
            [addr]: nextProgress,
          },
        }));
      },
      getProgress: (address) => {
        const addr = address.toLowerCase();
        return get().progressByAddress[addr] ?? DEFAULT_PROGRESS(addr);
      },
    }),
    {
      name: 'arclanding:learn',
    },
  ),
);
