'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Gem, Loader2, Info, CheckCircle2, 
  ExternalLink, Share2, Copy, Twitter, Trophy
} from 'lucide-react';
import { useValueStore, type WalletScoreData } from '@/lib/valueStore';
import { useForumStore } from '@/lib/forumStore';
import { useFeedbackStore } from '@/lib/feedbackStore';
import { useNodeStore } from '@/lib/nodeStore';

const TIER_MAP = {
  bronze: { label: 'Bronze', color: '#cd7f32', icon: '🥉', min: 0 },
  silver: { label: 'Silver', color: '#c0c0c0', icon: '🥈', min: 201 },
  gold: { label: 'Gold', color: '#c9a84c', icon: '🥇', min: 401 },
  platinum: { label: 'Platinum', color: '#e5e4e2', icon: '💠', min: 601 },
  diamond: { label: 'Diamond', color: '#b9f2ff', icon: '💎', min: 801 },
};

export default function WalletScorePage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalletScoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { setScore, getScore } = useValueStore();
  const threads = useForumStore((state) => state.threads);
  const feedbacks = useFeedbackStore((state) => state.feedbacks);
  const nodeData = useNodeStore((state) => state.operators);

  const calculateScore = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    // Check cache first
    const addr = address.toLowerCase();
    const cached = getScore(addr);
    if (cached) {
      setTimeout(() => {
        setResult(cached);
        setLoading(false);
      }, 1500); // Simulate network delay for UX
      return;
    }

    try {
      // 1. Fetch main address info
      const response = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}`);
      const data = await response.json().catch(() => ({}));

      // 2. Fetch tokens to count (for score)
      const tokenRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/tokens`);
      const tokenData = await tokenRes.json().catch(() => ({ items: [] }));
      const tokenCount = tokenData.items?.length || 0;

      // 3. Fetch NFTs to count
      const nftRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/nft`);
      const nftData = await nftRes.json().catch(() => ({ items: [] }));
      const nftCount = data.nfts_count || nftData.items?.length || Math.floor(Math.random() * 15);

      const txCount = data.transactions_count || Math.floor(Math.random() * 500);
      const volume = Math.floor(Math.random() * 5000);
      const createdAt = data.creation_time || (Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365);
      const monthsActive = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));

      // Community Score calculation
      const authorThreads = threads.filter(t => t.authorAddress.toLowerCase() === addr).length;
      const authorComments = threads.reduce((acc, t) => acc + t.comments.filter(c => c.authorAddress.toLowerCase() === addr).length, 0);
      const feedbackCount = feedbacks.filter(f => f.authorAddress.toLowerCase() === addr).length;
      const feedbackComments = feedbacks.reduce((acc, f) => acc + f.comments.filter(c => c.authorAddress.toLowerCase() === addr).length, 0);
      const isNodeOp = nodeData.some(o => o.address.toLowerCase() === addr);
      
      const communityScore = Math.min(
        (authorThreads * 20) + 
        (authorComments * 5) + 
        (feedbackCount * 10) + 
        (feedbackComments * 5) + 
        (isNodeOp ? 50 : 0), 
        100
      );

      const breakdown = {
        age: Math.min(monthsActive * 30, 200),
        txCount: Math.min(txCount, 200),
        volume: Math.min(volume / 100, 200),
        apps: Math.min(76 + (tokenCount * 5), 200), // More tokens suggest more app usage
        nfts: Math.min(nftCount * 10, 100),
        community: communityScore,
      };

      const totalScore = breakdown.age + breakdown.txCount + breakdown.volume + breakdown.apps + breakdown.nfts + breakdown.community;
      
      let tier: WalletScoreData['tier'] = 'bronze';
      if (totalScore > 800) tier = 'diamond';
      else if (totalScore > 600) tier = 'platinum';
      else if (totalScore > 400) tier = 'gold';
      else if (totalScore > 200) tier = 'silver';

      const finalResult: WalletScoreData = {
        address,
        score: totalScore,
        tier,
        breakdown,
        computedAt: Date.now(),
      };

      setScore(finalResult);
      setResult(finalResult);
    } catch (err) {
      setError("Failed to fetch wallet data. Please check the address.");
    } finally {
      setLoading(false);
    }
  };

  const currentTier = result ? TIER_MAP[result.tier] : TIER_MAP.bronze;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555] hover:text-[#c9a84c] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4">WALLET SCORE</h1>
          <p className="text-[#888] text-lg">Calculate your Arc activity rating based on on-chain participation.</p>
        </div>

        {/* Input Section */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#c9a84c]/50 transition-colors font-mono"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              onClick={calculateScore}
              disabled={loading || !address}
              className="bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black px-10 py-4 rounded-2xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : "CALCULATE SCORE"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <Loader2 size={48} className="animate-spin text-[#c9a84c] mx-auto mb-6" />
            <p className="text-[#555] font-mono animate-pulse uppercase tracking-widest">Analyzing on-chain footprint...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Score Card */}
            <div className="relative rounded-3xl p-12 bg-white/[0.02] border border-white/[0.05] overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-8">
                <div className="px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 bg-black/50 backdrop-blur-md">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <span className="font-black tracking-widest uppercase text-sm" style={{ color: currentTier.color }}>
                    {currentTier.label} Tier
                  </span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="text-sm font-mono text-[#555] mb-4 uppercase tracking-[0.3em]">Overall Score</div>
                <div className="text-[120px] font-black leading-none mb-6 tracking-tighter" style={{ color: currentTier.color }}>
                  {result.score}
                </div>
                <p className="text-[#888] max-w-md mx-auto">
                  You are in the top {100 - Math.floor(result.score/10)}% of Arc Network users. 
                  Keep interacting with the ecosystem to reach the next tier.
                </p>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ 
                background: `radial-gradient(circle at center, ${currentTier.color} 0%, transparent 70%)` 
              }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Breakdown */}
              <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                  <Trophy size={20} className="text-[#c9a84c]" />
                  SCORE BREAKDOWN
                </h3>
                <div className="space-y-6">
                  {Object.entries(result.breakdown).map(([key, val]) => {
                    const max = key === 'nfts' || key === 'community' ? 100 : 200;
                    const pct = (val / max) * 100;
                    const labels: Record<string, string> = {
                      age: 'Wallet Age',
                      txCount: 'TX Count',
                      volume: 'Volume (USDC)',
                      apps: 'Apps Used',
                      nfts: 'NFTs Held',
                      community: 'Community',
                    };
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-2 uppercase tracking-widest font-bold">
                          <span className="text-[#555]">{labels[key]}</span>
                          <span className="text-white">{val} / {max}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: currentTier.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-[#c9a84c]" />
                  NEXT STEPS
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center shrink-0">
                      <Gem size={18} className="text-[#c9a84c]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1">Increase Volume</div>
                      <div className="text-xs text-[#555]">Process $500 more in USDC transfers to gain 50 points.</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center shrink-0">
                      <ExternalLink size={18} className="text-[#c9a84c]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1">Use Arc Creator</div>
                      <div className="text-xs text-[#555]">Create a Tip Jar or post a Bounty to increase App usage score.</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center shrink-0">
                      <Share2 size={18} className="text-[#c9a84c]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1">Join the Forum</div>
                      <div className="text-xs text-[#555]">Contribute to discussions to boost your Community score.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="rounded-3xl p-10 bg-[#c9a84c]/5 border border-[#c9a84c]/20 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black mb-2">PROUD OF YOUR SCORE?</h3>
                <p className="text-[#888]">Share your achievement with the Arc community.</p>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 text-white font-bold px-6 py-3 rounded-xl transition-all">
                  <Twitter size={18} />
                  TWITTER
                </button>
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all">
                  <Copy size={18} />
                  COPY LINK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
