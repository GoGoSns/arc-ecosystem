import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuestCategory = 'starter' | 'payment' | 'creator' | 'play' | 'community' | 'builder' | 'special';
export type QuestStatus = 'available' | 'in-progress' | 'completed';
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  badgeId?: string;
  requirement: string;
  externalUrl?: string;
}

export interface UserProgress {
  address: string;
  totalXp: number;
  level: number;
  completedQuests: string[];
  earnedBadges: string[];
  joinedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const QUESTS: Quest[] = [
  // STARTER
  { id: 'q1', title: 'Welcome to Arc', description: 'Connect your wallet for the first time', category: 'starter', difficulty: 'easy', xpReward: 10, requirement: 'Connect wallet on arc-landing', badgeId: 'b1' },
  { id: 'q2', title: 'Explorer', description: 'Visit all 4 apps in the ecosystem', category: 'starter', difficulty: 'easy', xpReward: 20, requirement: 'Open arc-pay, arc-creator, arc-play, arc-landing' },
  
  // PAYMENT (Arc Pay)
  { id: 'q3', title: 'First Payment', description: 'Send your first USDC payment via QR', category: 'payment', difficulty: 'easy', xpReward: 30, externalUrl: 'http://localhost:3000/qr', requirement: 'Complete a QR payment' },
  { id: 'q4', title: 'Split Master', description: 'Use Split the Bill feature', category: 'payment', difficulty: 'easy', xpReward: 25, externalUrl: 'http://localhost:3000/split', requirement: 'Split a bill' },
  { id: 'q5', title: 'Invoice Pro', description: 'Create your first invoice', category: 'payment', difficulty: 'medium', xpReward: 40, externalUrl: 'http://localhost:3000/invoice', requirement: 'Generate invoice' },
  { id: 'q6', title: 'Mass Payer', description: 'Run a batch payroll', category: 'payment', difficulty: 'medium', xpReward: 50, externalUrl: 'http://localhost:3000/payroll', requirement: 'Complete batch payment' },
  { id: 'q7', title: 'Escrow Expert', description: 'Create an escrow agreement', category: 'payment', difficulty: 'hard', xpReward: 70, externalUrl: 'http://localhost:3000/escrow', requirement: 'Set up escrow' },
  
  // CREATOR (Arc Creator)
  { id: 'q8', title: 'Tip Receiver', description: 'Set up your Tip Jar', category: 'creator', difficulty: 'easy', xpReward: 25, externalUrl: 'http://localhost:3001/tip', requirement: 'Create tip jar' },
  { id: 'q9', title: 'Subscriber', description: 'Set up a subscription plan', category: 'creator', difficulty: 'medium', xpReward: 40, externalUrl: 'http://localhost:3001/subscription', requirement: 'Create subscription' },
  { id: 'q10', title: 'Bounty Hunter', description: 'Post or claim a bounty', category: 'creator', difficulty: 'medium', xpReward: 45, externalUrl: 'http://localhost:3001/bounty', requirement: 'Use bounty board' },
  { id: 'q11', title: 'Freelancer', description: 'List a service on Marketplace', category: 'creator', difficulty: 'medium', xpReward: 50, externalUrl: 'http://localhost:3001/marketplace', requirement: 'Create service listing' },
  
  // PLAY (Arc Play)
  { id: 'q12', title: 'Player', description: 'Play any mini-game', category: 'play', difficulty: 'easy', xpReward: 20, externalUrl: 'http://localhost:3002/games', requirement: 'Play one game' },
  { id: 'q13', title: 'High Score', description: 'Get a score on the leaderboard', category: 'play', difficulty: 'medium', xpReward: 40, externalUrl: 'http://localhost:3002/games', requirement: 'Top 10 game score' },
  { id: 'q14', title: 'Predictor', description: 'Place a prediction', category: 'play', difficulty: 'medium', xpReward: 35, externalUrl: 'http://localhost:3002/prediction', requirement: 'Bet on prediction market' },
  { id: 'q15', title: 'Raffle Winner', description: 'Enter an NFT raffle', category: 'play', difficulty: 'easy', xpReward: 30, externalUrl: 'http://localhost:3002/raffle', requirement: 'Enter raffle' },
  { id: 'q16', title: 'Launcher', description: 'Launch your own token', category: 'play', difficulty: 'hard', xpReward: 80, externalUrl: 'http://localhost:3002/launchpad', requirement: 'Use token launchpad' },
  
  // COMMUNITY
  { id: 'q17', title: 'First Post', description: 'Create a forum thread', category: 'community', difficulty: 'easy', xpReward: 15, externalUrl: '/forum/new', requirement: 'Post in forum' },
  { id: 'q18', title: 'Conversationalist', description: 'Comment on 5 forum threads', category: 'community', difficulty: 'medium', xpReward: 35, externalUrl: '/forum', requirement: 'Post 5 comments' },
  { id: 'q19', title: 'Feedback Provider', description: 'Submit feedback', category: 'community', difficulty: 'easy', xpReward: 20, externalUrl: '/feedback/new', requirement: 'Submit feedback' },
  { id: 'q20', title: 'Discord Active', description: 'Join the community discussion', category: 'community', difficulty: 'easy', xpReward: 15, externalUrl: '/forum', requirement: 'Daily forum visit' },
  
  // BUILDER
  { id: 'q21', title: 'Node Operator', description: 'Register as a node operator', category: 'builder', difficulty: 'hard', xpReward: 100, externalUrl: '/node', requirement: 'Register node', badgeId: 'b2' },
  { id: 'q22', title: 'Validator Applicant', description: 'Apply for mainnet validator', category: 'builder', difficulty: 'hard', xpReward: 80, externalUrl: '/node/validator', requirement: 'Submit validator application' },
  { id: 'q23', title: 'Bug Hunter', description: 'Report a bug', category: 'builder', difficulty: 'medium', xpReward: 60, externalUrl: '/node/bounty', requirement: 'Submit bug report', badgeId: 'b3' },
  { id: 'q24', title: 'RPC Contributor', description: 'Add an RPC provider', category: 'builder', difficulty: 'medium', xpReward: 50, externalUrl: '/node/rpc', requirement: 'Add RPC' },
  
  // SPECIAL
  { id: 'q25', title: 'Wallet Value Lookup', description: 'Check your Arc score', category: 'special', difficulty: 'easy', xpReward: 25, externalUrl: '/value/score', requirement: 'Calculate wallet score' },
  { id: 'q26', title: 'Daily Login', description: 'Login 7 days in a row', category: 'special', difficulty: 'medium', xpReward: 50, requirement: '7 day streak' },
  { id: 'q27', title: 'Diamond Tier', description: 'Reach Diamond tier on wallet score', category: 'special', difficulty: 'legendary', xpReward: 200, requirement: '801+ score', badgeId: 'b4' },
];

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Welcome', description: 'You joined Arc Ecosystem', icon: '👋', rarity: 'common' },
  { id: 'b2', name: 'Node Operator', description: 'Running an Arc node', icon: '🌐', rarity: 'rare' },
  { id: 'b3', name: 'Bug Hunter', description: 'Found a bug', icon: '🐛', rarity: 'rare' },
  { id: 'b4', name: 'Diamond', description: 'Reached Diamond tier', icon: '💎', rarity: 'legendary' },
  { id: 'b5', name: 'Maxed Level', description: 'Reached level 50', icon: '🏆', rarity: 'legendary' },
];

