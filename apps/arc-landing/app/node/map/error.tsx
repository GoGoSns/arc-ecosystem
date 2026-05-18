'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, RefreshCcw, ShieldAlert } from 'lucide-react';

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
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-[#1a1a2e] bg-[linear-gradient(135deg,rgba(212, 175, 55,0.06),transparent_32%),rgba(255,255,255,0.02)] p-6 sm:p-10 lg:p-12">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />

            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">
              <ShieldAlert size={16} />
              node map route error
            </div>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              NODE MAP <span className="text-[#d4af37]">BROKE</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
              The node operator map hit an unexpected error. Retry the page or return to the Node
              Hub to continue exploring the network.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={reset} className="primary-button">
                <RefreshCcw size={16} />
                TRY AGAIN
              </button>
              <Link href="/node" className="secondary-button">
                <ArrowLeft size={16} />
                BACK TO NODE HUB
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
