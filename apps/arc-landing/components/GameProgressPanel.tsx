import { Coins, Flame, Sparkles, Trophy, type LucideIcon } from 'lucide-react';
import { formatGameAmount, type GameProgressSnapshot } from '@/lib/gameStore';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-black/25 px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">
        <Icon size={14} className="text-[#c9a84c]" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

export default function GameProgressPanel({
  snapshot,
  title = 'Your Game Progress',
  description = 'Momentum from the local game store. XP, streaks, and payouts are derived from mock activity only.',
  className = '',
}: {
  snapshot: GameProgressSnapshot;
  title?: string;
  description?: string;
  className?: string;
}) {
  const levelProgressWidth = Math.max(0, Math.round(snapshot.levelProgress * 100));

  return (
    <HubCard as="section" className={`p-6 sm:p-8 ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#777]">Progress</p>
          <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9a9a9a]">{description}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">{snapshot.badgeLabel}</HubBadge>
          <div className="text-3xl font-black text-[#c9a84c]">LV {snapshot.level}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="XP" value={snapshot.xp.toLocaleString('en-US')} icon={Coins} />
        <MetricTile label="Streak" value={`${snapshot.streak}x`} icon={Flame} />
        <MetricTile label="Win Rate" value={`${snapshot.winRate}%`} icon={Sparkles} />
        <MetricTile label="Total Won" value={formatGameAmount(snapshot.totalWon)} icon={Trophy} />
      </div>

      <div className="mt-5 rounded-2xl border border-[#2a2a2a] bg-white/[0.02] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-[#9a9a9a]">Next level</span>
          <span className="font-semibold text-white">{snapshot.xpToNextLevel} XP to level {snapshot.level + 1}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#c9a84c_0%,#f0d79e_48%,#30d158_100%)] transition-[width] duration-500"
            style={{ width: `${levelProgressWidth}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Active challenges</div>
            <div className="mt-2 text-lg font-black text-white">{snapshot.activeChallenges}</div>
          </div>
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Open lucky packs</div>
            <div className="mt-2 text-lg font-black text-white">{snapshot.openLuckyPacks}</div>
          </div>
          <div className="rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Completed</div>
            <div className="mt-2 text-lg font-black text-white">{snapshot.completedChallenges}</div>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[#2a2a2a] bg-black/30 px-4 py-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#777]">Recent momentum</div>
          <div className="mt-2 text-sm font-semibold text-white">{snapshot.recentTitle}</div>
          <div className="mt-1 text-sm leading-7 text-[#9a9a9a]">{snapshot.recentSubtitle}</div>
        </div>
      </div>
    </HubCard>
  );
}
