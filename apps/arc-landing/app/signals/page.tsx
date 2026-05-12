'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import { useSignalsStore, type SignalBias, type SignalCategory, type SignalTimeframe } from '@/lib/signalsStore';

type SortMode = 'hot' | 'confidence' | 'newest';

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  market: 'MARKET',
  community: 'COMMUNITY',
  product: 'PRODUCT',
  launch: 'LAUNCH',
  security: 'SECURITY',
  growth: 'GROWTH',
};

const BIAS_LABELS: Record<SignalBias, string> = {
  bullish: 'BULLISH',
  bearish: 'BEARISH',
  neutral: 'NEUTRAL',
};

const TIMEFRAME_LABELS: Record<SignalTimeframe, string> = {
  now: 'NOW',
  '24h': '24H',
  '7d': '7D',
  '30d': '30D',
};

const CATEGORY_OPTIONS: Array<{ id: SignalCategory | 'all'; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'market', label: 'MARKET' },
  { id: 'community', label: 'COMMUNITY' },
  { id: 'product', label: 'PRODUCT' },
  { id: 'launch', label: 'LAUNCH' },
  { id: 'security', label: 'SECURITY' },
  { id: 'growth', label: 'GROWTH' },
];

const BIAS_OPTIONS: Array<{ id: SignalBias | 'all'; label: string }> = [
  { id: 'all', label: 'ALL BIAS' },
  { id: 'bullish', label: 'BULLISH' },
  { id: 'bearish', label: 'BEARISH' },
  { id: 'neutral', label: 'NEUTRAL' },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'hot', label: 'HOT' },
  { id: 'confidence', label: 'CONFIDENCE' },
  { id: 'newest', label: 'NEWEST' },
];

