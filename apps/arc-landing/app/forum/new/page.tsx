'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { useForumStore, type ForumCategory } from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';
import { CATEGORY_CONFIG, shortenAddress } from '@/components/forum/ForumBrowse';

export default function NewThread() {
  const { address, isConnected, connect } = useWallet();
  const { createThread } = useForumStore();
  const router = useRouter();

  const [title, setTitle]           = useState('');
  const [content, setContent]       = useState('');
  const [category, setCategory]     = useState<ForumCategory>('general');
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 5)     e.title   = 'Title must be at least 5 characters.';
    if (title.length > 150)          e.title   = 'Title must be at most 150 characters.';
    if (content.trim().length < 20)  e.content = 'Body must be at least 20 characters.';
    if (authorName.length > 30)      e.authorName = 'Name must be at most 30 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!address || !validate()) return;
    setSubmitting(true);
    const id  = crypto.randomUUID();
    const now = Date.now();
    createThread({
      id,
      title: title.trim(),
      content: content.trim(),
      category,
      authorAddress: address,
      authorName: authorName.trim() || undefined,
      upvotes: [],
      downvotes: [],
      comments: [],
      pinned: false,
      locked: false,
      views: 0,
      createdAt: now,
      updatedAt: now,
    });
    router.push(`/forum/${id}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
            <Link
              href="/forum"
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
            >
              <ArrowLeft size={14} />
              Arc Forum
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-black mb-2">Connect Your Wallet</h2>
            <p className="text-[#777] mb-8 text-sm">You need a wallet connection to post.</p>
            <button
              onClick={connect}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#c9a84c', color: '#0a0a0a' }}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/forum"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
          >
            <ArrowLeft size={14} />
            Arc Forum
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// New Post</span>
          <span
            className="px-3 py-1.5 rounded-lg text-xs font-mono border"
            style={{ borderColor: '#c9a84c', color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }}
          >
            {address ? shortenAddress(address) : ''}
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-black mb-2">Create Post</h1>
        <p className="text-[#777] text-sm mb-10">Start a discussion in the Arc community.</p>

        {/* Category */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-3">Category</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_CONFIG) as ForumCategory[]).map((cat) => {
              const cfg    = CATEGORY_CONFIG[cat];
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? `${cfg.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${cfg.color}50` : 'rgba(255,255,255,0.08)'}`,
                    color: active ? cfg.color : '#777',
                  }}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-2">
            Title <span className="text-[#ef4444]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="What's on your mind?"
            className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none transition-colors text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${errors.title ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#ef4444]">{errors.title ?? ''}</span>
            <span className="text-xs text-[#555]">{title.length}/150</span>
          </div>
        </div>

        {/* Body */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-2">
            Body <span className="text-[#ef4444]">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Share details, context, or your full thoughts... (min 20 chars)"
            className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none resize-none transition-colors text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${errors.content ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#ef4444]">{errors.content ?? ''}</span>
            <span className="text-xs text-[#555]">{content.length} chars</span>
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-10">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-2">
            Display Name <span className="text-[#555] font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={30}
            placeholder="How should we call you?"
            className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none transition-colors text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          {errors.authorName && (
            <p className="text-xs text-[#ef4444] mt-1.5">{errors.authorName}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#c9a84c', color: '#0a0a0a' }}
        >
          <Send size={16} />
          {submitting ? 'Posting...' : 'Post Thread'}
        </button>
      </div>
    </div>
  );
}
