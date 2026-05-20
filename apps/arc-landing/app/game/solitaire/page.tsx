'use client';

import Link from 'next/link';
import type { DragEvent, MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

type Card = {
  id: string;
  suit: Suit;
  rank: number;
  faceUp: boolean;
};

type Selection =
  | {
      kind: 'tableau';
      pileIndex: number;
      cardIndex: number;
    }
  | {
      kind: 'waste';
    }
  | null;

type SolitaireStatus = 'playing' | 'won';

type SolitaireState = {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundations: Card[][];
  moves: number;
  elapsed: number;
  status: SolitaireStatus;
};

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const FOUNDATION_ORDER: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const TOTAL_CARDS = 52;
const CARD_WIDTH_CLASS = 'w-16 sm:w-20';
const CARD_HEIGHT_CLASS = 'h-24 sm:h-28';
const TABLEAU_STACK_GAP = 58;

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_NAMES: Record<Suit, string> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

const SUIT_CLASSES: Record<Suit, string> = {
  spades: 'text-[#111827]',
  clubs: 'text-[#111827]',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
};

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
};

function getRankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

function rankDisplay(rank: number): string {
  return getRankLabel(rank);
}

function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

function createCard(suit: Suit, rank: number, index: number): Card {
  return {
    id: `${suit}-${rank}-${index}`,
    suit,
    rank,
    faceUp: false,
  };
}

function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildDeck(): Card[] {
  const cards: Card[] = [];
  let index = 0;

  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank += 1) {
      cards.push(createCard(suit, rank, index));
      index += 1;
    }
  }

  return shuffleCards(cards);
}

function cloneCard(card: Card): Card {
  return { ...card };
}

function createInitialGame(): SolitaireState {
  const deck = buildDeck();
  const tableau: Card[][] = [];
  let cursor = 0;

  for (let pileIndex = 0; pileIndex < 7; pileIndex += 1) {
    const pile = deck.slice(cursor, cursor + pileIndex + 1).map(cloneCard);
    pile.forEach((card, cardIndex) => {
      card.faceUp = cardIndex === pile.length - 1;
    });
    tableau.push(pile);
    cursor += pileIndex + 1;
  }

  const stock = deck.slice(cursor).map(cloneCard);

  return {
    stock,
    waste: [],
    tableau,
    foundations: [[], [], [], []],
    moves: 0,
    elapsed: 0,
    status: 'playing',
  };
}

function canPlaceOnTableau(card: Card, target?: Card): boolean {
  if (!target) {
    return card.rank === 13;
  }

  return card.rank + 1 === target.rank && isRedSuit(card.suit) !== isRedSuit(target.suit);
}

function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  const top = foundation[foundation.length - 1];

  if (!top) {
    return card.rank === 1;
  }

  return top.suit === card.suit && card.rank === top.rank + 1;
}

function isValidDescendingStack(stack: Card[]): boolean {
  if (stack.length <= 1) {
    return true;
  }

  for (let index = 0; index < stack.length - 1; index += 1) {
    const current = stack[index];
    const next = stack[index + 1];

    if (!current.faceUp || !next.faceUp) {
      return false;
    }

    if (current.rank !== next.rank + 1) {
      return false;
    }

    if (isRedSuit(current.suit) === isRedSuit(next.suit)) {
      return false;
    }
  }

  return true;
}

function getTableauStack(pile: Card[], cardIndex: number): Card[] | null {
  if (cardIndex < 0 || cardIndex >= pile.length) {
    return null;
  }

  const stack = pile.slice(cardIndex);
  if (stack.length === 0 || !stack[0].faceUp) {
    return null;
  }

  return isValidDescendingStack(stack) ? stack : null;
}

function flipTopCardIfNeeded(pile: Card[]): Card[] {
  if (pile.length === 0) {
    return pile;
  }

  const nextPile = pile.map(cloneCard);
  const top = nextPile[nextPile.length - 1];
  if (!top.faceUp) {
    top.faceUp = true;
  }

  return nextPile;
}

function finalizeMove(state: SolitaireState): SolitaireState {
  const foundationCount = state.foundations.reduce((count, pile) => count + pile.length, 0);

  return {
    ...state,
    moves: state.moves + 1,
    status: foundationCount === TOTAL_CARDS ? 'won' : state.status,
  };
}

