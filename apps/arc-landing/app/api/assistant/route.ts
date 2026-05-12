import { NextRequest, NextResponse } from 'next/server';
import { buildAssistantReply, type AssistantMessage } from '@/lib/assistantDemo';

type AssistantRequestBody = {
  message?: unknown;
  history?: unknown;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as AssistantRequestBody;
  const message = typeof body.message === 'string' ? body.message : '';
  const rawHistory = Array.isArray(body.history) ? body.history : [];

  const history: AssistantMessage[] = rawHistory.map((entry) => {
    const value = entry as Partial<AssistantMessage>;
    return {
      role: value.role === 'assistant' ? 'assistant' : 'user',
      content: typeof value.content === 'string' ? value.content : '',
    };
  });

  return NextResponse.json({ reply: buildAssistantReply(message, history) });
}
