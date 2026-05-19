import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAddress } from 'viem';

export type ForumCategory = 'general' | 'bugs' | 'features' | 'node' | 'dev' | 'showcase' | 'help';

export interface ForumComment {
  id: string;
  threadId: string;
  parentCommentId?: string;
  authorAddress: string;
  authorName?: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  createdAt: number;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  authorAddress: string;
  authorName?: string;
  upvotes: string[];
  downvotes: string[];
  comments: ForumComment[];
  pinned: boolean;
  locked: boolean;
  views: number;
  createdAt: number;
  updatedAt: number;
}

export const FORUM_ADMIN = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

export const isForumAdmin = (address?: string): boolean =>
  !!address && address.toLowerCase() === FORUM_ADMIN.toLowerCase();

export const getScore = (upvotes: string[], downvotes: string[]): number =>
  upvotes.length - downvotes.length;

export const getHotThreads = (threads: Thread[]): Thread[] => {
  const now = Date.now();
  return [...threads].sort((a, b) => {
    const ageA = Math.max(1, (now - a.createdAt) / 3_600_000);
    const ageB = Math.max(1, (now - b.createdAt) / 3_600_000);
    const hotA = (a.upvotes.length - a.downvotes.length + 1) / Math.pow(ageA + 2, 1.5);
    const hotB = (b.upvotes.length - b.downvotes.length + 1) / Math.pow(ageB + 2, 1.5);
    return hotB - hotA;
  });
};

export const getNewThreads = (threads: Thread[]): Thread[] =>
  [...threads].sort((a, b) => b.createdAt - a.createdAt);

export const getTopThreads = (threads: Thread[]): Thread[] =>
  [...threads].sort((a, b) => getScore(b.upvotes, b.downvotes) - getScore(a.upvotes, a.downvotes));

export const getThreadsByCategory = (threads: Thread[], category: ForumCategory): Thread[] =>
  threads.filter((t) => t.category === category);

interface ForumStore {
  threads: Thread[];
  createThread: (thread: Thread) => void;
  toggleVote: (threadId: string, address: string, type: 'up' | 'down') => void;
  toggleCommentVote: (threadId: string, commentId: string, address: string, type: 'up' | 'down') => void;
  addComment: (threadId: string, comment: ForumComment) => void;
  incrementViews: (threadId: string) => void;
  pinThread: (threadId: string) => void;
  lockThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
}

function applyVoteToggle(arr: string[], other: string[], address: string, voting: boolean): [string[], string[]] {
  if (voting) {
    if (arr.includes(address)) return [arr.filter((a) => a !== address), other];
    return [[...arr, address], other.filter((a) => a !== address)];
  }
  return [arr, other];
}

export const useForumStore = create<ForumStore>()(
  persist(
    (set) => ({
      threads: [],

      createThread: (thread) =>
        set((state) => ({ threads: [thread, ...state.threads] })),

      toggleVote: (threadId, address, type) =>
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.id !== threadId) return t;
            const now = Date.now();
            if (type === 'up') {
              const [upvotes, downvotes] = applyVoteToggle(t.upvotes, t.downvotes, address, true);
              return { ...t, upvotes, downvotes, updatedAt: now };
            }
            const [downvotes, upvotes] = applyVoteToggle(t.downvotes, t.upvotes, address, true);
            return { ...t, upvotes, downvotes, updatedAt: now };
          }),
        })),

      toggleCommentVote: (threadId, commentId, address, type) =>
        set((state) => ({
          threads: state.threads.map((t) => {
            if (t.id !== threadId) return t;
            return {
              ...t,
              comments: t.comments.map((c) => {
                if (c.id !== commentId) return c;
                if (type === 'up') {
                  const [upvotes, downvotes] = applyVoteToggle(c.upvotes, c.downvotes, address, true);
                  return { ...c, upvotes, downvotes };
                }
                const [downvotes, upvotes] = applyVoteToggle(c.downvotes, c.upvotes, address, true);
                return { ...c, upvotes, downvotes };
              }),
            };
          }),
        })),

      addComment: (threadId, comment) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, comments: [...t.comments, comment], updatedAt: Date.now() }
              : t
          ),
        })),

      incrementViews: (threadId) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, views: t.views + 1 } : t
          ),
        })),

      pinThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, pinned: !t.pinned, updatedAt: Date.now() } : t
          ),
        })),

      lockThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, locked: !t.locked, updatedAt: Date.now() } : t
          ),
        })),

      deleteThread: (threadId) =>
        set((state) => ({
          threads: state.threads.filter((t) => t.id !== threadId),
        })),
    }),
    { name: 'arclanding:forum' }
  )
);
