const ADMIN_WALLET = '0xB87B774a5b3D77E13a89C68F62810D5a23404365';
const ARC_RPC = 'https://rpc.testnet.arc.network';
const DECIMALS = 18;

export const USE_REAL_TRANSFERS = typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

export function explorerUrl(txHash: string): string {
  return `https://testnet.arcscan.app/tx/${txHash}`;
}

/**
 * User pays USDC into the admin wallet (entry fee, wager, bet).
 * Uses Circle AppKit via the connected MetaMask wallet.
 * Falls back to mock success when CIRCLE_KIT_KEY is absent.
 */
export async function payToAdmin(amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!USE_REAL_TRANSFERS) {
    return { success: true };
  }

  try {
    const { AppKit } = await import('@circle-fin/app-kit');
    const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');

    const kit = new AppKit();
    const adapter = await createViemAdapterFromProvider({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: (window as any).ethereum,
    });

    const res = await kit.send({
      from: { adapter, chain: 'Arc_Testnet' as never },
      to: ADMIN_WALLET,
      amount: String(amount),
      token: 'USDC',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txHash = (res as any)?.hash || (res as any)?.txHash || '';
    return { success: true, txHash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transaction failed. Please try again.';
    return { success: false, error: msg };
  }
}

/**
 * Admin pays USDC to a user address (winnings, claims, rewards).
 * On the frontend this simulates success — a real backend signer would be
 * needed in production. The mock balance is updated by the calling page.
 */
export async function payFromAdmin(
  toAddress: string,
  amount: number,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  // In a production system this would call a server action with admin signer.
  // For the demo, we simulate the payout and update mock balance on the client.
  void toAddress;
  void amount;
  return { success: true };
}

/**
 * Returns the USDC balance for an address on Arc Testnet.
 * Arc Testnet native currency IS USDC (18 decimals).
 */
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const response = await fetch(ARC_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    const data = (await response.json()) as { result?: string };
    if (!data.result) return 0;
    const wei = BigInt(data.result);
    return Number(wei) / 10 ** DECIMALS;
  } catch {
    return 0;
  }
}
