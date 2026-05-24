import { NextResponse } from 'next/server';
import { getActiveMarket, getBets } from '@/lib/predictionStore';

export async function GET() {
  try {
    const market = await getActiveMarket();
    if (!market) {
      return NextResponse.json({ market: null, bets: [] });
    }

    const bets = await getBets(market.id);
    return NextResponse.json({ market, bets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
