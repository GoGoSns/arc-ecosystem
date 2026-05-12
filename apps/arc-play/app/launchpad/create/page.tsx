'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Coins, 
  BarChart, 
  Users, 
  Globe, 
  MessageCircle, 
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLaunchpadStore, LaunchMode, IDORound } from '@/lib/launchpadStore';

export default function CreateLaunch() {
  const router = useRouter();
  const { address } = useAccount();
  const { createLaunch } = useLaunchpadStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    logoUrl: '',
    totalSupply: 0,
    description: '',
    websiteUrl: '',
    twitterUrl: ''
  });

  const [mode, setMode] = useState<LaunchMode>('basic');

  // Basic Mode Config
  const [basicConfig, setBasicConfig] = useState({
    price: 0,
    hardCap: 0,
    minBuy: 0,
    maxBuy: 0
  });

  // Allocation Mode Config
  const [allocConfig, setAllocConfig] = useState({
    targetRaise: 0,
    softCap: 0,
    tokensForSale: 0,
    vestingTGE: 25,
    vestingMonths: 6
  });

  // IDO Mode Config
  const [idoRounds, setIdoRounds] = useState<Omit<IDORound, 'raised'>[]>([
    { name: 'Whitelist', pricePerToken: 0.01, tokensInRound: 1000000, whitelistOnly: true, whitelist: [] }
  ]);

  const [timing, setTiming] = useState({
    startsAt: '',
    endsAt: ''
  });

  const [agreed, setAgreed] = useState(false);

  // Handlers
  const handleCreate = async () => {
    if (!address) return;
    setLoading(true);

    try {
      const startsAt = new Date(timing.startsAt).getTime();
      const endsAt = new Date(timing.endsAt).getTime();

      const launchData: any = {
        tokenName: tokenInfo.name,
        tokenSymbol: tokenInfo.symbol.toUpperCase(),
        tokenLogoUrl: tokenInfo.logoUrl,
        totalSupply: Number(tokenInfo.totalSupply),
        description: tokenInfo.description,
        websiteUrl: tokenInfo.websiteUrl,
        twitterUrl: tokenInfo.twitterUrl,
        mode,
        startsAt,
        endsAt,
        creatorAddress: address
      };

      if (mode === 'basic') {
        launchData.basicPricePerToken = Number(basicConfig.price);
        launchData.basicHardCap = Number(basicConfig.hardCap);
        launchData.basicMinBuy = Number(basicConfig.minBuy);
        launchData.basicMaxBuy = Number(basicConfig.maxBuy);
        launchData.basicTokensForSale = Number(basicConfig.hardCap) / Number(basicConfig.price);
      } else if (mode === 'allocation') {
        launchData.allocTargetRaise = Number(allocConfig.targetRaise);
        launchData.allocSoftCap = Number(allocConfig.softCap);
        launchData.allocTokensForSale = Number(allocConfig.tokensForSale);
        launchData.allocVestingTGEPercent = Number(allocConfig.vestingTGE);
        launchData.allocVestingMonths = Number(allocConfig.vestingMonths);
      } else if (mode === 'ido') {
        launchData.idoRounds = idoRounds.map(r => ({ ...r, raised: 0 }));
        launchData.idoCurrentRound = 0;
      }

      const launch = createLaunch(launchData);
      router.push(`/launchpad/${launch.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating launch. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const addIdoRound = () => {
    setIdoRounds([...idoRounds, { 
      name: `Round ${idoRounds.length + 1}`, 
      pricePerToken: 0.05, 
      tokensInRound: 1000000, 
      whitelistOnly: false, 
      whitelist: [] 
    }]);
  };

  const removeIdoRound = (index: number) => {
    if (idoRounds.length > 1) {
      setIdoRounds(idoRounds.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <Link 
          href="/launchpad"
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity mb-8 w-fit"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} />
          Back to Browse
        </Link>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
          {[1, 2, 3, 4, 5].map(s => (
            <div 
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'scale-110 shadow-lg' : 'opacity-30'}`}
              style={{ 
                background: step >= s ? 'var(--accent)' : 'var(--card)', 
                color: step >= s ? '#000' : 'var(--fg)',
                border: step >= s ? 'none' : '1px solid var(--border)'
              }}
            >
              {step > s ? <CheckCircle2 size={20} /> : s}
            </div>
          ))}
        </div>

        <div className="sweep p-8 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          
          {/* STEP 1: Token Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Token Information</h2>
                <p className="opacity-50 text-sm">Tell us about the token you're launching.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Token Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Arc Governance"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50 transition-all"
                    value={tokenInfo.name}
                    onChange={e => setTokenInfo({ ...tokenInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Token Symbol</label>
                  <input 
                    type="text"
                    placeholder="e.g. ARC"
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50 transition-all uppercase"
                    value={tokenInfo.symbol}
                    onChange={e => setTokenInfo({ ...tokenInfo, symbol: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-50">Description</label>
                <textarea 
                  placeholder="What is this token for? Explain your project vision..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-yellow-500/50 transition-all min-h-[120px]"
                  value={tokenInfo.description}
                  onChange={e => setTokenInfo({ ...tokenInfo, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Total Supply</label>
                  <input 
                    type="number"
                    placeholder="1,000,000,000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50 transition-all"
                    value={tokenInfo.totalSupply || ''}
                    onChange={e => setTokenInfo({ ...tokenInfo, totalSupply: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Logo URL (Optional)</label>
                  <input 
                    type="text"
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50 transition-all"
                    value={tokenInfo.logoUrl}
                    onChange={e => setTokenInfo({ ...tokenInfo, logoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
                    <input 
                      type="text"
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-yellow-500/50 transition-all"
                      value={tokenInfo.websiteUrl}
                      onChange={e => setTokenInfo({ ...tokenInfo, websiteUrl: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Twitter / X</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
                    <input 
                      type="text"
                      placeholder="https://x.com/..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-yellow-500/50 transition-all"
                      value={tokenInfo.twitterUrl}
                      onChange={e => setTokenInfo({ ...tokenInfo, twitterUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Mode */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Choose Launch Mode</h2>
                <p className="opacity-50 text-sm">Select the mechanism for your token sale.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { 
                    id: 'basic', 
                    title: 'BASIC Presale', 
                    desc: 'Fixed price presale. Simple and effective for immediate fundraising.', 
                    icon: Coins,
                    color: '#60a5fa'
                  },
                  { 
                    id: 'allocation', 
                    title: 'Allocation Pool', 
                    desc: 'Fair distribution based on contribution share. Supports vesting schedules.', 
                    icon: Users,
                    color: '#a78bfa'
                  },
                  { 
                    id: 'ido', 
                    title: 'Multi-Round IDO', 
                    desc: 'Sequential rounds with increasing prices. Whitelist and public stages.', 
                    icon: BarChart,
                    color: '#c9a84c'
                  }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as LaunchMode)}
                    className={`flex items-start gap-6 p-6 rounded-xl border-2 transition-all text-left group ${mode === m.id ? 'border-yellow-500/50 bg-yellow-500/[0.03]' : 'border-white/5 bg-white/[0.01] hover:border-white/20'}`}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: `${m.color}15`, color: m.color }}
                    >
                      <m.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: mode === m.id ? 'var(--accent)' : 'var(--fg)' }}>{m.title}</h3>
                      <p className="text-sm opacity-50 leading-relaxed">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Mode Config */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Configure {mode.toUpperCase()} Mode</h2>
                <p className="opacity-50 text-sm">Set the financial parameters of your sale.</p>
              </div>

              {mode === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Price (USDC per Token)</label>
                    <input 
                      type="number" step="0.0001"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                      value={basicConfig.price || ''}
                      onChange={e => setBasicConfig({ ...basicConfig, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Hard Cap (Max USDC Raise)</label>
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                      value={basicConfig.hardCap || ''}
                      onChange={e => setBasicConfig({ ...basicConfig, hardCap: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Min Buy (USDC)</label>
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                      value={basicConfig.minBuy || ''}
                      onChange={e => setBasicConfig({ ...basicConfig, minBuy: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Max Buy (USDC)</label>
                    <input 
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                      value={basicConfig.maxBuy || ''}
                      onChange={e => setBasicConfig({ ...basicConfig, maxBuy: Number(e.target.value) })}
                    />
                  </div>
                  {basicConfig.price > 0 && basicConfig.hardCap > 0 && (
                    <div className="md:col-span-2 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-400 text-sm">
                      Tokens for sale: {(basicConfig.hardCap / basicConfig.price).toLocaleString()} {tokenInfo.symbol.toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              {mode === 'allocation' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">Target Raise (USDC)</label>
                      <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                        value={allocConfig.targetRaise || ''}
                        onChange={e => setAllocConfig({ ...allocConfig, targetRaise: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">Soft Cap (Refund Trigger)</label>
                      <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                        value={allocConfig.softCap || ''}
                        onChange={e => setAllocConfig({ ...allocConfig, softCap: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">Tokens for Sale (Total Amount)</label>
                      <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-yellow-500/50"
                        value={allocConfig.tokensForSale || ''}
                        onChange={e => setAllocConfig({ ...allocConfig, tokensForSale: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Vesting Schedule</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase opacity-50">% Unlocked at TGE</label>
                        <input 
                          type="number" max="100"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none"
                          value={allocConfig.vestingTGE}
                          onChange={e => setAllocConfig({ ...allocConfig, vestingTGE: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase opacity-50">Vesting Months (Linear)</label>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none"
                          value={allocConfig.vestingMonths}
                          onChange={e => setAllocConfig({ ...allocConfig, vestingMonths: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'ido' && (
                <div className="space-y-6">
                  {idoRounds.map((round, idx) => (
                    <div key={idx} className="p-6 rounded-xl border border-white/5 bg-white/[0.01] relative group">
                      {idoRounds.length > 1 && (
                        <button 
                          onClick={() => removeIdoRound(idx)}
                          className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      
                      <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                        Round {idx + 1}: {round.name}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase opacity-40">Round Name</label>
                          <input 
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none"
                            value={round.name}
                            onChange={e => {
                              const newRounds = [...idoRounds];
                              newRounds[idx].name = e.target.value;
                              setIdoRounds(newRounds);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase opacity-40">Price (USDC)</label>
                          <input 
                            type="number" step="0.0001"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none"
                            value={round.pricePerToken}
                            onChange={e => {
                              const newRounds = [...idoRounds];
                              newRounds[idx].pricePerToken = Number(e.target.value);
                              setIdoRounds(newRounds);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase opacity-40">Tokens in Round</label>
                          <input 
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none"
                            value={round.tokensInRound}
                            onChange={e => {
                              const newRounds = [...idoRounds];
                              newRounds[idx].tokensInRound = Number(e.target.value);
                              setIdoRounds(newRounds);
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={round.whitelistOnly}
                            onChange={e => {
                              const newRounds = [...idoRounds];
                              newRounds[idx].whitelistOnly = e.target.checked;
                              setIdoRounds(newRounds);
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 accent-yellow-500"
                          />
                          <span className="text-xs uppercase font-bold opacity-60 group-hover:opacity-100 transition-opacity">Whitelist Only</span>
                        </label>
                      </div>

                      {round.whitelistOnly && (
                        <div className="mt-4 space-y-2">
                          <label className="text-[10px] uppercase opacity-40">Whitelisted Addresses (One per line)</label>
                          <textarea 
                            placeholder="0x123...&#10;0xabc..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none h-24 text-xs font-mono"
                            value={round.whitelist.join('\n')}
                            onChange={e => {
                              const newRounds = [...idoRounds];
                              newRounds[idx].whitelist = e.target.value.split('\n').filter(a => a.trim());
                              setIdoRounds(newRounds);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button 
                    onClick={addIdoRound}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 opacity-50 hover:opacity-100"
                  >
                    <Plus size={18} />
                    Add Another Round
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Timing */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Sale Timing</h2>
                <p className="opacity-50 text-sm">When should the sale start and end?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Start Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-yellow-500/50"
                    value={timing.startsAt}
                    onChange={e => setTiming({ ...timing, startsAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">End Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-yellow-500/50"
                    value={timing.endsAt}
                    onChange={e => setTiming({ ...timing, endsAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-sm leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.8 }}>
                <p>💡 Tip: Most successful launches run for 3-7 days. Whitelist rounds usually last 24-48 hours.</p>
              </div>
            </div>
          )}

          {/* STEP 5: Confirm */}
          {step === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Final Confirmation</h2>
                <p className="opacity-50 text-sm">Review your launch details.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between">
                  <span className="opacity-50">Token</span>
                  <span className="font-bold">{tokenInfo.name} ({tokenInfo.symbol.toUpperCase()})</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between">
                  <span className="opacity-50">Mode</span>
                  <span className="font-bold uppercase tracking-widest text-xs" style={{ color: 'var(--accent)' }}>{mode}</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between">
                  <span className="opacity-50">Raise Target</span>
                  <span className="font-mono font-bold">
                    {mode === 'basic' ? `$${basicConfig.hardCap.toLocaleString()}` : 
                     mode === 'allocation' ? `$${allocConfig.targetRaise.toLocaleString()}` : 
                     `Multi-round IDO`}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-white/10 bg-white/5 accent-yellow-500"
                  />
                  <div className="text-sm leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    I understand that this is a <strong>trust-based MVP</strong>. Arc Play does not currently use automated smart contract escrow for token distribution. I commit to manually distributing the tokens to all contributors at the end of the sale.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-12">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 font-bold"
                style={{ color: 'var(--fg)' }}
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}
            
            <div className="ml-auto flex gap-4">
              {step < 5 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/10"
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  Next Step
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  disabled={!agreed || loading}
                  onClick={handleCreate}
                  className={`px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${!agreed || loading ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95 shadow-yellow-500/20'}`}
                  style={{ background: 'var(--accent)', color: '#000' }}
                >
                  {loading ? 'Launching...' : 'Create Launch Now'}
                  <Rocket size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
