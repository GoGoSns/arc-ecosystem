'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { 
  Briefcase, ArrowLeft, Plus, X, Calendar, 
  DollarSign, Clock, User, Shield, Check, Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useMarketplaceStore, Service, ServiceTier } from '@/lib/marketplaceStore';

const CATEGORIES = ['design', 'development', 'writing', 'video', 'marketing', 'other'] as const;

export default function CreateServicePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { addService } = useMarketplaceStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'development' as typeof CATEGORIES[number],
    pricingMode: 'single' as 'single' | 'tiered' | 'hourly',
    singlePrice: '',
    singleDeliveryDays: '',
    hourlyRate: '',
    minHours: '1',
    sellerName: '',
    sellerBio: '',
  });

  const [tiers, setTiers] = useState({
    basic: { price: '', deliveryDays: '', revisions: '1', description: '', features: [] as string[] },
    standard: { price: '', deliveryDays: '', revisions: '3', description: '', features: [] as string[] },
    premium: { price: '', deliveryDays: '', revisions: '5', description: '', features: [] as string[] },
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter(skill => skill !== s));
  };

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    
    if (form.pricingMode === 'single') {
      if (!form.singlePrice || parseFloat(form.singlePrice) <= 0) errs.singlePrice = 'Valid price required';
      if (!form.singleDeliveryDays || parseInt(form.singleDeliveryDays) <= 0) errs.singleDeliveryDays = 'Valid delivery days required';
    } else if (form.pricingMode === 'hourly') {
      if (!form.hourlyRate || parseFloat(form.hourlyRate) <= 0) errs.hourlyRate = 'Valid hourly rate required';
    } else if (form.pricingMode === 'tiered') {
      if (!tiers.basic.price || parseFloat(tiers.basic.price) <= 0) errs.tiered = 'Basic tier price required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (!validate()) return;

    const service: Service = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      pricingMode: form.pricingMode,
      singlePrice: form.pricingMode === 'single' ? parseFloat(form.singlePrice) : undefined,
      singleDeliveryDays: form.pricingMode === 'single' ? parseInt(form.singleDeliveryDays) : undefined,
      hourlyRate: form.pricingMode === 'hourly' ? parseFloat(form.hourlyRate) : undefined,
      minHours: form.pricingMode === 'hourly' ? parseInt(form.minHours) : undefined,
      tiers: form.pricingMode === 'tiered' ? {
        basic: { ...tiers.basic, price: parseFloat(tiers.basic.price), deliveryDays: parseInt(tiers.basic.deliveryDays), revisions: parseInt(tiers.basic.revisions) },
        standard: { ...tiers.standard, price: parseFloat(tiers.standard.price), deliveryDays: parseInt(tiers.standard.deliveryDays), revisions: parseInt(tiers.standard.revisions) },
        premium: { ...tiers.premium, price: parseFloat(tiers.premium.price), deliveryDays: parseInt(tiers.premium.deliveryDays), revisions: parseInt(tiers.premium.revisions) },
      } : undefined,
      skills,
      sellerAddress: address,
      sellerName: form.sellerName || undefined,
      sellerBio: form.sellerBio || undefined,
      ordersCompleted: 0,
      rating: 5, // Default rating for new services
      ratingCount: 0,
      status: 'active',
      createdAt: Date.now(),
    };

    addService(service);
    router.push(`/marketplace/${service.id}`);
  };

  const inputStyle = { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' };

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--fg)' }}>Sell a Service</h1>
          <p className="text-sm opacity-60" style={{ color: 'var(--fg)' }}>
            List your skills and start earning USDC.
          </p>
        </div>

        {!isConnected ? (
          <div className="sweep rounded-3xl p-12 text-center flex flex-col items-center gap-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <User size={48} className="opacity-20" />
            <h2 className="text-xl font-bold">Connect your wallet to get started</h2>
            <button
              onClick={() => connect({ connector: injected() })}
              className="px-8 py-3 rounded-xl font-bold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            {/* Section 1: Basic Info */}
            <section className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-40 flex items-center gap-2">
                <Info size={14} /> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold opacity-70">Service Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. I will design a professional logo for your brand"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)]"
                    style={inputStyle}
                  />
                  {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-70">Category</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                    className="px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                    style={inputStyle}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-70">Skills (Tags)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type skill and press Enter"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      className="w-full px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)]"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map(s => (
                      <span key={s} className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        {s} <X size={10} className="cursor-pointer" onClick={() => removeSkill(s)} />
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold opacity-70">Description</label>
                  <textarea 
                    placeholder="Tell buyers why they should hire you..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={6}
                    className="px-4 py-3 rounded-xl outline-none focus:border-[var(--accent)] resize-none"
                    style={inputStyle}
                  />
                  {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
                </div>
              </div>
            </section>

            {/* Section 2: Pricing */}
            <section className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-40 flex items-center gap-2">
                <DollarSign size={14} /> Pricing & Delivery
              </h2>
              
              <div className="flex p-1 rounded-2xl self-start mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {(['single', 'tiered', 'hourly'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pricingMode: mode }))}
                    className="px-6 py-2 rounded-xl text-xs font-bold capitalize transition-all"
                    style={{ 
                      background: form.pricingMode === mode ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: form.pricingMode === mode ? 'var(--accent)' : 'var(--fg)',
                      opacity: form.pricingMode === mode ? 1 : 0.4
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {form.pricingMode === 'single' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold opacity-70">Price (USDC)</label>
                    <input type="number" placeholder="50.00" value={form.singlePrice} onChange={e => setForm(f => ({ ...f, singlePrice: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    {errors.singlePrice && <p className="text-xs text-red-400">{errors.singlePrice}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold opacity-70">Delivery Time (Days)</label>
                    <input type="number" placeholder="3" value={form.singleDeliveryDays} onChange={e => setForm(f => ({ ...f, singleDeliveryDays: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    {errors.singleDeliveryDays && <p className="text-xs text-red-400">{errors.singleDeliveryDays}</p>}
                  </div>
                </div>
              )}

              {form.pricingMode === 'hourly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold opacity-70">Hourly Rate (USDC)</label>
                    <input type="number" placeholder="25.00" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                    {errors.hourlyRate && <p className="text-xs text-red-400">{errors.hourlyRate}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold opacity-70">Minimum Hours</label>
                    <input type="number" placeholder="1" value={form.minHours} onChange={e => setForm(f => ({ ...f, minHours: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                  </div>
                </div>
              )}

              {form.pricingMode === 'tiered' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {(['basic', 'standard', 'premium'] as const).map(tier => (
                    <div key={tier} className="flex flex-col gap-4 p-5 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'var(--border)' }}>
                      <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">{tier} Package</h3>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase opacity-50">Price (USDC)</label>
                        <input type="number" placeholder="0.00" value={tiers[tier].price} onChange={e => setTiers(t => ({ ...t, [tier]: { ...t[tier], price: e.target.value } }))} className="px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase opacity-50">Delivery Days</label>
                        <input type="number" placeholder="0" value={tiers[tier].deliveryDays} onChange={e => setTiers(t => ({ ...t, [tier]: { ...t[tier], deliveryDays: e.target.value } }))} className="px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase opacity-50">Revisions</label>
                        <input type="number" placeholder="0" value={tiers[tier].revisions} onChange={e => setTiers(t => ({ ...t, [tier]: { ...t[tier], revisions: e.target.value } }))} className="px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase opacity-50">Short Description</label>
                        <textarea placeholder="What's included in this tier?" value={tiers[tier].description} onChange={e => setTiers(t => ({ ...t, [tier]: { ...t[tier], description: e.target.value } }))} rows={2} className="px-3 py-2 rounded-lg text-xs outline-none resize-none" style={inputStyle} />
                      </div>
                    </div>
                  ))}
                  {errors.tiered && <p className="text-xs text-red-400 lg:col-span-3">{errors.tiered}</p>}
                </div>
              )}
            </section>

            {/* Section 3: Profile */}
            <section className="flex flex-col gap-6">
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-40 flex items-center gap-2">
                <User size={14} /> Seller Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-70">Display Name</label>
                  <input type="text" placeholder="Your name" value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold opacity-70">Short Bio</label>
                  <input type="text" placeholder="A one-sentence pitch about yourself" value={form.sellerBio} onChange={e => setForm(f => ({ ...f, sellerBio: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={inputStyle} />
                </div>
              </div>
            </section>

            <button
              type="submit"
              className="sweep w-full py-4 rounded-2xl font-bold text-lg mt-6 shadow-xl"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Create Marketplace Listing
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
