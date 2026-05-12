'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Share2, Copy, Twitter, ExternalLink, 
  Award, Zap, Wrench, Globe, User, MessageSquare, 
  ShieldCheck, Trophy, Bug, Gamepad2, Coins
} from 'lucide-react';

import { useForumStore } from '@/lib/forumStore';
import { useFeedbackStore } from '@/lib/feedbackStore';
import { useNodeStore } from '@/lib/nodeStore';

const TIER_MAP = {
  bronze: { label: 'Bronze', color: '#cd7f32', icon: '🥉' },
  silver: { label: 'Silver', color: '#c0c0c0', icon: '🥈' },
  gold: { label: 'Gold', color: '#c9a84c', icon: '🥇' },
  platinum: { label: 'Platinum', color: '#e5e4e2', icon: '💠' },
  diamond: { label: 'Diamond', color: '#b9f2ff', icon: '💎' },
};

const ACHIEVEMENTS_DEF = [
  { id: 'early', name: 'Early Adopter', icon: '🌅', desc: 'Active for over 3 months' },
  { id: 'power', name: 'Power User', icon: '⚡', desc: 'More than 100 transactions' },
  { id: 'builder', name: 'Builder', icon: '🛠️', desc: 'Contributed 5+ forum posts' },
  { id: 'validator', name: 'Validator Applicant', icon: '🌐', desc: 'Applied to be a validator' },
  { id: 'node', name: 'Node Operator', icon: '🖥️', desc: 'Registered as operator' },
  { id: 'top', name: 'Top Contributor', icon: '🏆', desc: 'In top 10 stats leaderboard' },
  { id: 'bug', name: 'Bug Hunter', icon: '🐛', desc: 'Reported a bug' },
  { id: 'active', name: 'Active Commenter', icon: '💬', desc: '10+ forum comments' },
  { id: 'player', name: 'Player', icon: '🎮', desc: 'Used Arc Play apps' },
  { id: 'high', name: 'High Roller', icon: '💰', desc: 'Volume > $1,000 USDC' },
];

