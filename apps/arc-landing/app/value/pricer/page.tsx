'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Calculator, Star,
  Layers, Rocket, Sparkles
} from 'lucide-react';
import { getArcAppUrl, isExternalUrl } from '@/lib/arcAppLinks';

const SERVICE_TYPES = [
  { id: 'logo', label: 'Logo Design', min: 25, max: 200 },
  { id: 'audit', label: 'Smart Contract Audit', min: 100, max: 500 },
  { id: 'web', label: 'Web Development', min: 30, max: 250 },
  { id: 'writing', label: 'Content Writing', min: 20, max: 150 },
  { id: 'marketing', label: 'Marketing Campaign', min: 25, max: 200 },
  { id: 'video', label: 'Video Editing', min: 30, max: 200 },
  { id: 'translation', label: 'Translation', min: 20, max: 100 },
  { id: 'consulting', label: 'Consulting', min: 50, max: 300 },
  { id: 'other', label: 'Other', min: 25, max: 150 },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner (0-1 year)', mult: 0.5 },
  { id: 'intermediate', label: 'Intermediate (1-3 years)', mult: 1.0 },
  { id: 'expert', label: 'Expert (3-5 years)', mult: 1.8 },
  { id: 'senior', label: 'Senior (5+ years)', mult: 2.5 },
];

