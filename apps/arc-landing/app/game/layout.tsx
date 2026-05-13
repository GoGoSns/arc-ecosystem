import Link from 'next/link';
import type { ReactNode } from 'react';
import { Gamepad2 } from 'lucide-react';

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
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/game" className="flex min-w-0 items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center border border-[#c9a84c]/60 bg-white/[0.02]">
              <Gamepad2 size={15} className="text-[#c9a84c]" aria-hidden="true" />
            </span>
            <span className="truncate">Arc Game Hub</span>
          </Link>

          <div
            className="flex min-w-0 flex-1 items-center justify-start gap-4 overflow-x-auto whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-[#777] sm:justify-center sm:gap-6"
            aria-label="Game navigation"
          >
            <Link href="/game" className="text-white">
              Hub
            </Link>
            <Link href="/game/challenges" className="nav-link">
              Challenges
            </Link>
            <Link href="/game/lucky" className="nav-link">
              Lucky
            </Link>
            <Link href="/game/quiz-pot" className="nav-link">
              Quiz Pot
            </Link>
            <Link href="/game/history" className="nav-link">
              History
            </Link>
          </div>

          <Link href="/" className="bracket-button shrink-0">
            Arc Home
          </Link>
        </div>
      </nav>

      <div className="relative">{children}</div>
    </main>
  );
}
