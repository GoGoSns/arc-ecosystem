'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Gem, Loader2, Info, CheckCircle2, 
  ExternalLink, Share2, Copy, Twitter, Trophy
} from 'lucide-react';
import { HubCard, HubEmptyState, HubSkeletonCard, hubInputClass } from '@/components/HubPrimitives';
import { useValueStore, type WalletScoreData } from '@/lib/valueStore';
import { buildDemoWalletScore } from '@/lib/demoMetrics';
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
    const trimmed = address.trim();
    if (!trimmed) {
      setError('Enter a wallet address to calculate a demo score.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const addr = trimmed.toLowerCase();
      const cached = getScore(addr);
      if (cached) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setResult(cached);
        return;
      }

      const authorThreads = threads.filter((t) => t.authorAddress.toLowerCase() === addr).length;
      const authorComments = threads.reduce((acc, t) => acc + t.comments.filter((c) => c.authorAddress.toLowerCase() === addr).length, 0);
      const feedbackCount = feedbacks.filter((f) => f.authorAddress.toLowerCase() === addr).length;
      const feedbackComments = feedbacks.reduce((acc, f) => acc + f.comments.filter((c) => c.authorAddress.toLowerCase() === addr).length, 0);
      const isNodeOp = nodeData.some((o) => o.address.toLowerCase() === addr);

      const demoBase = buildDemoWalletScore(addr, {
        threads: authorThreads,
        feedbacks: feedbackCount + feedbackComments,
        nodeOperators: isNodeOp ? 1 : 0,
      });

      const communityScore = Math.min(
        (authorThreads * 20) +
        (authorComments * 5) +
        (feedbackCount * 10) +
        (feedbackComments * 5) +
        (isNodeOp ? 50 : 0),
        100,
      );

      const score = demoBase.score - demoBase.breakdown.community + communityScore;
      const finalResult: WalletScoreData = {
        ...demoBase,
        score,
        tier:
          score > 800 ? 'diamond' :
          score > 600 ? 'platinum' :
          score > 400 ? 'gold' :
          score > 200 ? 'silver' :
          'bronze',
        breakdown: {
          ...demoBase.breakdown,
          community: communityScore,
        },
        computedAt: Date.now(),
      };

      setScore(finalResult);
      setResult(finalResult);
    } catch {
      setError('Unable to calculate a demo score.');
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
          <p className="text-[#888] text-lg">Calculate your Arc activity rating from local demo data and community activity.</p>
        </div>

        {/* Input Section */}
        <HubCard className="mb-12 p-8">
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={(event) => { event.preventDefault(); calculateScore(); }}>
            <div className="flex-1">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-[#777]" htmlFor="wallet-address">
                Wallet Address
              </label>
              <input
                id="wallet-address"
                aria-label="Enter wallet address"
                type="text"
                placeholder="Enter wallet address (0x...)"
                className={`w-full font-mono ${hubInputClass}`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="primary-button px-10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'CALCULATE SCORE'}
            </button>
          </form>
        </HubCard>

        {loading && (
          <div className="space-y-4">
            <HubSkeletonCard lines={4} />
            <p className="text-center font-mono text-xs uppercase tracking-[0.28em] text-[#555]">
              Analyzing demo footprint...
            </p>
          </div>
        )}

        {error && !loading ? (
          <HubEmptyState
            icon={Info}
            title="Unable to calculate wallet score"
            description={error}
            tone="error"
            className="mb-12"
          >
            <button type="button" onClick={calculateScore} className="primary-button">
              RETRY
            </button>
          </HubEmptyState>
        ) : null}

        {!loading && !result && !error ? (
          <div className="mb-12 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c9a84c]">Demo Preview</p>
            <p className="mt-4 text-[#888]">Enter any wallet address to generate a local score snapshot.</p>
          </div>
        ) : null}

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
