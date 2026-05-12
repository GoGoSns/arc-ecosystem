export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

function isTurkishInput(message: string): boolean {
  const lower = message.toLowerCase();
  return /[ğüşöçıİ]/i.test(message) || /(yardım|yardim|nasıl|nasil|istiyorum|ne yapabilirim|cüzdan|cuzdan)/i.test(lower);
}

function pickReply(message: string, turkish: boolean): string {
  const lower = message.toLowerCase();

  if (/(test usdc|faucet|ask for tokens|faucet circle)/i.test(lower)) {
    return turkish
      ? 'Test USDC almak için Circle faucet kullan: https://faucet.circle.com. İstersen ilgili Arc sayfasını da söyleyebilirim.'
      : 'Get test USDC from the Circle faucet: https://faucet.circle.com. I can point you to the right Arc page next if you want.';
  }

  if (/(qr|split|invoice|payroll|escrow)/i.test(lower)) {
    return turkish
      ? 'Arc Pay demo rotaları: /qr, /split, /invoice, /payroll ve /escrow. İstersen hangisinin ne yaptığını özetleyeyim.'
      : 'Arc Pay demo routes: /qr, /split, /invoice, /payroll, and /escrow. I can summarize any of them if you want.';
  }

  if (/(tip jar|subscription|bounty|marketplace|creator)/i.test(lower)) {
    return turkish
      ? 'Arc Creator demo rotaları: /tip, /subscription, /bounty ve /marketplace. Hangi akışla ilgilendiğini söyle.'
      : 'Arc Creator demo routes: /tip, /subscription, /bounty, and /marketplace. Tell me which flow you want to open.';
  }

  if (/(games|prediction|raffle|launchpad|play)/i.test(lower)) {
    return turkish
      ? 'Arc Play demo rotaları: /games, /prediction, /raffle ve /launchpad. İstersen birini seçelim.'
      : 'Arc Play demo routes: /games, /prediction, /raffle, and /launchpad. Pick one and I’ll keep it short.';
  }

  if (/(quests|roadmap|glossary|learn|value|stats|node|forum|feedback)/i.test(lower)) {
    return turkish
      ? 'Landing hub içinde /quests, /roadmap, /glossary, /learn, /value, /stats, /node, /forum ve /feedback sayfaları var.'
      : 'The landing hub includes /quests, /roadmap, /glossary, /learn, /value, /stats, /node, /forum, and /feedback.';
  }

  return turkish
    ? 'Arc Assistant demo modunda çalışıyor. Bana ne istediğini söyle, sana doğru rotayı veya sayfayı göstereyim.'
    : 'Arc Assistant is running in demo mode. Tell me what you need and I’ll point you to the right route or page.';
}

export function buildAssistantReply(message: string, history: AssistantMessage[] = []): string {
  const trimmed = message.trim();
  const turkish = isTurkishInput(trimmed) || history.some((entry) => isTurkishInput(entry.content));
  return pickReply(trimmed, turkish);
}
