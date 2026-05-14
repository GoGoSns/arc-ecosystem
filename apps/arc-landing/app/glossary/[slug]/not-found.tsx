import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

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

export default function GlossaryTermNotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-4xl">
          <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12">
            <Brackets />
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// glossary</p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">
              TERM <span className="text-[#c9a84c]">NOT FOUND</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
              The term you were looking for is not in the glossary index yet. Return to the glossary list and try another term.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/glossary" className="primary-button">
                <BookOpen size={16} />
                OPEN GLOSSARY
              </Link>
              <Link href="/" className="secondary-button">
                <ArrowLeft size={16} />
                BACK HOME
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
