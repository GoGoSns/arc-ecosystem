'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bug, Sparkles, Lightbulb, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { useFeedbackStore, type FeedbackCategory } from '@/lib/feedbackStore';
import { useWallet } from '@/contexts/WalletContext';
import SiteHeader from '@/components/SiteHeader';

const CATEGORIES: {
  value: FeedbackCategory;
  label: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
}[] = [
  { value: 'bug',     label: 'Bug Report',       icon: <Bug size={22} />,           desc: 'Something is broken',     color: '#ef4444' },
  { value: 'feature', label: 'Feature Request',  icon: <Sparkles size={22} />,      desc: 'New functionality',        color: '#60a5fa' },
  { value: 'idea',    label: 'Idea',             icon: <Lightbulb size={22} />,     desc: 'Concept or improvement',   color: '#facc15' },
  { value: 'general', label: 'General',          icon: <MessageCircle size={22} />, desc: 'Any other feedback',       color: '#9ca3af' },
];

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export default function NewFeedback() {
  const { address, isConnected, connect } = useWallet();
  const { addFeedback } = useFeedbackStore();
  const router = useRouter();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState<FeedbackCategory>('feature');
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 5)   e.title = 'Title must be at least 5 characters.';
    if (title.length > 100)        e.title = 'Title must be at most 100 characters.';
    if (description.trim().length < 30) e.description = 'Description must be at least 30 characters.';
    if (authorName.length > 30)    e.authorName = 'Name must be at most 30 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!address || !validate()) return;
    setSubmitting(true);
    const id  = crypto.randomUUID();
    const now = Date.now();
    addFeedback({
      id,
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'open',
      authorAddress: address,
      authorName: authorName.trim() || undefined,
      votes: [address],
      comments: [],
      createdAt: now,
      updatedAt: now,
    });
    router.push(`/feedback/${id}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-black mb-2">Connect Your Wallet</h2>
            <p className="text-[#777] mb-8 text-sm">You need a wallet connection to submit feedback.</p>
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
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-black mb-2">Submit Feedback</h1>
        <p className="text-[#777] text-sm mb-10">Share your thoughts to help improve Arc Ecosystem.</p>

        {/* Category */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-3">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all"
                  style={{
                    background: active ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? `${cat.color}50` : 'rgba(255,255,255,0.08)'}`,
                    color: active ? cat.color : '#777',
                  }}
                >
                  {cat.icon}
                  <span className="text-xs font-bold leading-tight">{cat.label}</span>
                  <span className="text-[10px] opacity-60 leading-tight">{cat.desc}</span>
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
            maxLength={100}
            placeholder="Brief summary of your feedback..."
            className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none transition-colors text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${errors.title ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#ef4444]">{errors.title ?? ''}</span>
            <span className="text-xs text-[#555]">{title.length}/100</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#aaa] mb-2">
            Description <span className="text-[#ef4444]">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Describe your feedback in detail — what happened, what you expected, steps to reproduce... (min 30 chars)"
            className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none resize-none transition-colors text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${errors.description ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#ef4444]">{errors.description ?? ''}</span>
            <span className="text-xs text-[#555]">{description.length} chars</span>
          </div>
        </div>

        {/* Author Name */}
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
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
