'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, Coins, Plus, Sparkles, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GameProgressPanel from '@/components/GameProgressPanel';
import { HubBadge, HubCard, HubEmptyState, HubMetricCard, HubSkeletonCard, hubInputClass, hubLabelClass, hubSelectClass } from '@/components/HubPrimitives';
import {
  formatQuizAmount,
  formatQuizDate,
  formatQuizTimeLeft,
  resolveQuizPotStatus,
  useQuizPotStore,
  type QuizPot,
  type QuizPotDistribution,
} from '@/lib/quizPotStore';
import { buildGameProgressSnapshot, useGameStore } from '@/lib/gameStore';
import { ShareButtons } from '@/components/ShareButtons';

import { GameToast } from '@/components/GameToast';

function useHydratedNow() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setHydrated(true);
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return { hydrated, now } as const;
}

function statusTone(status: ReturnType<typeof resolveQuizPotStatus>) {
  switch (status) {
    case 'live':
      return 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]';
    case 'ended':
      return 'border-[#777]/30 bg-white/[0.02] text-[#d8d8d8]';
    default:
      return 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]';
  }
}

function getCountdownCopy(pot: QuizPot, now: number) {
  const status = resolveQuizPotStatus(pot, now);

  if (status === 'live') {
    return {
      label: 'Ends in',
      value: formatQuizTimeLeft(Math.max(0, pot.endsAt - now)),
    };
  }

  if (status === 'open') {
    return {
      label: 'Starts in',
      value: formatQuizTimeLeft(Math.max(0, pot.startsAt - now)),
    };
  }

  return {
    label: 'Ended on',
    value: formatQuizDate(pot.endsAt),
  };
}

function formatDistributionLabel(distribution: QuizPotDistribution): string {
  return distribution.replace('-', ' ');
}