export const getLevelFromXp = (xp: number): number => {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  return Math.min(level, 50);
};

export const getXpForLevel = (level: number): number => {
  return 50 * Math.pow(level - 1, 2);
};

export const getXpToNextLevel = (currentXp: number): number => {
  const currentLevel = getLevelFromXp(currentXp);
  if (currentLevel >= 50) return 0;
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
};

export const getProgressPercent = (currentXp: number): number => {
  const currentLevel = getLevelFromXp(currentXp);
  if (currentLevel >= 50) return 100;
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const progressXp = currentXp - currentLevelXp;
  const totalXpNeeded = nextLevelXp - currentLevelXp;
  return Math.floor((progressXp / totalXpNeeded) * 100);
};

interface QuestStore {
  userProgress: Record<string, UserProgress>;
  completeQuest: (address: string, questId: string) => void;
  getUserProgress: (address: string) => UserProgress;
}

const DEFAULT_PROGRESS = (address: string): UserProgress => ({
  address,
  totalXp: 0,
  level: 1,
  completedQuests: [],
  earnedBadges: [],
  joinedAt: Date.now(),
});

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      userProgress: {},
      getUserProgress: (address: string) => {
        const progress = get().userProgress[address.toLowerCase()];
        return progress || DEFAULT_PROGRESS(address);
      },
      completeQuest: (address: string, questId: string) => {
        const addr = address.toLowerCase();
        const currentProgress = get().getUserProgress(addr);
        
        if (currentProgress.completedQuests.includes(questId)) return;

        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) return;

        const newCompletedQuests = [...currentProgress.completedQuests, questId];
        const newTotalXp = currentProgress.totalXp + quest.xpReward;
        const newLevel = getLevelFromXp(newTotalXp);
        
        const newEarnedBadges = [...currentProgress.earnedBadges];
        if (quest.badgeId && !newEarnedBadges.includes(quest.badgeId)) {
          newEarnedBadges.push(quest.badgeId);
        }

        // Special check for Maxed Level badge
        if (newLevel === 50 && !newEarnedBadges.includes('b5')) {
          newEarnedBadges.push('b5');
        }

        set((state) => ({
          userProgress: {
            ...state.userProgress,
            [addr]: {
              ...currentProgress,
              totalXp: newTotalXp,
              level: newLevel,
              completedQuests: newCompletedQuests,
              earnedBadges: newEarnedBadges,
            }
          }
        }));
      },
    }),
    {
      name: 'arclanding:quests',
    }
  )
);
