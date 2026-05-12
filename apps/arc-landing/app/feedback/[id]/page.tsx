'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bug, Sparkles, Lightbulb, MessageCircle,
  ChevronUp, ArrowLeft, Send, Shield, Trash2, Check, User, Clock,
} from 'lucide-react';
import {
  useFeedbackStore, isAdmin,
  type FeedbackStatus, type FeedbackCategory,
} from '@/lib/feedbackStore';
import { useWallet } from '@/contexts/WalletContext';

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug:     { label: 'Bug',     icon: <Bug size={12} />,           color: '#ef4444' },
  feature: { label: 'Feature', icon: <Sparkles size={12} />,      color: '#60a5fa' },
  idea:    { label: 'Idea',    icon: <Lightbulb size={12} />,     color: '#facc15' },
  general: { label: 'General', icon: <MessageCircle size={12} />, color: '#9ca3af' },
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

export default function FeedbackDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useWallet();
  const router = useRouter();
  const { feedbacks, toggleVote, addComment, updateStatus, deleteFeedback } = useFeedbackStore();

  const fb = feedbacks.find((f) => f.id === id);

  const [commentText, setCommentText]   = useState('');
  const [newStatus, setNewStatus]       = useState<FeedbackStatus>(fb?.status ?? 'open');
  const [adminResponse, setAdminResponse] = useState(fb?.adminResponse ?? '');
  const [posting, setPosting]           = useState(false);

  if (!fb) {
    notFound();
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#555] text-lg mb-4">Feedback not found.</p>
          <Link href="/feedback" className="text-[#c9a84c] text-sm hover:underline">
            ← Back to Feedback Hub
          </Link>
        </div>
      </div>
    );
  }

  const hasVoted  = address ? fb.votes.includes(address) : false;
  const admin     = isAdmin(address);
  const catCfg    = CATEGORY_CONFIG[fb.category];
  const statusCfg = STATUS_CONFIG[fb.status];

  const handlePostComment = () => {
    if (!address || !commentText.trim()) return;
    setPosting(true);
    addComment(fb.id, {
      id: crypto.randomUUID(),
      feedbackId: fb.id,
      authorAddress: address,
      content: commentText.trim(),
      createdAt: Date.now(),
    });
    setCommentText('');
    setPosting(false);
  };

  const handleUpdateStatus = () => {
    updateStatus(fb.id, newStatus, adminResponse.trim() || undefined);
  };

  const handleDelete = () => {
    if (!confirm('Delete this feedback permanently?')) return;
    deleteFeedback(fb.id);
    router.push('/feedback');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/feedback"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors"
          >
            <ArrowLeft size={14} />
            Feedback Hub
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Feedback</span>
          <WalletConnect />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Hero */}
        <div className="flex gap-5 mb-8">
          {/* Vote button */}
          <button
            onClick={() => address && toggleVote(fb.id, address)}
            className="flex flex-col items-center gap-1.5 min-w-[56px] p-3 rounded-xl border transition-all hover:scale-105 h-fit"
            style={{
              background: hasVoted ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
              borderColor: hasVoted ? '#c9a84c' : 'rgba(255,255,255,0.08)',
            }}
            title={address ? (hasVoted ? 'Remove vote' : 'Upvote') : 'Connect wallet to vote'}
          >
            <ChevronUp size={22} style={{ color: hasVoted ? '#c9a84c' : '#555' }} />
            <span className="text-sm font-black" style={{ color: hasVoted ? '#c9a84c' : '#777' }}>
              {fb.votes.length}
            </span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: `${catCfg.color}15`, color: catCfg.color, border: `1px solid ${catCfg.color}30` }}
              >
                {catCfg.icon}
                {catCfg.label}
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: `${statusCfg.color}15`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}
              >
                {statusCfg.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3">{fb.title}</h1>
            <div className="flex flex-wrap gap-4 text-xs text-[#555]">
              <span className="flex items-center gap-1">
                <User size={11} />
                {fb.authorName || shortenAddress(fb.authorAddress)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(fb.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {fb.comments.length} comment{fb.comments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          className="rounded-xl p-6 mb-6 text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {fb.description}
        </div>

        {/* Admin Response display */}
        {fb.adminResponse && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: '#c9a84c' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Admin Response</span>
            </div>
            <p className="text-[#ddd] text-sm whitespace-pre-wrap">{fb.adminResponse}</p>
          </div>
        )}

        {/* Admin Panel */}
        {admin && (
          <div
            className="rounded-xl p-6 mb-8"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield size={14} style={{ color: '#c9a84c' }} />
              <span className="text-sm font-bold text-[#c9a84c]">Admin Actions</span>
            </div>
            <div className="flex flex-col gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                className="rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: '#111', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={3}
                placeholder="Admin response visible to everyone (optional)..."
                className="w-full rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none resize-none text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)' }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                  style={{ background: '#c9a84c', color: '#0a0a0a' }}
                >
                  <Check size={14} />
                  Update
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h2 className="text-lg font-black mb-5">
            Comments{' '}
            <span className="text-[#555] font-normal text-base">({fb.comments.length})</span>
          </h2>

          {fb.comments.length > 0 && (
            <div className="space-y-3 mb-6">
              {fb.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#aaa]">
                      {comment.authorName || shortenAddress(comment.authorAddress)}
                    </span>
                    <span className="text-xs text-[#555]">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#ccc] whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {address ? (
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Add a comment..."
                className="w-full bg-transparent text-white placeholder-[#555] outline-none resize-none text-sm mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePostComment}
                  disabled={!commentText.trim() || posting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#c9a84c', color: '#0a0a0a' }}
                >
                  <Send size={14} />
                  Post Comment
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#555] mb-3">Connect your wallet to join the conversation.</p>
              <WalletConnect />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
