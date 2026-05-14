'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Compass,
  Eye,
  Lock,
  MessageCircle,
  Pin,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users2,
  ArrowUp,
} from 'lucide-react';
import {
  useForumStore,
  getHotThreads,
  getNewThreads,
  getScore,
  getTopThreads,
  type ForumCategory,
  type Thread,
} from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';
import BrandLogo from '../BrandLogo';

export const CATEGORY_CONFIG: Record<ForumCategory, { label: string; emoji: string; color: string; description: string }> = {
  general: { label: 'General', emoji: '◆', color: '#9ca3af', description: 'Open discussion and community signals.' },
  bugs: { label: 'Bugs', emoji: '!', color: '#ef4444', description: 'Repros, regressions, and fixes.' },
  features: { label: 'Features', emoji: '+', color: '#60a5fa', description: 'Product ideas and roadmap input.' },
  node: { label: 'Node', emoji: '◉', color: '#4ade80', description: 'Node operations and infrastructure.' },
  dev: { label: 'Dev', emoji: '<>', color: '#a78bfa', description: 'SDK, engineering, and implementation notes.' },
  showcase: { label: 'Showcase', emoji: '▣', color: '#f472b6', description: 'Demos, launches, and wins.' },
  help: { label: 'Help', emoji: '?', color: '#facc15', description: 'Questions, troubleshooting, and guidance.' },
};

const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as ForumCategory[];

const FEATURED_LANES: Array<{ label: string; href: string; description: string }> = [
  { label: 'Node Operations', href: '/forum/c/node', description: 'Infrastructure, uptime, and validation.' },
  { label: 'Product Signals', href: '/forum/c/features', description: 'Shipping ideas and roadmap direction.' },
  { label: 'Bug Reports', href: '/forum/c/bugs', description: 'Repro steps and prioritized fixes.' },
];

export const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

interface Props {
  filterCategory?: ForumCategory;
}

