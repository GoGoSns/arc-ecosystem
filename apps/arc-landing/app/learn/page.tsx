'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  Layers3,
  Search,
  Trophy,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';
import { HubBrackets, HubEmptyState, HubMetricCard, hubInputClass, hubSelectClass } from '@/components/HubPrimitives';
import { useWallet } from '@/contexts/WalletContext';
import {
  LESSONS,
  useLearnStore,
  type LearnCategory,
  type LearnLevel,
} from '@/lib/learnStore';

type SortMode = 'recommended' | 'xp' | 'newest';
type StatusFilter = 'all' | 'available' | 'completed' | 'bookmarked';

const CATEGORY_LABELS: Record<LearnCategory, string> = {
  basics: 'BASICS',
  payments: 'PAYMENTS',
  creator: 'CREATOR',
  community: 'COMMUNITY',
  builder: 'BUILDER',
  play: 'PLAY',
};

const LEVEL_LABELS: Record<LearnLevel, string> = {
  intro: 'INTRO',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
};

const LEVEL_ORDER: Record<LearnLevel, number> = {
  intro: 0,
  intermediate: 1,
  advanced: 2,
};

const CATEGORY_OPTIONS: Array<{ id: LearnCategory | 'all'; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'basics', label: 'BASICS' },
  { id: 'payments', label: 'PAYMENTS' },
  { id: 'creator', label: 'CREATOR' },
  { id: 'community', label: 'COMMUNITY' },
  { id: 'builder', label: 'BUILDER' },
  { id: 'play', label: 'PLAY' },
];

const LEVEL_OPTIONS: Array<{ id: LearnLevel | 'all'; label: string }> = [
  { id: 'all', label: 'ALL LEVELS' },
  { id: 'intro', label: 'INTRO' },
  { id: 'intermediate', label: 'INTERMEDIATE' },
  { id: 'advanced', label: 'ADVANCED' },
];

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'available', label: 'AVAILABLE' },
  { id: 'completed', label: 'COMPLETED' },
  { id: 'bookmarked', label: 'BOOKMARKED' },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'recommended', label: 'RECOMMENDED' },
  { id: 'xp', label: 'XP' },
  { id: 'newest', label: 'NEWEST' },
];

