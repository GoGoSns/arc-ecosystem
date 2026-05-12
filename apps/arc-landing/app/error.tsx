'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import AppSwitcher from '@/components/AppSwitcher';
import { ArrowLeft, RefreshCcw, ShieldAlert } from 'lucide-react';

function Brackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="hidden items-center gap-6 font-mono text-xs uppercase text-[#777] md:flex">
            <span className="text-white">ERROR</span>
            <span className="nav-link">RECOVERABLE STATE</span>
          </div>
          <AppSwitcher />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-4xl">
          <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
            <Brackets />
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">
              <ShieldAlert size={16} />
              application error
            </div>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              SOMETHING <span className="text-[#c9a84c]">BROKE</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
              The landing app hit an unexpected error. Retry the page or jump back to a stable route.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={reset} className="primary-button">
                <RefreshCcw size={16} />
                TRY AGAIN
              </button>
              <Link href="/" className="secondary-button">
                <ArrowLeft size={16} />
                BACK HOME
              </Link>
            </div>

            {error.digest ? (
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
                Error digest: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
