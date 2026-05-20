'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { HubBadge } from '@/components/HubPrimitives';
import {
  doesScoreBeatTarget,
  formatChallengeAmount,
  formatChallengeScore,
  getChallengeGameTitle,
  getChallengeMetric,
  getChallengeParticipantAddress,
  truncateAddress,
  type GameType,
  useChallengeStore,
} from '@/lib/challengeStore';

type ChallengeBarProps = {
  gameType: GameType;
  playerScore?: number;
  className?: string;
};

function formatChallengeCreatorName(name: string | undefined, address: string): string {
  if (name && name.trim().length > 0) {
    return `${name.trim()} (${truncateAddress(address)})`;
  }

  return truncateAddress(address);
}

export function ChallengeBar({ gameType, playerScore, className = '' }: ChallengeBarProps) {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const challenge = useChallengeStore((state) => (challengeId ? state.getChallengeById(challengeId) : undefined));
  const acceptChallenge = useChallengeStore((state) => state.acceptChallenge);
  const completeChallenge = useChallengeStore((state) => state.completeChallenge);

  const metric = useMemo(() => getChallengeMetric(gameType), [gameType]);
  const hasFinalScore = typeof playerScore === 'number' && Number.isFinite(playerScore);
  const storedScore = typeof challenge?.challengerScore === 'number' ? challenge.challengerScore : undefined;
  const scoreValue = hasFinalScore
    ? Math.max(0, Math.round(playerScore))
    : typeof storedScore === 'number'
      ? Math.max(0, Math.round(storedScore))
      : undefined;
  const didWin = typeof scoreValue === 'number' && hasFinalScore && challenge
    ? doesScoreBeatTarget(gameType, scoreValue, challenge.targetScore)
    : false;
  const storedDidWin =
    !hasFinalScore && challenge && typeof scoreValue === 'number'
      ? doesScoreBeatTarget(gameType, scoreValue, challenge.targetScore)
      : didWin;

  useEffect(() => {
    if (!challenge || challenge.status !== 'open') {
      return;
    }

    if (!challenge.challengerAddress) {
      acceptChallenge(challenge.id, getChallengeParticipantAddress('challenger'));
    }
  }, [acceptChallenge, challenge]);

  useEffect(() => {
    if (!challenge || challenge.status !== 'open' || !hasFinalScore || scoreValue === undefined) {
      return;
    }

    completeChallenge(challenge.id, scoreValue);
  }, [challenge, completeChallenge, hasFinalScore, scoreValue]);

  if (!challengeId) {
    return null;
  }

  if (!challenge) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(13,13,18,0.96))] px-4 py-4 shadow-[0_0_30px_rgba(212,175,55,0.08)] ${className}`.trim()}
      >
        <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge</HubBadge>
        <p className="mt-3 text-sm font-semibold text-white">Challenge data was not found on this device.</p>
      </div>
    );
  }

  const creatorLabel = formatChallengeCreatorName(challenge.creatorName, challenge.creatorAddress);
  const scoreLabel = formatChallengeScore(gameType, challenge.targetScore);
  const completed = challenge.status === 'completed';
  const expired = challenge.status === 'expired';
  const finalDidWin = completed ? storedDidWin : didWin;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border px-4 py-4 shadow-[0_0_30px_rgba(212,175,55,0.08)] ${
        expired
          ? 'border-red-500/25 bg-red-500/10 text-red-100'
          : completed
            ? finalDidWin
              ? 'border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.14),rgba(13,13,18,0.96))] text-white'
              : 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))] text-red-100'
            : 'border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(13,13,18,0.96))] text-white'
      } ${className}`.trim()}
    >
      {finalDidWin ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              className="absolute rounded-sm opacity-0 [animation:challenge-confetti_2.6s_linear_infinite]"
              style={{
                left: `${(index * 6) % 100}%`,
                top: `${(index * 7) % 30}%`,
                width: `${6 + (index % 3)}px`,
                height: `${10 + (index % 4)}px`,
                animationDelay: `${(index % 9) * 0.07}s`,
                backgroundColor: ['#d4af37', '#f5d060', '#30d158', '#ffffff'][index % 4],
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <HubBadge
            className={`${
              expired
                ? 'border-red-500/25 bg-red-500/10 text-red-100'
                : completed
                  ? finalDidWin
                    ? 'border-[#30d158]/25 bg-[#30d158]/10 text-[#a6f4bf]'
                    : 'border-red-500/25 bg-red-500/10 text-red-100'
                  : 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]'
            }`}
          >
            Challenge {expired ? 'Expired' : completed ? (finalDidWin ? 'Won' : 'Lost') : 'Live'}
          </HubBadge>

          <h2 className="mt-3 text-2xl font-black uppercase leading-tight sm:text-3xl">
            {expired
              ? 'This challenge expired.'
              : completed
                ? finalDidWin
                  ? 'YOU WON!'
                  : 'Better luck next time!'
                : `Challenge from ${creatorLabel}`}
          </h2>

          <p className={`mt-2 max-w-3xl text-sm leading-7 ${expired ? 'text-red-100/80' : 'text-white/80'}`}>
            {expired ? (
              'This challenge can no longer be completed.'
            ) : completed && typeof scoreValue === 'number' ? (
              finalDidWin ? (
                `${scoreLabel} beaten. You won ${formatChallengeAmount(challenge.usdcAmount)}.`
              ) : (
                `Score: ${formatChallengeScore(gameType, scoreValue)}. Needed: ${scoreLabel}. Better luck next time!`
              )
            ) : (
              <>
                Beat {metric.label}: <span className="font-black text-[#f5d060]">{scoreLabel}</span> to win{' '}
                <span className="font-black text-[#f5d060]">{formatChallengeAmount(challenge.usdcAmount)}</span>.
              </>
            )}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[320px] lg:grid-cols-1 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Target</div>
            <div className="mt-1 text-xl font-black text-[#f5d060]">{scoreLabel}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Prize</div>
            <div className="mt-1 text-xl font-black text-[#f5d060]">{formatChallengeAmount(challenge.usdcAmount)}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a2e] bg-black/25 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Game</div>
            <div className="mt-1 text-lg font-black text-white">{getChallengeGameTitle(gameType)}</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes challenge-confetti {
          0% {
            opacity: 0;
            transform: translateY(-12px) rotate(0deg);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(240px) rotate(520deg);
          }
        }
      `}</style>
    </div>
  );
}
