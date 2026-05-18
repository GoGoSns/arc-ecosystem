'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useGameStore } from '@/lib/gameStore';

export function WalletBar() {
  const { address, isConnected, connect } = useWallet();
  const mockBalance = useGameStore((state) => state.mockBalance);
  const topUp = useGameStore((state) => state.topUp);

  const balance = address ? (mockBalance[address.trim().toLowerCase()] ?? 0) : 0;
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <span className="font-mono text-white/60">{short}</span>
      <span className="font-semibold text-emerald-400">${balance.toFixed(2)} USDC</span>
      <button
        onClick={() => address && topUp(address)}
        className="rounded px-2 py-0.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}
      >
        +$10
      </button>
    </div>
  );
}
