import { NextResponse } from 'next/server';
import { createMarket } from '@/lib/predictionStore';

export async function POST(req: Request) {
  try {
    const { question, adminSecret } = await req.json();

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const market = await createMarket(question);
    return NextResponse.json({ success: true, market });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
