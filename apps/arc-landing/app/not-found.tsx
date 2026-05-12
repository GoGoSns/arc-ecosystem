import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import { ArrowLeft, BookOpen, Home, Search } from 'lucide-react';

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

export default function NotFound() {
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
            <span className="text-white">404</span>
            <span className="nav-link">PAGE NOT FOUND</span>
          </div>
          <AppSwitcher />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-4xl">
          <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
            <Brackets />
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// 404</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              PAGE <span className="text-[#c9a84c]">NOT FOUND</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
              The route you requested does not exist in the Arc landing experience. Use the links below to get back to a working page.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/" className="primary-button">
                <Home size={16} />
                BACK HOME
              </Link>
              <Link href="/glossary" className="secondary-button">
                <BookOpen size={16} />
                OPEN GLOSSARY
              </Link>
              <Link href="/learn" className="secondary-button">
                <Search size={16} />
                OPEN LEARN
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#777]">
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">INFORMATIONAL ONLY</span>
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">NO WALLET FLOW</span>
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">ARC GOLD CYBER-FINTECH</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
