'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Wallet, Gem, Coins, Wrench, Globe, ArrowRight, Award,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { useValueStore } from '@/lib/valueStore';

const TOOLS = [
  {
    title: "Wallet Score",
    description: "Get your Arc activity score (0-1000). Track wallet age, transactions, and ecosystem participation.",
    icon: Gem,
    href: "/value/score",
    color: "#b9f2ff", // Diamond
    tag: "0-1000",
  },
  {
    title: "Portfolio Value",
    description: "Total USDC value of tokens & NFTs in any wallet. Live data from Arc Testnet.",
    icon: Coins,
    href: "/value/portfolio",
    color: "#c9a84c", // Gold
    tag: "LIVE DATA",
  },
  {
    title: "Service Pricer",
    description: "What should I charge for my freelance work? AI-suggested pricing for Web3 services.",
    icon: Wrench,
    href: "/value/pricer",
    color: "#c0c0c0", // Silver
    tag: "AI SUGGESTED",
  },
  {
    title: "Domain Value",
    description: "How premium is your ENS or Web3 domain? Length, rarity, and market analysis.",
    icon: Globe,
    href: "/value/domain",
    color: "#e5e4e2", // Platinum
    tag: "RARITY ENGINE",
  },
];

const RECENT_LOOKUPS = [
  { address: '0xVitalik.eth', score: 998, tier: 'Diamond', color: '#b9f2ff' },
  { address: '0xPunk.eth', score: 945, tier: 'Diamond', color: '#b9f2ff' },
  { address: '0xBuilder.eth', score: 876, tier: 'Platinum', color: '#e5e4e2' },
  { address: '0xTrader.eth', score: 723, tier: 'Platinum', color: '#e5e4e2' },
  { address: '0xCollector.eth', score: 654, tier: 'Gold', color: '#c9a84c' },
];

export default function ValueHub() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/value/${search.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#c9a84c]/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#c9a84c]/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#c9a84c]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#555] hover:text-[#c9a84c] transition-colors mb-12 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO ECOSYSTEM</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl sm:text-7xl font-black mb-6 tracking-tighter">
            ARC <span className="text-[#c9a84c]">VALUE</span>
          </h1>
          <p className="text-xl text-[#888] max-w-2xl mx-auto mb-12 leading-relaxed">
            Discover what your wallet is worth on Arc Network. 
            Track activity, value portfolios, and price services.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-[#c9a84c]/20 blur-2xl group-focus-within:bg-[#c9a84c]/30 transition-all duration-500 rounded-full" />
            <div className="relative flex items-center bg-zinc-900/80 border border-white/10 rounded-2xl p-2 backdrop-blur-xl">
              <div className="pl-4 pr-2 text-[#555]">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Enter wallet address or ENS name"
                className="w-full bg-transparent border-none outline-none py-4 text-lg font-medium placeholder:text-[#333]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#c9a84c] hover:bg-[#d4b96a] text-black font-bold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                LOOKUP
              </button>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <span className="text-[#555]">Or try:</span>
              <button 
                type="button"
                onClick={() => setSearch('0xB87B774a5b3D77E13a89C68F62810D5a23404365')}
                className="text-[#888] hover:text-[#c9a84c] transition-colors underline decoration-[#333] underline-offset-4"
              >
                Use my wallet
              </button>
            </div>
          </form>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {TOOLS.map((tool) => (
            <Link 
              key={tool.title}
              href={tool.href}
              className="group relative rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05] hover:border-[#c9a84c]/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold tracking-widest text-[#555] group-hover:text-[#c9a84c] transition-colors">
                  {tool.tag}
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500" style={{ background: `${tool.color}15`, border: `1px solid ${tool.color}30` }}>
                  <tool.icon size={28} style={{ color: tool.color }} />
                </div>
                <h3 className="text-2xl font-black mb-3 group-hover:text-[#c9a84c] transition-colors">{tool.title}</h3>
                <p className="text-[#888] leading-relaxed mb-6">{tool.description}</p>
                <div className="flex items-center gap-2 text-sm font-bold tracking-widest text-[#555] group-hover:text-white transition-colors">
                  LAUNCH TOOL <ArrowRight size={16} />
                </div>
              </div>

              {/* Hover Glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 blur-[60px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700" style={{ background: tool.color }} />
            </Link>
          ))}
        </div>

        {/* Recent Lookups */}
        <div className="rounded-3xl p-10 bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black mb-1">RECENT LOOKUPS</h2>
              <p className="text-sm text-[#555]">High-scoring wallets on Arc Network</p>
            </div>
            <Award className="text-[#c9a84c]" size={32} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {RECENT_LOOKUPS.map((item) => (
              <Link 
                key={item.address}
                href={`/value/${item.address}`}
                className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-[#c9a84c]/20 hover:bg-[#c9a84c]/5 transition-all group text-center"
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/5 group-hover:bg-[#c9a84c]/20 transition-colors">
                  <Gem size={20} style={{ color: item.color }} />
                </div>
                <div className="font-mono text-xs mb-2 text-white/80">{item.address}</div>
                <div className="text-xl font-black mb-1" style={{ color: item.color }}>{item.score}</div>
                <div className="text-[10px] font-bold tracking-tighter text-[#555] group-hover:text-white transition-colors uppercase">
                  {item.tier} Tier
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