function moveWasteToTableau(state: SolitaireState, pileIndex: number): SolitaireState | null {
  const card = state.waste[state.waste.length - 1];
  if (!card) {
    return null;
  }

  const targetPile = state.tableau[pileIndex];
  const targetCard = targetPile[targetPile.length - 1];
  if (!canPlaceOnTableau(card, targetCard)) {
    return null;
  }

  const waste = state.waste.slice(0, -1);
  const tableau = state.tableau.map((pile, index) =>
    index === pileIndex ? [...pile.map(cloneCard), { ...card, faceUp: true }] : pile.map(cloneCard),
  );

  return finalizeMove({
    ...state,
    waste,
    tableau,
  });
}

function moveWasteToFoundation(state: SolitaireState, foundationIndex: number): SolitaireState | null {
  const card = state.waste[state.waste.length - 1];
  if (!card) {
    return null;
  }

  const foundation = state.foundations[foundationIndex];
  if (!canPlaceOnFoundation(card, foundation)) {
    return null;
  }

  const waste = state.waste.slice(0, -1);
  const foundations = state.foundations.map((pile, index) =>
    index === foundationIndex ? [...pile.map(cloneCard), { ...card, faceUp: true }] : pile.map(cloneCard),
  );

  return finalizeMove({
    ...state,
    waste,
    foundations,
  });
}

function moveTableauToTableau(state: SolitaireState, sourcePileIndex: number, cardIndex: number, targetPileIndex: number): SolitaireState | null {
  if (sourcePileIndex === targetPileIndex) {
    return null;
  }

  const sourcePile = state.tableau[sourcePileIndex];
  const stack = getTableauStack(sourcePile, cardIndex);
  if (!stack) {
    return null;
  }

  const targetPile = state.tableau[targetPileIndex];
  const targetCard = targetPile[targetPile.length - 1];
  if (!canPlaceOnTableau(stack[0], targetCard)) {
    return null;
  }

  const sourceNextPile = flipTopCardIfNeeded(sourcePile.slice(0, cardIndex));
  const targetNextPile = [...targetPile.map(cloneCard), ...stack.map((card) => ({ ...card, faceUp: true }))];
  const tableau = state.tableau.map((pile, index) => {
    if (index === sourcePileIndex) {
      return sourceNextPile;
    }

    if (index === targetPileIndex) {
      return targetNextPile;
    }

    return pile.map(cloneCard);
  });

  return finalizeMove({
    ...state,
    tableau,
  });
}

function moveTableauToFoundation(state: SolitaireState, sourcePileIndex: number, cardIndex: number, foundationIndex: number): SolitaireState | null {
  const sourcePile = state.tableau[sourcePileIndex];
  const stack = getTableauStack(sourcePile, cardIndex);
  if (!stack || stack.length !== 1) {
    return null;
  }

  const card = stack[0];
  const foundation = state.foundations[foundationIndex];
  if (!canPlaceOnFoundation(card, foundation)) {
    return null;
  }

  const sourceNextPile = flipTopCardIfNeeded(sourcePile.slice(0, cardIndex));
  const foundations = state.foundations.map((pile, index) => {
    if (index === foundationIndex) {
      return [...pile.map(cloneCard), { ...card, faceUp: true }];
    }

    return pile.map(cloneCard);
  });

  const tableau = state.tableau.map((pile, index) => (index === sourcePileIndex ? sourceNextPile : pile.map(cloneCard)));

  return finalizeMove({
    ...state,
    tableau,
    foundations,
  });
}

function recycleWasteToStock(state: SolitaireState): SolitaireState | null {
  if (state.stock.length > 0 || state.waste.length === 0) {
    return null;
  }

  const stock = state.waste
    .slice()
    .reverse()
    .map((card) => ({
      ...card,
      faceUp: false,
    }));

  return finalizeMove({
    ...state,
    stock,
    waste: [],
  });
}

function drawFromStock(state: SolitaireState): SolitaireState | null {
  if (state.stock.length === 0) {
    return recycleWasteToStock(state);
  }

  const stock = state.stock.slice(0, -1).map(cloneCard);
  const card = cloneCard(state.stock[state.stock.length - 1]);
  card.faceUp = true;

  return finalizeMove({
    ...state,
    stock,
    waste: [...state.waste.map(cloneCard), card],
  });
}

