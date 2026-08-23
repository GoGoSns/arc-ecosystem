import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getAddress, verifyMessage } from "viem";
import { COMMUNITIES, communitySigningMessage, type CommunityMessage } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

const MESSAGE_LIST = "arc-community:messages:v2";
const MAX_MESSAGES = 500;
const MAX_BODY_LENGTH = 1000;

function redisClient(): Redis {
  return Redis.fromEnv();
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function allowPost(redis: Redis, request: NextRequest): Promise<boolean> {
  const key = `arc-community:rate:${clientKey(request)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 12;
}

export async function GET() {
  try {
    const messages = await redisClient().lrange<CommunityMessage>(MESSAGE_LIST, 0, -1);
    return NextResponse.json({ messages: messages || [] }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[community] message read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Community messages are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = redisClient();
    if (!(await allowPost(redis, request))) {
      return NextResponse.json({ error: "Too many messages. Please wait a minute and try again." }, { status: 429 });
    }

    const payload = await request.json() as {
      address?: string;
      signature?: `0x${string}`;
      message?: { communityId?: string; channelId?: string; body?: string; replyTo?: string };
    };
    const body = payload.message?.body?.trim() || "";
    const community = COMMUNITIES.find((item) => item.id === payload.message?.communityId);
    const channel = community?.channels.find((item) => item.id === payload.message?.channelId);
    if (!community || !channel || !body || body.length > MAX_BODY_LENGTH || !payload.address || !payload.signature) {
      return NextResponse.json({ error: "Invalid community message." }, { status: 400 });
    }

    let address: `0x${string}`;
    try {
      address = getAddress(payload.address);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
    }
    const signedText = communitySigningMessage({
      communityId: community.id,
      channelId: channel.id,
      body,
      replyTo: payload.message?.replyTo,
    });
    const valid = await verifyMessage({ address, message: signedText, signature: payload.signature });
    if (!valid) return NextResponse.json({ error: "Wallet signature verification failed." }, { status: 401 });

    const message: CommunityMessage = {
      id: crypto.randomUUID(),
      communityId: community.id,
      channelId: channel.id,
      author: `arc-${address.slice(2, 6).toLowerCase()}`,
      address,
      role: "member",
      body,
      createdAt: Date.now(),
      reactions: 0,
      replyTo: payload.message?.replyTo?.slice(0, 100),
    };
    await redis.rpush(MESSAGE_LIST, message);
    await redis.ltrim(MESSAGE_LIST, -MAX_MESSAGES, -1);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[community] message publish failed", message);
    return NextResponse.json({ error: "Message could not be published." }, { status: 500 });
  }
}
