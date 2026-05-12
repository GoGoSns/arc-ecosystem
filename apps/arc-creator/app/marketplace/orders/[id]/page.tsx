'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  ShoppingBag, ArrowLeft, Star, Clock, DollarSign, Tag, 
  User, Check, ChevronRight, ExternalLink, Shield, Info,
  Send, Link as LinkIcon, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useMarketplaceStore, Order, Service } from '@/lib/marketplaceStore';
import { sendUSDC } from '@/lib/payments';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#9ca3af',
    in_progress: '#facc15',
    delivered: '#60a5fa',
    completed: '#c9a84c',
    cancelled: '#ef4444',
    disputed: '#f97316',
  };
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: `${colors[status] || '#9ca3af'}15`, color: colors[status] || '#9ca3af', border: `1px solid ${colors[status] || '#9ca3af'}30` }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { address } = useAccount();
  const { orders, services, updateOrder, updateService } = useMarketplaceStore();
  
  const order = orders.find(o => o.id === id);
  const service = services.find(s => s.id === order?.serviceId);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Delivery form
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  
  // Review form
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (!order) return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <button onClick={() => router.push('/marketplace/orders')} className="text-[var(--accent)] font-bold">My Orders</button>
        </div>
      </main>
    </div>
  );

  const isBuyer = address?.toLowerCase() === order.buyerAddress.toLowerCase();
  const isSeller = address?.toLowerCase() === order.sellerAddress.toLowerCase();

  const handleDeliver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryUrl) return;
    
    updateOrder(order.id, {
      status: 'delivered',
      deliveryUrl,
      deliveryNote,
      deliveredAt: Date.now()
    });
  };

  const handleComplete = () => {
    updateOrder(order.id, {
      status: 'completed',
      completedAt: Date.now(),
      rating,
      review
    });

    // Update service stats
    if (service) {
      const newCount = service.ratingCount + 1;
      const newRating = ((service.rating * service.ratingCount) + rating) / newCount;
      updateService(service.id, {
        ordersCompleted: service.ordersCompleted + 1,
        rating: newRating,
        ratingCount: newCount
      });
    }
  };

  const handleRevision = () => {
    updateOrder(order.id, { status: 'in_progress' });
  };

  const handleRefund = async () => {
    if (!confirm('Refund the buyer? This will send the USDC back.')) return;
    setLoading(true);
    try {
      const { txHash } = await sendUSDC(order.buyerAddress, order.totalAmount.toString());
      updateOrder(order.id, { status: 'cancelled', refundTxHash: txHash, cancelledAt: Date.now() });
      alert('Refund successful!');
    } catch (err) {
      console.error(err);
      alert('Refund failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' };

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--fg)' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <h1 className="text-xl font-bold">Order #{order.id}</h1>
              </div>
              <p className="text-sm opacity-50">Placed on {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <Link href={`/marketplace/${order.serviceId}`} className="text-sm font-bold text-[var(--accent)] flex items-center gap-1">
              View Service Listing <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Order Info Card */}
              <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Service Ordered</h2>
                  <p className="font-bold text-lg">{order.service.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase opacity-40">Amount Paid</p>
                    <p className="font-bold text-lg text-[var(--accent)]">${order.totalAmount} USDC</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold uppercase opacity-40">Delivery Days</p>
                    <p className="font-bold text-lg">{order.deliveryDays} Days</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                  <p className="text-xs font-bold uppercase opacity-40">Payment Transaction</p>
                  <a href={`https://testnet.arcscan.app/tx/${order.paymentTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-xs font-mono opacity-60 truncate">{order.paymentTxHash}</span>
                    <ExternalLink size={14} className="text-[var(--accent)] shrink-0" />
                  </a>
                </div>
              </div>

              {/* Requirements */}
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Order Requirements</h2>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{order.requirements}</p>
                  {order.attachmentUrl && (
                    <a href={order.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:underline">
                      <LinkIcon size={12} /> Reference Attachment
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery History */}
              {(order.status === 'delivered' || order.status === 'completed') && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider opacity-40">Work Delivered</h2>
                  <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold uppercase opacity-40">Delivery Link</p>
                      <a href={order.deliveryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs break-all">
                        {order.deliveryUrl} <ExternalLink size={14} className="shrink-0" />
                      </a>
                    </div>
                    {order.deliveryNote && (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold uppercase opacity-40">Seller Note</p>
                        <p className="text-sm opacity-80 italic">"{order.deliveryNote}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Actions */}
            <div className="flex flex-col gap-6">
              {/* Buyer/Seller Cards */}
              <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-[10px] font-bold">BY</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold opacity-40">Buyer</span>
                    <span className="text-xs font-mono">{shortenAddr(order.buyerAddress)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--accent)] text-[#0a0a0a] text-[10px] font-bold">SL</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold opacity-40">Seller</span>
                    <span className="text-xs font-mono">{shortenAddr(order.sellerAddress)}</span>
                  </div>
                </div>
              </div>

              {/* Action Panels */}
              {order.status === 'in_progress' && isSeller && (
                <div className="rounded-2xl p-6 border border-[var(--accent)]/20 bg-[var(--accent)]/5 flex flex-col gap-5">
                  <h3 className="font-bold flex items-center gap-2"><Send size={18} /> Submit Delivery</h3>
                  <form onSubmit={handleDeliver} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase opacity-40">Deliverable URL</label>
                      <input type="url" required placeholder="https://..." value={deliveryUrl} onChange={e => setDeliveryUrl(e.target.value)} className="px-3 py-2 rounded-xl text-sm outline-none" style={inputStyle} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase opacity-40">Note for Buyer</label>
                      <textarea placeholder="Tell the buyer what you've done..." value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} rows={3} className="px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                    </div>
                    <button type="submit" className="sweep w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
                      Submit Work
                    </button>
                  </form>
                </div>
              )}

              {order.status === 'delivered' && isBuyer && (
                <div className="rounded-2xl p-6 border border-[var(--accent)]/20 bg-[var(--accent)]/5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-bold flex items-center gap-2"><CheckCircle size={18} /> Review Work</h3>
                    <p className="text-xs opacity-60">The seller has submitted the work. Please review it before completing the order.</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase opacity-40">Rating</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setRating(s)} className="hover:scale-110 transition-transform">
                            <Star size={24} fill={s <= rating ? 'var(--accent)' : 'none'} style={{ color: s <= rating ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase opacity-40">Review</label>
                      <textarea placeholder="Share your experience..." value={review} onChange={e => setReview(e.target.value)} rows={3} className="px-3 py-2 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button onClick={handleComplete} className="sweep w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
                      Accept & Complete
                    </button>
                    <button onClick={handleRevision} className="w-full py-3 rounded-xl font-bold text-sm border border-white/10 flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                      <RefreshCw size={14} /> Request Revision
                    </button>
                  </div>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="rounded-2xl p-6 border border-green-500/20 bg-green-500/5 flex flex-col gap-4 items-center text-center">
                  <CheckCircle size={40} className="text-green-500" />
                  <div>
                    <h3 className="font-bold text-lg">Order Completed</h3>
                    <p className="text-xs opacity-60">Funds have been released to the seller.</p>
                  </div>
                  {order.review && (
                    <div className="w-full mt-2 pt-4 border-t border-green-500/10 text-left">
                      <div className="flex gap-1 mb-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} fill={s <= (order.rating || 0) ? 'var(--accent)' : 'none'} style={{ color: s <= (order.rating || 0) ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <p className="text-xs italic opacity-70">"{order.review}"</p>
                    </div>
                  )}
                </div>
              )}

              {order.status === 'in_progress' && isBuyer && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-xs opacity-40 mb-2 font-medium">Order is in progress</p>
                  <div className="flex items-center justify-center gap-2 text-[var(--accent)]">
                    <Clock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Awaiting Delivery</span>
                  </div>
                </div>
              )}

              {/* Refund Action for Seller on Cancelled (Optional MVP extra) */}
              {order.status === 'cancelled' && isSeller && !order.refundTxHash && (
                <button onClick={handleRefund} disabled={loading} className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? 'Processing...' : 'Refund Buyer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
