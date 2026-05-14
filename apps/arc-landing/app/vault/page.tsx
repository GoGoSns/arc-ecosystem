'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Eye,
  Search,
  Shield,
  SquareArrowOutUpRight,
  Unlock,
  Vault,
} from 'lucide-react';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';
import { HubBrackets, HubEmptyState, HubMetricCard, hubInputClass, hubSelectClass, hubTextareaClass } from '@/components/HubPrimitives';
import { useVaultStore, type VaultAccess, type VaultCategory } from '@/lib/vaultStore';

type SortMode = 'featured' | 'accesses' | 'newest';

const CATEGORY_LABELS: Record<VaultCategory, string> = {
  brand: 'BRAND',
  playbook: 'PLAYBOOK',
  template: 'TEMPLATE',
  ops: 'OPS',
  education: 'EDUCATION',
  asset: 'ASSET',
};

const ACCESS_LABELS: Record<VaultAccess, string> = {
  open: 'OPEN',
  gated: 'GATED',
  private: 'PRIVATE',
};

const CATEGORY_OPTIONS: Array<{ id: VaultCategory | 'all'; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'brand', label: 'BRAND' },
  { id: 'playbook', label: 'PLAYBOOK' },
  { id: 'template', label: 'TEMPLATE' },
  { id: 'ops', label: 'OPS' },
  { id: 'education', label: 'EDUCATION' },
  { id: 'asset', label: 'ASSET' },
];