function moveWasteToFoundationBySuit(state: SolitaireState): SolitaireState | null {
  const card = state.waste[state.waste.length - 1];
  if (!card) {
    return null;
  }

  const foundationIndex = FOUNDATION_ORDER.findIndex((suit) => suit === card.suit);
  if (foundationIndex === -1) {
    return null;
  }

  return moveWasteToFoundation(state, foundationIndex);
}

function moveTableauCardToFoundationBySuit(state: SolitaireState, pileIndex: number, cardIndex: number): SolitaireState | null {
  const sourcePile = state.tableau[pileIndex];
  const stack = getTableauStack(sourcePile, cardIndex);
  if (!stack || stack.length !== 1) {
    return null;
  }

  const card = stack[0];
  const foundationIndex = FOUNDATION_ORDER.findIndex((suit) => suit === card.suit);
  if (foundationIndex === -1) {
    return null;
  }

  return moveTableauToFoundation(state, pileIndex, cardIndex, foundationIndex);
}

function cardToLabel(card: Card): string {
  return `${rankDisplay(card.rank)}${SUIT_SYMBOLS[card.suit]}`;
}

function getFoundationLabel(index: number): string {
  const suit = FOUNDATION_ORDER[index];
  return `${SUIT_SYMBOLS[suit]} ${SUIT_NAMES[suit]}`;
}

function getStackDragData(selection: Selection): string {
  return JSON.stringify(selection);
}

