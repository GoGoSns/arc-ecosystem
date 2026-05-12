'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Heart,
  Layers3,
  Search,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import { useShowcaseStore, type ShowcaseCategory } from '@/lib/showcaseStore';

type SortMode = 'featured' | 'likes' | 'newest';

const CATEGORY_LABELS: Record<ShowcaseCategory, string> = {
  product: 'PRODUCT',
  community: 'COMMUNITY',
  launch: 'LAUNCH',
  design: 'DESIGN',
  ops: 'OPS',
  education: 'EDUCATION',
};

const CATEGORY_OPTIONS: Array<{ id: ShowcaseCategory | 'all'; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'product', label: 'PRODUCT' },
  { id: 'community', label: 'COMMUNITY' },
  { id: 'launch', label: 'LAUNCH' },
  { id: 'design', label: 'DESIGN' },
  { id: 'ops', label: 'OPS' },
  { id: 'education', label: 'EDUCATION' },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'featured', label: 'FEATURED' },
  { id: 'likes', label: 'LIKES' },
  { id: 'newest', label: 'NEWEST' },
];

const INITIAL_FORM = {
  title: '',
  creator: '',
  description: '',
  url: '/forum',
  category: 'product' as ShowcaseCategory,
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Layers3;
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

export default function ShowcasePage() {
  const { items, addShowcase, toggleLike } = useShowcaseStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ShowcaseCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [form, setForm] = useState(INITIAL_FORM);

  const viewerId = 'arc-showcase-viewer';

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesCategory = category === 'all' || item.category === category;
        const haystack = [item.title, item.creator, item.description, item.tags.join(' ')].join(' ').toLowerCase();
        const matchesSearch = !query || haystack.includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'likes') return b.likes.length - a.likes.length || Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        return Number(b.featured) - Number(a.featured) || b.likes.length - a.likes.length || b.createdAt - a.createdAt;
      });
  }, [category, items, search, sortBy]);

  const spotlight = filteredItems[0] ?? items[0];

  const stats = useMemo(
    () => ({
      total: items.length,
      featured: items.filter((item) => item.featured).length,
      creators: new Set(items.map((item) => item.creator)).size,
      likes: items.reduce((sum, item) => sum + item.likes.length, 0),
    }),
    [items],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const creator = form.creator.trim();
    const description = form.description.trim();

    if (!title || !creator || !description) return;

    addShowcase({
      title,
      creator,
      description,
      url: form.url.trim() || '/forum',
      category: form.category,
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
            <span className="text-white">SHOWCASE</span>
            <span className="nav-link">CURATED WALL</span>
          </div>
          <AppSwitcher />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// showcase</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                COMMUNITY <span className="text-[#c9a84c]">SHOWCASE</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
                Curate the best product moments, launch visuals, and community highlights from across the Arc ecosystem.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/forum" className="primary-button">
                  BROWSE FORUM <ArrowRight size={16} />
                </Link>
                <Link href="/roadmap" className="secondary-button">
                  SEE ROADMAP
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="ITEMS" value={stats.total} icon={Sparkles} />
              <StatCard label="FEATURED" value={stats.featured} icon={Star} />
              <StatCard label="CREATORS" value={stats.creators} icon={Layers3} />
              <StatCard label="LIKES" value={stats.likes} icon={Heart} />
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
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
                        placeholder="Find a highlight, creator, or tag"
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
                      onChange={(event) => setCategory(event.target.value as ShowcaseCategory | 'all')}
                      className="min-w-[190px] border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-[#c9a84c]/50"
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
                      Sort
                    </label>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value as SortMode)}
                      className="min-w-[180px] border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] text-white outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredItems.map((item) => {
                  const isInternal = item.url.startsWith('/');

                  return (
                    <article
                      key={item.id}
                      className={`bracket-card flex min-h-[280px] flex-col rounded-3xl p-6 transition-colors ${item.featured ? 'border-[#c9a84c]/35' : ''}`}
                    >
                      <Brackets />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c9a84c]">
                            {CATEGORY_LABELS[item.category]}
                          </p>
                          <h3 className="mt-3 text-2xl font-black leading-tight">{item.title}</h3>
                          <p className="mt-2 text-sm text-[#777]">By {item.creator}</p>
                        </div>
                        {item.featured ? <Star className="shrink-0 text-[#c9a84c]" size={18} /> : null}
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#9a9a9a]">{item.description}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#2a2a2a] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleLike(item.id, viewerId)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#ddd] transition-colors hover:border-[#c9a84c]/60 hover:text-[#c9a84c]"
                        >
                          <Heart size={14} className={item.likes.includes(viewerId) ? 'fill-current text-[#c9a84c]' : ''} />
                          {item.likes.length}
                        </button>

                        {isInternal ? (
                          <Link href={item.url} className="bracket-button">
                            VIEW <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="bracket-button">
                            VIEW <ArrowRight size={14} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}

                {filteredItems.length === 0 ? (
                  <div className="md:col-span-2 rounded-3xl border border-dashed border-[#2a2a2a] bg-white/[0.015] p-10 text-center text-[#777]">
                    <Layers3 size={42} className="mx-auto text-[#333]" />
                    <h3 className="mt-5 text-2xl font-black text-white">No showcase items found</h3>
                    <p className="mt-2 text-sm">Try a different search term or reset the category filter.</p>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <Brackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// spotlight</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Current highlight</h2>
                {spotlight ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
                        {CATEGORY_LABELS[spotlight.category]}
                      </span>
                      {spotlight.featured ? <span className="soon-badge">featured</span> : null}
                    </div>
                    <h3 className="text-2xl font-black">{spotlight.title}</h3>
                    <p className="text-sm leading-7 text-[#9a9a9a]">{spotlight.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {spotlight.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="soon-badge">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
                      <span>{spotlight.likes.length} likes</span>
                      <span>By {spotlight.creator}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[#777]">Nothing to spotlight yet.</p>
                )}
              </div>

              <div className="bracket-card rounded-3xl p-6 sm:p-8">
                <Brackets />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// submit</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Add a showcase</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Title"
                    className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <input
                    value={form.creator}
                    onChange={(event) => setForm((current) => ({ ...current, creator: event.target.value }))}
                    placeholder="Creator"
                    className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe the showcase"
                    className="min-h-[120px] w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#444] focus:border-[#c9a84c]/50"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ShowcaseCategory }))}
                      className="w-full border border-[#2a2a2a] bg-black/30 px-4 py-3 text-sm uppercase tracking-[0.14em] outline-none transition-colors focus:border-[#c9a84c]/50"
                    >
                      {CATEGORY_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.url}
                      onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                      placeholder="/forum"
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
                    <Upload size={16} />
                    PUBLISH TO WALL
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
