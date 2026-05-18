'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useGameStore } from '@/lib/gameStore';
import { USE_REAL_TRANSFERS, getUSDCBalance } from '@/lib/usdcTransfer';

export function GameWalletStrip() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const mockBalance = useGameStore((state) => state.mockBalance);
  const topUp = useGameStore((state) => state.topUp);

  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [connectPending, setConnectPending] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !USE_REAL_TRANSFERS) {
      setRealBalance(null);
      return;
    }
    let cancelled = false;
    getUSDCBalance(address).then((bal) => {
      if (!cancelled) setRealBalance(bal);
    });
    return () => { cancelled = true; };
  }, [isConnected, address]);

  const mockBal = address ? (mockBalance[address.trim().toLowerCase()] ?? 0) : 0;
  const displayBalance = USE_REAL_TRANSFERS && realBalance !== null ? realBalance : mockBal;
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  const handleConnect = async () => {
    setConnectPending(true);
    try { await connect(); } finally { setConnectPending(false); }
  };

  if (!isConnected) {
    return (
      <div className="fixed left-0 right-0 top-16 z-40 border-b border-[#d4af37]/30 bg-[#050508]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm text-[#8a8a9a]">
            <span className="mr-1 hidden font-semibold text-white sm:inline">Arc Game Hub</span>
            Connect your wallet to interact with games and track your balance.
          </p>
          <button
            onClick={handleConnect}
            disabled={connectPending}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-black shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-95 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
          >
            {connectPending && <Loader2 size={14} className="animate-spin" />}
            {connectPending ? 'Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 top-16 z-40 border-b border-[#d4af37]/20 bg-[#050508]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#30d158] shadow-[0_0_6px_rgba(48,209,88,0.6)]" />
          <span className="hidden font-mono text-xs text-white/50 sm:block">{short}</span>
          <span className="text-sm font-bold text-emerald-400">${displayBalance.toFixed(2)} USDC</span>
          {USE_REAL_TRANSFERS && (
            <span className="hidden rounded-full border border-[#30d158]/30 bg-[#30d158]/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-[#30d158] sm:block">
              Arc Testnet
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!USE_REAL_TRANSFERS && (
            <button
              onClick={() => address && topUp(address)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-black transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
            >
              + $10 Top Up
            </button>
          )}
          <button
            onClick={disconnect}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
