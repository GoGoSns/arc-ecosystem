import { getAddress } from 'viem';

const ADMIN_WALLET = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

async function sendUSDC(toAddress: string, amount: string): Promise<{ txHash: string; explorerUrl: string }> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("MetaMask provider not found");

  // Circle AppKit ve Viem Adaptörünü dinamik yükle
  const { AppKit } = await import('@circle-fin/app-kit');
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');

  const kit = new AppKit();
  
  // Sağlayıcıyı (MetaMask) temiz bir şekilde Viem adaptörüne bağla
  const adapter = await createViemAdapterFromProvider({
    provider: eth,
  });

  // Arc Testnet parametrelerini explicit (açıkça) göndererek AppKit RPC uyuşmazlığını çözüyoruz
  const res = await kit.send({
    from: { 
      adapter, 
      chain: {
        id: 5042002, // Arc Testnet resmi Chain ID'si
        name: 'Arc Testnet',
        rpcUrl: 'https://rpc.testnet.arc.network',
        nativeCurrency: { name: 'Arc', symbol: 'ARC', decimals: 18 }
      } as any
    },
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

export async function payToAdmin(amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  if (isLocalhost()) {
    return { success: true, txHash: 'mock-tx-' + Date.now(), explorerUrl: '' };
  }
  try {
    const result = await sendUSDC(ADMIN_WALLET, String(amount));
    return { success: true, txHash: result.txHash, explorerUrl: result.explorerUrl };
  } catch (e: any) {
    console.error("Transaction Core Error:", e);
    return { success: false, error: e?.message || 'RPC endpoint error on Arc Testnet' };
  }
}

export async function payFromAdmin(toAddress: string, amount: number): Promise<{ success: boolean; txHash?: string; explorerUrl?: string; error?: string }> {
  return { success: true, txHash: 'pending-payout-' + Date.now(), explorerUrl: '' };
}

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