export default function LearnPage() {
  const { address, isConnected, connect } = useWallet();
  const { lessons, getProgress, completeLesson, toggleBookmark } = useLearnStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LearnCategory | 'all'>('all');
  const [level, setLevel] = useState<LearnLevel | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('recommended');

  const progress = address ? getProgress(address) : null;
  const viewer = address?.toLowerCase() ?? 'arc-learn-viewer';

  const filteredLessons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lessons
      .filter((lesson) => {
        const matchesCategory = category === 'all' || lesson.category === category;
        const matchesLevel = level === 'all' || lesson.level === level;
        const haystack = [lesson.title, lesson.description, lesson.steps.join(' '), lesson.resourceUrl ?? ''].join(' ').toLowerCase();
        const matchesSearch = !query || haystack.includes(query);

        const completed = progress?.completedLessons.includes(lesson.id) ?? false;
        const bookmarked = progress?.bookmarkedLessons.includes(lesson.id) ?? false;
        const matchesStatus =
          status === 'all' ||
          (status === 'available' && !completed) ||
          (status === 'completed' && completed) ||
          (status === 'bookmarked' && bookmarked);

        return matchesCategory && matchesLevel && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'xp') return b.xp - a.xp || b.createdAt - a.createdAt;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        const scoreA = LEVEL_ORDER[a.level] * 100 + a.xp + (progress?.completedLessons.includes(a.id) ? -25 : 25);
        const scoreB = LEVEL_ORDER[b.level] * 100 + b.xp + (progress?.completedLessons.includes(b.id) ? -25 : 25);
        return scoreA - scoreB || b.createdAt - a.createdAt;
      });
  }, [category, lessons, level, progress, search, sortBy, status]);

  const progressPercent = progress ? Math.round((progress.completedLessons.length / lessons.length) * 100) : 0;
  const nextLesson = filteredLessons.find((lesson) => !(progress?.completedLessons.includes(lesson.id) ?? false)) ?? filteredLessons[0];

  const stats = useMemo(
    () => ({
      total: lessons.length,
      completed: progress?.completedLessons.length ?? 0,
      bookmarked: progress?.bookmarkedLessons.length ?? 0,
      xp: progress?.totalXp ?? 0,
    }),
    [lessons.length, progress],
  );

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setLevel('all');
    setStatus('all');
    setSortBy('recommended');
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37]">// learn</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                ARC <span className="text-[#d4af37]">LEARN</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#8a8a9a]">
                Follow a structured path through the ecosystem, earn XP, and keep track of what you have completed or bookmarked.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/quests" className="primary-button">
                  OPEN QUESTS <ArrowRight size={16} />
                </Link>
                <Link href="/value" className="secondary-button">
                  CHECK VALUE
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HubMetricCard label="LESSONS" value={stats.total} icon={BookOpen} />
              <HubMetricCard label="COMPLETED" value={stats.completed} icon={CheckCircle2} />
              <HubMetricCard label="BOOKMARKS" value={stats.bookmarked} icon={Bookmark} />
              <HubMetricCard label="XP" value={stats.xp} icon={Trophy} />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-5">
              <div className="bracket-card rounded-3xl p-5 sm:p-6">
                <HubBrackets />
                <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                  <div className="relative">
                    <label className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Search</label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555566]" size={16} />
                      <input
                        aria-label="Search lessons"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search lessons, steps, or resources"
                        className={`w-full ${hubInputClass} py-3.5 !pl-11 !pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                      Category
                    </label>
                    <select
                      aria-label="Filter lesson category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as LearnCategory | 'all')}
                      className={`min-w-[180px] ${hubSelectClass}`}
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                      Level
                    </label>
                    <select
                      aria-label="Filter lesson level"
                      value={level}
                      onChange={(event) => setLevel(event.target.value as LearnLevel | 'all')}
                      className={`min-w-[170px] ${hubSelectClass}`}
                    >
                      {LEVEL_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortBy(option.id)}
                    className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                      sortBy === option.id
                        ? 'border-[#d4af37] bg-[#d4af37] text-black'
                        : 'border-[#1a1a2e] text-[#555566] hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStatus(option.id)}
                    className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                      status === option.id
                        ? 'border-[#d4af37] bg-[#d4af37] text-black'
                        : 'border-[#1a1a2e] text-[#555566] hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredLessons.map((lesson) => {
                  const completed = progress?.completedLessons.includes(lesson.id) ?? false;
                  const bookmarked = progress?.bookmarkedLessons.includes(lesson.id) ?? false;
                  const levelColor =
                    lesson.level === 'intro' ? '#4ade80' : lesson.level === 'intermediate' ? '#d4af37' : '#a78bfa';
                  const resourceInternal = lesson.resourceUrl?.startsWith('/');

                  return (
                    <article
                      key={lesson.id}
                      className={`bracket-card flex min-h-[320px] flex-col rounded-3xl p-6 transition-colors ${
                        completed ? 'opacity-75' : ''
                      }`}
                    >
                      <HubBrackets />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d4af37]">
                            {CATEGORY_LABELS[lesson.category]}
                          </p>
                          <h3 className="mt-3 text-2xl font-black leading-tight">{lesson.title}</h3>
                          <p className="mt-2 text-sm text-[#555566]">{lesson.duration} · {lesson.xp} XP</p>
                        </div>
                        <span
                          className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                          style={{ borderColor: `${levelColor}40`, color: levelColor, background: `${levelColor}12` }}
                        >
                          {LEVEL_LABELS[lesson.level]}
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#8a8a9a]">{lesson.description}</p>

                      <ol className="mt-5 space-y-2">
                        {lesson.steps.map((step, index) => (
                          <li
                            key={step}
                            className="flex items-start gap-3 rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3 text-sm text-[#cfcfcf]"
                          >
                            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#555566]">
                              0{index + 1}
                            </span>
                            <span className="leading-6">{step}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555566]">
                          <span>{completed ? 'Completed' : 'Available'}</span>
                          <span>{bookmarked ? 'Saved' : 'Unsaved'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isConnected ? (
                            <button type="button" onClick={connect} className="bracket-button">
                              CONNECT
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleBookmark(viewer, lesson.id)}
                                className="rounded-full border border-[#1a1a2e] p-2 text-[#ddd] transition-colors hover:border-[#d4af37]/60 hover:text-[#d4af37]"
                                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
                              >
                                {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                              </button>
                              {completed ? (
                                <span className="rounded-full border border-[#1a1a2e] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#d4af37]">
                                  COMPLETED
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => completeLesson(viewer, lesson.id)}
                                  className="rounded-full border border-[#d4af37] bg-[#d4af37] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-black transition-colors hover:opacity-90"
                                >
                                  COMPLETE
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {lesson.resourceUrl ? (
                        <div className="mt-4">
                          {resourceInternal ? (
                            <Link href={lesson.resourceUrl} className="feature-link justify-between">
                              <span>OPEN RESOURCE</span>
                              <ArrowRight className="feature-arrow" size={16} />
                            </Link>
                          ) : (
                            <a href={lesson.resourceUrl} target="_blank" rel="noopener noreferrer" className="feature-link justify-between">
                              <span>OPEN RESOURCE</span>
                              <ArrowRight className="feature-arrow" size={16} />
                            </a>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}

                {filteredLessons.length === 0 ? (
                  <div className="md:col-span-2">
                    <HubEmptyState
                      icon={Layers3}
                      title="No lessons match the filter"
                      description="Adjust your filters or clear search to bring the path back."
                    >
                      <button type="button" onClick={resetFilters} className="primary-button">
                        RESET FILTERS
                      </button>
                    </HubEmptyState>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <HubBrackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// progress</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Your learning path</h2>
                {isConnected && progress ? (
                  <div className="mt-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">Wallet</p>
                        <p className="mt-1 text-lg font-black">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">Progress</p>
                        <p className="mt-1 text-2xl font-black text-[#d4af37]">{progressPercent}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">
                        <span>{progress.completedLessons.length} completed</span>
                        <span>{progress.bookmarkedLessons.length} bookmarks</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">XP</p>
                        <p className="mt-2 text-lg font-black">{progress.totalXp}</p>
                      </div>
                      <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">Lessons</p>
                        <p className="mt-2 text-lg font-black">{progress.completedLessons.length}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm leading-7 text-[#8a8a9a]">
                      Connect a wallet to save completed lessons, bookmarks, and XP across sessions.
                    </p>
                    <button onClick={connect} className="primary-button w-full">
                      CONNECT WALLET
                    </button>
                  </div>
                )}
              </div>

              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <HubBrackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// next up</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Recommended lesson</h2>
                {nextLesson ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="soon-badge">{CATEGORY_LABELS[nextLesson.category]}</span>
                      <span className="soon-badge">{LEVEL_LABELS[nextLesson.level]}</span>
                      <span className="soon-badge">{nextLesson.xp} XP</span>
                    </div>
                    <h3 className="text-2xl font-black">{nextLesson.title}</h3>
                    <p className="text-sm leading-7 text-[#8a8a9a]">{nextLesson.description}</p>
                    <div className="flex items-center justify-between border-t border-[#1a1a2e] pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">
                      <span>{nextLesson.duration}</span>
                      <span>{nextLesson.steps.length} steps</span>
                    </div>
                  </div>
                ) : (
                  <HubEmptyState
                    icon={Layers3}
                    title="No lessons available"
                    description="Complete the current path or reset your filters to surface lessons again."
                    className="mt-6 !p-8"
                  >
                    <button type="button" onClick={resetFilters} className="secondary-button">
                      SHOW ALL
                    </button>
                  </HubEmptyState>
                )}
              </div>

              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <HubBrackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d4af37]">// path notes</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#8a8a9a]">
                  <p>Use the lesson cards to move between the ecosystem surfaces you already know.</p>
                  <p>Bookmark anything you want to revisit later. Completed lessons stay saved per wallet.</p>
                  <p>Pair Learn with Quests for XP and progress tracking across the Arc hub.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
