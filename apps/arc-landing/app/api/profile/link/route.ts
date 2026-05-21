import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function POST(req: NextRequest) {
  try {
    const { username, address } = await req.json();
    if (!username || !address) {
      return NextResponse.json({ error: 'Missing username or address' }, { status: 400 });
    }

    // In a real app, we'd verify the cookie to ensure the user owns this profile.
    // For now, matching the requested pattern.
    const redis = Redis.fromEnv();
    const cleanHandle = username.toLowerCase();
    const existing: any = await redis.get(`profile:${cleanHandle}`);

    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updatedProfile = {
      ...existing,
      address: address.toLowerCase(),
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`profile:${cleanHandle}`, JSON.stringify(updatedProfile));

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error('Link profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
