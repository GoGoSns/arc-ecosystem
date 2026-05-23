import { getAddress } from 'viem';

const ADMIN_WALLET = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

const ARC_CHAIN_ID = 5042002;
const ARC_RPC_URL = 'https://rpc.drpc.testnet.arc.network';

async function sendUSDC(toAddress: string, amount: string): Promise<{ txHash: string; explorerUrl: string }> {
  // Reference implementation from arc-payouts
  const { AppKit } = await import('@circle-fin/app-kit');
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');

  const kit = new AppKit();
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("MetaMask provider not found.");

  const adapter = await createViemAdapterFromProvider({
    provider: eth
  });

  if (!adapter) throw new Error("Failed to create wallet adapter.");

  // Payload shape exactly matching working reference
  const payload = {
    from: {
      adapter,
      chain: 'Arc_Testnet' as never
    },
    to: toAddress,
    amount: amount,
    token: 'USDC'
  };

  // Dev log for payload verification
  if (process.env.NODE_ENV === 'development' || isLocalhost()) {
    console.log("[sendUSDC] kit.send payload keys:", Object.keys(payload));
    console.log("[sendUSDC] kit.send from shape:", { 
      hasAdapter: !!(payload.from as any).adapter, 
      chain: (payload.from as any).chain 
    });
  }

  const res = await kit.send(payload);

  const txHash = (res as any)?.hash || (res as any)?.txHash || '';
  if (!txHash) throw new Error("Transaction failed: No hash returned.");
  
  return {
    txHash,
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
  };
}

export async function payToAdmin(amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  if (isLocalhost()) {
    return { success: true, txHash: 'mock-tx-' + Date.now(), explorerUrl: '' };
  }
  
  if (amount <= 0) {
    return { success: false, error: "Invalid amount: Must be greater than 0" };
  }

  try {
    const result = await sendUSDC(ADMIN_WALLET, String(amount));
    return { success: true, txHash: result.txHash, explorerUrl: result.explorerUrl };
  } catch (e: any) {
    console.error("Transaction Core Error:", e);
    let errorMsg = e?.message || 'Unknown RPC error on Arc Testnet';
    if (errorMsg.includes('user rejected')) errorMsg = "Transaction rejected by user.";
    return { success: false, error: errorMsg };
  }
}

export async function payFromAdmin(toAddress: string, amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  return { success: true, txHash: 'pending-payout-' + Date.now(), explorerUrl: '' };
}

export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const res = await fetch(ARC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const balanceWei = BigInt(data.result || '0');
    return Number(balanceWei) / 1e18;
  } catch (e) {
    console.error("Balance fetch error:", e);
    return 0;
  }
}

export function explorerUrl(txHash: string): string {
  return `https://testnet.arcscan.app/tx/${txHash}`;
}

export const USE_REAL_TRANSFERS = !isLocalhost();
