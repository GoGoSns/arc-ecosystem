'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  Trophy, ArrowLeft, Clock, DollarSign, Tag, Briefcase, 
  ExternalLink, CheckCircle, Send, User,
  Link as LinkIcon, Trash2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useBountyStore, Bounty, Proposal } from '@/lib/bountyStore';
import { sendUSDC } from '@/lib/payments';

function StatusBadge({ status }: { status: Bounty['status'] }) {
  const colors: Record<string, string> = {
    open: '#4ade80',
    in_progress: '#facc15',
    submitted: '#60a5fa',
    completed: '#c9a84c',
    cancelled: '#9ca3af',
    expired: '#ef4444',
  };
  const label = status.replace('_', ' ');
  return (
    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
      style={{ background: `${colors[status]}15`, color: colors[status], border: `1px solid ${colors[status]}30` }}>
      {label}
    </span>
  );
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { bounties, updateBounty, addProposal, updateProposal } = useBountyStore();
  
  const bounty = bounties.find(b => b.id === id);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(0);
  
  // Form states
  const [proposalForm, setProposalForm] = useState({ bidAmount: '', coverLetter: '', portfolioUrl: '', estimatedDays: '' });
  const [submissionForm, setSubmissionForm] = useState({ url: '', note: '' });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => { 
    setMounted(true); 
    setNow(Date.now());
  }, []);

  if (!mounted) return null;
  if (!bounty) return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold mb-2">Bounty not found</h1>
          <button onClick={() => router.push('/bounty')} className="text-[var(--accent)] font-bold">Back to Board</button>
        </div>
      </main>
    </div>
  );

  const isOwner = address?.toLowerCase() === bounty.ownerAddress.toLowerCase();
  const myProposal = bounty.proposals.find(p => p.hunterAddress.toLowerCase() === address?.toLowerCase());
  const isAcceptedHunter = bounty.acceptedHunterAddress?.toLowerCase() === address?.toLowerCase();
  const daysLeft = now > 0 ? Math.max(0, Math.ceil((bounty.deadline - now) / 86_400_000)) : 0;

  const handlePostProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    
    const errs: Partial<Record<string, string>> = {};
    const bid = parseFloat(proposalForm.bidAmount);
    if (!proposalForm.bidAmount || isNaN(bid) || bid <= 0) errs.bidAmount = 'Valid bid is required';
    if (proposalForm.coverLetter.length < 50) errs.coverLetter = 'Min 50 characters required';
    
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const proposal: Proposal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bountyId: bounty.id,
      hunterAddress: address,
      bidAmount: bid,
      coverLetter: proposalForm.coverLetter,
      portfolioUrl: proposalForm.portfolioUrl || undefined,
      estimatedDays: proposalForm.estimatedDays ? parseInt(proposalForm.estimatedDays) : undefined,
      status: 'pending',
      createdAt: Date.now(),
    };

    addProposal(bounty.id, proposal);
    setProposalForm({ bidAmount: '', coverLetter: '', portfolioUrl: '', estimatedDays: '' });
    setErrors({});
  };

  const handleWithdrawProposal = () => {
    if (myProposal && confirm('Withdraw your proposal?')) {
      updateProposal(bounty.id, myProposal.id, { status: 'withdrawn' });
    }
  };

  const handleAcceptProposal = (p: Proposal) => {
    if (confirm(`Accept proposal from ${shortenAddr(p.hunterAddress)} for $${p.bidAmount} USDC?`)) {
      updateBounty(bounty.id, {
        status: 'in_progress',
        acceptedProposalId: p.id,
        acceptedHunterAddress: p.hunterAddress,
        finalAmount: p.bidAmount,
        acceptedAt: Date.now(),
      });
      updateProposal(bounty.id, p.id, { status: 'accepted' });
      // Reject others
      bounty.proposals.forEach(other => {
        if (other.id !== p.id && other.status === 'pending') {
          updateProposal(bounty.id, other.id, { status: 'rejected' });
        }
      });
    }
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionForm.url) { setErrors({ submission: 'URL is required' }); return; }
    
    updateBounty(bounty.id, {
      status: 'submitted',
      submissionUrl: submissionForm.url,
      submissionNote: submissionForm.note,
      submittedAt: Date.now(),
    });
  };

  const handleApproveAndPay = async () => {
    if (!bounty.acceptedHunterAddress || !bounty.finalAmount) return;
    if (!confirm(`Approve work and pay $${bounty.finalAmount} USDC?`)) return;

    setLoading(true);
    try {
      const { txHash } = await sendUSDC(bounty.acceptedHunterAddress, bounty.finalAmount.toString());
      updateBounty(bounty.id, {
        status: 'completed',
        payoutTxHash: txHash,
        completedAt: Date.now(),
      });
      alert('Payment successful!');
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBounty = () => {
    if (confirm('Cancel this bounty? This cannot be undone.')) {
      updateBounty(bounty.id, { status: 'cancelled', cancelledAt: Date.now() });
    }
  };

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' };

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-6 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--fg)' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <StatusBadge status={bounty.status} />
                <div className="flex items-center gap-1.5 text-xs opacity-50">
                  <User size={14} />
                  <span>Posted by <span className="font-mono">{shortenAddr(bounty.ownerAddress)}</span></span>
                </div>
              </div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>{bounty.title}</h1>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Tag size={14} className="opacity-50" />
                  <span className="capitalize">{bounty.category}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Clock size={14} className="opacity-50" />
                  <span>{daysLeft === 0 ? 'Ends today' : `Ends in ${daysLeft} days`}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Description</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: 'var(--fg)' }}>
                {bounty.description}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {bounty.requiredSkills.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Proposals List (Owner Only) */}
            {isOwner && bounty.status === 'open' && (
              <div className="flex flex-col gap-4 mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Proposals ({bounty.proposals.filter(p => p.status === 'pending').length})</h2>
                {bounty.proposals.filter(p => p.status === 'pending').length === 0 ? (
                  <p className="text-sm opacity-50 italic">No proposals yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {bounty.proposals.filter(p => p.status === 'pending').map(p => (
                      <div key={p.id} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 font-bold text-xs">
                              {p.hunterAddress.slice(2, 4).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold font-mono">{shortenAddr(p.hunterAddress)}</p>
                              <p className="text-xs opacity-50">Bid: <span className="text-[var(--accent)] font-bold">${p.bidAmount} USDC</span></p>
                            </div>
                          </div>
                          <button onClick={() => handleAcceptProposal(p)} className="sweep px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
                            Accept Proposal
                          </button>
                        </div>
                        <p className="text-sm opacity-70 whitespace-pre-wrap">{p.coverLetter}</p>
                        {p.portfolioUrl && (
                          <a href={p.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                            <LinkIcon size={12} /> Portfolio Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submission View (Owner Only) */}
            {isOwner && bounty.status === 'submitted' && (
              <div className="rounded-2xl p-6 flex flex-col gap-6 mt-8" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.2)' }}>
                <div className="flex items-center gap-3 text-blue-400">
                  <Send size={20} />
                  <h2 className="text-lg font-bold">Work Submitted</h2>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase opacity-50">Submission Link</p>
                  <a href={bounty.submissionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 font-mono text-sm break-all">
                    {bounty.submissionUrl} <ExternalLink size={14} />
                  </a>
                </div>
                {bounty.submissionNote && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold uppercase opacity-50">Hunter's Note</p>
                    <p className="text-sm opacity-80 italic">"{bounty.submissionNote}"</p>
                  </div>
                )}
                <button 
                  onClick={handleApproveAndPay} 
                  disabled={loading}
                  className="sweep w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50" 
                  style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                >
                  {loading ? 'Processing...' : <><CheckCircle size={20} /> Approve & Pay ${bounty.finalAmount} USDC</>}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex flex-col">
                <p className="text-xs font-bold uppercase opacity-40 mb-1">Budget</p>
                <div className="flex items-center gap-2">
                  <DollarSign size={20} style={{ color: 'var(--accent)' }} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{bounty.status === 'open' ? bounty.budget : bounty.finalAmount}</span>
                  <span className="text-sm font-mono opacity-50">USDC</span>
                </div>
                <p className="text-[10px] opacity-40 mt-1 capitalize">{bounty.budgetType} Budget</p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-bold uppercase opacity-40 mb-1">Status</p>
                <p className="text-sm font-medium capitalize">{bounty.status.replace('_', ' ')}</p>
              </div>

              {bounty.status === 'completed' && bounty.payoutTxHash && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs font-bold uppercase opacity-40 mb-2">Payout Transaction</p>
                  <a href={`https://testnet.arcscan.app/tx/${bounty.payoutTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-colors">
                    <span className="font-mono opacity-60">{shortenAddr(bounty.payoutTxHash)}</span>
                    <ExternalLink size={12} className="text-[var(--accent)]" />
                  </a>
                </div>
              )}
            </div>

            {/* Actions for Hunter */}
            {!isOwner && bounty.status === 'open' && (
              <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold flex items-center gap-2"><Briefcase size={18} /> Submit Proposal</h3>
                {!isConnected ? (
                  <p className="text-xs opacity-50 text-center py-4">Connect wallet to submit a proposal.</p>
                ) : myProposal && myProposal.status === 'pending' ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-green-400/5 border border-green-400/20 text-green-400 text-xs flex items-center gap-2">
                      <CheckCircle size={14} /> Proposal submitted
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] uppercase font-bold opacity-40">Your Bid</p>
                      <p className="text-sm font-bold">${myProposal.bidAmount} USDC</p>
                    </div>
                    <button onClick={handleWithdrawProposal} className="flex items-center justify-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={14} /> Withdraw Proposal
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePostProposal} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase opacity-40">Bid Amount (USDC)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={proposalForm.bidAmount} onChange={e => setProposalForm(f => ({ ...f, bidAmount: e.target.value }))} className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                      {errors.bidAmount && <p className="text-[10px] text-red-400">{errors.bidAmount}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase opacity-40">Cover Letter</label>
                      <textarea placeholder="Why are you the best fit? (min 50 chars)" value={proposalForm.coverLetter} onChange={e => setProposalForm(f => ({ ...f, coverLetter: e.target.value }))} rows={4} className="px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                      <div className="flex justify-between">
                        {errors.coverLetter && <p className="text-[10px] text-red-400">{errors.coverLetter}</p>}
                        <span className="text-[10px] opacity-30">{proposalForm.coverLetter.length} chars</span>
                      </div>
                    </div>
                    <button type="submit" className="sweep w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>Submit Proposal</button>
                  </form>
                )}
              </div>
            )}

            {/* Submit Work for Accepted Hunter */}
            {isAcceptedHunter && bounty.status === 'in_progress' && (
              <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <h3 className="font-bold flex items-center gap-2"><Send size={18} /> Submit Work</h3>
                <form onSubmit={handleSubmitWork} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase opacity-40">Deliverable URL</label>
                    <input type="url" placeholder="https://..." value={submissionForm.url} onChange={e => setSubmissionForm(f => ({ ...f, url: e.target.value }))} className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                    {errors.submission && <p className="text-[10px] text-red-400">{errors.submission}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase opacity-40">Note for Owner</label>
                    <textarea placeholder="Anything else the owner should know?" value={submissionForm.note} onChange={e => setSubmissionForm(f => ({ ...f, note: e.target.value }))} rows={3} className="px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                  </div>
                  <button type="submit" className="sweep w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>Submit for Review</button>
                </form>
              </div>
            )}

            {/* Owner Control */}
            {isOwner && bounty.status === 'open' && (
              <button onClick={handleCancelBounty} className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/5 transition-colors">
                <Trash2 size={16} /> Cancel Bounty
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
