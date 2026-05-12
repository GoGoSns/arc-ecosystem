'use client';

import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowUp, ArrowDown, MessageCircle,
  Pin, Lock, Trash2, Eye, Send, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  useForumStore, isForumAdmin, getScore,
  type ForumComment,
} from '@/lib/forumStore';
import { useWallet } from '@/contexts/WalletContext';
import { CATEGORY_CONFIG, shortenAddress, timeAgo } from '@/components/forum/ForumBrowse';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address, isConnected, connect, disconnect } = useWallet();
  const {
    threads, toggleVote, toggleCommentVote,
    addComment, incrementViews, pinThread, lockThread, deleteThread,
  } = useForumStore();
  const router = useRouter();

  const thread = threads.find((t) => t.id === id);

  useEffect(() => {
    if (thread) incrementViews(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo]         = useState<string | null>(null);
  const [replyText, setReplyText]     = useState('');
  const [authorName, setAuthorName]   = useState('');
  const [commentErr, setCommentErr]   = useState('');
  const [replyErr, setReplyErr]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const admin = isForumAdmin(address);

  if (!thread) {
    notFound();
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-[#777]">Thread not found.</p>
        <Link href="/forum" className="text-[#c9a84c] text-sm hover:underline">← Back to Forum</Link>
      </div>
    );
  }

  const catCfg  = CATEGORY_CONFIG[thread.category];
  const score   = getScore(thread.upvotes, thread.downvotes);
  const hasUp   = !!address && thread.upvotes.includes(address);
  const hasDown = !!address && thread.downvotes.includes(address);

  const topLevel = thread.comments.filter((c) => !c.parentCommentId);
  const replies  = (parentId: string) => thread.comments.filter((c) => c.parentCommentId === parentId);

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
    if (parentId) { setReplyText(''); setReplyTo(null); setReplyErr(''); }
    else { setCommentText(''); setCommentErr(''); }
    setSubmitting(false);
  };

  const handleDelete = () => {
    if (!admin) return;
    deleteThread(id);
    router.push('/forum');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/forum"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
          >
            <ArrowLeft size={14} />
            Arc Forum
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Thread</span>
          <WalletChip address={address} isConnected={isConnected} connect={connect} disconnect={disconnect} />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Thread card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${score >= 3 ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {/* Category + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ background: `${catCfg.color}18`, color: catCfg.color }}
            >
              {catCfg.emoji} {catCfg.label}
            </span>
            {thread.pinned && (
              <span className="flex items-center gap-1 text-[#c9a84c] text-[11px]">
                <Pin size={11} /> Pinned
              </span>
            )}
            {thread.locked && (
              <span className="flex items-center gap-1 text-[#fb923c] text-[11px]">
                <Lock size={11} /> Locked
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black leading-snug mb-3">{thread.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555] mb-5">
            <span>by {thread.authorName || shortenAddress(thread.authorAddress)}</span>
            <span>{timeAgo(thread.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {thread.views}</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} /> {thread.comments.length}</span>
          </div>

          <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{thread.content}</p>

          {/* Vote row */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#1e1e1e]">
            <button
              onClick={() => address && toggleVote(id, address, 'up')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{
                background: hasUp ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                color: hasUp ? '#c9a84c' : '#666',
                border: `1px solid ${hasUp ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
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
              onClick={() => address && toggleVote(id, address, 'down')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{
                background: hasDown ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                color: hasDown ? '#ef4444' : '#666',
                border: `1px solid ${hasDown ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              title={address ? 'Downvote' : 'Connect wallet to vote'}
            >
              <ArrowDown size={14} />
              {thread.downvotes.length}
            </button>

            {!address && (
              <span className="text-xs text-[#555] ml-2">
                <button onClick={connect} className="text-[#c9a84c] hover:underline">Connect wallet</button> to vote
              </span>
            )}
          </div>
        </div>

        {/* Admin panel */}
        {admin && (
          <div
            className="rounded-xl p-4 mb-6 flex flex-wrap gap-2"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] self-center mr-2">Admin</span>
            <button
              onClick={() => pinThread(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
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
              onClick={() => lockThread(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
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
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
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

        {/* Comments section */}
        <div className="mb-6">
          <h2 className="text-lg font-black mb-4">
            {thread.comments.length} {thread.comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>

          {/* Add comment */}
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
              <div
                className="rounded-xl p-4 mb-6 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm text-[#777] mb-3">Connect your wallet to join the discussion.</p>
                <button
                  onClick={connect}
                  className="px-4 py-2 rounded-lg text-xs font-bold"
                  style={{ background: '#c9a84c', color: '#0a0a0a' }}
                >
                  Connect Wallet
                </button>
              </div>
            )
          ) : (
            <div
              className="rounded-xl p-4 mb-6 text-center text-sm text-[#fb923c]"
              style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}
            >
              <Lock size={14} className="inline mr-2 opacity-70" />
              This thread is locked. No new comments.
            </div>
          )}

          {/* Thread comments */}
          <div className="space-y-4">
            {topLevel.length === 0 && (
              <p className="text-[#555] text-sm text-center py-8">No comments yet. Be the first!</p>
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
                authorName={authorName}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBox({
  label, value, onChange, onSubmit, error, submitting,
  authorName, onAuthorNameChange, showNameField,
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
    <div className="mb-6">
      {showNameField && onAuthorNameChange && (
        <input
          type="text"
          value={authorName}
          onChange={(e) => onAuthorNameChange(e.target.value)}
          maxLength={30}
          placeholder="Display name (optional)"
          className="w-full rounded-xl px-4 py-2.5 text-white placeholder-[#555] outline-none text-sm mb-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={label}
        className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none resize-none text-sm"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
        }}
      />
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-xs text-[#ef4444]">{error}</span>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: '#c9a84c', color: '#0a0a0a' }}
        >
          <Send size={12} />
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function CommentNode({
  comment, replies, address, onVote,
  replyTo, replyText, setReplyTo, setReplyText,
  replyErr, setReplyErr, onSubmitReply, submitting,
  locked, authorName,
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
  authorName: string;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const hasUp   = !!address && comment.upvotes.includes(address);
  const hasDown = !!address && comment.downvotes.includes(address);
  const cscore  = getScore(comment.upvotes, comment.downvotes);
  const isReplying = replyTo === comment.id;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Author + time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-[#aaa]">
          {comment.authorName || shortenAddress(comment.authorAddress)}
        </span>
        <span className="text-[10px] text-[#555]">{timeAgo(comment.createdAt)}</span>
      </div>

      <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap mb-3">{comment.content}</p>

      {/* Vote + reply row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => onVote(comment.id, 'up')}
          className="p-1 rounded transition-all hover:scale-110"
          style={{ color: hasUp ? '#c9a84c' : '#444' }}
        >
          <ArrowUp size={12} />
        </button>
        <span
          className="text-xs font-black"
          style={{ color: cscore > 0 ? '#c9a84c' : cscore < 0 ? '#ef4444' : '#666' }}
        >
          {cscore}
        </span>
        <button
          onClick={() => onVote(comment.id, 'down')}
          className="p-1 rounded transition-all hover:scale-110"
          style={{ color: hasDown ? '#ef4444' : '#444' }}
        >
          <ArrowDown size={12} />
        </button>

        {!locked && address && (
          <button
            onClick={() => {
              if (isReplying) { setReplyTo(null); setReplyErr(''); }
              else { setReplyTo(comment.id); setReplyText(''); setReplyErr(''); }
            }}
            className="text-[11px] text-[#555] hover:text-[#c9a84c] transition-colors ml-1"
          >
            {isReplying ? 'Cancel' : '↩ Reply'}
          </button>
        )}

        {replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-0.5 text-[11px] text-[#555] hover:text-[#aaa] transition-colors ml-auto"
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Inline reply box */}
      {isReplying && (
        <div className="mt-3 pl-4 border-l border-[#2a2a2a]">
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

      {/* Nested replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 pl-4 border-l border-[#1e1e1e] space-y-3">
          {replies.map((r) => (
            <div key={r.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-[#aaa]">
                  {r.authorName || shortenAddress(r.authorAddress)}
                </span>
                <span className="text-[10px] text-[#555]">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{r.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onVote(r.id, 'up')}
                  className="p-0.5 rounded transition-all hover:scale-110"
                  style={{ color: address && r.upvotes.includes(address) ? '#c9a84c' : '#444' }}
                >
                  <ArrowUp size={11} />
                </button>
                <span className="text-[10px] font-black" style={{ color: '#666' }}>
                  {getScore(r.upvotes, r.downvotes)}
                </span>
                <button
                  onClick={() => onVote(r.id, 'down')}
                  className="p-0.5 rounded transition-all hover:scale-110"
                  style={{ color: address && r.downvotes.includes(address) ? '#ef4444' : '#444' }}
                >
                  <ArrowDown size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletChip({
  address, isConnected, connect, disconnect,
}: {
  address?: string;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}) {
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
