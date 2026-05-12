'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMarketplaceStore, Service } from '@/lib/marketplaceStore';
import { 
  Briefcase, Plus, Star, Clock, DollarSign, Search, 
  ChevronDown, User, Tag, Filter, ShoppingBag
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['all', 'design', 'development', 'writing', 'video', 'marketing', 'other'];

function ServiceCard({ service }: { service: Service }) {
  const getDisplayPrice = () => {
    if (service.pricingMode === 'single') return `From $${service.singlePrice}`;
    if (service.pricingMode === 'tiered' && service.tiers) return `From $${service.tiers.basic.price}`;
    if (service.pricingMode === 'hourly') return `$${service.hourlyRate}/hr`;
    return 'Price on request';
  };

  return (
    <Link href={`/marketplace/${service.id}`}>
      <div
        className="sweep rounded-2xl p-6 flex flex-col gap-4 transition-all hover:scale-[1.02]"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.2)' }}>
            {service.sellerName ? service.sellerName[0].toUpperCase() : service.sellerAddress.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold" style={{ color: 'var(--fg)' }}>{service.sellerName || `${service.sellerAddress.slice(0, 6)}...`}</span>
            <div className="flex items-center gap-1">
              <Star size={10} style={{ color: 'var(--accent)' }} fill="var(--accent)" />
              <span className="text-[10px] opacity-60">{service.rating.toFixed(1)} ({service.ratingCount})</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold line-clamp-2 min-h-[40px]" style={{ color: 'var(--fg)' }}>
            {service.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {service.skills.slice(0, 2).map((skill, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md" 
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.6 }}>
              {skill}
            </span>
          ))}
          {service.skills.length > 2 && (
            <span className="text-[10px] opacity-40">+{service.skills.length - 2}</span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 text-[10px] opacity-50">
            <CheckCircle size={10} />
            <span>{service.ordersCompleted} completed</span>
          </div>
          <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {getDisplayPrice()} <span className="text-[10px] font-mono opacity-50">USDC</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function MarketplacePage() {
  const { services } = useMarketplaceStore();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const filteredServices = services.filter((s) => {
    const matchesCategory = category === 'all' || s.category === category;
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         s.description.toLowerCase().includes(search.toLowerCase());
    const isActive = s.status === 'active';
    return matchesCategory && matchesSearch && isActive;
  });

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.12)' }}>
                <Briefcase size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
                Freelance Marketplace
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.6 }}>
              Discover services. Hire talent. Pay USDC securely.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/marketplace/orders"
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 flex items-center gap-2"
              style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              <ShoppingBag size={16} />
              My Orders
            </Link>
            <Link 
              href="/marketplace/create"
              className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={16} />
              Sell a Service
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  style={{
                    background: category === c ? 'rgba(201,168,76,0.12)' : 'transparent',
                    color: category === c ? 'var(--accent)' : 'var(--fg)',
                    opacity: category === c ? 1 : 0.4,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
              <input 
                type="text" 
                placeholder="Search for any service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm border outline-none transition-all focus:border-[var(--accent)]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              />
            </div>
          </div>

          {/* Grid */}
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed"
              style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.01)' }}
            >
              <Briefcase size={48} className="mb-4 opacity-10" />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--fg)' }}>No services found</h3>
              <p className="text-sm opacity-40 mb-8 max-w-xs text-center">
                Try adjusting your search or category filters to find what you're looking for.
              </p>
              <button 
                onClick={() => { setCategory('all'); setSearch(''); }}
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: 'var(--accent)' }}
              >
                <Filter size={14} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
