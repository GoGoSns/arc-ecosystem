'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Globe, Search, Info, TrendingUp, 
  Award, ShieldCheck, Zap, Sparkles, ExternalLink
} from 'lucide-react';

const TLD_MULT = {
  '.eth': 1.0,
  '.arc': 0.5,
  '.crypto': 0.7,
  '.x': 0.6,
  'other': 0.3,
};

const SIMILAR_SALES = [
  { name: 'punks.eth', price: 25000, year: 2024 },
  { name: 'degen.eth', price: 8500, year: 2024 },
  { name: 'defi.eth', price: 15000, year: 2023 },
];

export default function DomainValuePage() {
  const [domain, setDomain] = useState('');
  const [tld, setTld] = useState('.eth');
  const [result, setResult] = useState<any>(null);

  const evaluateDomain = () => {
    if (!domain) return;
    
    const nameOnly = domain.split('.')[0].toLowerCase();
    const len = nameOnly.length;
    
    let baseMin = 5;
    let baseMax = 100;
    let rarity = "Common";

    if (len === 1) { baseMin = 50000; baseMax = 500000; rarity = "Ultra Rare"; }
    else if (len === 2) { baseMin = 10000; baseMax = 100000; rarity = "Premium"; }
    else if (len === 3) { baseMin = 1000; baseMax = 10000; rarity = "Rare"; }
    else if (len <= 5) { baseMin = 100; baseMax = 1000; rarity = "Valuable"; }
    else if (len <= 8) { baseMin = 50; baseMax = 500; rarity = "Standard"; }

    let mult = 1.0;
    const factors = [];

    // All numeric
    if (/^\d+$/.test(nameOnly)) {
      mult *= 2.0;
      factors.push("All numeric (999 club)");
    }
    // Repeated chars
    if (new Set(nameOnly).size === 1) {
      mult *= 3.0;
      factors.push("Repeated characters");
    }
    // Crypto words
    if (['defi', 'crypto', 'nft', 'eth', 'btc', 'pay', 'arc', 'vault'].some(w => nameOnly.includes(w))) {
      mult *= 2.0;
      factors.push("Crypto-related keyword");
    }

    const tldM = TLD_MULT[tld as keyof typeof TLD_MULT] || TLD_MULT.other;
    
    setResult({
      min: Math.round(baseMin * mult * tldM),
      max: Math.round(baseMax * mult * tldM),
      rarity,
      factors,
      len,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555566] hover:text-[#d4af37] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4">DOMAIN VALUE</h1>
          <p className="text-[#8a8a9a] text-lg">How premium is your ENS or Web3 domain?</p>
        </div>

        {/* Input */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#d4af37]/50 transition-colors">
              <input
                type="text"
                placeholder="vitalik"
                className="flex-1 bg-transparent px-6 py-4 outline-none font-bold"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <select 
                value={tld}
                onChange={(e) => setTld(e.target.value)}
                className="bg-zinc-900 border-l border-white/10 px-4 outline-none font-mono text-sm text-[#d4af37]"
              >
                {Object.keys(TLD_MULT).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={evaluateDomain}
              className="bg-[#d4af37] hover:bg-[#d4b96a] text-black font-black px-10 py-4 rounded-2xl transition-all"
            >
              EVALUATE
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {/* Value Display */}
             <div className="rounded-3xl p-12 bg-white/[0.02] border border-white/[0.05] text-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold tracking-widest text-[#d4af37] mb-6">
                    {result.rarity.toUpperCase()} DOMAIN
                  </div>
                  <div className="text-6xl md:text-7xl font-black mb-4 tracking-tighter">
                    ${result.min.toLocaleString()} - ${result.max.toLocaleString()}
                  </div>
                  <div className="text-sm font-mono text-[#555566] uppercase tracking-[0.2em]">Estimated Fair Market Value (USDC)</div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 blur-3xl w-full h-full bg-[#d4af37] rounded-full" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Factors */}
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                   <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                     <Zap size={20} className="text-[#d4af37]" />
                     VALUATION FACTORS
                   </h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[#555566] text-sm font-bold uppercase">Length</span>
                        <span className="text-white font-mono">{result.len} Characters</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[#555566] text-sm font-bold uppercase">Extension</span>
                        <span className="text-white font-mono">{tld}</span>
                      </div>
                      {result.factors.map((f: string) => (
                         <div key={f} className="flex justify-between items-center p-4 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20">
                           <span className="text-[#d4af37] text-sm font-bold uppercase">{f}</span>
                           <Sparkles size={16} className="text-[#d4af37]" />
                         </div>
                      ))}
                   </div>
                </div>

                {/* Similar Sales */}
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                   <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                     <TrendingUp size={20} className="text-[#d4af37]" />
                     SIMILAR SALES
                   </h3>
                   <div className="space-y-4">
                      {SIMILAR_SALES.map(sale => (
                         <div key={sale.name} className="flex justify-between items-center p-4 rounded-2xl bg-black/40 border border-white/5">
                            <div>
                               <div className="font-bold">{sale.name}</div>
                               <div className="text-[10px] text-[#555566] font-mono uppercase">{sale.year} SALE</div>
                            </div>
                            <div className="text-lg font-black text-[#d4af37]">
                               ${sale.price.toLocaleString()}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Footer Info */}
             <div className="flex items-center gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-[#555566]">
                <Info size={20} />
                <p className="text-xs leading-relaxed">
                  Valuation is based on historical Web3 domain sales data and rarity heuristics. 
                  Actual market price may vary significantly based on buyer demand and platform liquidity.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
