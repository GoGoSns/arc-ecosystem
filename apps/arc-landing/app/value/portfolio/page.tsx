'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, History, 
  Wallet, PieChart as PieIcon, ArrowRightLeft, Image as ImageIcon
} from 'lucide-react';
import { buildDemoPortfolio } from '@/lib/demoMetrics';

interface PortfolioData {
  totalUsdc: number;
  tokens: Array<{ symbol: string; balance: number; value: number; color: string }>;
  nfts: Array<{ name: string; id: string; estValue: number }>;
  transactions: Array<{ hash: string; type: 'in' | 'out'; amount: number; target: string; time: string }>;
}

export default function PortfolioValuePage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioData | null>(null);
  const calculatePortfolio = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError('Enter an address to generate a demo portfolio preview.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 180));
      setResult(buildDemoPortfolio(trimmed));
    } catch {
      setError('Unable to build a demo portfolio snapshot.');
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555] hover:text-[#c9a84c] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4">PORTFOLIO VALUE</h1>
          <p className="text-[#888] text-lg">Total worth of your Arc Network holdings in a local demo snapshot.</p>
        </div>

        {/* Input Section */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 mb-8">
          <form
            className="flex flex-col md:flex-row gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void calculatePortfolio();
            }}
          >
            <div className="flex-1">
              <label className="mb-2 block text-xs font-mono uppercase tracking-widest text-[#555]" htmlFor="portfolio-address">
                Wallet Address
              </label>
              <input
                id="portfolio-address"
                type="text"
                placeholder="Enter wallet address (0x...)"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-4 font-mono outline-none transition-colors focus:border-[#c9a84c]/50 focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-describedby="portfolio-help"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="rounded-2xl bg-[#c9a84c] px-10 py-4 font-black text-black transition-all hover:bg-[#d4b96a] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {loading ? <Loader2 className="animate-spin" /> : "VALUATE PORTFOLIO"}
            </button>
          </form>
          <p id="portfolio-help" className="mt-3 text-[11px] uppercase tracking-[0.24em] text-[#333]">
            Demo preview only. No network requests are made.
          </p>
        </div>

        {error && !loading ? (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading && (
          <div className="text-center py-20">
            <Loader2 size={48} className="animate-spin text-[#c9a84c] mx-auto mb-6" />
            <p className="text-[#555] font-mono animate-pulse uppercase tracking-widest">Generating demo snapshot...</p>
          </div>
        )}

        {!loading && !result && !error ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center text-[#777]">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">Demo Snapshot</p>
            <p className="mt-4 text-lg">Enter any wallet address to generate a local portfolio preview.</p>
          </div>
        ) : null}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Total Value Hero */}
            <div className="rounded-3xl p-12 bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-sm font-mono text-[#555] mb-4 uppercase tracking-[0.3em]">Total Portfolio Worth</div>
                 <div className="text-7xl md:text-8xl font-black mb-2 text-[#c9a84c]">
                   ${result.totalUsdc.toLocaleString()} <span className="text-3xl text-white/40">USDC</span>
                 </div>
                 <div className="text-xs text-[#555] font-mono">LAST UPDATED: JUST NOW</div>
               </div>
               {/* Background Pie Decore */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] scale-[2]">
                  <PieIcon size={400} />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Asset Breakdown */}
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <Wallet size={20} className="text-[#c9a84c]" />
                    Token Balances
                  </h3>
                  <div className="space-y-4">
                    {result.tokens.map((token) => (
                      <div key={token.symbol} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `${token.color}20`, color: token.color, border: `1px solid ${token.color}40` }}>
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold">{token.symbol}</div>
                            <div className="text-xs text-[#555]">{token.balance} {token.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${token.value.toLocaleString()}</div>
                          <div className="text-[10px] text-[#555]">{((token.value / result.totalUsdc) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <ImageIcon size={20} className="text-[#c9a84c]" />
                    NFT Collection
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.nfts.map((nft) => (
                      <div key={nft.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                        <div className="aspect-square rounded-xl bg-black/40 flex items-center justify-center text-[#333]">
                          <ImageIcon size={40} />
                        </div>
                        <div>
                          <div className="font-bold text-sm truncate">{nft.name}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-[#555]">EST. VALUE</span>
                            <span className="text-xs font-bold text-[#c9a84c]">${nft.estValue} USDC</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: Activity + Chart */}
              <div className="space-y-8">
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <PieIcon size={20} className="text-[#c9a84c]" />
                    Allocation
                  </h3>
                  <div className="aspect-square flex items-center justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-full transform -rotate-90">
                      {/* Simplistic Pie Chart for 3 segments */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#c9a84c" strokeWidth="20" strokeDasharray="80 20" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e4e2" strokeWidth="20" strokeDasharray="10 90" strokeDashoffset="-80" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#b9f2ff" strokeWidth="20" strokeDasharray="10 90" strokeDashoffset="-90" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-xs text-[#555] uppercase tracking-tighter">USDC</span>
                       <span className="font-black">80%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <History size={20} className="text-[#c9a84c]" />
                    Recent Activity
                  </h3>
                  <div className="space-y-6">
                    {result.transactions.map((tx, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <ArrowRightLeft size={14} className={tx.type === 'in' ? 'rotate-45' : '-rotate-135'} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm uppercase">{tx.type}</span>
                            <span className="text-xs text-[#555]">{tx.time}</span>
                          </div>
                          <div className="text-xs font-mono text-[#555] truncate">{tx.target}</div>
                          <div className={`font-bold mt-1 ${tx.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'in' ? '+' : '-'}{tx.amount} USDC
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
