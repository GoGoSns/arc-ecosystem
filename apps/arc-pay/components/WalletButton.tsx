"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { Wallet } from "lucide-react";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            background: "rgba(201,168,76,0.08)",
          }}
        >
          <span className="font-mono text-xs">{shortenAddress(address)}</span>
          {balance && (
            <span className="font-mono text-xs opacity-70">
              {(Number(balance.value) / 10 ** balance.decimals).toFixed(2)} {balance.symbol}
            </span>
          )}
        </button>
        <a
          href="https://faucet.circle.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs"
          style={{ color: "var(--accent)", opacity: 0.6 }}
        >
          Get test USDC ↗
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: "var(--accent)",
        color: "#0a0a0a",
      }}
    >
      <Wallet size={15} />
      <span>Connect</span>
    </button>
  );
}
