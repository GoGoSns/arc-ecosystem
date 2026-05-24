import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export type MarketStatus = 'open' | 'resolved';
export type Side = 'YES' | 'NO';

export interface Market {
  id: string;
  question: string;
  status: MarketStatus;
  outcome?: Side;
  createdAt: number;
}

export interface Bet {
  id: string;
  marketId: string;
  userAddress: string;
  side: Side;
  amount: number;
  txHash: string;
  createdAt: number;
}

export async function createMarket(question: string): Promise<Market> {
  const id = `m_${Date.now()}`;
  const market: Market = {
    id,
    question,
    status: 'open',
    createdAt: Date.now(),
  };

  await redis.set(`market:${id}`, market);
  await redis.set('market:active', id);
  return market;
}

export async function getMarket(id: string): Promise<Market | null> {
  return await redis.get<Market>(`market:${id}`);
}

export async function getActiveMarket(): Promise<Market | null> {
  const activeId = await redis.get<string>('market:active');
  if (!activeId) return null;
  return await getMarket(activeId);
}

export async function placeBet(bet: Omit<Bet, 'id' | 'createdAt'>): Promise<Bet> {
  const id = `b_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fullBet: Bet = {
    ...bet,
    id,
    createdAt: Date.now(),
  };

  await redis.rpush(`bets:${bet.marketId}`, fullBet);
  return fullBet;
}

export async function getBets(marketId: string): Promise<Bet[]> {
  const bets = await redis.lrange<Bet>(`bets:${marketId}`, 0, -1);
  return bets || [];
}

export async function resolveMarket(marketId: string, outcome: Side): Promise<void> {
  const market = await getMarket(marketId);
  if (!market) throw new Error('Market not found');

  market.status = 'resolved';
  market.outcome = outcome;

  await redis.set(`market:${marketId}`, market);
  
  // If it was the active market, clear it (or we could keep it as resolved active)
  const activeId = await redis.get<string>('market:active');
  if (activeId === marketId) {
    // Optional: decide if we clear active or not. 
    // Usually we want to show the resolved result until a new one is created.
  }
}
