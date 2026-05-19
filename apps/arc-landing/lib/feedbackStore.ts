import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAddress } from 'viem';

export type FeedbackCategory = 'bug' | 'feature' | 'idea' | 'general';
export type FeedbackStatus = 'open' | 'reviewing' | 'planned' | 'in-progress' | 'completed' | 'declined';

export interface Comment {
  id: string;
  feedbackId: string;
  authorAddress: string;
  authorName?: string;
  content: string;
  createdAt: number;
}

export interface Feedback {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  authorAddress: string;
  authorName?: string;
  votes: string[]; // Array of wallet addresses that voted
  comments: Comment[];
  adminResponse?: string;
  createdAt: number;
  updatedAt: number;
}

export const ADMIN_ADDRESS = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

interface FeedbackStore {
  feedbacks: Feedback[];
  addFeedback: (feedback: Feedback) => void;
  toggleVote: (feedbackId: string, address: string) => void;
  addComment: (feedbackId: string, comment: Comment) => void;
  updateStatus: (feedbackId: string, status: FeedbackStatus, adminResponse?: string) => void;
  deleteFeedback: (feedbackId: string) => void;
}

export const useFeedbackStore = create<FeedbackStore>()(
  persist(
    (set) => ({
      feedbacks: [],
      addFeedback: (feedback) =>
        set((state) => ({ feedbacks: [feedback, ...state.feedbacks] })),
      toggleVote: (feedbackId, address) =>
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === feedbackId
              ? {
                  ...f,
                  votes: f.votes.includes(address)
                    ? f.votes.filter((v) => v !== address)
                    : [...f.votes, address],
                  updatedAt: Date.now(),
                }
              : f
          ),
        })),
      addComment: (feedbackId, comment) =>
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === feedbackId
              ? { ...f, comments: [...f.comments, comment], updatedAt: Date.now() }
              : f
          ),
        })),
      updateStatus: (feedbackId, status, adminResponse) =>
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === feedbackId
              ? { ...f, status, adminResponse, updatedAt: Date.now() }
              : f
          ),
        })),
      deleteFeedback: (feedbackId) =>
        set((state) => ({
          feedbacks: state.feedbacks.filter((f) => f.id !== feedbackId),
        })),
    }),
    { name: 'arclanding:feedback' }
  )
);

export const isAdmin = (address?: string): boolean => {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
};

export const getFeedbackStats = (feedbacks: Feedback[]) => ({
  total: feedbacks.length,
  open: feedbacks.filter((f) => f.status === 'open' || f.status === 'reviewing').length,
  planned: feedbacks.filter((f) => f.status === 'planned' || f.status === 'in-progress').length,
  completed: feedbacks.filter((f) => f.status === 'completed').length,
});
