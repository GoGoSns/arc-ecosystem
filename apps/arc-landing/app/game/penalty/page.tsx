'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type ZoneId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type ShotResult = 'goal' | 'save' | null;

type PenaltyState = {
  phase: 'playing' | 'result';
  round: number;
  goals: number;
  shotResult: ShotResult;
  ballZone: ZoneId | null;
  keeperZone: ZoneId | null;
  hoveredZone: ZoneId | null;
  locked: boolean;
};

const TOTAL_ROUNDS = 5;

const ZONES: Array<{
  id: ZoneId;
  label: string;
  x: number;
  y: number;
}> = [
  { id: 0, label: 'Top Left', x: 18, y: 18 },
  { id: 1, label: 'Top Center', x: 50, y: 18 },
  { id: 2, label: 'Top Right', x: 82, y: 18 },
  { id: 3, label: 'Mid Left', x: 18, y: 38 },
  { id: 4, label: 'Mid Center', x: 50, y: 38 },
  { id: 5, label: 'Mid Right', x: 82, y: 38 },
  { id: 6, label: 'Low Left', x: 18, y: 58 },
  { id: 7, label: 'Low Center', x: 50, y: 58 },
  { id: 8, label: 'Low Right', x: 82, y: 58 },
];

const BALL_START = { x: 50, y: 86 };
const GOALIE_Y = 17;

function createInitialState(): PenaltyState {
  return {
    phase: 'playing',
    round: 1,
    goals: 0,
    shotResult: null,
    ballZone: null,
    keeperZone: null,
    hoveredZone: null,
    locked: false,
  };
}

function getZone(zoneId: ZoneId | null) {
  return zoneId === null ? null : ZONES[zoneId];
}

function zoneLabel(zoneId: ZoneId | null): string {
  if (zoneId === null) {
    return 'Aim';
  }

  return ZONES[zoneId].label;
}

