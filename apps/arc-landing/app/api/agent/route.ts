import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Parse intent with Gemini if available, else fallback to keyword parsing
    const text = String(prompt).toLowerCase();
    let intent = "CHAT";
    let amount = "";
    let recipient = "";

    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (text.includes("send") || text.includes("pay") || text.includes("transfer")) {
      intent = "SEND_USDC";
      amount = amountMatch ? amountMatch[1] : "";
    }
    const addrMatch = String(prompt).match(/0x[a-fA-F0-9]{40}/);
    if (addrMatch) recipient = addrMatch[0];

    // Build AI reply via Gemini
    let reply = "";
    if (apiKey) {
      const sysPrompt = `You are Gogo AI, a conversational payment assistant for the Arc Ecosystem on Arc Testnet (a stablecoin-native L1 by Circle). You help users send real USDC payments using natural language, powered by Circle App Kit. Be concise, professional, and English-only. If the user wants to send USDC, confirm the amount and recipient. Never claim to do trading, prediction markets, or anything the app does not actually do. You only do real USDC transfers on Arc Testnet.`;
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sysPrompt }] },
              contents: [{ role: "user", parts: [{ text: String(prompt) }] }],
            }),
          }
        );
        const data = await r.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch {
        reply = "";
      }
    }
    if (!reply) {
      reply =
        intent === "SEND_USDC"
          ? `Ready to send ${amount || "the specified amount"} USDC${recipient ? " to " + recipient : ""} on Arc Testnet. Confirm to execute the real transfer.`
          : "I am Gogo AI. I can send real USDC payments on Arc Testnet using natural language. Try: 'Send 5 USDC to 0x...'";
    }

    return NextResponse.json({
      success: true,
      agentName: "Gogo AI",
      intent,
      isCommand: intent === "SEND_USDC",
      amount,
      recipient,
      reply,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Agent execution failed" }, { status: 500 });
  }
}