export default function ServicePricerPage() {
  const [service, setService] = useState(SERVICE_TYPES[0].id);
  const [experience, setExperience] = useState('intermediate');
  const [hours, setHours] = useState(10);
  const [complexity, setComplexity] = useState(5);
  
  const [adjustments, setAdjustments] = useState({
    rush: false,
    revisions: false,
    source: false,
    longterm: false,
  });

  const [result, setResult] = useState<{ total: number; hourly: number; min: number; max: number } | null>(null);
  const marketplaceUrl = getArcAppUrl('creator', '/marketplace/create');

  const calculatePrice = () => {
    const s = SERVICE_TYPES.find(x => x.id === service)!;
    const exp = EXPERIENCE_LEVELS.find(x => x.id === experience)!;
    
    const avgRate = (s.min + s.max) / 2;
    const complexityMult = 0.5 + (complexity / 10) * 1.5;
    
    let adjSum = 0;
    if (adjustments.rush) adjSum += 0.5;
    if (adjustments.revisions) adjSum += 0.2;
    if (adjustments.source) adjSum += 0.1;
    if (adjustments.longterm) adjSum -= 0.15;

    const finalHourly = avgRate * complexityMult * exp.mult;
    const total = finalHourly * hours * (1 + adjSum);

    setResult({
      total: Math.round(total),
      hourly: Math.round(finalHourly),
      min: Math.round(total * 0.8),
      max: Math.round(total * 1.2),
    });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555566] hover:text-[#d4af37] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        <div className="mb-12 text-center md:text-left">
          <h1 className="text-5xl font-black mb-4">SERVICE PRICER</h1>
          <p className="text-[#8a8a9a] text-lg">What's your freelance work worth in USDC?</p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Form Side */}
          <div className="space-y-8">
            <div className="space-y-4">
                <label className="text-xs font-mono text-[#555566] uppercase tracking-widest">1. Service Type</label>
                <select 
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  aria-label="Service type"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#d4af37]/50 appearance-none"
                >
                {SERVICE_TYPES.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.label}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest">2. Experience Level</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {EXPERIENCE_LEVELS.map(exp => (
                  <button
                    type="button"
                    key={exp.id}
                    onClick={() => setExperience(exp.id)}
                    aria-pressed={experience === exp.id}
                    className={`min-h-12 rounded-2xl border p-4 text-sm font-bold transition-all ${experience === exp.id ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'bg-white/5 border-white/5 text-[#555566] hover:border-white/20'}`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-mono text-[#555566] uppercase tracking-widest">3. Project Size</label>
                  <span className="text-xs text-[#d4af37] font-mono">{hours} HOURS</span>
                </div>
                <input 
                  type="range" min="1" max="200" value={hours} 
                  onChange={(e) => setHours(parseInt(e.target.value))}
                  aria-label="Project size in hours"
                  className="w-full accent-[#d4af37]"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-mono text-[#555566] uppercase tracking-widest">Complexity</label>
                  <span className="text-xs text-[#d4af37] font-mono">{complexity}/10</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={complexity} 
                  onChange={(e) => setComplexity(parseInt(e.target.value))}
                  aria-label="Project complexity"
                  className="w-full accent-[#d4af37]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest">4. Adjustments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'rush', label: 'Rush Delivery (+50%)' },
                  { id: 'revisions', label: 'Includes Revisions (+20%)' },
                  { id: 'source', label: 'Source Files (+10%)' },
                  { id: 'longterm', label: 'Long-term (-15%)' },
                ].map(adj => (
                  <label key={adj.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/20 transition-all">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded accent-[#d4af37]" 
                      checked={adjustments[adj.id as keyof typeof adjustments]}
                      onChange={(e) => setAdjustments({...adjustments, [adj.id]: e.target.checked})}
                    />
                    <span className="text-xs font-bold text-[#8a8a9a]">{adj.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={calculatePrice}
              className="w-full bg-[#d4af37] hover:bg-[#d4b96a] text-black font-black py-6 rounded-3xl transition-all flex items-center justify-center gap-3 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Calculator size={24} />
              CALCULATE SUGGESTED PRICE
            </button>
          </div>

          {/* Result Side */}
          <div className="relative">
            {result ? (
              <div className="sticky top-32 max-h-[calc(100vh-8rem)] space-y-8 overflow-y-auto pr-1 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="rounded-3xl p-10 bg-white/[0.02] border border-[#d4af37]/30 text-center relative overflow-hidden">
                  <div className="text-xs font-mono text-[#555566] mb-6 uppercase tracking-[0.3em]">Suggested Price</div>
                  <div className="text-7xl font-black mb-4 text-[#d4af37]">
                    ${result.total.toLocaleString()} <span className="text-2xl text-white/40">USDC</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold mb-8">
                    <Star size={14} fill="#d4af37" />
                    PROFESSIONAL RATE
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-8 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] text-[#555566] uppercase mb-1">Hourly Rate</div>
                      <div className="font-bold text-lg">${result.hourly}/hr</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555566] uppercase mb-1">Market Range</div>
                      <div className="font-bold text-lg text-white/60">${result.min} - ${result.max}</div>
                    </div>
                  </div>

                  {/* Decore */}
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={100} />
                  </div>
                </div>

                <div className="rounded-3xl p-8 bg-zinc-900/50 border border-white/5">
                   <h4 className="text-sm font-black mb-4 uppercase tracking-widest text-[#555566]">PRO TIP</h4>
                   <p className="text-sm text-[#8a8a9a] leading-relaxed">
                     Based on market data, freelancers with similar profiles charge between 
                     <span className="text-white font-bold mx-1">${result.min} - ${result.max} USDC</span> 
                     for this type of project. Consider your current pipeline when finalizing the quote.
                   </p>
                </div>

                <div className="flex flex-col gap-4">
                  {marketplaceUrl ? (
                    <a
                      href={marketplaceUrl}
                      target={isExternalUrl(marketplaceUrl) ? "_blank" : undefined}
                      rel={isExternalUrl(marketplaceUrl) ? "noopener noreferrer" : undefined}
                      className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white p-5 font-black text-black transition-all hover:bg-[#d4af37]"
                    >
                      <Rocket size={20} />
                      CREATE SERVICE ON MARKETPLACE
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white p-5 font-black text-black transition-all opacity-50 cursor-not-allowed"
                    >
                      <Rocket size={20} />
                      CREATE SERVICE ON MARKETPLACE
                    </button>
                  )}
                  <button 
                    onClick={() => setResult(null)}
                    type="button"
                    className="text-xs font-mono text-[#555566] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    RESET CALCULATOR
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-3xl border-2 border-dashed border-white/5 text-[#1a1a2e]">
                <Layers size={64} className="mb-6 opacity-20" />
                <p className="font-mono text-sm uppercase tracking-widest">Result will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
