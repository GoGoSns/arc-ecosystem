'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  Briefcase, ArrowLeft, Star, Clock, DollarSign, Tag, 
  User, Check, ChevronRight, ExternalLink, Shield, Info,
  ShoppingBag, Send, Link as LinkIcon, X
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useMarketplaceStore, Service, Order } from '@/lib/marketplaceStore';
import { sendUSDC } from '@/lib/payments';

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { services, orders, addOrder } = useMarketplaceStore();
  
  const service = services.find(s => s.id === id);
  const serviceOrders = orders.filter(o => o.serviceId === id && o.status === 'completed');

  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium' | 'single'>('single');
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Order Form
  const [requirements, setRequirements] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    setMounted(true);
    if (service?.pricingMode === 'tiered') setSelectedTier('basic');
    else if (service?.pricingMode === 'hourly') setHours(service.minHours || 1);
  }, [service]);

  if (!mounted) return null;
  if (!service) return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
          <h1 className="text-2xl font-bold mb-2">Service not found</h1>
          <button onClick={() => router.push('/marketplace')} className="text-[var(--accent)] font-bold">Back to Marketplace</button>
        </div>
      </main>
    </div>
  );

  const isSeller = address?.toLowerCase() === service.sellerAddress.toLowerCase();
  
  const getCurrentPrice = () => {
    if (service.pricingMode === 'single') return service.singlePrice || 0;
    if (service.pricingMode === 'hourly') return (service.hourlyRate || 0) * hours;
    if (service.pricingMode === 'tiered' && service.tiers) {
      return service.tiers[selectedTier as 'basic' | 'standard' | 'premium'].price;
    }
    return 0;
  };

  const getCurrentDelivery = () => {
    if (service.pricingMode === 'single') return service.singleDeliveryDays || 0;
    if (service.pricingMode === 'hourly') return 1; // Default for hourly
    if (service.pricingMode === 'tiered' && service.tiers) {
      return service.tiers[selectedTier as 'basic' | 'standard' | 'premium'].deliveryDays;
    }
    return 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (requirements.length < 30) {
      setErrors({ requirements: 'Please provide more details (min 30 chars)' });
      return;
    }

    setLoading(true);
    const amount = getCurrentPrice();
    
    try {
      const { txHash } = await sendUSDC(service.sellerAddress, amount.toString());
      
      const order: Order = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        serviceId: service.id,
        service: {
          id: service.id,
          title: service.title,
          sellerAddress: service.sellerAddress,
          category: service.category
        },
        selectedTier: service.pricingMode === 'tiered' ? selectedTier : (service.pricingMode === 'single' ? 'single' : undefined),
        selectedHours: service.pricingMode === 'hourly' ? hours : undefined,
        totalAmount: amount,
        deliveryDays: getCurrentDelivery(),
        buyerAddress: address,
        sellerAddress: service.sellerAddress,
        status: 'in_progress',
        requirements,
        attachmentUrl: attachmentUrl || undefined,
        paymentTxHash: txHash,
        createdAt: Date.now(),
      };

      addOrder(order);
      router.push(`/marketplace/orders/${order.id}`);
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please check your wallet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' };

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--fg)' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" 
                  style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  {service.category}
                </span>
                {service.status !== 'active' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                    {service.status}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{service.title}</h1>
              
              <div className="flex items-center gap-6 py-2 border-y" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} fill={s <= Math.round(service.rating) ? 'var(--accent)' : 'none'} 
                        style={{ color: s <= Math.round(service.rating) ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{service.rating.toFixed(1)}</span>
                  <span className="text-sm opacity-40">({service.ratingCount} reviews)</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-sm opacity-60">{service.ordersCompleted} orders completed</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>About this service</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-70" style={{ color: 'var(--fg)' }}>
                {service.description}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {service.skills.map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium" 
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.8 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>About the Seller</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
                  style={{ background: 'rgba(201,168,76,0.05)', color: 'var(--accent)', borderColor: 'rgba(201,168,76,0.2)' }}>
                  {service.sellerName ? service.sellerName[0].toUpperCase() : service.sellerAddress.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold">{service.sellerName || 'Anonymous Seller'}</h3>
                  <p className="text-xs font-mono opacity-50 mb-2">{shortenAddr(service.sellerAddress)}</p>
                  <p className="text-sm opacity-70 italic max-w-md">{service.sellerBio || 'No bio provided.'}</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="flex flex-col gap-8 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Reviews ({service.ratingCount})</h2>
                <div className="flex items-center gap-1.5">
                  <Star size={16} fill="var(--accent)" style={{ color: 'var(--accent)' }} />
                  <span className="font-bold">{service.rating.toFixed(1)}</span>
                </div>
              </div>
              
              {serviceOrders.length === 0 ? (
                <p className="text-sm opacity-40 italic">No reviews yet for this service.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {serviceOrders.filter(o => o.review).map(o => (
                    <div key={o.id} className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono opacity-50">{shortenAddr(o.buyerAddress)}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} fill={s <= (o.rating || 0) ? 'var(--accent)' : 'none'} 
                              style={{ color: s <= (o.rating || 0) ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm opacity-80 italic">"{o.review}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Panel */}
          <div className="flex flex-col gap-6">
            <div className="sticky top-10 flex flex-col gap-6 p-1 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {service.pricingMode === 'tiered' && (
                <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                  {(['basic', 'standard', 'premium'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className="flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2"
                      style={{ 
                        color: selectedTier === t ? 'var(--accent)' : 'var(--fg)', 
                        opacity: selectedTier === t ? 1 : 0.4,
                        borderColor: selectedTier === t ? 'var(--accent)' : 'transparent'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                    ${getCurrentPrice()} <span className="text-sm font-mono opacity-50 uppercase">USDC</span>
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {service.pricingMode === 'tiered' && service.tiers && (
                    <p className="text-sm opacity-80 min-h-[40px]">
                      {service.tiers[selectedTier as 'basic' | 'standard' | 'premium'].description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {getCurrentDelivery()} Day Delivery</span>
                    {service.pricingMode === 'tiered' && service.tiers && (
                      <span className="flex items-center gap-1.5"><Shield size={14} /> {service.tiers[selectedTier as 'basic' | 'standard' | 'premium'].revisions} Revisions</span>
                    )}
                  </div>
                </div>

                {service.pricingMode === 'hourly' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase opacity-50">Hours to Order (Min {service.minHours})</label>
                    <input 
                      type="number" 
                      min={service.minHours} 
                      value={hours} 
                      onChange={e => setHours(Math.max(service.minHours || 1, parseInt(e.target.value) || 0))}
                      className="px-3 py-2 rounded-lg text-sm outline-none w-full" 
                      style={inputStyle} 
                    />
                  </div>
                )}

                {!isConnected ? (
                  <p className="text-xs text-center opacity-40 py-2">Connect wallet to order</p>
                ) : isSeller ? (
                  <button disabled className="w-full py-4 rounded-xl font-bold opacity-50 cursor-not-allowed border border-white/10">
                    This is your service
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowOrderModal(true)}
                    className="sweep w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                  >
                    <ShoppingCart size={18} /> Order Now
                  </button>
                )}
                
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/5">
                  <p className="text-[10px] opacity-40 uppercase font-bold text-center">Trust-based MVP</p>
                  <p className="text-[10px] opacity-30 text-center leading-tight">
                    Payment is sent directly to the seller upon order placement. 
                    Ensure you trust the seller before ordering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Modal */}
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl p-8 flex flex-col gap-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Order Requirements</h2>
                <button onClick={() => setShowOrderModal(false)} className="opacity-50 hover:opacity-100"><X size={20} /></button>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold">{service.title}</p>
                <p className="text-xs opacity-50 uppercase font-bold tracking-wider">
                  {service.pricingMode === 'tiered' ? `${selectedTier} Package` : (service.pricingMode === 'hourly' ? `${hours} Hours` : 'Single Service')}
                  {' '}• Total: ${getCurrentPrice()} USDC
                </p>
              </div>

              <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-70">Tell the seller what you need</label>
                  <textarea 
                    required
                    placeholder="Provide specific details about your requirements (min 30 characters)"
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    rows={5}
                    className="px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)] resize-none"
                    style={inputStyle}
                  />
                  {errors.requirements && <p className="text-xs text-red-400">{errors.requirements}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-70">Attachment URL (Optional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                    <input 
                      type="url" 
                      placeholder="https://link-to-references.com"
                      value={attachmentUrl}
                      onChange={e => setAttachmentUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="sweep w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                >
                  {loading ? 'Processing Payment...' : <><DollarSign size={20} /> Confirm & Pay ${getCurrentPrice()} USDC</>}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ShoppingCart({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
