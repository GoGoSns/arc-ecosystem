import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { GameWalletStrip } from '@/components/GameWalletStrip';

export default function GameLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#070707] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212, 175, 55,0.12),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(212, 175, 55,0.06),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(212, 175, 55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212, 175, 55,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />
      <SiteHeader />
      <GameWalletStrip />

      {/* Reserve space for the 64px header plus the 44px wallet strip. */}
      <div className="relative pt-[108px]">{children}</div>
    </main>
  );
}