function QuizPotCard({ pot, now }: { pot: QuizPot; now: number }) {
  const status = resolveQuizPotStatus(pot, now);
  const countdown = getCountdownCopy(pot, now);
  const ctaLabel = status === 'ended' ? 'Review Pot' : 'Join Pot';

  return (
    <HubCard as="article" className="p-6 sm:p-8 hover:border-[#d4af37]/30 transition-all group">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className={statusTone(status)}>{status.toUpperCase()}</HubBadge>
            <HubBadge>{formatDistributionLabel(pot.distribution)}</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-white">{pot.hostName}</HubBadge>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase sm:text-3xl group-hover:text-[#d4af37] transition-colors">{pot.title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-[#8a8a9a]">
              Challenge a live room, join a queued table, or review the final standings. Each pot is fully local and safe to play.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">{countdown.label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{countdown.value}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Questions</div>
          <div className="mt-2 text-sm font-semibold text-white">{pot.questionCount}</div>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Duration</div>
          <div className="mt-2 text-sm font-semibold text-white">{pot.durationHours}h</div>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Participants</div>
          <div className="mt-2 text-sm font-semibold text-white">{pot.participants.length}</div>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#555566]">Pot</div>
          <div className="mt-2 text-sm font-semibold text-[#d4af37]">{formatQuizAmount(pot.potUsd)}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm leading-7 text-[#555566]">
          {status === 'ended'
            ? `Finalized on ${formatQuizDate(pot.endsAt)}.`
            : status === 'live'
              ? 'Answers are being accepted right now.'
              : 'Players can join now and wait for the room to go live.'}
        </div>
        <Link href={`/game/quiz-pot/${pot.id}`} className="primary-button justify-center sm:min-w-40 pulse-gold">
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </HubCard>
  );
}

export default function QuizPotHubPage() {
  const { pots, createQuizPot } = useQuizPotStore();
  const { hydrated, now } = useHydratedNow();
  
  const [toast, setToast] = useState<{ isVisible: boolean; type: 'win' | 'loss' | 'info'; title: string; message: string; amount?: string }>({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showToast = (type: 'win' | 'loss' | 'info', title: string, message: string, amount?: string) => {
    setToast({ isVisible: true, type, title, message, amount });
  };

  const closeToast = () => setToast(prev => ({ ...prev, isVisible: false }));

  const challenges = useGameStore((state) => state.challenges);
  const luckyPacks = useGameStore((state) => state.luckyPacks);
  const history = useGameStore((state) => state.history);
  const gameProgress = useMemo(
    () => buildGameProgressSnapshot({ challenges, luckyPacks, history }, now),
    [challenges, luckyPacks, history, now],
  );
  
  const [formTitle, setFormTitle] = useState('Weekend Trivia Night');
  const [formPot, setFormPot] = useState('500');
  const [formQuestionCount, setFormQuestionCount] = useState('5');
  const [formDurationHours, setFormDurationHours] = useState('2');
  const [formDistribution, setFormDistribution] = useState<QuizPotDistribution>('top3-split');
  const [statusMessage, setStatusMessage] = useState('');

  const sortedPots = useMemo(() => {
    const rank: Record<string, number> = { live: 0, open: 1, ended: 2 };

    return [...pots].sort((a, b) => {
      const statusDiff = rank[resolveQuizPotStatus(a, now)] - rank[resolveQuizPotStatus(b, now)];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return a.startsAt - b.startsAt || a.endsAt - b.endsAt || a.title.localeCompare(b.title);
    });
  }, [now, pots]);

  const stats = useMemo(() => {
    const livePots = pots.filter((pot) => resolveQuizPotStatus(pot, now) === 'live').length;
    const totalPot = pots.reduce((sum, pot) => sum + pot.potUsd, 0);
    const totalParticipants = pots.reduce((sum, pot) => sum + pot.participants.length, 0);

    return { livePots, totalPot, totalParticipants };
  }, [now, pots]);

  const handleCreatePot = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formTitle.trim();
    if (!title) {
      showToast('info', 'Missing Title', 'Enter a title before creating a pot.');
      return;
    }

    const created = createQuizPot({
      title,
      potUsd: Number(formPot),
      questionCount: Number(formQuestionCount),
      durationHours: Number(formDurationHours),
      distribution: formDistribution,
    });

    showToast('win', 'Quiz Pot Created!', `${created.title} was successfully added to the hub.`, String(created.potUsd));
    setStatusMessage('Pot created successfully!');
    setFormTitle('Weekend Trivia Night');
    setFormPot('500');
    setFormQuestionCount('5');
    setFormDurationHours('2');
    setFormDistribution('top3-split');
  };

  if (!hydrated) {
    return (
      <section className="section pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl space-y-8">
          <HubSkeletonCard lines={4} className="min-h-[260px]" />
          <div className="grid gap-4 md:grid-cols-3">
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
            <HubSkeletonCard lines={1} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <HubSkeletonCard lines={5} className="min-h-[360px]" />
            <HubSkeletonCard lines={8} className="min-h-[480px]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl">
        <GameToast
          isVisible={toast.isVisible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          amount={toast.amount}
          onClose={closeToast}
        />

        <div className="reveal space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f0d79e]">Quiz Pot</HubBadge>
            <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#bdbdbd]">Mock gameplay</HubBadge>
          </div>
          <h1 className="max-w-5xl text-4xl font-black uppercase leading-tight sm:text-5xl lg:text-7xl">
            Quiz Pot Hub
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
            Live trivia rooms, local countdowns, and a browser-persisted leaderboard. Create a new pot, join a room, and play through the questions.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ShareButtons title="Quiz Pot Hub" />
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <HubMetricCard label="Live Pots" value={stats.livePots} icon={Clock3} />
          <HubMetricCard label="Total Pot" value={formatQuizAmount(stats.totalPot)} icon={Coins} />
          <HubMetricCard label="Participants" value={stats.totalParticipants} icon={Users} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-5">
            {sortedPots.length > 0 ? (
              sortedPots.map((pot) => <QuizPotCard key={pot.id} pot={pot} now={now} />)
            ) : (
              <HubCard className="p-12 text-center border-dashed border-2 border-[#1a1a2e] bg-transparent">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#0d0d12] rounded-3xl flex items-center justify-center border border-[#1a1a2e]">
                  <Sparkles size={32} className="text-[#555566]" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">No quiz pots yet</h3>
                <p className="text-[#8a8a9a] mb-8 max-w-sm mx-auto">The local store is empty. Create your first mock quiz pot to get started.</p>
                <button 
                  onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="primary-button mx-auto"
                >
                  Create Quiz Pot
                </button>
              </HubCard>
            )}
          </div>

          <div className="space-y-6">
            <GameProgressPanel
              snapshot={gameProgress}
              description="Streak, XP, and recent wins are shared with the rest of the Arc game store and update locally in the browser."
            />

            <HubCard as="aside" className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Create pot</p>
                  <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">Mock form</h2>
                </div>
                <span className="inline-flex rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a9a]">
                  {pots.length} total
                </span>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleCreatePot}>
                <div className="space-y-2">
                  <label className={hubLabelClass} htmlFor="quiz-pot-title">
                    Title
                  </label>
                  <input
                    id="quiz-pot-title"
                    type="text"
                    value={formTitle}
                    onChange={(event) => setFormTitle(event.target.value)}
                    className={`w-full ${hubInputClass}`}
                    placeholder="Weekend Trivia Night"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={hubLabelClass} htmlFor="quiz-pot-amount">
                      Pot USD
                    </label>
                    <input
                      id="quiz-pot-amount"
                      type="number"
                      min={25}
                      step={25}
                      value={formPot}
                      onChange={(event) => setFormPot(event.target.value)}
                      className={`w-full ${hubInputClass}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={hubLabelClass} htmlFor="quiz-pot-questions">
                      Questions
                    </label>
                    <input
                      id="quiz-pot-questions"
                      type="number"
                      min={3}
                      max={10}
                      step={1}
                      value={formQuestionCount}
                      onChange={(event) => setFormQuestionCount(event.target.value)}
                      className={`w-full ${hubInputClass}`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={hubLabelClass} htmlFor="quiz-pot-duration">
                      Duration hours
                    </label>
                    <input
                      id="quiz-pot-duration"
                      type="number"
                      min={1}
                      max={24}
                      step={1}
                      value={formDurationHours}
                      onChange={(event) => setFormDurationHours(event.target.value)}
                      className={`w-full ${hubInputClass}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={hubLabelClass} htmlFor="quiz-pot-distribution">
                      Distribution
                    </label>
                    <select
                      id="quiz-pot-distribution"
                      value={formDistribution}
                      onChange={(event) => setFormDistribution(event.target.value as QuizPotDistribution)}
                      className={`w-full ${hubSelectClass}`}
                    >
                      <option value="winner-takes-all">Winner takes all</option>
                      <option value="top3-split">Top 3 split</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3 text-sm leading-7 text-[#8a8a9a]">
                  New pots start as open rooms with Arc Game Desk as the host. The countdown begins one hour from creation and uses only local mock data.
                </div>

                <button type="submit" className="primary-button w-full">
                  <Plus size={15} />
                  Create Mock Pot
                </button>

                <p aria-live="polite" className="min-h-6 text-sm text-[#d8d8d8]">
                  {statusMessage}
                </p>
              </form>
            </HubCard>
          </div>
        </div>
      </div>
    </section>
  );
}
