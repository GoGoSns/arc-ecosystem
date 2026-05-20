'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { HubBadge, HubCard } from '@/components/HubPrimitives';
import {
  formatChallengeAmount,
  formatChallengeScore,
  getChallengeGameTitle,
  getChallengeMetric,
  truncateAddress,
  type GameChallenge,
  useChallengeStore,
} from '@/lib/challengeStore';

type GameCard = {
  mark: string;
  title: string;
  description: string;
  href: string;
};

const liveGames: GameCard[] = [
  {
    mark: 'MS',
    title: 'Mayın Tarlas',
    description: 'Classic Minesweeper with safe first clicks, flags, timer pressure, and clean difficulty modes.',
    href: '/game/minesweeper',
  },
  {
    mark: 'AQ',
    title: 'Arc Quiz',
    description: 'Five fast Web3 questions, short rounds, and a perfect-score challenge path.',
    href: '/game/quiz',
  },
  {
    mark: 'SP',
    title: 'Solitaire',
    description: 'Klondike card stacks, foundation runs, and a challenge score built around fewer moves.',
    href: '/game/solitaire',
  },
  {
    mark: 'BB',
    title: 'Bil Bakalım',
    description: 'Hangman-style guessing with 30 Web3 words, streak chasing, and challenge support.',
    href: '/game/bilbakalim',
  },
  {
    mark: 'WC',
    title: 'Word Connect',
    description: 'Scramble the tiles, build valid words, and clear every slot on the level board.',
    href: '/game/wordconnect',
  },
  {
    mark: 'RB',
    title: 'Red Ball',
    description: 'Three canvas levels with jumps, stars, enemies, and checkpoint-driven platforming.',
    href: '/game/redball',
  },
  {
    mark: 'BM',
    title: 'Bomberman',
    description: 'Lay bombs, blast bricks, chain power-ups, and clear three explosive levels.',
    href: '/game/bomberman',
  },
  {
    mark: 'FN',
    title: 'Fruit Ninja',
    description: 'Slice fruits, dodge bombs, and chain big combos before the timer runs out.',
    href: '/game/fruitninja',
  },
  {
    mark: 'BS',
    title: 'Bubble Shooter',
    description: 'Aim, match, and clear the board in color bursts.',
    href: '/game/bubble',
  },
  {
    mark: 'CC',
    title: 'Candy Crush',
    description: 'Swap, match, and trigger chunky chain reactions.',
    href: '/game/candycrush',
  },
];

function LiveGameCard({ mark, title, description, href }: GameCard) {
  return (
    <HubCard as="article" className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 text-lg font-black tracking-[0.2em] text-[#f5d060] shadow-[0_0_20px_rgba(212,175,55,0.12)]">
          {mark}
        </div>
        <HubBadge className="border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]">Live</HubBadge>
      </div>

      <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#8a8a9a]">{description}</p>

      <div className="mt-6">
        <Link
          href={href}
          className="primary-button w-fit focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Play &rarr;
        </Link>
      </div>
    </HubCard>
  );
}

function ActiveChallengeCard({ challenge }: { challenge: GameChallenge }) {
  const metric = getChallengeMetric(challenge.gameType);
  const gameTitle = getChallengeGameTitle(challenge.gameType);

  return (
    <HubCard as="article" className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Open Challenge</HubBadge>
          <h3 className="mt-4 text-2xl font-black uppercase leading-tight text-white">Someone challenged you!</h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#8a8a8a]">
            Beat their {metric.label} of{' '}
            <span className="font-black text-[#f5d060]">
              {formatChallengeScore(challenge.gameType, challenge.targetScore)}
            </span>{' '}
            to win <span className="font-black text-[#f5d060]">{formatChallengeAmount(challenge.usdcAmount)}</span>.
          </p>
        </div>

        <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">{gameTitle}</HubBadge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">From</div>
          <div className="mt-1 text-lg font-black text-white">
            {challenge.creatorName
              ? `${challenge.creatorName} · ${truncateAddress(challenge.creatorAddress)}`
              : truncateAddress(challenge.creatorAddress)}
          </div>
        </div>
        <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Window</div>
          <div className="mt-1 text-lg font-black text-[#f5d060]">24h</div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href={`/game/${challenge.gameType}?challenge=${challenge.id}`}
          className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Play Challenge &rarr;
        </Link>
      </div>
    </HubCard>
  );
}

export default function GameHubPage() {
  const challenges = useChallengeStore((state) => state.challenges);
  const openChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'open' && challenge.expiresAt > Date.now()),
    [challenges],
  );

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-2">
          <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Arc Game Hub</HubBadge>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
            {liveGames.length} live games
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Choose a game.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Jump into a live game, pick up an active challenge, or start a fresh run from the hub.
            </p>
          </div>

          <Link
            href="/"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase tracking-[0.24em] text-[#f5d060]">Active Challenges</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
              {openChallenges.length} open
            </span>
          </div>

          {openChallenges.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {openChallenges.map((challenge) => (
                <ActiveChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <HubCard className="mt-4 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">No Active Challenges</HubBadge>
                  <h3 className="mt-4 text-2xl font-black uppercase text-white">Challenge cards will show up here.</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                    Finish a run in any live game to create a challenge, then return here to see it in the hub.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3 text-right">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Queue</div>
                  <div className="mt-1 text-2xl font-black text-[#f5d060]">0</div>
                </div>
              </div>
            </HubCard>
          )}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {liveGames.map((game) => (
            <LiveGameCard key={game.href} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}
