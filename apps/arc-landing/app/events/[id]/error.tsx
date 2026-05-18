'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, RefreshCcw, ShieldAlert } from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import BrandLogo from '@/components/BrandLogo';
import SiteHeader from '@/components/SiteHeader';

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
    <main className="min-h-screen bg-[#050508] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-4xl">
          <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">
              <ShieldAlert size={16} />
              event detail error
            </div>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              EVENT <span className="text-[#d4af37]">BROKE</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
              The event detail page hit an unexpected error. Retry the page or jump back to a stable route.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={reset} className="primary-button">
                <RefreshCcw size={16} />
                TRY AGAIN
              </button>
              <Link href="/events" className="secondary-button">
                <ArrowLeft size={16} />
                BACK TO EVENTS
              </Link>
            </div>

            {error.digest ? (
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">
                Error digest: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
