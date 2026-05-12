import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LaunchMode = 'basic' | 'allocation' | 'ido';
export type LaunchStatus = 'upcoming' | 'live' | 'ended' | 'completed' | 'cancelled' | 'refunded';

export interface IDORound {
  name: string;
  pricePerToken: number;
  tokensInRound: number;
  whitelistOnly: boolean;
  whitelist: string[];
  raised: number;
}

export interface Contribution {
  id: string;
  launchId: string;
  buyerAddress: string;
  usdcAmount: number;
  tokenAllocation: number;
  txHash: string;
  timestamp: number;
  finalAllocation?: number;
  refunded?: boolean;
  roundIndex?: number;
  claimed: boolean;
  claimedAt?: number;
}

export interface TokenLaunch {
  id: string;
  
  // Token info
  tokenName: string;
  tokenSymbol: string;
  tokenLogoUrl?: string;
  totalSupply: number;
  description: string;
  websiteUrl?: string;
  twitterUrl?: string;
  
  // Mode
  mode: LaunchMode;
  
  // BASIC mode fields:
  basicPricePerToken?: number;
  basicHardCap?: number;
  basicMinBuy?: number;
  basicMaxBuy?: number;
  basicTokensForSale?: number;
  
  // ALLOCATION mode fields:
  allocTargetRaise?: number;
  allocSoftCap?: number;
  allocTokensForSale?: number;
  allocVestingTGEPercent?: number;
  allocVestingMonths?: number;
  
  // IDO mode fields:
  idoRounds?: IDORound[];
  idoCurrentRound?: number;
  
  // Time
  startsAt: number;
  endsAt: number;
  
  // Creator
  creatorAddress: string;
  
  // State
  status: LaunchStatus;
  
  // Stats
  totalRaised: number;
  totalContributors: number;
  
  // Lifecycle
  createdAt: number;
  endedAt?: number;
  cancelledAt?: number;
  
