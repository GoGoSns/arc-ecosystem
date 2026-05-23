import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const raw = String(prompt);
    const text = raw.toLowerCase();

    // Extract all addresses and amounts
    const addresses = raw.match(/0x[a-fA-F0-9]{40}/g) || [];
    const amounts = (text.match(/(\d+(?:\.\d+)?)/g) || []).map((n) => n);

    let intent = "CHAT";
    let amount = "";
    let recipient = "";
    let transfers: { to: string; amount: string }[] = [];

    const wantsSend = text.includes("send") || text.includes("pay") || text.includes("transfer") || text.includes("split");

    if (wantsSend && addresses.length > 0) {
      if (text.includes("split") && amounts.length > 0 && addresses.length > 1) {
        // SPLIT: divide first amount equally among all addresses
        const total = parseFloat(amounts[0]);
        const each = (total / addresses.length).toFixed(4).replace(/\.?0+$/, "");
        intent = "SEND_MULTI";
        transfers = addresses.map((to) => ({ to, amount: each }));
        amount = amounts[0];
      } else if (addresses.length > 1) {
        // MULTI: pair each address with its amount (or use first amount for all)
        intent = "SEND_MULTI";
        transfers = addresses.map((to, i) => ({
          to,
          amount: amounts[i] || amounts[0] || "1",
        }));
      } else {
        // SINGLE
        intent = "SEND_USDC";
        amount = amounts[0] || "";
        recipient = addresses[0] || "";
        transfers = [{ to: recipient, amount: amount || "1" }];
      }
    } else if (wantsSend) {
      intent = "SEND_USDC";
      amount = amounts[0] || "";
    }

    // Build AI reply via Gemini
    let reply = "";
    if (apiKey) {
      const sysPrompt = `You are Gogo AI, a conversational payment assistant for the Arc Ecosystem on Arc Testnet (a stablecoin-native L1 by Circle). You help users send real USDC payments using natural language, powered by Circle App Kit. You can send to one recipient, send to multiple recipients at once, or split an amount equally among several addresses. Be concise, professional, and English-only. Confirm the amount and recipients. Never claim to do trading, prediction markets, or anything the app does not actually do. You only do real USDC transfers on Arc Testnet.`;
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sysPrompt }] },
              contents: [{ role: "user", parts: [{ text: raw }] }],
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
      if (intent === "SEND_MULTI") {
        reply = `Ready to execute ${transfers.length} real USDC transfers on Arc Testnet. Confirm to proceed.`;
      } else if (intent === "SEND_USDC") {
        reply = `Ready to send ${amount || "the specified amount"} USDC${recipient ? " to " + recipient : ""} on Arc Testnet. Confirm to execute the real transfer.`;
      } else {
        reply = "I am Gogo AI. I send real USDC on Arc Testnet using natural language. Try: 'Send 5 USDC to 0x...', 'Split 30 USDC between 0x... and 0x...', or 'Send 5 to 0x... and 10 to 0x...'.";
      }
    }

    return NextResponse.json({
      success: true,
      agentName: "Gogo AI",
      intent,
      isCommand: intent === "SEND_USDC" || intent === "SEND_MULTI",
      amount,
      recipient,
      transfers,
      reply,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Agent execution failed" }, { status: 500 });
  }
}
