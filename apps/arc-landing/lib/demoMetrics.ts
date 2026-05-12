import type { WalletScoreData } from '@/lib/valueStore';

export interface DemoPortfolioData {
  totalUsdc: number;
  tokens: Array<{ symbol: string; balance: number; value: number; color: string }>;
  nfts: Array<{ name: string; id: string; estValue: number }>;
  transactions: Array<{ hash: string; type: 'in' | 'out'; amount: number; target: string; time: string }>;
}

export interface DemoRpcStatus {
  healthy: boolean;
  blockHeight: number | null;
  chainId: string | null;
  latencyMs: number | null;
  error?: string;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildDemoRpcStatus(url: string): DemoRpcStatus {
  const normalized = url.trim().toLowerCase();
  const healthy = normalized.includes('arc.network') || normalized.startsWith('https://');
  const seed = hashString(normalized || 'arc-rpc');

  if (!healthy) {
    return {
      healthy: false,
      blockHeight: null,
      chainId: null,
      latencyMs: null,
      error: 'Demo mode: RPC checks are simulated in the landing app.',
    };
  }

  return {
    healthy: true,
    blockHeight: 1_230_000 + (seed % 8_000),
    chainId: '5042002',
    latencyMs: 35 + (seed % 120),
  };
}

export function buildDemoPortfolio(address: string): DemoPortfolioData {
  const seed = hashString(address.trim().toLowerCase() || 'arc-portfolio');
  const baseBalance = 2_000 + (seed % 8_000) / 10;
  const arcBalance = 100 + (seed % 600);
  const wethBalance = Number(((seed % 70) / 100).toFixed(2));
  const nftCount = 1 + (seed % 3);

  const tokens = [
    { symbol: 'USDC', balance: baseBalance, value: baseBalance, color: '#c9a84c' },
    { symbol: 'ARC', balance: arcBalance, value: arcBalance * 2.5, color: '#e5e4e2' },
    { symbol: 'WETH', balance: wethBalance, value: wethBalance * 2_400, color: '#b9f2ff' },
  ];

  const nfts = Array.from({ length: nftCount }, (_, index) => ({
    name: `Arc Collectible #${(seed % 900) + index + 1}`,
    id: String((seed % 900) + index + 1),
    estValue: 150 + ((seed + index * 37) % 900),
  }));

  const transactions = Array.from({ length: 3 }, (_, index) => {
    const amount = 25 + ((seed + index * 17) % 1_200);
    return {
      hash: `0x${(seed + index * 97).toString(16).padStart(12, '0')}`,
      type: index % 2 === 0 ? 'in' : 'out',
      amount,
      target: `0x${(seed + index * 41).toString(16).slice(0, 10).padStart(10, '0')}`,
      time: `${index + 1}h ago`,
    } as const;
  });

  const totalUsdc = tokens.reduce((sum, token) => sum + token.value, 0) + nfts.reduce((sum, nft) => sum + nft.estValue, 0);

  return {
    totalUsdc,
    tokens: [
      { symbol: 'USDC (Native)', balance: baseBalance, value: baseBalance, color: '#c9a84c' },
      ...tokens,
    ],
    nfts,
    transactions,
  };
}

export function buildDemoWalletScore(
  address: string,
  community: { threads: number; feedbacks: number; nodeOperators: number },
): WalletScoreData {
  const seed = hashString(address.trim().toLowerCase() || 'arc-score');
  const baseAge = clamp(30 + (seed % 160), 0, 200);
  const txCount = clamp(40 + ((seed >> 1) % 180), 0, 200);
  const volume = clamp(25 + ((seed >> 2) % 175), 0, 200);
  const apps = clamp(60 + ((seed >> 3) % 120), 0, 200);
  const nfts = clamp(10 + ((seed >> 4) % 90), 0, 100);
  const communityScore = clamp(
    (community.threads * 20) + (community.feedbacks * 10) + (community.nodeOperators > 0 ? 50 : 0),
    0,
    100,
  );

  const totalScore = baseAge + txCount + volume + apps + nfts + communityScore;

  let tier: WalletScoreData['tier'] = 'bronze';
  if (totalScore > 800) tier = 'diamond';
  else if (totalScore > 600) tier = 'platinum';
  else if (totalScore > 400) tier = 'gold';
  else if (totalScore > 200) tier = 'silver';

  return {
    address,
    score: totalScore,
    tier,
    breakdown: {
      age: baseAge,
      txCount,
      volume,
      apps,
      nfts,
      community: communityScore,
    },
    computedAt: Date.now(),
  };
}
