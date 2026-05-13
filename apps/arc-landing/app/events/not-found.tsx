import Link from 'next/link';
import { ArrowLeft, CalendarDays, Home, Search } from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';

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
            <span className="nav-link">EVENT NOT FOUND</span>
          </div>
          <AppSwitcher />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-4xl">
          <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// 404</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              EVENT <span className="text-[#c9a84c]">NOT FOUND</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
              The event you requested is not in the local calendar store. Use the links below to return to a working page.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/events" className="primary-button">
                <CalendarDays size={16} />
                BACK TO EVENTS
              </Link>
              <Link href="/" className="secondary-button">
                <Home size={16} />
                BACK HOME
              </Link>
              <Link href="/learn" className="secondary-button">
                <Search size={16} />
                OPEN LEARN
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#777]">
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">LOCAL MOCK DATA</span>
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">NO BACKEND CALLS</span>
              <span className="rounded-full border border-[#2a2a2a] px-3 py-1">ARC CALENDAR</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