const ACCESS_OPTIONS: Array<{ id: VaultAccess | 'all'; label: string }> = [
  { id: 'all', label: 'ALL ACCESS' },
  { id: 'open', label: 'OPEN' },
  { id: 'gated', label: 'GATED' },
  { id: 'private', label: 'PRIVATE' },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'featured', label: 'FEATURED' },
  { id: 'accesses', label: 'ACCESSES' },
  { id: 'newest', label: 'NEWEST' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  url: '/forum',
  category: 'template' as VaultCategory,
  access: 'gated' as VaultAccess,
  format: 'PDF',
  size: '',
  tags: '',
};
export default function VaultPage() {
  const { items, addVaultItem, toggleUnlock, trackAccess } = useVaultStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VaultCategory | 'all'>('all');
  const [access, setAccess] = useState<VaultAccess | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortMode>('featured');
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? '');
  const [form, setForm] = useState(INITIAL_FORM);

  const viewerId = 'arc-vault-viewer';

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesCategory = category === 'all' || item.category === category;
        const matchesAccess = access === 'all' || item.access === access;
        const haystack = [item.title, item.description, item.tags.join(' ')].join(' ').toLowerCase();
        const matchesSearch = !query || haystack.includes(query);
        return matchesCategory && matchesAccess && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'accesses') return b.accessCount - a.accessCount || Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        return Number(b.featured) - Number(a.featured) || b.accessCount - a.accessCount || b.createdAt - a.createdAt;
      });
  }, [access, category, items, search, sortBy]);

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? items[0];

  const stats = useMemo(
    () => ({
      total: items.length,
      open: items.filter((item) => item.access === 'open').length,
      unlocked: items.filter((item) => item.access === 'open' || item.unlockedBy.includes(viewerId)).length,
      accesses: items.reduce((sum, item) => sum + item.accessCount, 0),
    }),
    [items],
  );

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setAccess('all');
    setSortBy('featured');
  };

  const isUnlocked = (item: (typeof items)[number]) => item.access === 'open' || item.unlockedBy.includes(viewerId);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const size = form.size.trim();

    if (!title || !description || !size) return;

    addVaultItem({
      title,
      description,
      url: form.url.trim() || '/forum',
      category: form.category,
      access: form.access,
      format: form.format.trim() || 'PDF',
      size,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setForm(INITIAL_FORM);
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// vault</p>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">
                SEALED <span className="text-[#c9a84c]">VAULT</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#9a9a9a]">
                Store the ecosystem&apos;s templates, playbooks, and operational assets in one place with access controls and usage tracking.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/node" className="primary-button">
                  VIEW OPS <ArrowRight size={16} />
                </Link>
                <Link href="/value" className="secondary-button">
                  CHECK VALUE
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HubMetricCard label="ITEMS" value={stats.total} icon={Vault} />
              <HubMetricCard label="OPEN" value={stats.open} icon={Unlock} />
              <HubMetricCard label="UNLOCKED" value={stats.unlocked} icon={Shield} />
              <HubMetricCard label="ACCESSES" value={stats.accesses} icon={Eye} />
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
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_auto_auto] xl:items-end">
                  <div className="relative">
                    <label className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">Search</label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
                      <input
                        aria-label="Search vault items"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Find a resource, format, or tag"
                        className={`w-full ${hubInputClass} py-3.5 !pl-11 !pr-4`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                      Category
                    </label>
                    <select
                      aria-label="Filter vault category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as VaultCategory | 'all')}
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
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]">
                      Access
                    </label>
                    <select
                      aria-label="Filter vault access"
                      value={access}
                      onChange={(event) => setAccess(event.target.value as VaultAccess | 'all')}
                      className={`min-w-[170px] ${hubSelectClass}`}
                    >
                      {ACCESS_OPTIONS.map((option) => (
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
                  const unlocked = isUnlocked(item);
                  const selected = item.id === selectedItem?.id;
                  const isInternal = item.url.startsWith('/');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`bracket-card flex min-h-[280px] flex-col rounded-3xl p-6 text-left transition-colors ${selected ? 'border-[#c9a84c]/40' : ''}`}
                    >
                      <HubBrackets />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c9a84c]">
                            {CATEGORY_LABELS[item.category]}
                          </p>
                          <h3 className="mt-3 text-2xl font-black leading-tight">{item.title}</h3>
                          <p className="mt-2 text-sm text-[#777]">{item.format} · {item.size}</p>
                        </div>
                        {item.featured ? <Unlock className="shrink-0 text-[#c9a84c]" size={18} /> : null}
                      </div>

                      <p className="mt-5 text-sm leading-7 text-[#9a9a9a]">{item.description}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="soon-badge">{ACCESS_LABELS[item.access]}</span>
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
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777]">
                          {item.accessCount} accesses
                        </span>
                        <div className="flex items-center gap-2">
                          {!unlocked && item.access !== 'open' ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleUnlock(item.id, viewerId);
                              }}
                              className="rounded-full border border-[#2a2a2a] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#ddd] transition-colors hover:border-[#c9a84c]/60 hover:text-[#c9a84c]"
                            >
                              UNLOCK
                            </button>
                          ) : (
                            <span className="rounded-full border border-[#2a2a2a] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#c9a84c]">
                              OPEN
                            </span>
                          )}
                          {isInternal ? (
                            <Link
                              href={item.url}
                              onClick={() => trackAccess(item.id)}
                              className="bracket-button"
                            >
                              OPEN <ArrowRight size={14} />
                            </Link>
                          ) : (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackAccess(item.id)}
                              className="bracket-button"
                            >
                              OPEN <SquareArrowOutUpRight size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredItems.length === 0 ? (
                  <div className="md:col-span-2">
                    <HubEmptyState
                      icon={Vault}
                      title="No vault items found"
                      description="Try a different search term or widen the category filter."
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
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// selected</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Vault details</h2>
                {selectedItem ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="soon-badge">{CATEGORY_LABELS[selectedItem.category]}</span>
                      <span className="soon-badge">{ACCESS_LABELS[selectedItem.access]}</span>
                      <span className="soon-badge">{selectedItem.format}</span>
                    </div>
                    <h3 className="text-2xl font-black">{selectedItem.title}</h3>
                    <p className="text-sm leading-7 text-[#9a9a9a]">{selectedItem.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">Size</p>
                        <p className="mt-2 text-lg font-black">{selectedItem.size}</p>
                      </div>
                      <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">Access</p>
                        <p className="mt-2 text-lg font-black">{selectedItem.accessCount}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags.map((tag) => (
                        <span key={tag} className="soon-badge">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
                      <span>{isUnlocked(selectedItem) ? 'Unlocked' : 'Locked'}</span>
                      <span>{selectedItem.featured ? 'Featured' : 'Standard'}</span>
                    </div>
                  </div>
                ) : (
                  <HubEmptyState
                    icon={Vault}
                    title="No vault selection"
                    description="Select a vault item to inspect the contents and access status."
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
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c9a84c]">// add asset</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Publish to vault</h2>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <input
                    aria-label="Vault title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Title"
                    className={`w-full ${hubInputClass}`}
                  />
                  <textarea
                    aria-label="Vault description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe the vault item"
                    className={`w-full ${hubTextareaClass}`}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      aria-label="Vault category"
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as VaultCategory }))}
                      className={`w-full ${hubSelectClass}`}
                    >
                      {CATEGORY_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Vault access"
                      value={form.access}
                      onChange={(event) => setForm((current) => ({ ...current, access: event.target.value as VaultAccess }))}
                      className={`w-full ${hubSelectClass}`}
                    >
                      {ACCESS_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      aria-label="Vault format"
                      value={form.format}
                      onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
                      placeholder="PDF"
                      className={`w-full ${hubInputClass}`}
                    />
                    <input
                      aria-label="Vault size"
                      value={form.size}
                      onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}
                      placeholder="8 MB"
                      className={`w-full ${hubInputClass}`}
                    />
                  </div>
                  <input
                    aria-label="Vault URL"
                    value={form.url}
                    onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                    placeholder="/forum"
                    className={`w-full ${hubInputClass}`}
                  />
                  <input
                    aria-label="Vault tags"
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="Tags separated by commas"
                    className={`w-full ${hubInputClass}`}
                  />
                  <button type="submit" className="primary-button w-full">
                    <ArrowRight size={16} />
                    ADD TO VAULT
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