  contributions: Contribution[];
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LaunchpadStore {
  launches: Record<string, TokenLaunch>;
  
  createLaunch: (launch: Omit<TokenLaunch, 'id' | 'status' | 'totalRaised' | 'totalContributors' | 'createdAt' | 'contributions'>) => TokenLaunch;
  buyTokens: (launchId: string, usdcAmount: number, txHash: string, buyerAddress: string) => Contribution | null;
  closeIdoRound: (launchId: string) => void;
  finalizeAllocation: (launchId: string) => void;
  markClaimed: (launchId: string, contributionId: string) => void;
  cancelLaunch: (launchId: string) => void;
  updateStatus: (launchId: string, status: LaunchStatus) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLaunchesByStatus(launches: Record<string, TokenLaunch>, status: LaunchStatus | 'all'): TokenLaunch[] {
  return Object.values(launches)
    .filter((l) => status === 'all' || l.status === status)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getMyContributions(launches: Record<string, TokenLaunch>, address: string): Array<{ launch: TokenLaunch; contribution: Contribution }> {
  const results: Array<{ launch: TokenLaunch; contribution: Contribution }> = [];
  for (const launch of Object.values(launches)) {
    for (const contribution of launch.contributions) {
      if (contribution.buyerAddress.toLowerCase() === address.toLowerCase()) {
        results.push({ launch, contribution });
      }
    }
  }
  return results.sort((a, b) => b.contribution.timestamp - a.contribution.timestamp);
}

export function getMyLaunches(launches: Record<string, TokenLaunch>, address: string): TokenLaunch[] {
  return Object.values(launches)
    .filter((l) => l.creatorAddress.toLowerCase() === address.toLowerCase())
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getLaunchStats(launch: TokenLaunch) {
  let cap = 0;
  if (launch.mode === 'basic') cap = launch.basicHardCap || 0;
  else if (launch.mode === 'allocation') cap = launch.allocTargetRaise || 0;
  else if (launch.mode === 'ido' && launch.idoRounds) {
    cap = launch.idoRounds.reduce((acc, r) => acc + (r.pricePerToken * r.tokensInRound), 0);
  }
  
  const percentFilled = cap > 0 ? (launch.totalRaised / cap) * 100 : 0;
  return {
    raised: launch.totalRaised,
    contributors: launch.totalContributors,
    percentFilled: Math.min(percentFilled, 100),
    cap
  };
}

export function isWhitelisted(launch: TokenLaunch, roundIndex: number, address: string): boolean {
  if (launch.mode !== 'ido' || !launch.idoRounds) return true;
  const round = launch.idoRounds[roundIndex];
  if (!round || !round.whitelistOnly) return true;
  return round.whitelist.some(a => a.toLowerCase() === address.toLowerCase());
}

export function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useLaunchpadStore = create<LaunchpadStore>()(
  persist(
    (set, get) => ({
      launches: {},

      createLaunch: (data) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newLaunch: TokenLaunch = {
          ...data,
          id,
          status: 'upcoming',
          totalRaised: 0,
          totalContributors: 0,
          createdAt: Date.now(),
          contributions: [],
          idoCurrentRound: data.mode === 'ido' ? 0 : undefined,
        };
        
        // Auto-set status if it should be live
        if (newLaunch.startsAt <= Date.now() && newLaunch.endsAt > Date.now()) {
          newLaunch.status = 'live';
        }

        set((state) => ({
          launches: { ...state.launches, [id]: newLaunch }
        }));
        return newLaunch;
      },

      buyTokens: (launchId, usdcAmount, txHash, buyerAddress) => {
        const launch = get().launches[launchId];
        if (!launch || (launch.status !== 'live' && launch.status !== 'upcoming')) return null;

        // Check time
        const now = Date.now();
        if (now < launch.startsAt || now > launch.endsAt) return null;

        let tokenAllocation = 0;
        let roundIndex: number | undefined;

        if (launch.mode === 'basic') {
          if (launch.basicMinBuy && usdcAmount < launch.basicMinBuy) return null;
          if (launch.basicMaxBuy && usdcAmount > launch.basicMaxBuy) return null;
          if (launch.basicPricePerToken) {
            tokenAllocation = usdcAmount / launch.basicPricePerToken;
          }
          if (launch.basicHardCap && launch.totalRaised + usdcAmount > launch.basicHardCap) return null;
        } else if (launch.mode === 'allocation') {
          // Allocation is computed at the end, but we store initial guess or just USDC
          // Here we just store the usdcAmount and placeholder tokenAllocation
          // tokenAllocation = (usdcAmount / targetRaise) * tokensForSale is a good estimate
          if (launch.allocTargetRaise && launch.allocTokensForSale) {
            tokenAllocation = (usdcAmount / launch.allocTargetRaise) * launch.allocTokensForSale;
          }
        } else if (launch.mode === 'ido' && launch.idoRounds) {
          const currentRoundIdx = launch.idoCurrentRound ?? 0;
          const round = launch.idoRounds[currentRoundIdx];
          if (!round) return null;
          
          if (round.whitelistOnly && !round.whitelist.some(a => a.toLowerCase() === buyerAddress.toLowerCase())) {
            return null;
          }
          
          tokenAllocation = usdcAmount / round.pricePerToken;
          roundIndex = currentRoundIdx;
          
          // Check if round overflow
          const roundMaxUsdc = round.pricePerToken * round.tokensInRound;
          if (round.raised + usdcAmount > roundMaxUsdc) return null;
        }

        const contribution: Contribution = {
          id: Math.random().toString(36).substring(2, 9),
          launchId,
          buyerAddress,
          usdcAmount,
          tokenAllocation,
          txHash,
          timestamp: now,
          roundIndex,
          claimed: false
        };

        set((state) => {
          const l = state.launches[launchId];
          if (!l) return state;

          const isNewContributor = !l.contributions.some(c => c.buyerAddress.toLowerCase() === buyerAddress.toLowerCase());
          
          const updatedLaunch = {
            ...l,
            totalRaised: l.totalRaised + usdcAmount,
            totalContributors: isNewContributor ? l.totalContributors + 1 : l.totalContributors,
            contributions: [...l.contributions, contribution]
          };

          // Update round stats if IDO
          if (l.mode === 'ido' && l.idoRounds && roundIndex !== undefined) {
            const newRounds = [...l.idoRounds];
            newRounds[roundIndex] = {
              ...newRounds[roundIndex],
              raised: newRounds[roundIndex].raised + usdcAmount
            };
            updatedLaunch.idoRounds = newRounds;

            // Auto-advance round if filled?
            const round = newRounds[roundIndex];
            const roundMaxUsdc = round.pricePerToken * round.tokensInRound;
            if (round.raised >= roundMaxUsdc && roundIndex < newRounds.length - 1) {
              updatedLaunch.idoCurrentRound = roundIndex + 1;
            } else if (round.raised >= roundMaxUsdc && roundIndex === newRounds.length - 1) {
                updatedLaunch.status = 'ended';
                updatedLaunch.endedAt = Date.now();
            }
          }
          
          // Check if hardCap reached for Basic
          if (l.mode === 'basic' && l.basicHardCap && updatedLaunch.totalRaised >= l.basicHardCap) {
             updatedLaunch.status = 'ended';
             updatedLaunch.endedAt = Date.now();
          }

          return {
            launches: { ...state.launches, [launchId]: updatedLaunch }
          };
        });

        return contribution;
      },

      closeIdoRound: (launchId) => {
        set((state) => {
          const l = state.launches[launchId];
          if (!l || l.mode !== 'ido' || l.idoCurrentRound === undefined || !l.idoRounds) return state;
          
          const nextRound = l.idoCurrentRound + 1;
          if (nextRound < l.idoRounds.length) {
            return {
              launches: {
                ...state.launches,
                [launchId]: { ...l, idoCurrentRound: nextRound }
              }
            };
          } else {
            return {
              launches: {
                ...state.launches,
                [launchId]: { ...l, status: 'ended', endedAt: Date.now() }
              }
            };
          }
        });
      },

      finalizeAllocation: (launchId) => {
        set((state) => {
          const l = state.launches[launchId];
          if (!l || l.mode !== 'allocation' || !l.allocTokensForSale || !l.allocTargetRaise) return state;
          
          // In allocation mode, tokens are distributed based on contribution % of total raised
          const totalRaised = l.totalRaised;
          const tokensForSale = l.allocTokensForSale;
          
          const updatedContributions = l.contributions.map(c => ({
            ...c,
            finalAllocation: (c.usdcAmount / totalRaised) * tokensForSale
          }));

          return {
            launches: {
              ...state.launches,
              [launchId]: { ...l, status: 'completed', contributions: updatedContributions }
            }
          };
        });
      },

      markClaimed: (launchId, contributionId) => {
        set((state) => {
          const l = state.launches[launchId];
          if (!l) return state;
          
          const updatedContributions = l.contributions.map(c => 
            c.id === contributionId ? { ...c, claimed: true, claimedAt: Date.now() } : c
          );
          
          return {
            launches: {
              ...state.launches,
              [launchId]: { ...l, contributions: updatedContributions }
            }
          };
        });
      },

      cancelLaunch: (launchId) => {
        set((state) => {
          const l = state.launches[launchId];
          if (!l) return state;
          
          return {
            launches: {
              ...state.launches,
              [launchId]: { ...l, status: 'cancelled', cancelledAt: Date.now() }
            }
          };
        });
      },

      updateStatus: (launchId, status) => {
        set((state) => {
          const l = state.launches[launchId];
          if (!l) return state;
          return {
            launches: {
              ...state.launches,
              [launchId]: { ...l, status }
            }
          };
        });
      }
    }),
    { name: 'arcplay:launchpad' }
  )
);
