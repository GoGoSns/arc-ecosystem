'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HubBadge, HubCard } from '@/components/HubPrimitives';
import {
  formatChallengeAmount,
  formatChallengeScore,
  getChallengeGameTitle,
  getChallengeMetric,
  getChallengeParticipantAddress,
  type GameType,
  useChallengeStore,
} from '@/lib/challengeStore';

type ChallengeModalProps = {
  gameType: GameType;
  playerScore: number;
  isOpen: boolean;
  onClose: () => void;
};

type AmountChoice = 5 | 10 | 25 | 'custom';

function buildChallengeUrl(gameType: GameType, challengeId: string): string {
  return `/game/${gameType}?challenge=${challengeId}`;
}

export function ChallengeModal({ gameType, playerScore, isOpen, onClose }: ChallengeModalProps) {
  const metric = useMemo(() => getChallengeMetric(gameType), [gameType]);
  const createChallenge = useChallengeStore((state) => state.createChallenge);
  const [targetScore, setTargetScore] = useState(String(playerScore));
  const [amountChoice, setAmountChoice] = useState<AmountChoice>(10);
  const [customAmount, setCustomAmount] = useState('25');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copy Link');

  const challenge = useChallengeStore((state) =>
    challengeId ? state.getChallengeById(challengeId) : undefined,
  );

  useEffect(() => {
    if (!isOpen) {
      setChallengeId(null);
      setCopyLabel('Copy Link');
      return;
    }

    setTargetScore(String(playerScore));
    setAmountChoice(10);
    setCustomAmount('25');
    setChallengeId(null);
    setCopyLabel('Copy Link');
  }, [gameType, isOpen, playerScore]);

  const createdChallenge = challengeId ? challenge : null;
  const sharePath = createdChallenge ? buildChallengeUrl(gameType, createdChallenge.id) : '';
  const shareUrl = createdChallenge && typeof window !== 'undefined' ? `${window.location.origin}${sharePath}` : '';
  const createdAmount = createdChallenge ? formatChallengeAmount(createdChallenge.usdcAmount) : '';

  if (!isOpen) {
    return null;
  }

  const handleCreateChallenge = () => {
    const parsedTarget = Number(targetScore);
    const amount = amountChoice === 'custom' ? Number(customAmount) : amountChoice;

    if (!Number.isFinite(parsedTarget) || parsedTarget < 0 || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const nextChallengeId = createChallenge({
      gameType,
      creatorAddress: getChallengeParticipantAddress('creator'),
      creatorScore: Math.max(0, Math.round(playerScore)),
      targetScore: Math.max(0, Math.round(parsedTarget)),
      usdcAmount: Math.max(1, Math.round(amount)),
    });

    setChallengeId(nextChallengeId);
    setCopyLabel('Copy Link');
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopyLabel('Copied!');
    window.setTimeout(() => setCopyLabel('Copy Link'), 1800);
  };

  const handleShare = () => {
    if (!shareUrl) {
      return;
    }

    const text = encodeURIComponent(
      `I created an Arc ${getChallengeGameTitle(gameType)} challenge: beat ${formatChallengeScore(gameType, Number(targetScore) || 0)} to win ${createdAmount || '$5 USDC'}.`,
    );
    window.open(`https://x.com/intent/tweet?text=${text}%0A${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <HubCard as="section" className="relative z-10 w-full max-w-2xl overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge a Friend!</HubBadge>
            <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
              {getChallengeGameTitle(gameType)}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#8a8a9a]">
              Share your result and let someone try to beat it in the same game.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#1a1a2e] bg-white/[0.02] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8a8a] transition-colors hover:border-[#d4af37]/30 hover:text-white"
          >
            Close
          </button>
        </div>

        {!createdChallenge ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Your Score</div>
                <div className="mt-2 text-2xl font-black text-white">{formatChallengeScore(gameType, playerScore)}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Target</div>
                <div className="mt-2 text-2xl font-black text-[#f5d060]">
                  {targetScore}
                  {metric.unit}
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Mode</div>
                <div className="mt-2 text-lg font-black text-[#a6f4bf]">
                  {metric.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                  Target {metric.label} to beat
                </label>
                <input
                  value={targetScore}
                  onChange={(event) => setTargetScore(event.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  className="mt-2 w-full rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3 text-lg font-semibold text-white outline-none transition-colors focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/15"
                />
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">USDC Amount</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  {([5, 10, 25, 'custom'] as const).map((option) => {
                    const active = amountChoice === option;
                    const label = option === 'custom' ? 'Custom' : `$${option}`;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAmountChoice(option)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                          active
                            ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060] shadow-[0_0_22px_rgba(212,175,55,0.14)]'
                            : 'border-[#1a1a2e] bg-black/30 text-[#8a8a8a] hover:border-[#d4af37]/25 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {amountChoice === 'custom' ? (
                  <input
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    type="number"
                    min="1"
                    step="1"
                    className="mt-3 w-full rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/15"
                    placeholder="Enter custom USDC amount"
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateChallenge}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Create Challenge
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                {metric.lowerIsBetter ? 'Beat the target with fewer moves or seconds.' : 'Beat the target with a higher score.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="rounded-[1.5rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02))] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#f0d79e]">Challenge Created</div>
                  <div className="mt-2 text-2xl font-black text-white">
                    Share the link and let someone try to beat your run.
                  </div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Prize</div>
                  <div className="mt-1 text-xl font-black text-[#f5d060]">{createdAmount}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Shareable Link</div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    readOnly
                    value={shareUrl}
                    className="min-w-0 flex-1 rounded-2xl border border-[#1a1a2e] bg-black/40 px-4 py-3 text-sm text-[#f5f5f5] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full border border-[#d4af37] bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-[#f5d060]"
                  >
                    {copyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border border-[#1a1a2e] bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Share on X
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#8a8a8a]">
                <span>Game: {getChallengeGameTitle(gameType)}</span>
                <span>•</span>
                <span>Your score: {formatChallengeScore(gameType, playerScore)}</span>
                <span>•</span>
                <span>Target: {formatChallengeScore(gameType, Number(targetScore) || 0)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
              >
                Done
              </button>
              <Link
                href={sharePath}
                className="rounded-full border border-[#1a1a2e] bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
              >
                Open Challenge
              </Link>
            </div>
          </div>
        )}
      </HubCard>
    </div>
  );
}
