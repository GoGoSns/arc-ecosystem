export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const USDC_DECIMALS = 6;

export function formatUSDC(amount: bigint): string {
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole}.${fractionStr}`;
}

export function parseUSDC(amount: string): bigint {
  const [whole = "0", fraction = "0"] = amount.split(".");
  const paddedFraction = fraction.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, "0");
  return BigInt(whole) * BigInt(10 ** USDC_DECIMALS) + BigInt(paddedFraction);
}
