import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RaceCategory = 'transactions' | 'volume' | 'forum-posts' | 'quests' | 'referrals';
export type RaceStatus = 'upcoming' | 'active' | 'ended';

export interface RaceParticipant {
  address: string;
  name?: string;
  score: number;
  joinedAt: number;
}

export interface Race {
  id: string;
  title: string;
  description: string;
  category: RaceCategory;
  status: RaceStatus;
  prizePool: number;  // USDC
  prizes: number[];   // [1st, 2nd, 3rd, 4th, 5th] in USDC
  startDate: number;
  endDate: number;
  participants: RaceParticipant[];
}

export const ADMIN_ADDRESS = '0xB87B774a5b3D77E13a89C68F62810D5a23404365';

const MOCK_RACES: Race[] = [
  {
    id: 'race-active-1',
    title: 'January Champion',
    description: 'The user with the most transactions on Arc Network this month wins the grand prize.',
    category: 'transactions',
    status: 'active',
    prizePool: 500,
    prizes: [250, 125, 75, 30, 20],
    startDate: Date.now() - 86400000 * 25,
    endDate: Date.now() + 86400000 * 5,
    participants: [
      { address: '0x1234...5678', name: 'Alpha', score: 150, joinedAt: Date.now() - 86400000 * 24 },
      { address: '0xabcd...efgh', name: 'Beta', score: 120, joinedAt: Date.now() - 86400000 * 20 },
      { address: '0x9876...5432', score: 115, joinedAt: Date.now() - 86400000 * 15 },
      { address: '0x5555...4444', name: 'Gamma', score: 95, joinedAt: Date.now() - 86400000 * 10 },
      { address: '0x1111...2222', score: 80, joinedAt: Date.now() - 86400000 * 5 },
      { address: '0x3333...7777', name: 'Delta', score: 75, joinedAt: Date.now() - 86400000 * 2 },
    ]
  },
  {
    id: 'race-upcoming-1',
    title: 'Forum Master',
    description: 'Engage with the community! Most forum posts wins the prize pool.',
    category: 'forum-posts',
    status: 'upcoming',
    prizePool: 200,
    prizes: [100, 50, 25, 15, 10],
    startDate: Date.now() + 86400000 * 7,
    endDate: Date.now() + 86400000 * 14,
    participants: []
  },
  {
    id: 'race-past-1',
    title: 'Holiday Volume Sprint',
    description: 'Highest trading volume during the holiday season.',
    category: 'volume',
    status: 'ended',
    prizePool: 1000,
    prizes: [500, 250, 150, 60, 40],
    startDate: Date.now() - 86400000 * 45,
    endDate: Date.now() - 86400000 * 15,
    participants: [
      { address: '0xwinner...1', name: 'WhaleMain', score: 50000, joinedAt: Date.now() - 86400000 * 44 },
      { address: '0xrunner...up', name: 'TraderJoe', score: 42000, joinedAt: Date.now() - 86400000 * 40 },
      { address: '0xthird...place', score: 35000, joinedAt: Date.now() - 86400000 * 35 },
    ]
  },
  {
    id: 'race-past-2',
    title: 'Quest Marathon',
    description: 'Complete as many quests as possible in one week.',
    category: 'quests',
    status: 'ended',
    prizePool: 300,
    prizes: [150, 75, 40, 25, 10],
    startDate: Date.now() - 86400000 * 60,
    endDate: Date.now() - 86400000 * 53,
    participants: [
      { address: '0xq1...123', name: 'QuestHero', score: 25, joinedAt: Date.now() - 86400000 * 59 },
      { address: '0xq2...456', name: 'Explorer', score: 22, joinedAt: Date.now() - 86400000 * 58 },
    ]
  },
  {
    id: 'race-past-3',
    title: 'Referral Rush',
    description: 'Bring your friends to Arc! Most referrals wins.',
    category: 'referrals',
    status: 'ended',
    prizePool: 400,
    prizes: [200, 100, 50, 30, 20],
    startDate: Date.now() - 86400000 * 90,
    endDate: Date.now() - 86400000 * 83,
    participants: [
      { address: '0xr1...abc', name: 'Networker', score: 45, joinedAt: Date.now() - 86400000 * 89 },
      { address: '0xr2...def', score: 38, joinedAt: Date.now() - 86400000 * 88 },
    ]
  }
];

interface RaceStore {
  races: Race[];
  joinRace: (raceId: string, address: string, name?: string) => void;
  updateScore: (raceId: string, address: string, score: number) => void;
  createRace: (race: Race) => void;
  endRace: (raceId: string) => void;
}

export const useRaceStore = create<RaceStore>()(
  persist(
    (set) => ({
      races: MOCK_RACES,
      joinRace: (raceId, address, name) => set((state) => ({
        races: state.races.map((race) => {
          if (race.id === raceId && race.status === 'active') {
            if (race.participants.some(p => p.address.toLowerCase() === address.toLowerCase())) return race;
            return {
              ...race,
              participants: [...race.participants, {
                address,
                name,
                score: 0,
                joinedAt: Date.now()
              }]
            };
          }
          return race;
        })
      })),
      updateScore: (raceId, address, score) => set((state) => ({
        races: state.races.map((race) => {
          if (race.id === raceId && race.status === 'active') {
            return {
              ...race,
              participants: race.participants.map((p) => 
                p.address.toLowerCase() === address.toLowerCase() ? { ...p, score } : p
              )
            };
          }
          return race;
        })
      })),
      createRace: (race) => set((state) => ({
        races: [race, ...state.races]
      })),
      endRace: (raceId) => set((state) => ({
        races: state.races.map((race) => 
          race.id === raceId ? { ...race, status: 'ended' } : race
        )
      })),
    }),
    {
      name: 'arclanding:race',
    }
  )
);
