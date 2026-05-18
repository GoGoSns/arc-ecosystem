import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Layers3, Shield, Sparkles } from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';
import {
  GLOSSARY_TERMS,
  getGlossaryRelatedTerms,
  getGlossaryTermBySlug,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@/lib/glossaryStore';

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  blockchain: 'BLOCKCHAIN',
  defi: 'DEFI',
  security: 'SECURITY',
  wallet: 'WALLET',
  infrastructure: 'INFRASTRUCTURE',
  governance: 'GOVERNANCE',
};

const CATEGORY_BADGE_CLASSES: Record<GlossaryCategory, string> = {
  blockchain: 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f2d58b]',
  defi: 'border-[#60a5fa]/25 bg-[#60a5fa]/10 text-[#bfdbfe]',
  security: 'border-[#f87171]/25 bg-[#f87171]/10 text-[#fecaca]',
  wallet: 'border-[#34d399]/25 bg-[#34d399]/10 text-[#bbf7d0]',
  infrastructure: 'border-[#94a3b8]/25 bg-[#94a3b8]/10 text-[#e2e8f0]',
  governance: 'border-[#a78bfa]/25 bg-[#a78bfa]/10 text-[#ddd6fe]',
};

const DIFFICULTY_BADGE_CLASSES: Record<GlossaryTerm['difficulty'], string> = {
  beginner: 'border-[#30d158]/25 bg-[#30d158]/10 text-[#bbf7c8]',
  intermediate: 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5dd94]',
  advanced: 'border-[#f87171]/25 bg-[#f87171]/10 text-[#fecaca]',
};

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

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((term) => ({ slug: term.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const term = getGlossaryTermBySlug(params.slug);

  if (!term) {
    return {
      title: 'Glossary | Arc Ecosystem',
      description: 'A glossary of Web3 and Arc ecosystem terms.',
    };
  }

  return {
    title: `${term.term} | Arc Glossary`,
    description: term.shortDefinition,
  };
}

export default function GlossaryTermPage({ params }: { params: { slug: string } }) {
  const term = getGlossaryTermBySlug(params.slug);

  if (!term) {
    notFound();
  }

  const relatedTerms = getGlossaryRelatedTerms(term);
  const addedOn = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(term.createdAt));

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">// glossary / definition</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                {term.term.split(' ')[0]} <span className="text-[#d4af37]">{term.term.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
                {term.shortDefinition}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/glossary" className="primary-button">
                  <ArrowLeft size={16} />
                  BACK TO INDEX
                </Link>
                <Link href="/learn" className="secondary-button">
                  OPEN LEARN
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard icon={Layers3} label="CATEGORY" value={CATEGORY_LABELS[term.category]} />
              <MetricCard icon={Sparkles} label="DIFFICULTY" value={term.difficulty.toUpperCase()} />
              <MetricCard icon={BookOpen} label="RELATED" value={String(relatedTerms.length)} />
              <MetricCard icon={Shield} label="ADDED" value={addedOn} />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <Brackets />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// full definition</p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Definition</h2>
            <p className="mt-6 text-base leading-8 text-[#d8d8d8] sm:text-lg sm:leading-9">
              {term.fullDefinition}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${CATEGORY_BADGE_CLASSES[term.category]}`}>
                {CATEGORY_LABELS[term.category]}
              </span>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${DIFFICULTY_BADGE_CLASSES[term.difficulty]}`}>
                {term.difficulty.toUpperCase()}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#1a1a2e] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                {term.related.length} RELATED
              </span>
            </div>
          </article>

          <aside className="space-y-6">
            <section className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <Brackets />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// related</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Related terms</h2>
              <div className="mt-6 space-y-3">
                {relatedTerms.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/glossary/${related.slug}`}
                    className="group flex items-start gap-4 rounded-2xl border border-[#1a1a2e] bg-black/25 p-4 transition-colors hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#d4af37]">
                        {CATEGORY_LABELS[related.category]}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-tight">{related.term}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#8a8a9a]">{related.shortDefinition}</p>
                    </div>
                    <ArrowRight className="mt-1 shrink-0 text-[#d4af37] transition-transform group-hover:translate-x-1" size={16} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <Brackets />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// context</p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Glossary context</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-[#8a8a9a]">
                <p>Use this term as a reference point when reading product pages, guides, and ecosystem modules.</p>
                <p>Related terms connect the glossary into a web, making it easier to move from one concept to the next.</p>
                <p>If you want the hands-on version, open Learn to see these concepts in action across Arc flows.</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="bracket-card relative overflow-hidden rounded-3xl p-5">
      <Brackets />
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">
        <Icon size={14} className="text-[#d4af37]" />
        {label}
      </div>
      <div className="mt-3 text-xl font-black uppercase leading-tight text-white sm:text-2xl">{value}</div>
    </div>
  );
}
