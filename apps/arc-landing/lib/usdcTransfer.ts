import { getAddress } from 'viem';

const ADMIN_WALLET = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

// Check if we're on localhost (Circle AppKit only works on Vercel)
function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// The EXACT working pattern from arc-pay
async function sendUSDC(toAddress: string, amount: string): Promise<{ txHash: string; explorerUrl: string }> {
  const { AppKit } = await import('@circle-fin/app-kit');
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');
  
  const kit = new AppKit();
  const adapter = await createViemAdapterFromProvider({
    provider: (window as any).ethereum,
  });
  
  const res = await kit.send({
    from: { adapter, chain: 'Arc_Testnet' as never },
    to: toAddress,
    amount,
    token: 'USDC',
  });
  
  const txHash = (res as any)?.hash || (res as any)?.txHash || '';
  return {
    txHash,
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
  };
}

// User pays admin (for bets, entry fees, wagers)
export async function payToAdmin(amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  if (isLocalhost()) {
    // Mock on localhost — Circle AppKit doesn't work locally
    return { success: true, txHash: 'mock-tx-' + Date.now(), explorerUrl: '' };
  }
  
  try {
    const result = await sendUSDC(ADMIN_WALLET, String(amount));
    return { success: true, txHash: result.txHash, explorerUrl: result.explorerUrl };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Transaction failed' };
  }
}

// Admin pays user (for winnings — simulated on frontend, real on Vercel requires backend)
export async function payFromAdmin(toAddress: string, amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  if (isLocalhost()) {
    return { success: true, txHash: 'mock-payout-' + Date.now(), explorerUrl: '' };
  }
  
  // On Vercel: this would need a backend API to sign from admin wallet
  // For now, simulate success and track in local store
  return { success: true, txHash: 'pending-payout-' + Date.now(), explorerUrl: '' };
}

// Get real USDC balance from Arc Testnet
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const res = await fetch('https://rpc.testnet.arc.network', {
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
    const balanceWei = BigInt(data.result || '0');
    return Number(balanceWei) / 1e18;
  } catch {
    return 0;
  }
}

export function explorerUrl(txHash: string): string {
  return `https://testnet.arcscan.app/tx/${txHash}`;
}

export const USE_REAL_TRANSFERS = !isLocalhost();
