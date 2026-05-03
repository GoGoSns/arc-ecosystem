export async function sendUSDC(
  toAddress: string,
  amount: string
): Promise<{ txHash: string; explorerUrl: string }> {
  const { AppKit } = await import("@circle-fin/app-kit");
  const { createViemAdapterFromProvider } = await import(
    "@circle-fin/adapter-viem-v2"
  );

  const kit = new AppKit();
  const adapter = await createViemAdapterFromProvider({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: (window as any).ethereum,
  });

  const res = await kit.send({
    from: { adapter, chain: "Arc_Testnet" as never },
    to: toAddress,
    amount,
    token: "USDC",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txHash = (res as any)?.hash || (res as any)?.txHash || "";
  return {
    txHash,
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
  };
}