export default function ForumBrowse({ filterCategory }: Props) {
  const { address } = useWallet();
  const { threads, toggleVote } = useForumStore();
  const [sort, setSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.14 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ForumCategory, number>> = {};
    CATEGORY_ORDER.forEach((cat) => {
      counts[cat] = threads.filter((t) => t.category === cat).length;
    });
    return counts;
  }, [threads]);

  const sorted = useMemo(() => {
    let pool = filterCategory ? threads.filter((t) => t.category === filterCategory) : threads;

    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(
        (t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q),
      );
    }

    const pinned = pool.filter((t) => t.pinned);
    const rest = pool.filter((t) => !t.pinned);
    const sortedRest = sort === 'hot' ? getHotThreads(rest) : sort === 'new' ? getNewThreads(rest) : getTopThreads(rest);

    return [...pinned, ...sortedRest];
  }, [threads, filterCategory, sort, search]);

  const totalComments = useMemo(
    () => threads.reduce((sum, thread) => sum + thread.comments.length, 0),
    [threads],
  );

  const activeThreads = useMemo(
    () => threads.filter((thread) => getScore(thread.upvotes, thread.downvotes) >= 3).length,
    [threads],
  );

  const pinnedThreads = useMemo(() => threads.filter((thread) => thread.pinned).length, [threads]);

  const activeCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => (categoryCounts[cat] ?? 0) > 0).length,
    [categoryCounts],
  );

  const heroLabel = filterCategory
    ? `${CATEGORY_CONFIG[filterCategory].label} hub`
    : 'Community hub';
  const heroTitle = filterCategory ? CATEGORY_CONFIG[filterCategory].label : 'Arc Forum';
  const heroCopy = filterCategory
    ? `${CATEGORY_CONFIG[filterCategory].description} Filtered to ${CATEGORY_CONFIG[filterCategory].label.toLowerCase()} signals.`
    : 'A premium community desk for shipping notes, product feedback, bugs, node operations, and launch signals.';
  const isEmpty = sorted.length === 0;

  const sidebarCategories = CATEGORY_ORDER
    .map((cat) => ({
      cat,
      ...CATEGORY_CONFIG[cat],
      count: categoryCounts[cat] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat));

  const rightRailSignals = [
    { label: 'Threads', value: threads.length, text: 'Live discussion signals across the forum.' },
    { label: 'Replies', value: totalComments, text: 'Response depth and community activity.' },
    { label: 'Hot', value: activeThreads, text: 'Threads with strong recent traction.' },
    { label: 'Pinned', value: pinnedThreads, text: 'Priority posts carrying permanent weight.' },
  ];

  return (
    <div className="forum-shell min-h-screen text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="forum-brand">
            <BrandLogo href={null} variant="mark" decorative className="forum-logo-glow h-10 w-10 shrink-0" />
            <div className="forum-brand-copy">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a]">
                Arc Ecosystem
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#f4f4f4]">
                Arc Forum
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <span className="forum-chip">
              <Compass size={11} className="text-[#c9a84c]" />
              Community hub
            </span>
            <span className="forum-chip">
              <Activity size={11} className="text-[#c9a84c]" />
              Live signals
            </span>
          </div>

          <WalletConnect />
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="reveal forum-panel forum-hero mb-6 rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="forum-panel-title">{heroLabel}</p>
              <h1 className="forum-hero-title mt-3">{heroTitle}</h1>
              <p className="forum-hero-copy mt-4">
                {heroCopy}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="forum-breadcrumb">
                  <Link href="/" className="hover:text-[#f4f4f4] transition-colors">
                    Home
                  </Link>
                  <span>·</span>
                  <strong>Forum</strong>
                  {filterCategory ? (
                    <>
                      <span>·</span>
                      <strong>{CATEGORY_CONFIG[filterCategory].label}</strong>
                    </>
                  ) : null}
                </span>
              </div>
            </div>

            <div className="forum-empty-actions shrink-0">
              <Link href="/forum/new" className="forum-button forum-button--gold">
                <Plus size={15} />
                New Post
              </Link>
              <Link href="#feed" className="forum-button">
                Browse Feed
              </Link>
            </div>
          </div>

          <div className="forum-stat-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Threads', value: threads.length },
              { label: 'Replies', value: totalComments },
              { label: 'Hot signals', value: activeThreads },
              { label: 'Live categories', value: activeCategories },
            ].map((stat) => (
              <div key={stat.label} className="forum-stat-card">
                <div className="forum-stat-label">{stat.label}</div>
                <div className="forum-stat-value">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="forum-sidebar lg:pt-1">
            <div className="reveal forum-panel forum-sidebar-sticky rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="forum-panel-title">Categories</p>
                  <h2 className="mt-2 text-lg font-bold text-white">Discussion lanes</h2>
                </div>
                <span className="forum-chip">
                  <Sparkles size={11} className="text-[#c9a84c]" />
                  Live
                </span>
              </div>

              <div className="forum-category-list mt-4">
                <Link
                  href="/forum"
                  className="forum-category-item"
                  data-active={!filterCategory ? 'true' : undefined}
                >
                  <span className="forum-category-left">
                    <span className="forum-category-mark">All</span>
                    <span className="forum-category-meta">
                      <span className="forum-category-label">All signals</span>
                      <span className="forum-category-note">Everything in one view</span>
                    </span>
                  </span>
                  <span className="forum-counter">{threads.length}</span>
                </Link>

                {sidebarCategories.map((cat) => {
                  const active = filterCategory === cat.cat;
                  return (
                    <Link
                      key={cat.cat}
                      href={`/forum/c/${cat.cat}`}
                      className="forum-category-item"
                      data-active={active ? 'true' : undefined}
                    >
                      <span className="forum-category-left">
                        <span
                          className="forum-category-mark"
                          style={{
                            color: active ? cat.color : '#8a8a8a',
                            borderColor: active ? cat.color : 'rgba(255,255,255,0.1)',
                            background: active ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          {cat.emoji}
                        </span>
                        <span className="forum-category-meta">
                          <span className="forum-category-label">{cat.label}</span>
                          <span className="forum-category-note">{cat.description}</span>
                        </span>
                      </span>
                      <span className="forum-counter">{cat.count}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-[#2a2a2a]/80 pt-4">
                <Link href="/feedback" className="forum-button w-full justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Compass size={12} className="text-[#c9a84c]" />
                    Feedback Hub
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </aside>

          <main id="feed" className="min-w-0">
            <section className="reveal forum-panel rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="forum-tab-group self-start" role="tablist" aria-label="Forum sort options">
                  {(['hot', 'new', 'top'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSort(option)}
                      className="forum-tab"
                      data-active={sort === option ? 'true' : undefined}
                      aria-pressed={sort === option}
                    >
                      {option === 'hot' ? 'Hot' : option === 'new' ? 'New' : 'Top'}
                    </button>
                  ))}
                </div>

                <div className="forum-search-wrap flex-1 xl:max-w-md">
                  <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                  <input
                    type="text"
                    placeholder="Search signals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="forum-search"
                    aria-label="Search forum threads"
                  />
                </div>
              </div>
            </section>

            <section className="mt-5">
              {isEmpty ? (
                <EmptyState search={search} />
              ) : (
                <div className="forum-thread-list">
                  {sorted.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      address={address}
                      onVote={toggleVote}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>

          <aside className="forum-signal-card">
            <div className="reveal forum-panel rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="forum-panel-title">Community Signals</p>
                  <h2 className="mt-2 text-lg font-bold text-white">Market pulse</h2>
                </div>
                <TrendingUp size={17} className="text-[#c9a84c]" />
              </div>

              <div className="forum-signal-list mt-4">
                {rightRailSignals.map((signal) => (
                  <div key={signal.label} className="forum-signal-item">
                    <span className="forum-signal-dot" aria-hidden="true" />
                    <div className="forum-signal-copy">
                      <span className="forum-signal-title">{signal.label}</span>
                      <span className="forum-signal-text">{signal.text}</span>
                    </div>
                    <span className="forum-signal-metric">{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal forum-panel rounded-[1.5rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="forum-panel-title">Featured Areas</p>
                  <h2 className="mt-2 text-lg font-bold text-white">Where to post</h2>
                </div>
                <Users2 size={17} className="text-[#c9a84c]" />
              </div>

              <div className="mt-4 space-y-2">
                {FEATURED_LANES.map((lane) => (
                  <Link
                    key={lane.href}
                    href={lane.href}
                    className="forum-category-item"
                  >
                    <span className="forum-category-left">
                      <span className="forum-category-mark">Go</span>
                      <span className="forum-category-meta">
                        <span className="forum-category-label">{lane.label}</span>
                        <span className="forum-category-note">{lane.description}</span>
                      </span>
                    </span>
                    <ArrowRight size={14} className="text-[#8a8a8a]" />
                  </Link>
                ))}
              </div>
            </div>

            {isEmpty ? (
              <div className="reveal forum-empty-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="relative z-10">
                  <p className="forum-empty-label">Start the first signal</p>
                  <h2 className="forum-empty-title mt-3">
                    {search ? 'No matching signals' : 'Start the first signal'}
                  </h2>
                  <p className="forum-empty-copy mt-4">
                    {search
                      ? `Nothing matched "${search}". Clear the search or open a different lane to continue browsing.`
                      : 'Create the first premium discussion thread to set the tone for the Arc community.'}
                  </p>
                  <div className="forum-empty-actions mt-5">
                    <Link href="/forum/new" className="forum-button forum-button--gold">
                      <Plus size={15} />
                      Create First Post
                    </Link>
                    <Link href="/forum" className="forum-button">
                      Reset View
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="reveal forum-empty-card rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="forum-empty-label">Start the first signal</p>
          <h2 className="forum-empty-title mt-3">
            {search ? 'No matching signals' : 'Start the first signal'}
          </h2>
          <p className="forum-empty-copy mt-4">
            {search
              ? `Nothing matched "${search}". Clear the query or browse a different lane to keep moving.`
              : 'There are no threads yet. Create the first post and set the tone for the Arc community.'}
          </p>

          <div className="forum-empty-actions mt-5">
            <Link href="/forum/new" className="forum-button forum-button--gold">
              <Plus size={15} />
              Create First Post
            </Link>
            <Link href="/forum/c/general" className="forum-button">
              Browse General
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem] lg:shrink-0">
          {FEATURED_LANES.slice(0, 3).map((lane) => (
            <Link key={lane.href} href={lane.href} className="forum-stat-card">
              <div className="forum-stat-label">{lane.label}</div>
              <div className="forum-stat-value mt-2 text-base">{lane.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  address,
  onVote,
}: {
  thread: Thread;
  address?: string;
  onVote: (id: string, addr: string, type: 'up' | 'down') => void;
}) {
  const score = getScore(thread.upvotes, thread.downvotes);
  const hasUp = !!address && thread.upvotes.includes(address);
  const hasDown = !!address && thread.downvotes.includes(address);
  const catCfg = CATEGORY_CONFIG[thread.category];
  const isHot = score >= 3;

  return (
    <article className={`forum-thread-card ${isHot ? 'is-hot' : ''}`}>
      <div className="forum-thread-vote">
        <button
          type="button"
          onClick={() => address && onVote(thread.id, address, 'up')}
          className="forum-vote-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
          style={{
            color: hasUp ? '#c9a84c' : '#777',
            background: hasUp ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
            borderColor: hasUp ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.07)',
          }}
          aria-label={address ? 'Upvote thread' : 'Connect wallet to vote'}
          title={address ? 'Upvote' : 'Connect wallet to vote'}
        >
          <ArrowUp size={13} />
        </button>
        <span className="forum-vote-score" style={{ color: score > 0 ? '#c9a84c' : score < 0 ? '#ef4444' : '#666' }}>
          {score}
        </span>
        <button
          type="button"
          onClick={() => address && onVote(thread.id, address, 'down')}
          className="forum-vote-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
          style={{
            color: hasDown ? '#ef4444' : '#777',
            background: hasDown ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)',
            borderColor: hasDown ? 'rgba(239,68,68,0.26)' : 'rgba(255,255,255,0.07)',
          }}
          aria-label={address ? 'Downvote thread' : 'Connect wallet to vote'}
          title={address ? 'Downvote' : 'Connect wallet to vote'}
        >
          <ArrowDown size={13} />
        </button>
      </div>

      <div className="forum-thread-main">
        <div className="forum-thread-badges">
          <span
            className="forum-tag"
            style={{
              color: catCfg.color,
              borderColor: `${catCfg.color}33`,
              background: `${catCfg.color}12`,
            }}
          >
            <span
              className="forum-category-mark"
              style={{
                width: '1.35rem',
                height: '1.35rem',
                borderColor: catCfg.color,
                color: catCfg.color,
              }}
            >
              {catCfg.emoji}
            </span>
            {catCfg.label}
          </span>
          {thread.pinned ? <span className="forum-tag"><Pin size={11} /> Pinned</span> : null}
          {thread.locked ? <span className="forum-tag is-locked"><Lock size={11} /> Locked</span> : null}
        </div>

        <Link href={`/forum/${thread.id}`} className="forum-thread-title">
          {thread.title}
        </Link>

        <p className="forum-thread-excerpt">{thread.content}</p>

        <div className="forum-thread-meta">
          <span>by {thread.authorName || shortenAddress(thread.authorAddress)}</span>
          <span>{timeAgo(thread.createdAt)}</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={10} />
            {thread.comments.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={10} />
            {thread.views}
          </span>
        </div>
      </div>

      <div className="forum-thread-side">
        <span className="forum-tag">{isHot ? 'Hot' : 'Signal'}</span>
        <Link href={`/forum/${thread.id}`} className="forum-thread-link">
          Read
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}

function WalletConnect() {
  const { address, isConnected, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={disconnect}
        className="forum-wallet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-[#30d158] shadow-[0_0_12px_rgba(48,209,88,0.45)]" />
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      className="forum-button forum-button--gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/60"
    >
      Connect Wallet
    </button>
  );
}
