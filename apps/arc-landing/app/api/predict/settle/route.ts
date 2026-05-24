import { NextResponse } from 'next/server';
import { getMarket, getBets, resolveMarket } from '@/lib/predictionStore';
import { createWalletClient, http, parseUnits, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.drpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export async function POST(req: Request) {
  try {
    const { marketId, outcome, adminSecret } = await req.json();

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const market = await getMarket(marketId);
    if (!market || market.status !== 'open') {
      return NextResponse.json({ error: 'Market is not open or not found' }, { status: 400 });
    }

    const bets = await getBets(marketId);
    if (bets.length === 0) {
      await resolveMarket(marketId, outcome);
      return NextResponse.json({ success: true, message: 'No bets to settle' });
    }

    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const winningBets = bets.filter(bet => bet.side === outcome);
    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

    const privateKey = process.env.AGENT_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Agent private key not configured' }, { status: 500 });
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    const payouts: { address: string; amount: number; txHash: string }[] = [];

    if (totalWinningAmount > 0) {
      for (const bet of winningBets) {
        // Payout = (bet.amount / totalWinningAmount) * totalPool
        const payoutAmount = (bet.amount / totalWinningAmount) * totalPool;
        
        // Convert to 18 decimals (Native USDC on Arc)
        const value = parseUnits(payoutAmount.toFixed(18), 18);

        const txHash = await client.sendTransaction({
          to: bet.userAddress as `0x${string}`,
          value: value,
        });

        payouts.push({
          address: bet.userAddress,
          amount: payoutAmount,
          txHash,
        });
      }
    }

    await resolveMarket(marketId, outcome);

    return NextResponse.json({
      success: true,
      marketId,
      outcome,
      totalPool,
      payouts,
    });
  } catch (error: any) {
    console.error('Settle error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
