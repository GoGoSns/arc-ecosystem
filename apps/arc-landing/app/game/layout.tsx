import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';

export default function GameLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#070707] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.12),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(201,168,76,0.06),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,168,76,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />
      <SiteHeader />

      <div className="relative">{children}</div>
    </main>
  );
}
