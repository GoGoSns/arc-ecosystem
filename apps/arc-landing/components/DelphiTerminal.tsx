"use client";

import { useState } from "react";
import { Sparkles, Send, X, Terminal } from "lucide-react";

export default function DelphiTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<Array<{type: 'user' | 'agent' | 'system', text: string}>>([
    { type: 'system', text: '// Delphi AI Agent v1.0.0 initialized.' },
    { type: 'agent', text: 'Ready for on-chain intents. Try: "Send 10 USDC to Alice" or "Ekibe parayı böl"' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt;
    setLogs(prev => [...prev, { type: 'user', text: userPrompt }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, walletAddress: "0x319d...460F" })
      });
      const data = await res.json();

      if (data.success) {
        setLogs(prev => [
          ...prev,
          { type: 'system', text: `>> Intent Detected: ${data.intent}` },
          { type: 'agent', text: `[Delphi]: ${data.message}` },
          { type: 'system', text: `>> TX HASH: ${data.simulatedTxHash.slice(0, 20)}... (Settled <1s)` }
        ]);
      } else {
        setLogs(prev => [...prev, { type: 'agent', text: 'Error: Failed to execute agent intent.' }]);
      }
    } catch {
      setLogs(prev => [...prev, { type: 'agent', text: 'Network error connecting to Delphi core.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#d4af37]/40 bg-black px-4 py-3 text-xs uppercase tracking-widest text-[#f5d060] shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all hover:bg-[#d4af37]/10"
        >
          <Sparkles size={14} className="animate-pulse" /> Ask Delphi AI
        </button>
      ) : (
        <div className="w-[360px] sm:w-[420px] rounded-2xl border border-[#1a1a2e] bg-black/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[#1a1a2e] pb-3">
            <div className="flex items-center gap-2 text-[#d4af37]">
              <Terminal size={14} />
              <span className="text-xs uppercase tracking-widest">// Delphi Agent Terminal</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>

          <div className="my-4 h-[260px] overflow-y-auto space-y-3 pr-1 text-xs leading-5">
            {logs.map((log, i) => (
              <div key={i} className={`p-2 rounded-lg ${log.type === 'user' ? 'bg-white/5 text-right text-white' : log.type === 'system' ? 'text-[#d4af37]/60' : 'text-white/80'}`}>
                {log.text}
              </div>
            ))}
            {loading && <div className="text-white/40 animate-pulse">// Delphi is parsing intent rails...</div>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-[#1a1a2e] pt-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type an on-chain command..."
              className="flex-1 bg-white/[0.02] border border-[#1a1a2e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/40"
            />
            <button type="submit" className="rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/25 p-2 text-[#f5d060] hover:bg-[#d4af37]/20">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
