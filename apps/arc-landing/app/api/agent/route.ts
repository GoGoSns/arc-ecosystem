import { NextResponse } from "next/server";

type ConditionType = "above" | "below";

type Condition = {
  type: ConditionType;
  threshold: number;
};

type Transfer = {
  to: string;
  amount: string;
};

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/;
const ADDRESS_GLOBAL_RE = /0x[a-fA-F0-9]{40}/g;
const CONDITION_RE =
  /\b(?:if|when)\b[\s\S]*?\b(above|over|exceeds|exceed|greater than|more than|below|under|less than|less|falls below|drops below)\s*(\d+(?:\.\d+)?)/i;
const SEND_AMOUNT_RE = /\b(?:send|transfer|pay)\b(?:\s+usdc)?\s+(\d+(?:\.\d+)?)/i;
const NUMBER_RE = /\d+(?:\.\d+)?/g;

function normalizeConditionType(value: string): ConditionType | null {
  if (/^(below|under|less|falls|drops)/i.test(value)) {
    return "below";
  }
  if (/^(above|over|exceed|greater|more)/i.test(value)) {
    return "above";
  }
  return null;
}

function buildConditionalReply(amount: string, recipient: string, condition: Condition): string {
  return `Ready to send ${amount} USDC to ${recipient} if balance is ${condition.type} ${condition.threshold}. Confirm to proceed.`;
}

function buildConditionalFallbackReply(): string {
  return 'I could not parse a conditional send. Try: "if balance above 20 send 1 to 0x...".';
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const raw = String(prompt);
    const text = raw.toLowerCase();
    const textWithoutAddresses = raw.replace(ADDRESS_GLOBAL_RE, " ");

    const addresses = raw.match(ADDRESS_GLOBAL_RE) || [];
    const amounts = textWithoutAddresses.match(NUMBER_RE) || [];

    let intent = "CHAT";
    let amount = "";
    let recipient = "";
    let condition: Condition | undefined;
    let transfers: Transfer[] = [];

    const wantsSend = text.includes("send") || text.includes("pay") || text.includes("transfer") || text.includes("split");
    const hasConditionalCue = /\b(if|when)\b/i.test(text);
    const conditionMatch = raw.match(CONDITION_RE);
    const amountMatch = raw.match(SEND_AMOUNT_RE);
    const recipientMatch = raw.match(ADDRESS_RE);

    if (hasConditionalCue) {
      if (conditionMatch) {
        const conditionType = normalizeConditionType(conditionMatch[1]);
        const threshold = Number(conditionMatch[2]);
        const parsedAmount = amountMatch?.[1] || amounts[1] || "";
        const parsedRecipient = recipientMatch?.[0] || "";

        if (conditionType && Number.isFinite(threshold) && parsedAmount && parsedRecipient) {
          intent = "CONDITIONAL_SEND";
          amount = parsedAmount;
          recipient = parsedRecipient;
          condition = { type: conditionType, threshold };
        } else {
          return NextResponse.json({
            success: true,
            agentName: "Gogo AI",
            intent: "CHAT",
            isCommand: false,
            amount: "",
            recipient: "",
            transfers: [],
            reply: buildConditionalFallbackReply(),
          });
        }
      } else {
        return NextResponse.json({
          success: true,
          agentName: "Gogo AI",
          intent: "CHAT",
          isCommand: false,
          amount: "",
          recipient: "",
          transfers: [],
          reply: buildConditionalFallbackReply(),
        });
      }
    }

    if (intent !== "CONDITIONAL_SEND" && wantsSend && addresses.length > 0) {
      if (text.includes("split") && amounts.length > 0 && addresses.length > 1) {
        const total = parseFloat(amounts[0] || "0");
        const each = (total / addresses.length).toFixed(4).replace(/\.?0+$/, "");
        intent = "SEND_MULTI";
        transfers = addresses.map((to) => ({ to, amount: each }));
        amount = amounts[0] || "";
      } else if (addresses.length > 1) {
        intent = "SEND_MULTI";
        transfers = addresses.map((to, i) => ({
          to,
          amount: amounts[i] || amounts[0] || "1",
        }));
      } else {
        intent = "SEND_USDC";
        amount = amounts[0] || "";
        recipient = addresses[0] || "";
        transfers = [{ to: recipient, amount: amount || "1" }];
      }
    } else if (intent !== "CONDITIONAL_SEND" && wantsSend) {
      intent = "SEND_USDC";
      amount = amounts[0] || "";
    }

    let reply = "";
    if (intent === "CONDITIONAL_SEND" && condition) {
      reply = buildConditionalReply(amount, recipient, condition);
    } else if (intent === "SEND_MULTI") {
      reply = `Ready to execute ${transfers.length} real USDC transfers on Arc Testnet. Confirm to proceed.`;
    } else if (intent === "SEND_USDC") {
      reply = `Ready to send ${amount || "the specified amount"} USDC${recipient ? " to " + recipient : ""} on Arc Testnet. Confirm to execute the real transfer.`;
    } else if (apiKey) {
      const sysPrompt = `You are Gogo AI, a conversational payment assistant for the Arc Ecosystem on Arc Testnet (a stablecoin-native L1 by Circle). You help users send real USDC payments using natural language, including conditional sends that depend on a live balance check. Be concise, professional, and English-only. Confirm the amount and recipients. Never claim to do trading, prediction markets, or anything the app does not actually do. You only do real USDC transfers on Arc Testnet.`;
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
      reply = "I am Gogo AI. I send real USDC on Arc Testnet using natural language. Try: 'Send 5 USDC to 0x...', 'Split 30 USDC between 0x... and 0x...', or 'If balance above 20 send 1 to 0x...'.";
    }

    return NextResponse.json({
      success: true,
      agentName: "Gogo AI",
      intent,
      isCommand: intent === "SEND_USDC" || intent === "SEND_MULTI" || intent === "CONDITIONAL_SEND",
      condition,
      amount,
      recipient,
      transfers,
      reply,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Agent execution failed" }, { status: 500 });
  }
}