const INITIAL_FORM = {
  title: '',
  summary: '',
  source: '',
  category: 'market' as SignalCategory,
  bias: 'bullish' as SignalBias,
  timeframe: '24h' as SignalTimeframe,
  confidence: 80,
  tags: '',
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

type IconType = typeof Activity;

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: IconType;
}) {
  return (
    <div className="bracket-card relative overflow-hidden rounded-3xl p-5">
      <Brackets />
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
        <Icon size={14} className="text-[#c9a84c]" />
        {label}
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}

const biasAccent: Record<SignalBias, string> = {
  bullish: '#4ade80',
  bearish: '#f87171',
  neutral: '#c9a84c',
};

export default function SignalsPage() {
  const { signals, addSignal, toggleBoost, toggleBookmark } = useSignalsStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<SignalCategory | 'all'>('all');
  const [bias, setBias] = useState<SignalBias | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortMode>('hot');
  const [form, setForm] = useState(INITIAL_FORM);

  const viewerId = 'arc-signals-viewer';

  const filteredSignals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return signals
      .filter((signal) => {
        const matchesCategory = category === 'all' || signal.category === category;
        const matchesBias = bias === 'all' || signal.bias === bias;
        const haystack = [signal.title, signal.summary, signal.source, signal.tags.join(' ')].join(' ').toLowerCase();
        const matchesSearch = !query || haystack.includes(query);
        return matchesCategory && matchesBias && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'confidence') return b.confidence - a.confidence || b.createdAt - a.createdAt;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        const hotA = a.confidence + a.boostedBy.length * 10 + (a.bias === 'bullish' ? 6 : 0);
        const hotB = b.confidence + b.boostedBy.length * 10 + (b.bias === 'bullish' ? 6 : 0);
        return hotB - hotA || b.createdAt - a.createdAt;
      });
  }, [bias, category, search, signals, sortBy]);

  const spotlight = filteredSignals[0] ?? signals[0];

  const stats = useMemo(
    () => ({
      total: signals.length,
      bullish: signals.filter((signal) => signal.bias === 'bullish').length,
      bearish: signals.filter((signal) => signal.bias === 'bearish').length,
      confidence: Math.round(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length),
    }),
    [signals],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const summary = form.summary.trim();
    const source = form.source.trim();

    if (!title || !summary || !source) return;

    addSignal({
      title,
      summary,
      source,
      category: form.category,
      bias: form.bias,
      timeframe: form.timeframe,
      confidence: form.confidence,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setForm(INITIAL_FORM);
  };

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
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <span className="text-white">SIGNALS</span>
            <span className="nav-link">PULSE FEED</span>
          </div>
          <AppSwitcher />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// signals</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                ECOSYSTEM <span className="text-[#c9a84c]">SIGNALS</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
                Track the strongest momentum, risk, and product readings across the Arc ecosystem in one live feed.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/roadmap" className="primary-button">
                  SEE ROADMAP <ArrowRight size={16} />
                </Link>
                <Link href="/forum" className="secondary-button">
                  OPEN FORUM
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="SIGNALS" value={stats.total} icon={Activity} />
              <StatCard label="BULLISH" value={stats.bullish} icon={TrendingUp} />
              <StatCard label="BEARISH" value={stats.bearish} icon={TrendingDown} />
              <StatCard label="AVG CONF" value={`${stats.confidence}%`} icon={BarChart3} />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-5">
              <div className="bracket-card rounded-3xl p-5 sm:p-6">
                <Brackets />
                <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                  <div className="relative">
                    <label className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Search</label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by signal, source, or tag"
                        className="w-full border border-[#2a2a2a] bg-black/30 py-3.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value as SignalCategory | 'all')}
                      className="min-w-[180px] border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                      Bias
                    </label>
                    <select
                      value={bias}
                      onChange={(event) => setBias(event.target.value as SignalBias | 'all')}
                      className="min-w-[160px] border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {BIAS_OPTIONS.map((option) => (
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
                        ? 'border-[#c9a84c] bg-[#c9a84c] text-black'
                        : 'border-[#2a2a2a] text-[#777] hover:border-[#c9a84c]/50 hover:text-[#c9a84c]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredSignals.map((signal) => {
                  const boostActive = signal.boostedBy.includes(viewerId);
                  const bookmarkActive = signal.bookmarkedBy.includes(viewerId);
                  const accent = biasAccent[signal.bias];

                  return (
                    <article
                      key={signal.id}
                      className="bracket-card flex min-h-[300px] flex-col rounded-3xl p-6 transition-colors"
                      style={{ borderColor: `${accent}40` }}
                    >
                      <Brackets />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c9a84c]">
                            {CATEGORY_LABELS[signal.category]}
                          </p>
                          <h3 className="mt-3 text-2xl font-black leading-tight">{signal.title}</h3>
                          <p className="mt-2 text-sm text-[#777]">{signal.source}</p>
                        </div>
                        <span
                          className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                          style={{ borderColor: `${accent}40`, color: accent, background: `${accent}12` }}
                        >
                          {BIAS_LABELS[signal.bias]}
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#9a9a9a]">{signal.summary}</p>

                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[#777]">
                          <span>Confidence</span>
                          <span>{signal.confidence}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${signal.confidence}%`, backgroundColor: accent }}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="soon-badge">{TIMEFRAME_LABELS[signal.timeframe]}</span>
                        {signal.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#2a2a2a] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#777]">
                          <span>{signal.boostedBy.length} boosts</span>
                          <span>{signal.bookmarkedBy.length} saved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleBoost(signal.id, viewerId)}
                            className="rounded-full border border-[#2a2a2a] p-2 text-[#ddd] transition-colors hover:border-[#c9a84c]/60 hover:text-[#c9a84c]"
                            aria-label={boostActive ? 'Remove boost' : 'Boost signal'}
                          >
                            <Zap size={14} className={boostActive ? 'fill-current text-[#c9a84c]' : ''} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(signal.id, viewerId)}
                            className="rounded-full border border-[#2a2a2a] p-2 text-[#ddd] transition-colors hover:border-[#c9a84c]/60 hover:text-[#c9a84c]"
                            aria-label={bookmarkActive ? 'Remove bookmark' : 'Bookmark signal'}
                          >
                            {bookmarkActive ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredSignals.length === 0 ? (
                  <div className="md:col-span-2 rounded-3xl border border-dashed border-[#2a2a2a] bg-white/[0.015] p-10 text-center text-[#777]">
                    <Activity size={42} className="mx-auto text-[#333]" />
                    <h3 className="mt-5 text-2xl font-black text-white">No signals match the filter</h3>
                    <p className="mt-2 text-sm">Widen the filter or clear the search box to reveal more readings.</p>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <Brackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// spotlight</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Top signal</h2>
                {spotlight ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="soon-badge">{CATEGORY_LABELS[spotlight.category]}</span>
                      <span className="soon-badge">{BIAS_LABELS[spotlight.bias]}</span>
                      <span className="soon-badge">{TIMEFRAME_LABELS[spotlight.timeframe]}</span>
                    </div>
                    <h3 className="text-2xl font-black">{spotlight.title}</h3>
                    <p className="text-sm leading-7 text-[#9a9a9a]">{spotlight.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">Source</p>
                        <p className="mt-2 text-lg font-black">{spotlight.source}</p>
                      </div>
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">Confidence</p>
                        <p className="mt-2 text-lg font-black">{spotlight.confidence}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
                      <span>{spotlight.boostedBy.length} boosts</span>
                      <span>{spotlight.bookmarkedBy.length} saves</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[#777]">Nothing to highlight yet.</p>
                )}
              </div>

              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <Brackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// compose</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Post a signal</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Title"
                    className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <textarea
                    value={form.summary}
                    onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Summarize the signal"
                    className="min-h-[120px] w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <input
                    value={form.source}
                    onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                    placeholder="Source"
                    className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as SignalCategory }))}
                      className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {CATEGORY_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.bias}
                      onChange={(event) => setForm((current) => ({ ...current, bias: event.target.value as SignalBias }))}
                      className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {BIAS_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={form.timeframe}
                      onChange={(event) => setForm((current) => ({ ...current, timeframe: event.target.value as SignalTimeframe }))}
                      className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {Object.entries(TIMEFRAME_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.confidence}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          confidence: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                        }))
                      }
                      placeholder="80"
                      className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                    />
                  </div>
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="Tags separated by commas"
                    className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <button type="submit" className="primary-button w-full">
                    <Sparkles size={16} />
                    PUBLISH SIGNAL
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
