'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  ShoppingBag, ArrowLeft, Briefcase, FileText, 
  CheckCircle, Clock, DollarSign, ExternalLink, 
  TrendingUp, User, ShoppingCart
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useMarketplaceStore, Order } from '@/lib/marketplaceStore';

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

export default function OrdersPage() {
  const { address, isConnected } = useAccount();
  const { orders } = useMarketplaceStore();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [subTab, setSubTab] = useState<'active' | 'delivered' | 'completed' | 'cancelled'>('active');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const myBuying = orders.filter(o => o.buyerAddress.toLowerCase() === address?.toLowerCase());
  const mySelling = orders.filter(o => o.sellerAddress.toLowerCase() === address?.toLowerCase());

  const currentList = activeTab === 'buying' ? myBuying : mySelling;
  
  const filteredList = currentList.filter(o => {
    if (subTab === 'active') return ['pending', 'in_progress'].includes(o.status);
    return o.status === subTab;
  });

  // Stats
  const totalSpent = myBuying.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.totalAmount, 0);
  const totalEarned = mySelling.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--fg)' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <Link href="/marketplace" className="text-sm font-bold text-[var(--accent)] hover:underline">
            Browse Services
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Buying Orders', value: myBuying.length, icon: ShoppingCart },
            { label: 'Total Spent', value: `$${totalSpent} USDC`, icon: DollarSign },
            { label: 'Selling Orders', value: mySelling.length, icon: Briefcase },
            { label: 'Total Earned', value: `$${totalEarned} USDC`, icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 border border-white/5 bg-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <stat.icon size={16} className="opacity-30" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">{stat.label}</span>
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-8">
          <div className="flex p-1 rounded-2xl bg-white/5 self-start">
            <button onClick={() => { setActiveTab('buying'); setSubTab('active'); }} className="px-8 py-3 rounded-xl text-sm font-bold transition-all" 
              style={{ background: activeTab === 'buying' ? 'rgba(201,168,76,0.1)' : 'transparent', color: activeTab === 'buying' ? 'var(--accent)' : 'var(--fg)', opacity: activeTab === 'buying' ? 1 : 0.4 }}>
              Buying
            </button>
            <button onClick={() => { setActiveTab('selling'); setSubTab('active'); }} className="px-8 py-3 rounded-xl text-sm font-bold transition-all" 
              style={{ background: activeTab === 'selling' ? 'rgba(201,168,76,0.1)' : 'transparent', color: activeTab === 'selling' ? 'var(--accent)' : 'var(--fg)', opacity: activeTab === 'selling' ? 1 : 0.4 }}>
              Selling
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['active', 'delivered', 'completed', 'cancelled'] as const).map(s => (
                <button key={s} onClick={() => setSubTab(s)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap" 
                  style={{ background: subTab === s ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'var(--fg)', opacity: subTab === s ? 1 : 0.3, border: subTab === s ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {filteredList.length > 0 ? (
                filteredList.map(order => (
                  <Link href={`/marketplace/orders/${order.id}`} key={order.id} className="sweep rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="text-[10px] font-mono opacity-40">#{order.id}</span>
                      </div>
                      <h3 className="font-bold text-lg">{order.service.title}</h3>
                      <div className="flex items-center gap-4 text-xs opacity-50">
                        <span className="flex items-center gap-1"><DollarSign size={12} /> {order.totalAmount} USDC</span>
                        <span className="flex items-center gap-1"><User size={12} /> {activeTab === 'buying' ? `Seller: ${shortenAddr(order.sellerAddress)}` : `Buyer: ${shortenAddr(order.buyerAddress)}`}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> Ordered {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-4 py-2 rounded-xl border border-white/10">View Order</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-white/5 opacity-40">
                  No {subTab} orders found.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
