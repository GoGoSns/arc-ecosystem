'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Filter,
  Layers3,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  hubInputClass,
  hubSelectClass,
} from '@/components/HubPrimitives';
import {
  GLOSSARY_TERMS,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@/lib/glossaryStore';

type DifficultyFilter = GlossaryTerm['difficulty'] | 'all';
type LetterFilter = 'all' | string;

const CATEGORY_OPTIONS: Array<{ id: GlossaryCategory | 'all'; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'blockchain', label: 'BLOCKCHAIN' },
  { id: 'defi', label: 'DEFI' },
  { id: 'security', label: 'SECURITY' },
  { id: 'wallet', label: 'WALLET' },
  { id: 'infrastructure', label: 'INFRASTRUCTURE' },
  { id: 'governance', label: 'GOVERNANCE' },
];

const DIFFICULTY_OPTIONS: Array<{ id: DifficultyFilter; label: string }> = [
  { id: 'all', label: 'ALL DIFFICULTIES' },
  { id: 'beginner', label: 'BEGINNER' },
  { id: 'intermediate', label: 'INTERMEDIATE' },
  { id: 'advanced', label: 'ADVANCED' },
];

const ALPHABET = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));

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

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [activeLetter, setActiveLetter] = useState<LetterFilter>('all');

  const filteredByText = useMemo(() => {
    const query = search.trim().toLowerCase();

    return GLOSSARY_TERMS.filter((term) => {
      const matchesCategory = category === 'all' || term.category === category;
      const matchesDifficulty = difficulty === 'all' || term.difficulty === difficulty;
      const haystack = [
        term.term,
        term.shortDefinition,
        term.fullDefinition,
        CATEGORY_LABELS[term.category],
        term.related.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [category, difficulty, search]);

  const filteredTerms = useMemo(() => {
    if (activeLetter === 'all') {
      return filteredByText;
    }

    return filteredByText.filter((term) => term.term[0].toUpperCase() === activeLetter);
  }, [activeLetter, filteredByText]);

  const letterCounts = useMemo(
    () =>
      Object.fromEntries(
        ALPHABET.map((letter) => [
          letter,
          filteredByText.filter((term) => term.term[0].toUpperCase() === letter).length,
        ]),
      ) as Record<string, number>,
    [filteredByText],
  );

  const stats = useMemo(
    () => ({
      total: GLOSSARY_TERMS.length,
      categories: new Set(GLOSSARY_TERMS.map((term) => term.category)).size,
      beginner: GLOSSARY_TERMS.filter((term) => term.difficulty === 'beginner').length,
      advanced: GLOSSARY_TERMS.filter((term) => term.difficulty === 'advanced').length,
    }),
    [],
  );

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setDifficulty('all');
    setActiveLetter('all');
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">// glossary</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                ARC <span className="text-[#d4af37]">GLOSSARY</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
                A living reference for the Web3, wallet, governance, and stablecoin terms used across Arc landing pages and the wider ecosystem.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/learn" className="primary-button">
                  OPEN LEARN <ArrowRight size={16} />
                </Link>
                <Link href="/" className="secondary-button">
                  BACK HOME
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HubMetricCard label="TERMS" value={stats.total} icon={BookOpen} />
              <HubMetricCard label="CATEGORIES" value={stats.categories} icon={Layers3} />
              <HubMetricCard label="BEGINNER" value={stats.beginner} icon={Sparkles} />
              <HubMetricCard label="ADVANCED" value={stats.advanced} icon={Shield} />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <HubCard as="section" className="p-6 sm:p-8">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                <div className="relative">
                  <label htmlFor="glossary-search" className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                    Search
                  </label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555566]" size={16} />
                    <input
                      id="glossary-search"
                      aria-label="Search glossary terms"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search terms, definitions, or related concepts"
                      className={`w-full py-3.5 !pl-11 !pr-4 ${hubInputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="glossary-category" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                    Category
                  </label>
                  <select
                    id="glossary-category"
                    aria-label="Filter glossary by category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as GlossaryCategory | 'all')}
                    className={`min-w-[190px] ${hubSelectClass}`}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="glossary-difficulty" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                    Difficulty
                  </label>
                  <select
                    id="glossary-difficulty"
                    aria-label="Filter glossary by difficulty"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
                    className={`min-w-[190px] ${hubSelectClass}`}
                  >
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </HubCard>

            <HubCard as="section" className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// a-z index</p>
                  <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Quick index</h2>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Jump by first letter or scan the counts to see where the glossary is densest.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bracket-button shrink-0"
                >
                  RESET
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={activeLetter === 'all'}
                  onClick={() => setActiveLetter('all')}
                  className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    activeLetter === 'all'
                      ? 'border-[#d4af37] bg-[#d4af37] text-black'
                      : 'border-[#1a1a2e] text-[#555566] hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                  }`}
                >
                  ALL
                </button>
                {ALPHABET.map((letter) => {
                  const count = letterCounts[letter] ?? 0;
                  const active = activeLetter === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveLetter(letter)}
                      className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                        active
                          ? 'border-[#d4af37] bg-[#d4af37] text-black'
                          : 'border-[#1a1a2e] text-[#555566] hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                      } ${count === 0 && !active ? 'opacity-40' : ''}`}
                    >
                      {letter} <span className="ml-1 text-[9px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </HubCard>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">
            <p>
              Showing <span className="text-[#d4af37]">{filteredTerms.length}</span> of {GLOSSARY_TERMS.length} terms
            </p>
            <div className="flex flex-wrap gap-2">
              {search ? <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f2d58b]">SEARCH</HubBadge> : null}
              {category !== 'all' ? <HubBadge>{CATEGORY_LABELS[category]}</HubBadge> : null}
              {difficulty !== 'all' ? <HubBadge>{difficulty.toUpperCase()}</HubBadge> : null}
              {activeLetter !== 'all' ? <HubBadge>{activeLetter}</HubBadge> : null}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTerms.map((term) => (
              <Link key={term.id} href={`/glossary/${term.slug}`} className="group block h-full">
                <HubCard as="article" className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d4af37]">
                        {CATEGORY_LABELS[term.category]}
                      </p>
                      <h3 className="mt-3 text-2xl font-black leading-tight">{term.term}</h3>
                    </div>
                    <HubBadge className={DIFFICULTY_BADGE_CLASSES[term.difficulty]}>
                      {term.difficulty.toUpperCase()}
                    </HubBadge>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#8a8a9a]">{term.shortDefinition}</p>

                  <div className="mt-6 flex items-center justify-between border-t border-[#1a1a2e] pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#555566]">
                    <span>{term.related.length} related</span>
                    <span className="inline-flex items-center gap-1 text-[#d4af37] transition-transform group-hover:translate-x-0.5">
                      OPEN <ArrowRight size={14} />
                    </span>
                  </div>
                </HubCard>
              </Link>
            ))}

            {filteredTerms.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3">
                <HubEmptyState
                  icon={Filter}
                  title="No glossary terms found"
                  description="Adjust the search, category, difficulty, or A-Z index to reveal more terms."
                >
                  <button type="button" onClick={clearFilters} className="primary-button">
                    RESET FILTERS
                  </button>
                </HubEmptyState>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