function parseSelectionData(value: string): Selection | null {
  try {
    const parsed = JSON.parse(value) as Selection;
    if (!parsed) {
      return null;
    }

    if (parsed.kind === 'waste') {
      return parsed;
    }

    if (parsed.kind === 'tableau' && Number.isInteger(parsed.pileIndex) && Number.isInteger(parsed.cardIndex)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function findFoundationForCard(card: Card): number {
  return FOUNDATION_ORDER.findIndex((suit) => suit === card.suit);
}

function getCardColorClass(card: Card): string {
  return SUIT_CLASSES[card.suit];
}

function CardFace({
  card,
  className = '',
  selected = false,
  draggable = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
}: {
  card: Card;
  className?: string;
  selected?: boolean;
  draggable?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
}) {
  const suitColor = getCardColorClass(card);

  return (
    <button
      type="button"
      draggable={draggable}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative flex flex-col justify-between rounded-2xl border bg-[#f8f1e4] p-2 text-left shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-all ${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS} ${
        selected ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40' : 'border-[#d8cfbd] hover:-translate-y-0.5'
      } ${className}`.trim()}
      aria-label={`${cardToLabel(card)} of ${SUIT_NAMES[card.suit]}`}
    >
      <div className={`text-sm font-black leading-none ${suitColor}`}>{getRankLabel(card.rank)}</div>
      <div className={`text-center text-3xl font-black leading-none ${suitColor}`}>{SUIT_SYMBOLS[card.suit]}</div>
      <div className={`text-right text-sm font-black leading-none ${suitColor}`}>{getRankLabel(card.rank)}</div>
    </button>
  );
}

function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(9,9,15,0.98),rgba(24,24,48,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS} ${className}`.trim()}
      style={{
        backgroundImage:
          'linear-gradient(135deg,rgba(212,175,55,0.22) 25%,transparent 25%,transparent 50%,rgba(212,175,55,0.22) 50%,rgba(212,175,55,0.22) 75%,transparent 75%,transparent)',
        backgroundSize: '18px 18px',
      }}
    >
      <div className="absolute inset-0 rounded-2xl border border-white/5" />
    </div>
  );
}

export default function SolitairePage() {
  const [game, setGame] = useState<SolitaireState>(() => createInitialGame());
  const [selectedSource, setSelectedSource] = useState<Selection>(null);
  const [dragSource, setDragSource] = useState<Selection>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);

  useEffect(() => {
    if (game.status !== 'playing') {
      return;
    }

    const timerId = window.setInterval(() => {
      setGame((previous) => (previous.status === 'playing' ? { ...previous, elapsed: previous.elapsed + 1 } : previous));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [game.status]);

  const foundationCards = game.foundations.reduce((count, pile) => count + pile.length, 0);
  const score = foundationCards * 10;
  const timeLabel = `${Math.floor(game.elapsed / 60)}:${String(game.elapsed % 60).padStart(2, '0')}`;
  const movesLabel = String(game.moves);

  const confettiPieces = useMemo(
    () =>
      game.status === 'won'
        ? Array.from({ length: 36 }, (_, index) => ({
            left: `${(index * 7) % 100}%`,
            top: `${(index * 5) % 35}%`,
            delay: `${(index % 10) * 0.07}s`,
            duration: `${2.2 + (index % 4) * 0.2}s`,
            size: `${6 + (index % 4)}px`,
            color: ['#d4af37', '#f5d060', '#30d158', '#ffffff'][index % 4],
          }))
        : [],
    [game.status],
  );

  const resetGame = () => {
    setGame(createInitialGame());
    setSelectedSource(null);
    setDragSource(null);
    setChallengeOpen(false);
  };

  const updateGame = (updater: (state: SolitaireState) => SolitaireState | null) => {
    setGame((previous) => {
      const next = updater(previous);
      if (!next) {
        return previous;
      }

      return next;
    });
    setSelectedSource(null);
    setDragSource(null);
  };

  const handleStockClick = () => {
    updateGame((state) => drawFromStock(state));
  };

  const handleTableauSelection = (pileIndex: number, cardIndex: number) => {
    const card = game.tableau[pileIndex][cardIndex];
    if (!card?.faceUp) {
      return;
    }

    if (selectedSource?.kind === 'tableau' && selectedSource.pileIndex === pileIndex && selectedSource.cardIndex === cardIndex) {
      setSelectedSource(null);
      return;
    }

    setSelectedSource({ kind: 'tableau', pileIndex, cardIndex });
  };

  const handleWasteSelection = () => {
    if (game.waste.length === 0) {
      return;
    }

    if (selectedSource?.kind === 'waste') {
      setSelectedSource(null);
      return;
    }

    setSelectedSource({ kind: 'waste' });
  };

  const handleTableauDrop = (pileIndex: number) => {
    const source = dragSource ?? selectedSource;
    if (!source) {
      return;
    }

    if (source.kind === 'waste') {
      updateGame((state) => moveWasteToTableau(state, pileIndex));
      return;
    }

    updateGame((state) => moveTableauToTableau(state, source.pileIndex, source.cardIndex, pileIndex));
  };

  const handleFoundationDrop = (foundationIndex: number) => {
    const source = dragSource ?? selectedSource;
    if (!source) {
      return;
    }

    if (source.kind === 'waste') {
      updateGame((state) => moveWasteToFoundation(state, foundationIndex));
      return;
    }

    updateGame((state) => moveTableauToFoundation(state, source.pileIndex, source.cardIndex, foundationIndex));
  };

  const handleAutoMove = (source: Selection) => {
    if (!source) {
      return;
    }

    if (source.kind === 'waste') {
      updateGame((state) => moveWasteToFoundationBySuit(state));
      return;
    }

    updateGame((state) => moveTableauCardToFoundationBySuit(state, source.pileIndex, source.cardIndex));
  };

  const renderSelectionHint = () => {
    if (!selectedSource) {
      return 'Click a face-up card, then click a destination pile or foundation.';
    }

    if (selectedSource.kind === 'waste') {
      return 'Waste card selected. Drop it on a tableau column or foundation.';
    }

    const card = game.tableau[selectedSource.pileIndex]?.[selectedSource.cardIndex];
    return card ? `Selected ${cardToLabel(card)} from tableau ${selectedSource.pileIndex + 1}.` : 'Card selected.';
  };

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Solitaire</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a9a]">Klondike</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">52-card deck</HubBadge>
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Solitaire</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              Move stacks in descending alternating colors, build the four foundations, and beat the board in fewer moves.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="solitaire" playerScore={game.status === 'won' ? game.moves : undefined} />

        <HubCard as="section" className="relative overflow-hidden p-5 sm:p-6 lg:p-8">
          {game.status === 'won' ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confettiPieces.map((piece, index) => (
                <span
                  key={`${piece.left}-${index}`}
                  className="absolute rounded-sm opacity-0 [animation:solitaire-confetti_2.8s_linear_infinite]"
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
                  game.status === 'won'
                    ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                }
              >
                {game.status === 'won' ? 'Victory' : 'Playing'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {game.status === 'won' ? 'YOU WIN!' : 'Build the foundations.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {game.status === 'won'
                  ? 'All 52 cards are in the foundations. Launch a challenge and try to beat the move count.'
                  : renderSelectionHint()}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Moves</div>
                <div className="mt-1 text-2xl font-black text-white">{movesLabel}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Timer</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{timeLabel}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{score}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <HubCard as="aside" className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Actions</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                  >
                    New Game
                  </button>
                  {game.status === 'won' ? (
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    >
                      Challenge a Friend
                    </button>
                  ) : null}
                </div>
              </HubCard>

              <HubCard as="aside" className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Rules</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#8a8a9a]">
                  <p>Move cards in descending order and alternate colors.</p>
                  <p>Only kings can start an empty tableau column.</p>
                  <p>Build each foundation from Ace to King in the same suit.</p>
                  <p>Double-click a face-up card to auto-move it to the matching foundation if possible.</p>
                </div>
              </HubCard>

              {game.status === 'won' ? (
                <HubCard as="aside" className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Challenge Score</p>
                  <div className="mt-3 text-3xl font-black text-[#f5d060]">{movesLabel} moves</div>
                  <div className="mt-2 text-sm leading-7 text-[#8a8a9a]">
                    Lower move counts are better for challenge runs.
                  </div>
                </HubCard>
              ) : null}
            </div>

            <HubCard as="section" className="p-4 sm:p-5">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <button
                    type="button"
                    onClick={handleStockClick}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const data = event.dataTransfer.getData('text/plain');
                      if (data) {
                        const parsed = parseSelectionData(data);
                        if (parsed) {
                          setDragSource(parsed);
                        }
                      }
                      handleStockClick();
                    }}
                    className="group flex flex-col items-start gap-3 rounded-3xl border border-[#1a1a2e] bg-black/30 p-4 text-left transition-all hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Stock</div>
                    <div className="relative">
                      {game.stock.length > 0 ? (
                        <div className="relative h-28 w-20">
                          {Array.from({ length: Math.min(3, game.stock.length) }, (_, index) => (
                            <div
                              key={index}
                              className={`absolute inset-0 rounded-2xl border border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(9,9,15,0.98),rgba(24,24,48,0.98))] ${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS}`}
                              style={{
                                transform: `translate(${index * 2}px, ${index * 2}px)`,
                                backgroundImage:
                                  'linear-gradient(135deg,rgba(212,175,55,0.22) 25%,transparent 25%,transparent 50%,rgba(212,175,55,0.22) 50%,rgba(212,175,55,0.22) 75%,transparent 75%,transparent)',
                                backgroundSize: '18px 18px',
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid h-28 w-20 place-items-center rounded-2xl border border-dashed border-[#1a1a2e] text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                          Empty
                        </div>
                      )}
                    </div>
                  </button>

                  <div
                    className="flex flex-col items-start gap-3 rounded-3xl border border-[#1a1a2e] bg-black/30 p-4 text-left transition-all hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    onClick={handleWasteSelection}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const data = event.dataTransfer.getData('text/plain');
                      if (data) {
                        const parsed = parseSelectionData(data);
                        if (parsed) {
                          setDragSource(parsed);
                        }
                      }
                      handleWasteSelection();
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Waste</div>
                    <div className="relative h-28 w-20">
                      {game.waste.length > 0 ? (
                        (() => {
                          const topCard = game.waste[game.waste.length - 1];
                          const selected = selectedSource?.kind === 'waste';
                          return (
                            <CardFace
                              card={topCard}
                              selected={selected}
                              draggable
                              onClick={(event) => {
                                event.stopPropagation();
                                handleWasteSelection();
                              }}
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                handleAutoMove({ kind: 'waste' });
                              }}
                              onDragStart={(event) => {
                                setDragSource({ kind: 'waste' });
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', getStackDragData({ kind: 'waste' }));
                              }}
                              onDragEnd={() => setDragSource(null)}
                              className="absolute inset-0"
                            />
                          );
                        })()
                      ) : (
                        <div className="grid h-28 w-20 place-items-center rounded-2xl border border-dashed border-[#1a1a2e] text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>

                  {game.foundations.map((foundation, index) => {
                    const topCard = foundation[foundation.length - 1];

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleFoundationDrop(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const data = event.dataTransfer.getData('text/plain');
                          if (data) {
                            const parsed = parseSelectionData(data);
                            if (parsed) {
                              setDragSource(parsed);
                            }
                          }
                          handleFoundationDrop(index);
                        }}
                        className="flex flex-col items-start gap-3 rounded-3xl border border-[#1a1a2e] bg-black/30 p-4 text-left transition-all hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                      >
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Foundation {index + 1}</div>
                        <div className="relative h-28 w-20">
                          {topCard ? (
                            <CardFace
                              card={topCard}
                              className="absolute inset-0"
                              onClick={(event) => event.stopPropagation()}
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                handleAutoMove({ kind: 'waste' });
                              }}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', getStackDragData({ kind: 'waste' }));
                              }}
                            />
                          ) : (
                            <div className="grid h-28 w-20 place-items-center rounded-2xl border border-dashed border-[#d4af37]/30 bg-white/[0.02] text-3xl text-[#d4af37]/40">
                              {SUIT_SYMBOLS[FOUNDATION_ORDER[index]]}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="overflow-x-auto rounded-[1.5rem] border border-[#1a1a2e] bg-black/30 p-3">
                  <div className="min-w-[860px]">
                    <div className="grid gap-3 lg:grid-cols-7">
                      {game.tableau.map((pile, pileIndex) => (
                        <div
                          key={pileIndex}
                          className="rounded-3xl border border-[#1a1a2e] bg-black/25 p-3 transition-all hover:border-[#d4af37]/20"
                          onClick={() => handleTableauDrop(pileIndex)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const data = event.dataTransfer.getData('text/plain');
                            if (data) {
                              const parsed = parseSelectionData(data);
                              if (parsed) {
                                setDragSource(parsed);
                              }
                            }
                            handleTableauDrop(pileIndex);
                          }}
                        >
                          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                            Tableau {pileIndex + 1}
                          </div>

                          <div className="relative min-h-[31rem]">
                            {pile.length === 0 ? (
                              <div className="grid h-28 w-20 place-items-center rounded-2xl border border-dashed border-[#d4af37]/30 bg-white/[0.02] text-[10px] uppercase tracking-[0.24em] text-[#8a8a8a]">
                                Empty
                              </div>
                            ) : null}

                            {pile.map((card, cardIndex) => {
                              const isTop = cardIndex === pile.length - 1;
                              const selected =
                                selectedSource?.kind === 'tableau' &&
                                selectedSource.pileIndex === pileIndex &&
                                cardIndex >= selectedSource.cardIndex;
                              const isSelectedAnchor =
                                selectedSource?.kind === 'tableau' &&
                                selectedSource.pileIndex === pileIndex &&
                                selectedSource.cardIndex === cardIndex;

                              return card.faceUp ? (
                                <div
                                  key={card.id}
                                  style={{ marginTop: cardIndex === 0 ? 0 : -TABLEAU_STACK_GAP }}
                                  className="relative"
                                >
                                  <CardFace
                                    card={card}
                                    selected={isSelectedAnchor || selected}
                                    draggable={isTop || selected}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleTableauSelection(pileIndex, cardIndex);
                                    }}
                                    onDoubleClick={(event) => {
                                      event.stopPropagation();
                                      handleAutoMove({ kind: 'tableau', pileIndex, cardIndex });
                                    }}
                                    onDragStart={(event) => {
                                      setDragSource({ kind: 'tableau', pileIndex, cardIndex });
                                      event.dataTransfer.effectAllowed = 'move';
                                      event.dataTransfer.setData(
                                        'text/plain',
                                        getStackDragData({ kind: 'tableau', pileIndex, cardIndex }),
                                      );
                                    }}
                                    onDragEnd={() => setDragSource(null)}
                                    className={isTop ? '' : 'cursor-grab'}
                                  />
                                </div>
                              ) : (
                                <div
                                  key={card.id}
                                  style={{ marginTop: cardIndex === 0 ? 0 : -44 }}
                                  className="relative"
                                >
                                  <button
                                    type="button"
                                    className="relative"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                    }}
                                    draggable={false}
                                  >
                                    <CardBack />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </HubCard>
          </div>
        </HubCard>
      </div>

      <ChallengeModal
        gameType="solitaire"
        playerScore={game.moves}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />

      <style jsx global>{`
        @keyframes solitaire-confetti {
          0% {
            opacity: 0;
            transform: translateY(-20px) rotate(0deg);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(280px) rotate(560deg);
          }
        }
      `}</style>
    </section>
  );
}
