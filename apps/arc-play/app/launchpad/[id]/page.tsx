'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { 
  Rocket, 
  ArrowLeft, 
  Globe, 
  MessageCircle, 
  ShieldCheck, 
  Users, 
  Coins, 
  Clock, 
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { 
  useLaunchpadStore, 
  getLaunchStats, 
  shortenAddress,
  isWhitelisted,
  TokenLaunch,
  Contribution
} from '@/lib/launchpadStore';
import { sendUSDC } from '@/lib/payments';

export default function LaunchDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const { launches, buyTokens, cancelLaunch, closeIdoRound, finalizeAllocation, markClaimed } = useLaunchpadStore();

  const launch = useMemo(() => launches[id as string], [launches, id]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txInfo, setTxInfo] = useState<{ hash: string; url: string } | null>(null);

  if (!launch) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Rocket size={48} className="mx-auto mb-4 opacity-20" />
            <h1 className="text-2xl font-bold opacity-40">Launch not found</h1>
            <button onClick={() => router.push('/launchpad')} className="mt-4 text-yellow-500 font-bold hover:underline">Return to Browse</button>
          </div>
        </main>
      </div>
    );
  }

  const stats = getLaunchStats(launch);
  const isCreator = address?.toLowerCase() === launch.creatorAddress.toLowerCase();
  const myContributions = launch.contributions.filter(c => c.buyerAddress.toLowerCase() === address?.toLowerCase());

  const handleContribute = async () => {
    if (!address) return alert('Please connect your wallet');
    if (!amount || Number(amount) <= 0) return alert('Enter a valid amount');
    
    setLoading(true);
    setTxInfo(null);

    try {
      // 1. Send USDC
      const { txHash, explorerUrl } = await sendUSDC(launch.creatorAddress, amount);
      
      // 2. Record contribution in store
      const contribution = buyTokens(launch.id, Number(amount), txHash, address);
      
      if (contribution) {
        setTxInfo({ hash: txHash, url: explorerUrl });
        setAmount('');
      } else {
        alert('Contribution failed. Please check limits/whitelist.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (): number => {
    if (launch.mode === 'basic') return launch.basicPricePerToken || 0;
    if (launch.mode === 'ido' && launch.idoRounds && launch.idoCurrentRound !== undefined) {
      const round = launch.idoRounds[launch.idoCurrentRound];
      return round?.pricePerToken || 0;
    }
    return 0;
  };

  const currentPrice = getPrice();
  const estimatedTokens = currentPrice ? Number(amount) / currentPrice : 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <button 
          onClick={() => router.push('/launchpad')}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity mb-8"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div 
                className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-bold shrink-0 border border-white/10 shadow-2xl"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  color: launch.mode === 'ido' ? 'var(--accent)' : launch.mode === 'basic' ? '#60a5fa' : '#a78bfa' 
                }}
              >
                {launch.tokenLogoUrl ? (
                  <img src={launch.tokenLogoUrl} alt={launch.tokenSymbol} className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  launch.tokenSymbol.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span 
                    className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent)' }}
                  >
                    {launch.mode} MODE
                  </span>
                  <span 
                    className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md"
                    style={{ 
                      background: launch.status === 'live' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
                      color: launch.status === 'live' ? '#22c55e' : 'var(--fg)' 
                    }}
                  >
                    {launch.status}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
                  {launch.tokenName} <span className="opacity-20 font-normal">({launch.tokenSymbol})</span>
                </h1>
                <p className="text-lg opacity-60 leading-relaxed mb-6 max-w-2xl">
                  {launch.description}
                </p>
                <div className="flex items-center gap-6">
                  {launch.websiteUrl && (
                    <a href={launch.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 hover:text-yellow-500 transition-all">
                      <Globe size={18} /> Website
                    </a>
                  )}
                  {launch.twitterUrl && (
                    <a href={launch.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 hover:text-yellow-500 transition-all">
                      <MessageCircle size={18} /> Twitter
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-sm opacity-50">
                    <ShieldCheck size={18} /> Created by {shortenAddress(launch.creatorAddress)}
                  </div>
                </div>
              </div>
            </div>

            {/* Token Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Total Supply" value={launch.totalSupply.toLocaleString()} icon={Coins} />
              <StatItem 
                label="For Sale" 
                value={
                  launch.mode === 'basic' ? (launch.basicTokensForSale?.toLocaleString() || '0') :
                  launch.mode === 'allocation' ? (launch.allocTokensForSale?.toLocaleString() || '0') :
                  launch.idoRounds?.reduce((acc, r) => acc + r.tokensInRound, 0).toLocaleString() || '0'
                } 
                icon={TrendingUp} 
              />
              <StatItem label="Participants" value={stats.contributors.toString()} icon={Users} />
              <StatItem label="Total Raised" value={`$${stats.raised.toLocaleString()}`} icon={TrendingUp} />
            </div>

            {/* Mode Specific Info */}
            <div className="p-8 rounded-2xl border bg-white/[0.01]" style={{ borderColor: 'var(--border)' }}>
              {launch.mode === 'ido' && launch.idoRounds && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    IDO Rounds Progress
                  </h3>
                  <div className="space-y-4">
                    {launch.idoRounds.map((round, idx) => {
                      const isActive = launch.idoCurrentRound === idx;
                      const isPast = (launch.idoCurrentRound ?? 0) > idx;
                      const roundMax = round.pricePerToken * round.tokensInRound;
                      const roundPercent = Math.min((round.raised / roundMax) * 100, 100);

                      return (
                        <div key={idx} className={`p-4 rounded-xl border transition-all ${isActive ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 opacity-50'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isPast ? 'bg-green-500 text-black' : isActive ? 'bg-yellow-500 text-black' : 'bg-white/10'}`}>
                                {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                              </div>
                              <span className="font-bold">{round.name}</span>
                              {round.whitelistOnly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">Whitelist</span>}
                            </div>
                            <span className="font-mono text-sm">${round.pricePerToken}</span>
                          </div>
                          <div className="flex justify-between items-end text-[10px] uppercase tracking-wider mb-2">
                            <span>{round.raised.toLocaleString()} / {roundMax.toLocaleString()} USDC</span>
                            <span>{roundPercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${roundPercent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {launch.mode === 'allocation' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#a78bfa' }}>
                    Allocation & Vesting
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Target Raise</span>
                      <p className="text-2xl font-mono">${launch.allocTargetRaise?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Soft Cap</span>
                      <p className="text-2xl font-mono">${launch.allocSoftCap?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">TGE Unlock</span>
                      <p className="text-2xl font-mono">{launch.allocVestingTGEPercent}%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Vesting Period</span>
                      <p className="text-2xl font-mono">{launch.allocVestingMonths} Months</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-sm leading-relaxed text-purple-200/70">
                    <Info size={16} className="inline mr-2 mb-1" />
                    In Allocation Mode, your final token share is calculated after the sale ends based on your percentage contribution to the total USDC pool.
                  </div>
                </div>
              )}

              {launch.mode === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#60a5fa' }}>
                    Presale Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Price</span>
                      <p className="text-2xl font-mono">${launch.basicPricePerToken} USDC</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Min Buy</span>
                      <p className="text-2xl font-mono">${launch.basicMinBuy || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-40 uppercase tracking-widest">Max Buy</span>
                      <p className="text-2xl font-mono">${launch.basicMaxBuy || 'No Limit'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contributors List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Recent Contributions
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 opacity-40 font-normal">{launch.contributions.length}</span>
              </h3>
              <div className="rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-bold opacity-40 uppercase tracking-wider text-[10px]">Contributor</th>
                      <th className="px-6 py-4 font-bold opacity-40 uppercase tracking-wider text-[10px]">Amount</th>
                      <th className="px-6 py-4 font-bold opacity-40 uppercase tracking-wider text-[10px]">Tokens</th>
                      <th className="px-6 py-4 font-bold opacity-40 uppercase tracking-wider text-[10px]">TX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {launch.contributions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center opacity-30 italic">No contributions yet. Be the first!</td>
                      </tr>
                    ) : (
                      [...launch.contributions].reverse().slice(0, 10).map((c) => (
                        <tr key={c.id} className={c.buyerAddress.toLowerCase() === address?.toLowerCase() ? 'bg-yellow-500/[0.03]' : ''}>
                          <td className="px-6 py-4 font-mono">{shortenAddress(c.buyerAddress)}</td>
                          <td className="px-6 py-4 font-bold">${c.usdcAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 opacity-70">
                            {launch.mode === 'allocation' ? 'TBD' : `${c.tokenAllocation.toLocaleString()} ${launch.tokenSymbol}`}
                          </td>
                          <td className="px-6 py-4">
                            <a href={`https://testnet.arcscan.app/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400">
                              <ExternalLink size={16} />
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6 sticky top-8">
            {/* Sales Card */}
            <div className="sweep p-8 rounded-2xl border shadow-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Progress</span>
                  <span className="text-2xl font-mono font-bold" style={{ color: 'var(--accent)' }}>{stats.percentFilled.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.percentFilled}%` }} 
                  />
                </div>
                <div className="flex justify-between mt-3 text-[10px] opacity-40 font-bold uppercase tracking-tighter">
                  <span>${stats.raised.toLocaleString()} Raised</span>
                  <span>Target ${stats.cap.toLocaleString()}</span>
                </div>
              </div>

              {launch.status === 'live' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Contribution Amount (USDC)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold opacity-30">$</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="bg-transparent text-2xl font-mono font-bold outline-none w-full"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {currentPrice > 0 && (
                    <div className="flex justify-between text-sm px-1">
                      <span className="opacity-50">Estimated {launch.tokenSymbol}</span>
                      <span className="font-bold">{estimatedTokens.toLocaleString()}</span>
                    </div>
                  )}

                  <button 
                    onClick={handleContribute}
                    disabled={loading || !amount}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${loading || !amount ? 'opacity-30 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] shadow-yellow-500/20'}`}
                    style={{ background: 'var(--accent)', color: '#000' }}
                  >
                    {loading ? 'Processing...' : 'Contribute USDC'}
                    <ChevronRight size={20} />
                  </button>

                  {txInfo && (
                    <a 
                      href={txInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-green-500 hover:text-green-400 font-bold py-2 bg-green-500/10 rounded-lg border border-green-500/20"
                    >
                      <CheckCircle2 size={14} /> View on ArcScan
                    </a>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center bg-white/5 rounded-xl border border-white/5">
                  <Clock size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold uppercase tracking-widest opacity-40">Sale {launch.status}</p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-xs opacity-50">
                  <Clock size={16} />
                  <span>Ends: {new Date(launch.endsAt).toLocaleString()}</span>
                </div>
                {launch.mode === 'ido' && launch.idoRounds && launch.idoCurrentRound !== undefined && (
                  <div className="flex items-center gap-3 text-xs opacity-50">
                    <Info size={16} />
                    <span>Current Round: {launch.idoRounds[launch.idoCurrentRound].name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator Actions */}
            {isCreator && (
              <div className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.02] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-yellow-500/70">Creator Management</h4>
                
                {launch.mode === 'ido' && launch.status === 'live' && (
                  <button 
                    onClick={() => {
                      if (confirm('Force close current round and move to next?')) closeIdoRound(launch.id);
                    }}
                    className="w-full py-2 rounded-lg border border-yellow-500/30 text-yellow-500 text-sm font-bold hover:bg-yellow-500/10 transition-all"
                  >
                    Close Current Round
                  </button>
                )}

                {launch.mode === 'allocation' && launch.status === 'ended' && (
                  <button 
                    onClick={() => {
                      if (confirm('Finalize allocations? This will calculate per-user shares.')) finalizeAllocation(launch.id);
                    }}
                    className="w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-bold hover:bg-purple-500/30 transition-all"
                  >
                    Finalize Allocation
                  </button>
                )}

                {(launch.status === 'live' || launch.status === 'upcoming') && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel? You must manually refund all contributors.')) cancelLaunch(launch.id);
                    }}
                    className="w-full py-2 rounded-lg border border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500/10 transition-all"
                  >
                    Cancel Launch
                  </button>
                )}
                
                <p className="text-[10px] opacity-40 italic text-center">
                  Only you can see these actions.
                </p>
              </div>
            )}

            {/* My Contributions Summary */}
            {myContributions.length > 0 && (
              <div className="p-6 rounded-2xl border border-green-500/20 bg-green-500/[0.02] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-green-500/70">Your Position</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Total Contributed</span>
                  <span className="font-bold text-lg">${myContributions.reduce((acc, c) => acc + c.usdcAmount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-60">Reserved Tokens</span>
                  <span className="font-bold text-lg">
                    {launch.mode === 'allocation' ? 'TBD' : `${myContributions.reduce((acc, c) => acc + c.tokenAllocation, 0).toLocaleString()} ${launch.tokenSymbol}`}
                  </span>
                </div>
                
                {launch.status === 'ended' || launch.status === 'completed' ? (
                  <div className="pt-4 border-t border-green-500/10">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                      <p className="text-xs font-bold mb-2">Presale Finished!</p>
                      <p className="text-[10px] opacity-70 leading-relaxed">
                        The creator will distribute tokens manually to your address. Contact them via Twitter/Website for updates.
                      </p>
                    </div>
                    {myContributions.some(c => !c.claimed) && (
                      <button 
                        onClick={() => {
                          const firstUnclaimed = myContributions.find(c => !c.claimed);
                          if (firstUnclaimed) markClaimed(launch.id, firstUnclaimed.id);
                        }}
                        className="w-full py-2 rounded-lg bg-green-500 text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Mark as Claimed
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex gap-3">
              <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[10px] opacity-40 leading-relaxed">
                This is a trust-based MVP. USDC is sent directly to the creator. Distribution is manual. Arc Play is not responsible for any losses.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
      <div className="flex items-center gap-2 mb-1 opacity-40">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-mono font-bold truncate" style={{ color: 'var(--fg)' }}>{value}</p>
    </div>
  );
}
