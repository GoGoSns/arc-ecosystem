'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUp, ArrowDown, MessageCircle, Eye,
  Pin, Lock, Plus, Search, ArrowLeft,
} from 'lucide-react';
import {
  useForumStore, getHotThreads, getNewThreads, getTopThreads, getScore,
  type ForumCategory, type Thread,
} from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';

export const CATEGORY_CONFIG: Record<ForumCategory, { label: string; emoji: string; color: string }> = {
  general:  { label: 'General',  emoji: '💬', color: '#9ca3af' },
  bugs:     { label: 'Bugs',     emoji: '🐛', color: '#ef4444' },
  features: { label: 'Features', emoji: '✨', color: '#60a5fa' },
  node:     { label: 'Node',     emoji: '🌐', color: '#4ade80' },
  dev:      { label: 'Dev',      emoji: '👨‍💻', color: '#a78bfa' },
  showcase: { label: 'Showcase', emoji: '🎨', color: '#f472b6' },
  help:     { label: 'Help',     emoji: '❓', color: '#facc15' },
};

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

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ForumCategory, number>> = {};
    (Object.keys(CATEGORY_CONFIG) as ForumCategory[]).forEach((cat) => {
      counts[cat] = threads.filter((t) => t.category === cat).length;
    });
    return counts;
  }, [threads]);

  const sorted = useMemo(() => {
    let pool = filterCategory ? threads.filter((t) => t.category === filterCategory) : threads;
    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(
        (t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q)
      );
    }
    const pinned = pool.filter((t) => t.pinned);
    const rest = pool.filter((t) => !t.pinned);
    const sortedRest =
      sort === 'hot' ? getHotThreads(rest)
      : sort === 'new' ? getNewThreads(rest)
      : getTopThreads(rest);
    return [...pinned, ...sortedRest];
  }, [threads, filterCategory, sort, search]);

  const totalComments = useMemo(
    () => threads.reduce((s, t) => s + t.comments.length, 0),
    [threads]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
          >
            <ArrowLeft size={14} />
            Arc Ecosystem
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Arc Forum</span>
          <WalletConnect />
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-52 shrink-0">
            <div
              className="rounded-xl p-4 sticky top-20"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] mb-3 px-1">
                Categories
              </h3>
              <div className="space-y-0.5">
                <Link
                  href="/forum"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ color: !filterCategory ? '#c9a84c' : '#aaa' }}
                >
                  <span>All</span>
                  <span className="text-xs opacity-50">{threads.length}</span>
                </Link>
                {(Object.keys(CATEGORY_CONFIG) as ForumCategory[]).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const active = filterCategory === cat;
                  return (
                    <Link
                      key={cat}
                      href={`/forum/c/${cat}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
                      style={{
                        background: active ? `${cfg.color}12` : 'transparent',
                        color: active ? cfg.color : '#aaa',
                      }}
                    >
                      <span>{cfg.emoji} {cfg.label}</span>
                      <span className="text-xs opacity-50">{categoryCounts[cat] ?? 0}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-1">
                <Link href="/feedback" className="flex items-center px-3 py-2 rounded-lg text-xs text-[#555] hover:text-[#c9a84c] transition-colors">
                  💡 Feedback Hub
                </Link>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-black">
                  {filterCategory
                    ? `${CATEGORY_CONFIG[filterCategory].emoji} ${CATEGORY_CONFIG[filterCategory].label}`
                    : 'Arc Forum'}
                </h1>
                {filterCategory && (
                  <Link href="/forum" className="text-xs text-[#555] hover:text-[#c9a84c] transition-colors">
                    ← All categories
                  </Link>
                )}
              </div>
              <Link
                href="/forum/new"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all hover:scale-105"
                style={{ background: '#c9a84c', color: '#0a0a0a' }}
              >
                <Plus size={15} />
                New Post
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-[#555] mb-4">
              <span>{threads.length} threads</span>
              <span>·</span>
              <span>{totalComments} comments</span>
            </div>

            {/* Mobile category pills */}
            <div className="flex lg:hidden flex-wrap gap-1.5 mb-4">
              <Link
                href="/forum"
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={{
                  background: !filterCategory ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  color: !filterCategory ? '#c9a84c' : '#777',
                  border: `1px solid ${!filterCategory ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                All
              </Link>
              {(Object.keys(CATEGORY_CONFIG) as ForumCategory[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const active = filterCategory === cat;
                return (
                  <Link
                    key={cat}
                    href={`/forum/c/${cat}`}
                    className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.04)',
                      color: active ? cfg.color : '#777',
                      border: `1px solid ${active ? `${cfg.color}30` : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    {cfg.emoji}
                    <span className="ml-1 hidden sm:inline">{cfg.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Sort + Search */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {(['hot', 'new', 'top'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: sort === s ? 'rgba(201,168,76,0.15)' : 'transparent',
                      color: sort === s ? '#c9a84c' : '#777',
                    }}
                  >
                    {s === 'hot' ? '🔥 Hot' : s === 'new' ? '🆕 New' : '🏆 Top'}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {/* Thread list */}
            {sorted.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#555] text-lg mb-5">
                  {search ? 'No threads match your search.' : 'No threads yet. Start the discussion!'}
                </p>
                <Link
                  href="/forum/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#c9a84c', color: '#0a0a0a' }}
                >
                  <Plus size={15} />
                  Create First Post
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
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
          </div>
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
  const score      = getScore(thread.upvotes, thread.downvotes);
  const hasUp      = !!address && thread.upvotes.includes(address);
  const hasDown    = !!address && thread.downvotes.includes(address);
  const catCfg     = CATEGORY_CONFIG[thread.category];
  const isHot      = score >= 3;

  return (
    <div
      className="flex gap-3 rounded-xl px-3 py-3 transition-all group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${isHot ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isHot ? '0 0 16px rgba(201,168,76,0.04)' : 'none',
      }}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 pt-0.5 min-w-[28px]">
        <button
          onClick={() => address && onVote(thread.id, address, 'up')}
          className="p-0.5 rounded transition-all hover:scale-110"
          style={{ color: hasUp ? '#c9a84c' : '#444' }}
          title={address ? 'Upvote' : 'Connect wallet to vote'}
        >
          <ArrowUp size={13} />
        </button>
        <span
          className="text-[11px] font-black leading-none"
          style={{ color: score > 0 ? '#c9a84c' : score < 0 ? '#ef4444' : '#666' }}
        >
          {score}
        </span>
        <button
          onClick={() => address && onVote(thread.id, address, 'down')}
          className="p-0.5 rounded transition-all hover:scale-110"
          style={{ color: hasDown ? '#ef4444' : '#444' }}
          title={address ? 'Downvote' : 'Connect wallet to vote'}
        >
          <ArrowDown size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: `${catCfg.color}18`, color: catCfg.color }}
          >
            {catCfg.emoji} {catCfg.label}
          </span>
          {thread.pinned && <Pin size={11} className="text-[#c9a84c]" />}
          {thread.locked && <Lock size={11} className="text-[#fb923c]" />}
          <Link
            href={`/forum/${thread.id}`}
            className="font-semibold text-[#e8e8e8] hover:text-[#c9a84c] transition-colors leading-snug text-sm sm:text-[15px] group-hover:text-white"
          >
            {thread.title}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#555]">
          <span>by {thread.authorName || shortenAddress(thread.authorAddress)}</span>
          <span>{timeAgo(thread.createdAt)}</span>
          <span className="flex items-center gap-0.5">
            <MessageCircle size={10} />
            {thread.comments.length}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye size={10} />
            {thread.views}
          </span>
        </div>
      </div>
    </div>
  );
}

function WalletConnect() {
  const { address, isConnected, connect, disconnect } = useWallet();
  if (isConnected && address) {
    return (
      <button
        onClick={disconnect}
        className="px-3 py-1.5 rounded-lg text-xs font-mono border"
        style={{ borderColor: '#c9a84c', color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }}
      >
        {shortenAddress(address)}
      </button>
    );
  }
  return (
    <button
      onClick={connect}
      className="px-3 py-1.5 rounded-lg text-xs font-bold"
      style={{ background: '#c9a84c', color: '#0a0a0a' }}
    >
      Connect Wallet
    </button>
  );
}
