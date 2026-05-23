"use client";

import { useState, useRef, useEffect } from "react";
import { payToAdmin, getUSDCBalance } from "@/lib/usdcTransfer";

interface Msg {
  role: "user" | "agent";
  text: string;
  tx?: { hash: string; url: string; amount: string };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "agent", text: "I am Gogo AI. I send real USDC payments on Arc Testnet using natural language. Connect your wallet, then try: 'Send 5 USDC to 0x...'" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<string>("");
  const [balance, setBalance] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function connectWallet() {
    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        alert("MetaMask not found. Please install MetaMask.");
        return;
      }
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];

      // Switch Network if needed
      const chainId = await eth.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== 5042002) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x4ce936' }], // 5042002 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x4ce936',
                chainName: 'Arc Testnet',
                nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
                rpcUrls: ['https://rpc.testnet.arc.network'],
                blockExplorerUrls: ['https://testnet.arcscan.app'],
              }],
            });
          }
        }
      }

      setWallet(addr);
      const bal = await getUSDCBalance(addr);
      setBalance(bal);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSend() {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, walletAddress: wallet }),
      });
      const data = await res.json();

      // If it is a real send command, execute the real transfer
      if (data.isCommand && data.intent === "SEND_USDC" && data.amount) {
        const numAmount = Number(data.amount);
        
        if (!wallet) {
          setMessages((m) => [...m, { role: "agent", text: "Wallet not connected. Please connect your MetaMask wallet first to execute this transfer." }]);
          setLoading(false);
          return;
        }

        if (isNaN(numAmount) || numAmount <= 0) {
          setMessages((m) => [...m, { role: "agent", text: `I couldn't parse a valid amount from your request (${data.amount}). Please try again with a specific number.` }]);
          setLoading(false);
          return;
        }

        setMessages((m) => [...m, { role: "agent", text: `Initiating real-time settlement of ${data.amount} USDC on Arc Testnet...` }]);
        
        const result = await payToAdmin(numAmount);
        
        if (result.success && result.txHash) {
          setMessages((m) => [...m, {
            role: "agent",
            text: `Transfer successfully settled on Arc Testnet.`,
            tx: { hash: result.txHash!, url: result.explorerUrl || `https://testnet.arcscan.app/tx/${result.txHash}`, amount: data.amount },
          }]);
          const bal = await getUSDCBalance(wallet);
          setBalance(bal);
        } else {
          let errorDisplay = result.error || "Unknown network error.";
          if (errorDisplay.includes("Incorrect Network")) {
            errorDisplay += " Click 'Connect Wallet' again to trigger a network switch.";
          }
          setMessages((m) => [...m, { role: "agent", text: `Transaction Failed: ${errorDisplay}` }]);
        }
      } else {
        setMessages((m) => [...m, { role: "agent", text: data.reply || "I'm sorry, I couldn't process that request." }]);
      }
    } catch (e) {
      console.error("Chat Error:", e);
      setMessages((m) => [...m, { role: "agent", text: "Service temporarily unavailable. Please check your connection and try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f0f5]">
      <div className="mx-auto flex h-screen max-w-4xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#1a1a2e] pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-wider">GOGO <span className="text-[#d4af37]">AI</span></h1>
            <p className="text-xs text-[#8a8a9a]">Conversational USDC payments on Arc Testnet</p>
          </div>
          <div className="text-right">
            {wallet ? (
              <div>
                <div className="font-mono text-xs text-[#d4af37]">{wallet.slice(0, 6)}...{wallet.slice(-4)}</div>
                {balance !== null && <div className="text-[10px] text-[#8a8a9a]">{balance.toFixed(2)} USDC</div>}
              </div>
            ) : (
              <button onClick={connectWallet} className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-4 py-2 text-sm text-[#d4af37] transition-colors hover:bg-[#d4af37]/20">
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-[#d4af37]/15 text-[#f0f0f5]" : "bg-[#0d0d12] border border-[#1a1a2e] text-[#f0f0f5]"}`}>
                <div>{m.text}</div>
                {m.tx && (
                  <div className="mt-3 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d4af37]">Live Settled · Arc Testnet</div>
                    <div className="mt-1 text-lg font-bold text-[#f5d060]">{m.tx.amount} USDC</div>
                    <a href={m.tx.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all font-mono text-[11px] text-[#8a8a9a] underline hover:text-[#d4af37]">
                      {m.tx.hash}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-[#8a8a9a]">Gogo AI is thinking...</div>}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2 border-t border-[#1a1a2e] pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Try: Send 5 USDC to 0x..."
            className="flex-1 rounded-lg border border-[#1a1a2e] bg-[#0d0d12] px-4 py-3 text-sm text-[#f0f0f5] outline-none focus:border-[#d4af37]/40"
          />
          <button onClick={handleSend} disabled={loading} className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-6 py-3 text-sm text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
