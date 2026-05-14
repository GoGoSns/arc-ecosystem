'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  MessageCircle,
  Pin,
  Send,
  Trash2,
} from 'lucide-react';
import {
  useForumStore,
  isForumAdmin,
  getScore,
  type ForumComment,
} from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';
import { CATEGORY_CONFIG, shortenAddress, timeAgo } from '@/components/forum/ForumBrowse';
import SiteHeader from '@/components/SiteHeader';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, isConnected, connect, disconnect } = useWallet();
  const {
    threads,
    toggleVote,
    toggleCommentVote,
    addComment,
    incrementViews,
    pinThread,
    lockThread,
    deleteThread,
  } = useForumStore();
  const router = useRouter();

  const thread = threads.find((t) => t.id === id);

  useEffect(() => {
    if (thread) incrementViews(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [commentErr, setCommentErr] = useState('');
  const [replyErr, setReplyErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const admin = isForumAdmin(address);

  if (!thread) {
    notFound();
  }

  const catCfg = CATEGORY_CONFIG[thread.category];
  const score = getScore(thread.upvotes, thread.downvotes);
  const hasUp = !!address && thread.upvotes.includes(address);
  const hasDown = !!address && thread.downvotes.includes(address);

  const topLevel = thread.comments.filter((comment) => !comment.parentCommentId);
  const replies = (parentId: string) =>
    thread.comments.filter((comment) => comment.parentCommentId === parentId);

  const submitComment = (parentId?: string) => {
    if (!address) return;

    const text = parentId ? replyText : commentText;
    if (text.trim().length < 2) {
      if (parentId) setReplyErr('Reply must be at least 2 characters.');
      else setCommentErr('Comment must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    const comment: ForumComment = {
      id: crypto.randomUUID(),
      threadId: id,
      parentCommentId: parentId,
      authorAddress: address,
      authorName: authorName.trim() || undefined,
      content: text.trim(),
      upvotes: [],
      downvotes: [],
      createdAt: Date.now(),
    };

    addComment(id, comment);

    if (parentId) {
      setReplyText('');
      setReplyTo(null);
      setReplyErr('');
    } else {
      setCommentText('');
      setCommentErr('');
    }

    setSubmitting(false);
  };

  const handleDelete = () => {
    if (!admin) return;
    deleteThread(id);
    router.push('/forum');
  };

  return (
    <div className="forum-shell min-h-screen text-white">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="forum-panel mb-6 rounded-[1.75rem] p-6 sm:p-8"
          style={{
            borderColor: score >= 3 ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.14)',
          }}
        >
          <div className="forum-thread-badges">
            <span
              className="forum-tag"
              style={{
                background: `${catCfg.color}12`,
                color: catCfg.color,
                borderColor: `${catCfg.color}33`,
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
            {thread.pinned && (
              <span className="forum-tag">
                <Pin size={11} /> Pinned
              </span>
            )}
            {thread.locked && (
              <span className="forum-tag is-locked">
                <Lock size={11} /> Locked
              </span>
            )}
          </div>

          <h1 className="mt-3 text-[clamp(2rem,3.7vw,3.6rem)] font-black leading-[0.98] tracking-[-0.05em] text-white">
            {thread.title}
          </h1>

          <div className="forum-thread-meta mb-5 mt-4">
            <span>by {thread.authorName || shortenAddress(thread.authorAddress)}</span>
            <span>{timeAgo(thread.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <Eye size={11} /> {thread.views}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={11} /> {thread.comments.length}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-8 text-[#cfcfcf] sm:text-[15px]">
            {thread.content}
          </p>

          <div className="mt-6 flex items-center gap-3 border-t border-[#1e1e1e] pt-5">
            <button
              type="button"
              onClick={() => address && toggleVote(id, address, 'up')}
              className="forum-vote-button flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold"
              style={{
                background: hasUp ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                color: hasUp ? '#c9a84c' : '#666',
                border: `1px solid ${
                  hasUp ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'
                }`,
              }}
              title={address ? 'Upvote' : 'Connect wallet to vote'}
            >
              <ArrowUp size={14} />
              {thread.upvotes.length}
            </button>

            <span
              className="text-lg font-black"
              style={{ color: score > 0 ? '#c9a84c' : score < 0 ? '#ef4444' : '#555' }}
            >
              {score}
            </span>

            <button
              type="button"
              onClick={() => address && toggleVote(id, address, 'down')}
              className="forum-vote-button flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold"
              style={{
                background: hasDown ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                color: hasDown ? '#ef4444' : '#666',
                border: `1px solid ${
                  hasDown ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'
                }`,
              }}
              title={address ? 'Downvote' : 'Connect wallet to vote'}
            >
              <ArrowDown size={14} />
              {thread.downvotes.length}
            </button>

            {!address && (
              <span className="ml-2 text-xs text-[#555]">
                <button type="button" onClick={connect} className="forum-button forum-button--gold px-3 py-2 text-[10px]">
                  Connect wallet
                </button>{' '}
                to vote
              </span>
            )}
          </div>
        </div>

        {admin && (
          <div className="forum-panel mb-6 flex flex-wrap gap-2 rounded-[1.25rem] p-4">
            <span className="forum-chip self-center mr-2">Admin</span>
            <button
              type="button"
              onClick={() => pinThread(id)}
              className="forum-button text-[10px] px-3 py-2"
              style={{
                background: thread.pinned ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                color: thread.pinned ? '#c9a84c' : '#888',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <Pin size={12} />
              {thread.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => lockThread(id)}
              className="forum-button text-[10px] px-3 py-2"
              style={{
                background: thread.locked ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.05)',
                color: thread.locked ? '#fb923c' : '#888',
                border: '1px solid rgba(251,146,60,0.2)',
              }}
            >
              <Lock size={12} />
              {thread.locked ? 'Unlock' : 'Lock'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="forum-button text-[10px] px-3 py-2"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <Trash2 size={12} />
              Delete Thread
            </button>
          </div>
        )}

        <div className="mb-6">
          <h2 className="forum-panel-title mb-4">
            {thread.comments.length} {thread.comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>

          {!thread.locked ? (
            isConnected ? (
              <CommentBox
                label="Add a comment"
                value={commentText}
                onChange={setCommentText}
                onSubmit={() => submitComment()}
                error={commentErr}
                submitting={submitting}
                authorName={authorName}
                onAuthorNameChange={setAuthorName}
                showNameField
              />
            ) : (
              <div className="forum-panel mb-6 rounded-[1.25rem] p-5 text-center">
                <p className="text-sm leading-7 text-[#8a8a8a]">
                  Connect your wallet to join the discussion.
                </p>
                <button onClick={connect} className="forum-button forum-button--gold mt-4">
                  Connect Wallet
                </button>
              </div>
            )
          ) : (
            <div className="forum-panel mb-6 rounded-[1.25rem] p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#fb923c]/20 bg-[rgba(251,146,60,0.08)] text-[#fb923c]">
                <Lock size={14} />
              </div>
              <p className="text-sm leading-7 text-[#fb923c]">
                This thread is locked. No new comments.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {topLevel.length === 0 && (
              <div className="forum-panel rounded-[1.25rem] p-5 text-center">
                <p className="text-sm leading-7 text-[#8a8a8a]">No comments yet. Be the first signal here.</p>
              </div>
            )}

            {topLevel.map((comment) => (
              <CommentNode
                key={comment.id}
                comment={comment}
                replies={replies(comment.id)}
                address={address}
                onVote={(cid, type) => address && toggleCommentVote(id, cid, address, type)}
                replyTo={replyTo}
                replyText={replyText}
                setReplyTo={setReplyTo}
                setReplyText={setReplyText}
                replyErr={replyErr}
                setReplyErr={setReplyErr}
                onSubmitReply={(cid) => submitComment(cid)}
                submitting={submitting}
                locked={thread.locked}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBox({
  label,
  value,
  onChange,
  onSubmit,
  error,
  submitting,
  authorName,
  onAuthorNameChange,
  showNameField,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
  submitting: boolean;
  authorName?: string;
  onAuthorNameChange?: (v: string) => void;
  showNameField?: boolean;
}) {
  return (
    <div className="forum-panel mb-6 rounded-[1.25rem] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="forum-panel-title">{label}</p>
          <p className="mt-1 text-xs text-[#8a8a8a]">Keep it concise, specific, and useful.</p>
        </div>
        <span className="forum-chip">Wallet-authored</span>
      </div>

      {showNameField && onAuthorNameChange && (
        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#bdbdbd]">
            Display name
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(event) => onAuthorNameChange(event.target.value)}
            maxLength={30}
            placeholder="Display name (optional)"
            className="forum-input"
          />
        </div>
      )}

      <div className="mt-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={label}
          className="forum-textarea min-h-[9rem]"
          style={{ borderColor: error ? 'rgba(239,68,68,0.7)' : undefined }}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-[#ef4444]">{error}</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="forum-button forum-button--gold w-full sm:w-auto"
        >
          <Send size={12} />
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  replies,
  address,
  onVote,
  replyTo,
  replyText,
  setReplyTo,
  setReplyText,
  replyErr,
  setReplyErr,
  onSubmitReply,
  submitting,
  locked,
}: {
  comment: ForumComment;
  replies: ForumComment[];
  address?: string;
  onVote: (cid: string, type: 'up' | 'down') => void;
  replyTo: string | null;
  replyText: string;
  setReplyTo: (id: string | null) => void;
  setReplyText: (v: string) => void;
  replyErr: string;
  setReplyErr: (v: string) => void;
  onSubmitReply: (cid: string) => void;
  submitting: boolean;
  locked: boolean;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const hasUp = !!address && comment.upvotes.includes(address);
  const hasDown = !!address && comment.downvotes.includes(address);
  const cscore = getScore(comment.upvotes, comment.downvotes);
  const isReplying = replyTo === comment.id;
  const replyFormId = `reply-form-${comment.id}`;
  const repliesId = `replies-${comment.id}`;

  return (
    <div className="forum-panel rounded-[1.25rem] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white">
              {comment.authorName || shortenAddress(comment.authorAddress)}
            </span>
            <span className="forum-chip">Comment</span>
          </div>
          <div className="forum-thread-meta mt-2">
            <span>{timeAgo(comment.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <ArrowUp size={10} />
              {comment.upvotes.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowDown size={10} />
              {comment.downvotes.length}
            </span>
          </div>
        </div>

        <span
          className="inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold"
          style={{
            borderColor:
              cscore > 0
                ? 'rgba(201,168,76,0.3)'
                : cscore < 0
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(255,255,255,0.08)',
            color: cscore > 0 ? '#c9a84c' : cscore < 0 ? '#ef4444' : '#8a8a8a',
            background: cscore > 0 ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
          }}
        >
          {cscore}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#d5d5d5]">
        {comment.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onVote(comment.id, 'up')}
          className="forum-vote-button"
          style={{ color: hasUp ? '#c9a84c' : '#6b6b6b' }}
          aria-label="Upvote comment"
        >
          <ArrowUp size={12} />
        </button>
        <button
          type="button"
          onClick={() => onVote(comment.id, 'down')}
          className="forum-vote-button"
          style={{ color: hasDown ? '#ef4444' : '#6b6b6b' }}
          aria-label="Downvote comment"
        >
          <ArrowDown size={12} />
        </button>

        {!locked && address && (
          <button
            type="button"
            onClick={() => {
              if (isReplying) {
                setReplyTo(null);
                setReplyErr('');
              } else {
                setReplyTo(comment.id);
                setReplyText('');
                setReplyErr('');
              }
            }}
            className="forum-button text-[10px] px-3 py-2"
            aria-expanded={isReplying}
            aria-controls={replyFormId}
          >
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        )}

        {replies.length > 0 && (
          <button
            type="button"
            onClick={() => setShowReplies(!showReplies)}
            className="forum-button ml-auto text-[10px] px-3 py-2"
            aria-expanded={showReplies}
            aria-controls={repliesId}
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showReplies ? 'Hide' : 'Show'} replies ({replies.length})
          </button>
        )}
      </div>

      {isReplying && (
        <div id={replyFormId} className="mt-4 border-l border-[#2a2a2a] pl-4">
          <CommentBox
            label="Write a reply..."
            value={replyText}
            onChange={setReplyText}
            onSubmit={() => onSubmitReply(comment.id)}
            error={replyErr}
            submitting={submitting}
          />
        </div>
      )}

      {showReplies && replies.length > 0 && (
        <div id={repliesId} className="mt-4 space-y-3 border-l border-[#1e1e1e] pl-4">
          {replies.map((reply) => {
            const replyScore = getScore(reply.upvotes, reply.downvotes);

            return (
              <div key={reply.id} className="forum-panel rounded-[1rem] p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {reply.authorName || shortenAddress(reply.authorAddress)}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]">
                        Reply
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-[#6f6f6f]">
                      {timeAgo(reply.createdAt)}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#8a8a8a]">{replyScore}</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#cfcfcf]">
                  {reply.content}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onVote(reply.id, 'up')}
                    className="forum-vote-button"
                    style={{
                      color: address && reply.upvotes.includes(address) ? '#c9a84c' : '#6b6b6b',
                    }}
                    aria-label="Upvote reply"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onVote(reply.id, 'down')}
                    className="forum-vote-button"
                    style={{
                      color: address && reply.downvotes.includes(address) ? '#ef4444' : '#6b6b6b',
                    }}
                    aria-label="Downvote reply"
                  >
                    <ArrowDown size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WalletChip({
  address,
  isConnected,
  connect,
  disconnect,
}: {
  address?: string;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}) {
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
