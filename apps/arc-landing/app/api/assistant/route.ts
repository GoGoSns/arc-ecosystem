import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Arc Assistant, the AI helper for Arc Ecosystem — a Web3 platform on Arc Network (chainId 5042002, native USDC).

The ecosystem has 4 apps:
- Arc Pay (arcpaymain.vercel.app): /qr, /split, /invoice, /payroll, /escrow — USDC payments
- Arc Creator (arccreatorhub.vercel.app): /tip, /subscription, /bounty, /marketplace — creator monetization
- Arc Play (arcarcade.vercel.app): /games, /prediction, /raffle, /launchpad — gaming & DeFi
- Arc Landing (arcecosystemmain.vercel.app): Central hub with these routes:
  /stats — Network statistics dashboard
  /value — Wallet value lookup (score, portfolio, pricer, domain)
  /quests — Quest system (XP, levels, badges)
  /roadmap — Public roadmap with voting
  /showcase — Build showcase gallery
  /jobs — Web3 job board
  /roulette — Arc Roulette mini-game
  /race — Weekly competitions
  /drops — USDC & NFT giveaways
  /vault — Lock USDC for APY
  /signals — AI trading signals
  /learn — Educational courses
  /events — Events calendar
  /glossary — Web3 terms dictionary
  /market — Marketplace
  /game — Games hub
  /forum — Community forum
  /feedback — Feedback hub
  /node — Node operator hub
  /chat — Gogo AI conversational payments

Arc Network details:
- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- Explorer: https://testnet.arcscan.app
- USDC: 0x3600000000000000000000000000000000000000
- Test USDC faucet: https://faucet.circle.com

Answer helpfully. If user speaks Turkish, respond in Turkish. If English, respond in English.
Keep answers concise (2-3 sentences). Guide users to the right page/route.`;

type HistoryEntry = {
  role: string;
  content: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  if (!apiKey) {
    return NextResponse.json(
      { reply: "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local and restart the server." },
      { status: 200 }
    );
  }

  try {
    const { message, history } = await req.json();

    // Gemini requires contents to start with a 'user' turn.
    // Drop any leading assistant/model messages from the history.
    const rawHistory = (history as HistoryEntry[]) ?? [];
    const firstUserIdx = rawHistory.findIndex((m) => m.role === 'user');
    const trimmedHistory = firstUserIdx === -1 ? [] : rawHistory.slice(firstUserIdx);

    const contents = trimmedHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API HTTP error:', geminiRes.status, errText);
      return NextResponse.json(
        { reply: `AI service error (${geminiRes.status}). Please try again.` },
        { status: 200 }
      );
    }

    const data = await geminiRes.json();

    if (data.error) {
      console.error('Gemini API error body:', data.error);
      return NextResponse.json(
        { reply: `AI error: ${data.error.message ?? 'Unknown error'}` },
        { status: 200 }
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Assistant API error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { reply: `Connection failed: ${msg}` },
      { status: 200 }
    );
  }
}
