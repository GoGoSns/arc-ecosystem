import Link from 'next/link';
import { ArrowLeft, CalendarDays, Home, Search } from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import BrandLogo from '@/components/BrandLogo';
import SiteHeader from '@/components/SiteHeader';

export default function NotFound() {
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
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">// 404</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              EVENT <span className="text-[#d4af37]">NOT FOUND</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
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

            <div className="mt-10 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#555566]">
              <span className="rounded-full border border-[#1a1a2e] px-3 py-1">LOCAL MOCK DATA</span>
              <span className="rounded-full border border-[#1a1a2e] px-3 py-1">NO BACKEND CALLS</span>
              <span className="rounded-full border border-[#1a1a2e] px-3 py-1">ARC CALENDAR</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
