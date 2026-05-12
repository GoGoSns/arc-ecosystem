'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bug, Sparkles, Lightbulb, MessageCircle,
  ChevronUp, Search, ArrowLeft, Plus, Clock, User,
} from 'lucide-react';
import {
  useFeedbackStore, getFeedbackStats,
  type FeedbackCategory, type FeedbackStatus,
} from '@/lib/feedbackStore';
import { useWallet } from '@/contexts/WalletContext';

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug:     { label: 'Bug',     icon: <Bug size={11} />,           color: '#ef4444' },
  feature: { label: 'Feature', icon: <Sparkles size={11} />,      color: '#60a5fa' },
  idea:    { label: 'Idea',    icon: <Lightbulb size={11} />,     color: '#facc15' },
  general: { label: 'General', icon: <MessageCircle size={11} />, color: '#9ca3af' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  open:          { label: 'Open',        color: '#4ade80' },
  reviewing:     { label: 'Reviewing',   color: '#60a5fa' },
  planned:       { label: 'Planned',     color: '#facc15' },
  'in-progress': { label: 'In Progress', color: '#fb923c' },
  completed:     { label: 'Completed',   color: '#c9a84c' },
  declined:      { label: 'Declined',    color: '#ef4444' },
};

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

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

export default function FeedbackBrowse() {
  const { address } = useWallet();
  const { feedbacks, toggleVote } = useFeedbackStore();
  const [category, setCategory] = useState<FeedbackCategory | 'all'>('all');
  const [status, setStatus]     = useState<FeedbackStatus | 'all'>('all');
  const [sort, setSort]         = useState<'votes' | 'newest' | 'oldest'>('votes');
  const [search, setSearch]     = useState('');

  const stats = getFeedbackStats(feedbacks);

  const filtered = useMemo(() => {
    let result = [...feedbacks];
    if (category !== 'all') result = result.filter((f) => f.category === category);
    if (status  !== 'all') result = result.filter((f) => f.status   === status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }
    if (sort === 'votes')  result.sort((a, b) => b.votes.length - a.votes.length);
    if (sort === 'newest') result.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'oldest') result.sort((a, b) => a.createdAt - b.createdAt);
    return result;
  }, [feedbacks, category, status, sort, search]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
          >
            <ArrowLeft size={14} />
            Arc Ecosystem
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Feedback Hub</span>
          <WalletConnect />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Feedback Hub</h1>
            <p className="mt-1 text-sm text-[#777]">
              Help shape Arc Ecosystem. Report bugs, suggest features, share ideas.
            </p>
          </div>
          <Link
            href="/feedback/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 shrink-0"
            style={{ background: '#c9a84c', color: '#0a0a0a' }}
          >
            <Plus size={16} />
            New Feedback
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',     value: stats.total },
            { label: 'Open',      value: stats.open },
            { label: 'Planned',   value: stats.planned },
            { label: 'Completed', value: stats.completed },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <div className="text-2xl font-black text-[#c9a84c]">{s.value}</div>
              <div className="text-xs text-[#777] uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: category === 'all' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${category === 'all' ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: category === 'all' ? '#c9a84c' : '#777',
              }}
            >
              All
            </button>
            {(Object.keys(CATEGORY_CONFIG) as FeedbackCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${cfg.color}60` : 'rgba(255,255,255,0.08)'}`,
                    color: active ? cfg.color : '#777',
                  }}
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Search + Status + Sort */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#555] outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FeedbackStatus | 'all')}
              className="rounded-lg px-3 py-2 text-sm text-[#aaa] outline-none"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'votes' | 'newest' | 'oldest')}
              className="rounded-lg px-3 py-2 text-sm text-[#aaa] outline-none"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="votes">Most Votes</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#555] text-lg mb-6">
              {search || category !== 'all' || status !== 'all'
                ? 'No feedback matches your filters.'
                : 'No feedback yet. Be the first!'}
            </p>
            <Link
              href="/feedback/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
              style={{ background: '#c9a84c', color: '#0a0a0a' }}
            >
              <Plus size={16} />
              Submit Feedback
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fb) => {
              const catCfg    = CATEGORY_CONFIG[fb.category];
              const statusCfg = STATUS_CONFIG[fb.status];
              const hasVoted  = address ? fb.votes.includes(address) : false;
              return (
                <div
                  key={fb.id}
                  className="flex gap-4 rounded-xl p-4 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {/* Vote */}
                  <button
                    onClick={() => address && toggleVote(fb.id, address)}
                    className="flex flex-col items-center justify-start gap-1 pt-1 min-w-[40px] transition-all hover:scale-110"
                    title={address ? (hasVoted ? 'Remove vote' : 'Upvote') : 'Connect wallet to vote'}
                  >
                    <ChevronUp size={18} style={{ color: hasVoted ? '#c9a84c' : '#555' }} />
                    <span
                      className="text-xs font-black"
                      style={{ color: hasVoted ? '#c9a84c' : '#777' }}
                    >
                      {fb.votes.length}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/feedback/${fb.id}`}
                        className="font-bold text-white hover:text-[#c9a84c] transition-colors text-sm sm:text-base"
                      >
                        {fb.title}
                      </Link>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: `${catCfg.color}15`,
                          color: catCfg.color,
                          border: `1px solid ${catCfg.color}30`,
                        }}
                      >
                        {catCfg.icon}
                        {catCfg.label}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: `${statusCfg.color}15`,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.color}30`,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#777] line-clamp-2 mb-2">{fb.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#555]">
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {fb.authorName || shortenAddress(fb.authorAddress)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={11} />
                        {fb.comments.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {timeAgo(fb.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