export default function PenaltyPage() {
  const [game, setGame] = useState<PenaltyState>(() => createInitialState());
  const [challengeOpen, setChallengeOpen] = useState(false);
  const shotTimeoutRef = useRef<number | null>(null);
  const roundTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shotTimeoutRef.current !== null) {
        window.clearTimeout(shotTimeoutRef.current);
      }

      if (roundTimeoutRef.current !== null) {
        window.clearTimeout(roundTimeoutRef.current);
      }
    };
  }, []);

  const perfectRun = game.phase === 'result' && game.goals === TOTAL_ROUNDS;

  const confettiPieces = useMemo(
    () =>
      perfectRun
        ? Array.from({ length: 40 }, (_, index) => ({
            left: `${(index * 6) % 100}%`,
            top: `${(index * 4) % 28}%`,
            delay: `${(index % 12) * 0.07}s`,
            duration: `${2.1 + (index % 5) * 0.18}s`,
            size: `${6 + (index % 4)}px`,
            color: ['#d4af37', '#f5d060', '#30d158', '#ffffff'][index % 4],
          }))
        : [],
    [perfectRun],
  );

  const resetGame = () => {
    if (shotTimeoutRef.current !== null) {
      window.clearTimeout(shotTimeoutRef.current);
    }

    if (roundTimeoutRef.current !== null) {
      window.clearTimeout(roundTimeoutRef.current);
    }

    setChallengeOpen(false);
    setGame(createInitialState());
  };

  const handleShoot = (zoneId: ZoneId) => {
    if (game.phase !== 'playing' || game.locked) {
      return;
    }

    const keeperZone = Math.floor(Math.random() * ZONES.length) as ZoneId;
    const isLastRound = game.round >= TOTAL_ROUNDS;

    if (shotTimeoutRef.current !== null) {
      window.clearTimeout(shotTimeoutRef.current);
    }

    if (roundTimeoutRef.current !== null) {
      window.clearTimeout(roundTimeoutRef.current);
    }

    setGame((previous) => ({
      ...previous,
      locked: true,
      shotResult: null,
      ballZone: zoneId,
      keeperZone,
      hoveredZone: null,
    }));

    shotTimeoutRef.current = window.setTimeout(() => {
      const result: ShotResult = zoneId === keeperZone ? 'save' : 'goal';

      setGame((previous) => ({
        ...previous,
        shotResult: result,
        goals: previous.goals + (result === 'goal' ? 1 : 0),
      }));
    }, 500);

    roundTimeoutRef.current = window.setTimeout(() => {
      setGame((previous) => ({
        ...previous,
        phase: isLastRound ? 'result' : 'playing',
        round: isLastRound ? previous.round : previous.round + 1,
        shotResult: null,
        ballZone: null,
        keeperZone: null,
        hoveredZone: null,
        locked: false,
      }));
    }, 1500);
  };

  const ballPosition = getZone(game.ballZone);
  const keeperPosition = getZone(game.keeperZone);
  const hoveredZone = getZone(game.hoveredZone);
  const ballX = ballPosition?.x ?? BALL_START.x;
  const ballY = ballPosition?.y ?? BALL_START.y;
  const keeperX = keeperPosition?.x ?? 50;
  const keeperY = keeperPosition?.y ?? GOALIE_Y;
  const hoverX = hoveredZone?.x ?? BALL_START.x;
  const hoverY = hoveredZone?.y ?? BALL_START.y;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Penalty</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Penalty Kick</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">5 rounds</HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Penaltı</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Pick your corner, read the keeper, and shoot for a perfect five-from-five streak.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="penalty" playerScore={game.phase === 'result' ? game.goals : undefined} />

        <HubCard as="section" className="relative overflow-hidden p-5 sm:p-6 lg:p-8">
          {perfectRun ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confettiPieces.map((piece, index) => (
                <span
                  key={`${piece.left}-${index}`}
                  className="absolute rounded-sm opacity-0 [animation:penalty-confetti_2.8s_linear_infinite]"
                  style={{
                    left: piece.left,
                    top: piece.top,
                    width: piece.size,
                    height: `calc(${piece.size} * 1.5)`,
                    animationDelay: piece.delay,
                    animationDuration: piece.duration,
                    backgroundColor: piece.color,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  game.phase === 'result' && game.goals === TOTAL_ROUNDS
                    ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                }
              >
                {game.phase === 'result' ? 'Result' : 'Playing'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {game.phase === 'result' ? (game.goals === TOTAL_ROUNDS ? 'PERFECT!' : `${game.goals}/5 Goals!`) : 'Aim and shoot.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {game.phase === 'result'
                  ? game.goals === TOTAL_ROUNDS
                    ? 'A full streak from the spot. Challenge someone to beat the perfect run.'
                    : game.goals === 0
                      ? 'Tough night from the spot. Start another run and clean it up.'
                      : 'A solid run with room for more goals next time.'
                  : 'Click a zone to shoot. Same-zone keeper dives are saves; every other shot is a goal.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Goals</div>
                <div className="mt-1 text-2xl font-black text-white">
                  {game.goals}/{TOTAL_ROUNDS}
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Round</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">
                  {game.phase === 'result' ? TOTAL_ROUNDS : game.round}/{TOTAL_ROUNDS}
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Aim</div>
                <div className="mt-1 text-lg font-black text-[#f5d060]">{zoneLabel(game.hoveredZone)}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[280px_1fr]">
            <div className="space-y-4">
              <HubCard as="aside" className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Controls</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#8a8a9a]">
                  <p>Move your mouse or touch a zone to aim.</p>
                  <p>Click or tap to shoot. The keeper picks a random zone each round.</p>
                  <p>If the keeper and ball land in the same zone, the shot is saved.</p>
                </div>
              </HubCard>

              <HubCard as="aside" className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Stats</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Accuracy</div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {game.round === 1 && game.goals === 0 ? '0%' : `${Math.round((game.goals / Math.max(game.round - 1, 1)) * 100)}%`}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Result</div>
                    <div className="mt-1 text-2xl font-black text-[#f5d060]">
                      {game.phase === 'result'
                        ? game.goals === TOTAL_ROUNDS
                          ? 'Perfect'
                          : game.goals === 0
                            ? 'Cold'
                            : 'Solid'
                        : game.shotResult === 'goal'
                          ? 'GOAL'
                          : game.shotResult === 'save'
                            ? 'SAVED'
                            : 'Waiting'}
                    </div>
                  </div>
                </div>
              </HubCard>

              {game.phase === 'result' ? (
                <HubCard as="aside" className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Challenge Score</p>
                  <div className="mt-3 text-3xl font-black text-[#f5d060]">{game.goals} goals</div>
                  <div className="mt-2 text-sm leading-7 text-[#8a8a8a]">
                    Higher goal counts are better for challenge runs.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Challenge a Friend
                    </button>
                  </div>
                </HubCard>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetGame}
                  className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                >
                  New Game
                </button>
              </div>
            </div>

            <HubCard as="section" className="p-4 sm:p-5">
              <div className="relative min-h-[36rem] overflow-hidden rounded-[1.5rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,rgba(10,25,14,0.96),rgba(4,12,6,0.98))]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.015)_30%,rgba(255,255,255,0)_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,transparent_25%,transparent_75%,rgba(255,255,255,0.02)_100%)]" />

                <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <rect x="16" y="4" width="68" height="20" rx="2" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" />
                  {Array.from({ length: 6 }, (_, index) => (
                    <line
                      key={`net-h-${index}`}
                      x1="16"
                      x2="84"
                      y1={6 + index * 3}
                      y2={6 + index * 3}
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="0.5"
                    />
                  ))}
                  {Array.from({ length: 8 }, (_, index) => (
                    <line
                      key={`net-v-${index}`}
                      y1="4"
                      y2="24"
                      x1={18 + index * 8}
                      x2={18 + index * 8}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="0.5"
                    />
                  ))}
                  <line x1="16" x2="84" y1="24" y2="24" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
                </svg>

                <div className="absolute left-1/2 top-[2.5%] h-[20%] w-[68%] -translate-x-1/2 rounded-t-3xl border-x-[4px] border-t-[4px] border-white/95">
                  <div className="absolute inset-x-0 bottom-0 h-[4px] bg-white/95" />
                </div>

                <div className="pointer-events-none absolute left-1/2 top-[19%] -translate-x-1/2">
                  <div
                    className="relative h-16 w-16 transition-all duration-500 ease-out"
                    style={{
                      transform: `translateX(calc(${keeperX - 50}%)) translateY(${keeperY - GOALIE_Y}%)`,
                    }}
                  >
                    <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-[#f5e8c8] shadow-[0_0_0_3px_rgba(0,0,0,0.28)]" />
                    <div className="absolute left-1/2 top-4 h-8 w-10 -translate-x-1/2 rounded-xl bg-[#0f172a] shadow-[0_10px_20px_rgba(0,0,0,0.22)]" />
                    <div className="absolute left-[16%] top-8 h-2 w-8 rounded-full bg-[#f5e8c8]" />
                    <div className="absolute right-[16%] top-8 h-2 w-8 rounded-full bg-[#f5e8c8]" />
                    <div className="absolute left-[24%] top-10 h-8 w-2 -rotate-12 rounded-full bg-[#f5e8c8]" />
                    <div className="absolute right-[24%] top-10 h-8 w-2 rotate-12 rounded-full bg-[#f5e8c8]" />
                  </div>
                </div>

                <div
                  className={`absolute left-1/2 top-[74%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[#f5d060] bg-[radial-gradient(circle_at_35%_35%,#fff6d8, #d4af37_60%, #8a6513_100%)] shadow-[0_0_30px_rgba(212,175,55,0.24)] transition-all duration-500 ease-out ${
                    game.locked ? 'scale-110' : 'scale-100'
                  }`}
                  style={{
                    left: `${ballX}%`,
                    top: `${ballY}%`,
                  }}
                />

                {game.phase === 'playing' && !game.locked && hoveredZone ? (
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line
                      x1={BALL_START.x}
                      y1={BALL_START.y}
                      x2={hoverX}
                      y2={hoverY}
                      stroke="rgba(245,208,96,0.9)"
                      strokeDasharray="2 2"
                      strokeWidth="0.7"
                    />
                    <circle cx={hoverX} cy={hoverY} r="1.6" fill="rgba(245,208,96,0.95)" />
                  </svg>
                ) : null}

                <div
                  className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-4 pt-20"
                  onPointerLeave={() => {
                    if (!game.locked) {
                      setGame((previous) => ({ ...previous, hoveredZone: null }));
                    }
                  }}
                >
                  {ZONES.map((zone) => {
                    const active = game.hoveredZone === zone.id;

                    return (
                      <button
                        key={zone.id}
                        type="button"
                        disabled={game.phase !== 'playing' || game.locked}
                        onPointerEnter={() => {
                          if (game.phase === 'playing' && !game.locked) {
                            setGame((previous) => ({ ...previous, hoveredZone: zone.id }));
                          }
                        }}
                        onFocus={() => {
                          if (game.phase === 'playing' && !game.locked) {
                            setGame((previous) => ({ ...previous, hoveredZone: zone.id }));
                          }
                        }}
                        onClick={() => handleShoot(zone.id)}
                        className={`relative rounded-3xl border transition-all ${
                          active
                            ? 'border-[#f5d060]/60 bg-[#f5d060]/10 shadow-[0_0_26px_rgba(245,208,96,0.14)]'
                            : 'border-[#1a1a2e]/30 bg-transparent hover:border-[#f5d060]/30 hover:bg-white/[0.02]'
                        } ${game.phase !== 'playing' || game.locked ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#d6d6d6]">
                          {zone.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {game.shotResult !== null ? (
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-4xl font-black uppercase tracking-[0.22em] sm:text-5xl ${
                      game.shotResult === 'goal' ? 'text-[#30d158]' : 'text-red-300'
                    }`}
                  >
                    {game.shotResult === 'goal' ? 'GOAL!' : 'SAVED!'}
                  </div>
                ) : null}
              </div>
            </HubCard>
          </div>
        </HubCard>
      </div>

      <ChallengeModal
        gameType="penalty"
        playerScore={game.goals}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />

      <style jsx global>{`
        @keyframes penalty-confetti {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(280px) rotate(580deg);
          }
        }
      `}</style>
    </section>
  );
}
