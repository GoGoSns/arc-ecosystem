'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useForumStore, type ForumCategory } from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';
import { CATEGORY_CONFIG, shortenAddress } from '@/components/forum/ForumBrowse';
import ForumBrandMark from '@/components/forum/ForumBrandMark';
import SiteHeader from '@/components/SiteHeader';

const POSTING_RULES = [
  'Be precise. Strong threads lead with context, not noise.',
  'Use the right lane so your signal reaches the right audience.',
  'Keep your post public and wallet-authored for clarity.',
];

const FEATURED_AREAS: Array<{ href: string; label: string; description: string }> = [
  { href: '/forum/c/features', label: 'Product Signals', description: 'Ideas, roadmap feedback, and feature proposals.' },
  { href: '/forum/c/node', label: 'Node Operations', description: 'Infrastructure, uptime, and technical coordination.' },
  { href: '/forum/c/bugs', label: 'Bug Reports', description: 'Repro steps, regressions, and fixes.' },
];

export default function NewThread() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const { createThread } = useForumStore();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ForumCategory>('general');
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = CATEGORY_CONFIG[category];

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (title.trim().length < 5) nextErrors.title = 'Title must be at least 5 characters.';
    if (title.length > 150) nextErrors.title = 'Title must be at most 150 characters.';
    if (content.trim().length < 20) nextErrors.content = 'Body must be at least 20 characters.';
    if (authorName.length > 30) nextErrors.authorName = 'Name must be at most 30 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!address || !validate()) return;
    setSubmitting(true);

    const id = crypto.randomUUID();
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
      <div className="forum-shell min-h-screen text-white">
        <SiteHeader />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="forum-panel relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] p-6 text-center sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#c9a84c]/25 bg-[rgba(201,168,76,0.08)]">
              <ForumBrandMark className="forum-logo-glow h-10 w-10" />
            </div>
            <p className="forum-chip mx-auto mt-5 inline-flex">
              <ShieldCheck size={11} className="text-[#c9a84c]" />
              Wallet required
            </p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black leading-[0.95] tracking-[-0.05em] text-white">
              Connect to publish
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#8a8a8a]">
              Arc Forum threads are authored from a connected wallet so every signal carries clear ownership.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <button onClick={connect} className="forum-button forum-button--gold">
                <Sparkles size={14} />
                Connect Wallet
              </button>
              <Link href="/forum" className="forum-button">
                <ArrowLeft size={14} />
                Browse Forum
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-shell min-h-screen text-white">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="forum-panel forum-hero mb-6 rounded-[1.75rem] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="forum-panel-title">Community post desk</p>
              <h1 className="forum-hero-title mt-3">Create a signal</h1>
              <p className="forum-hero-copy mt-4 max-w-2xl">
                Shape a precise thread for the Arc community. Keep it sharp, contextual, and easy to scan.
              </p>
            </div>

            <div className="forum-stat-grid grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
              {[
                { label: 'Wallet', value: address ? 'Connected' : 'Required' },
                { label: 'Lane', value: selectedCategory.label },
                { label: 'Tone', value: 'Serious / public' },
              ].map((stat) => (
                <div key={stat.label} className="forum-stat-card">
                  <div className="forum-stat-label">{stat.label}</div>
                  <div className="forum-stat-value text-[1.1rem]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="forum-panel rounded-[1.75rem] p-5 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="forum-panel-title">Post form</p>
                <h2 className="mt-2 text-lg font-bold text-white">Signal settings</h2>
              </div>
              <span className="forum-chip">
                <ShieldCheck size={11} className="text-[#c9a84c]" />
                Wallet-authored
              </span>
            </div>

            <div className="mt-6">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-[#bdbdbd]">
                Category
              </label>
              <div className="forum-tab-group flex-wrap">
                {(Object.keys(CATEGORY_CONFIG) as ForumCategory[]).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const active = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="forum-tab"
                      data-active={active ? 'true' : undefined}
                      aria-pressed={active}
                    >
                      <span
                        className="forum-category-mark"
                        style={{ borderColor: cfg.color, color: cfg.color }}
                      >
                        {cfg.emoji}
                      </span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {selectedCategory.description}
              </p>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label
                  htmlFor="forum-title"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#bdbdbd]"
                >
                  Title <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  id="forum-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder="What's on your mind?"
                  className="forum-input"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'forum-title-error' : undefined}
                />
                <div className="mt-2 flex justify-between gap-4">
                  <span id="forum-title-error" className="text-xs text-[#ef4444]">
                    {errors.title ?? ''}
                  </span>
                  <span className="text-xs text-[#8a8a8a]">{title.length}/150</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="forum-body"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#bdbdbd]"
                >
                  Body <span className="text-[#ef4444]">*</span>
                </label>
                <textarea
                  id="forum-body"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={9}
                  placeholder="Share context, details, and the signal you want the community to see..."
                  className="forum-textarea"
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={errors.content ? 'forum-body-error' : undefined}
                />
                <div className="mt-2 flex justify-between gap-4">
                  <span id="forum-body-error" className="text-xs text-[#ef4444]">
                    {errors.content ?? ''}
                  </span>
                  <span className="text-xs text-[#8a8a8a]">{content.length} chars</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="forum-author"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-[#bdbdbd]"
                >
                  Display Name{' '}
                  <span className="font-normal normal-case tracking-normal text-[#6f6f6f]">
                    (optional)
                  </span>
                </label>
                <input
                  id="forum-author"
                  type="text"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  maxLength={30}
                  placeholder="How should we call you?"
                  className="forum-input"
                  aria-invalid={Boolean(errors.authorName)}
                  aria-describedby={errors.authorName ? 'forum-author-error' : undefined}
                />
                {errors.authorName ? (
                  <p id="forum-author-error" className="mt-2 text-xs text-[#ef4444]">
                    {errors.authorName}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[#8a8a8a]">
                    Optional. If empty, your wallet address will be shown.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-[#1f1f1f] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#8a8a8a]">
                Posts are public and tied to the connected wallet.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="forum-button forum-button--gold w-full sm:w-auto"
              >
                <Send size={14} />
                {submitting ? 'Publishing...' : 'Post Thread'}
              </button>
            </div>
          </form>

          <aside className="space-y-4 lg:pt-1">
            <div className="forum-panel rounded-[1.5rem] p-5">
              <p className="forum-panel-title">Featured areas</p>
              <h2 className="mt-2 text-lg font-bold text-white">Where signals land best</h2>
              <div className="mt-4 space-y-3">
                {FEATURED_AREAS.map((lane) => (
                  <Link key={lane.href} href={lane.href} className="forum-thread-link w-full justify-between">
                    <span>
                      <span className="block text-sm font-bold text-white">{lane.label}</span>
                      <span className="mt-1 block text-xs leading-6 text-[#8a8a8a]">{lane.description}</span>
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="forum-panel rounded-[1.5rem] p-5">
              <p className="forum-panel-title">Posting rules</p>
              <h2 className="mt-2 text-lg font-bold text-white">Keep the feed premium</h2>
              <ul className="mt-4 space-y-3">
                {POSTING_RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-sm leading-6 text-[#bdbdbd]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a84c] shadow-[0_0_10px_rgba(201,168,76,0.45)]" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
