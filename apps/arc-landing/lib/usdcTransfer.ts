import { getAddress } from 'viem';

const ADMIN_WALLET = getAddress('0xB87B774a5b3D77E13a89C68F62810D5a23404365');

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

const ARC_CHAIN_ID = 5042002;
const ARC_RPC_URL = 'https://rpc.testnet.arc.network';

async function sendUSDC(toAddress: string, amount: string): Promise<{ txHash: string; explorerUrl: string }> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("MetaMask provider not found. Please install MetaMask to continue.");

  // Preflight: Check Network
  const chainId = await eth.request({ method: 'eth_chainId' });
  if (parseInt(chainId, 16) !== ARC_CHAIN_ID) {
    throw new Error(`Incorrect Network: Please switch your wallet to Arc Testnet (Chain ID: ${ARC_CHAIN_ID})`);
  }

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
        id: ARC_CHAIN_ID,
        name: 'Arc Testnet',
        rpcUrl: ARC_RPC_URL,
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }
      } as any
    },
    to: toAddress,
    amount,
    token: 'USDC',
  });

  const txHash = (res as any)?.hash || (res as any)?.txHash || '';
  if (!txHash) throw new Error("Transaction failed: No hash returned from network.");
  
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
