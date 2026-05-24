import { NextResponse } from 'next/server';
import { placeBet, getMarket } from '@/lib/predictionStore';

export async function POST(req: Request) {
  try {
    const { marketId, userAddress, side, amount, txHash } = await req.json();

    if (!marketId || !userAddress || !side || !amount || !txHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const market = await getMarket(marketId);
    if (!market || market.status !== 'open') {
      return NextResponse.json({ error: 'Market is not open' }, { status: 400 });
    }

    const bet = await placeBet({
      marketId,
      userAddress,
      side,
      amount: Number(amount),
      txHash,
    });

    return NextResponse.json({ success: true, bet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