export default function PublicProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: addressParam } = use(params);
  const [data, setData] = useState<any>(null);

  const threads = useForumStore((state) => state.threads);
  const feedbacks = useFeedbackStore((state) => state.feedbacks);
  const nodeStore = useNodeStore();

  useEffect(() => {
    const addr = addressParam.toLowerCase();
    
    // Simulate/Fetch on-chain data
    const txCount = Math.floor(Math.random() * 500);
    const volume = Math.floor(Math.random() * 5000);
    const monthsActive = Math.floor(Math.random() * 6);
    
    // Calculate Score for Profile
    const authorThreads = threads.filter(t => t.authorAddress.toLowerCase() === addr).length;
    const authorComments = threads.reduce((acc, t) => acc + t.comments.filter(c => c.authorAddress.toLowerCase() === addr).length, 0);
    const feedbackCount = feedbacks.filter(f => f.authorAddress.toLowerCase() === addr).length;
    const isNodeOp = nodeStore.operators.some(o => o.address.toLowerCase() === addr);
    const bugCount = nodeStore.bugs.filter(b => b.reporterAddress.toLowerCase() === addr).length;
    const isValidatorApp = nodeStore.validators.some(v => v.address.toLowerCase() === addr);

    const communityScore = Math.min((authorThreads * 20) + (authorComments * 5) + (feedbackCount * 10) + (isNodeOp ? 50 : 0), 100);
    const mockScore = Math.min(
      Math.min(monthsActive * 30, 200) + 
      Math.min(txCount, 200) + 
      Math.min(volume / 100, 200) + 
      76 + // mock apps
      Math.min(Math.floor(Math.random() * 10) * 10, 100) + // mock nfts
      communityScore,
      1000
    );

    const tier = mockScore > 800 ? 'diamond' : mockScore > 600 ? 'platinum' : mockScore > 400 ? 'gold' : mockScore > 200 ? 'silver' : 'bronze';

    // Achievement Logic
    const unlocked: string[] = [];
    if (monthsActive > 3) unlocked.push('early');
    if (txCount > 100) unlocked.push('power');
    if (authorThreads >= 5) unlocked.push('builder');
    if (isValidatorApp) unlocked.push('validator');
    if (isNodeOp) unlocked.push('node');
    if (bugCount > 0) unlocked.push('bug');
    if (authorComments >= 10) unlocked.push('active');
    if (Math.random() > 0.5) unlocked.push('player'); // Mock
    if (volume > 1000) unlocked.push('high');

    // Simple leaderboard check
    const totalScore = (authorThreads * 5) + authorComments + (feedbackCount * 3) + (bugCount * 10) + (isNodeOp ? 20 : 0);
    if (totalScore > 50) unlocked.push('top'); // Simplified top contributor check

    setData({
      score: mockScore,
      tier,
      portfolio: Math.floor(Math.random() * 50000),
      txCount,
      volume,
      memberSince: monthsActive || 1,
      unlockedIds: unlocked,
    });
  }, [addressParam, threads, feedbacks, nodeStore]);

  if (!data) return null;

  const currentTier = TIER_MAP[data.tier as keyof typeof TIER_MAP];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555] hover:text-[#c9a84c] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#c9a84c] to-[#b9f2ff] p-1 shrink-0">
             <div className="w-full h-full rounded-[22px] bg-black flex items-center justify-center text-white/20">
                <User size={64} />
             </div>
          </div>
          <div className="flex-1 text-center md:text-left">
             <div className="font-mono text-xs text-[#555] mb-2 flex items-center justify-center md:justify-start gap-2">
                <span className="truncate max-w-[200px] sm:max-w-none">{addressParam}</span>
                <button className="hover:text-white"><Copy size={14} /></button>
             </div>
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h1 className="text-4xl font-black uppercase tracking-tighter">ARC PROFILE</h1>
                <div className="px-4 py-1 rounded-full border border-white/10 flex items-center gap-2 bg-black/50">
                  <span className="text-xl">{currentTier.icon}</span>
                  <span className="font-black tracking-widest uppercase text-xs" style={{ color: currentTier.color }}>
                    {currentTier.label} Tier
                  </span>
                </div>
             </div>
          </div>
          <div className="flex gap-3">
             <button className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all">
                <Share2 size={20} className="text-[#c9a84c]" />
             </button>
             <button className="px-6 py-4 rounded-2xl bg-[#c9a84c] text-black font-black hover:bg-[#d4b96a] transition-all flex items-center gap-2">
                <Twitter size={18} />
                SHARE
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           {[
             { label: 'Wallet Score', value: data.score, icon: Award, color: currentTier.color },
             { label: 'Portfolio', value: `$${data.portfolio.toLocaleString()}`, icon: Coins, color: '#4ade80' },
             { label: 'Activity', value: `${data.txCount} TX`, icon: Zap, color: '#60a5fa' },
             { label: 'Member', value: `${data.memberSince} Mo`, icon: User, color: '#f472b6' },
           ].map((stat, i) => (
             <div key={i} className="rounded-3xl p-6 bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
                <stat.icon size={16} className="mb-4" style={{ color: stat.color }} />
                <div className="text-2xl font-black mb-1">{stat.value}</div>
                <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold">{stat.label}</div>
                <div className="absolute top-0 right-0 w-16 h-16 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity rounded-full" style={{ background: stat.color }} />
             </div>
           ))}
        </div>

        {/* Achievements */}
        <div className="rounded-3xl p-10 bg-white/[0.02] border border-white/[0.05]">
           <h2 className="text-2xl font-black mb-10 flex items-center gap-3 uppercase tracking-tight">
              <Trophy size={24} className="text-[#c9a84c]" />
              Achievements
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {ACHIEVEMENTS_DEF.map(ach => {
                const unlocked = data.unlockedIds.includes(ach.id);
                return (
                  <div key={ach.id} className={`p-6 rounded-3xl border transition-all ${unlocked ? 'bg-black/40 border-[#c9a84c]/20' : 'bg-black/20 border-white/5 opacity-40 grayscale'}`}>
                     <div className="text-3xl mb-4">{ach.icon}</div>
                     <div className={`font-black mb-1 ${unlocked ? 'text-white' : 'text-[#555]'}`}>{ach.name}</div>
                     <p className="text-xs text-[#555]">{ach.desc}</p>
                     {!unlocked && <div className="mt-4 text-[9px] font-bold text-[#333] tracking-widest uppercase flex items-center gap-1"><ShieldCheck size={10} /> Locked</div>}
                  </div>
                );
              })}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 text-center">
           <button className="text-[#555] hover:text-white transition-colors text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2 mx-auto">
              Embed this profile on your website <ExternalLink size={12} />
           </button>
        </div>
      </div>
    </div>
  );
}
