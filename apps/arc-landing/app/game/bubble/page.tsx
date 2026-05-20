'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Mode = 'menu' | 'playing' | 'result';
type ResultKind = 'levelClear' | 'win' | 'lose';

type BubbleColorKey = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'cyan';

type BubbleCell = {
  id: number;
  row: number;
  col: number;
  color: BubbleColorKey;
};

type ProjectileBubble = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColorKey;
};

type EffectBubble = {
  id: number;
  kind: 'pop' | 'fall';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColorKey;
  createdAt: number;
};

type ResultState = {
  kind: ResultKind;
  heading: string;
  message: string;
  score: number;
  bubblesCleared: number;
  levelReached: number;
} | null;

type PatternConfig = {
  rows: string[];
  allowedColors: BubbleColorKey[];
};

type Point = {
  x: number;
  y: number;
};

type CellRef = {
  row: number;
  col: number;
};

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const COLS = 8;
const BOARD_ROWS = 12;
const TOP_OFFSET = 52;
const ROW_STEP = 36;
const COL_STEP = 42;
const BUBBLE_RADIUS = 19;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const BOARD_LEFT = 40;
const LAUNCHER_X = CANVAS_WIDTH / 2;
const LAUNCHER_Y = 556;
const LOSS_LINE_Y = 540;
const PROJECTILE_SPEED = 8;
const EFFECT_DURATION = 300;

const COLOR_META: Record<
  BubbleColorKey,
  { fill: string; glow: string; label: string }
> = {
  red: { fill: '#ef4444', glow: '#ff8a8a', label: 'R' },
  blue: { fill: '#3b82f6', glow: '#8bb8ff', label: 'B' },
  green: { fill: '#22c55e', glow: '#8af0ac', label: 'G' },
  yellow: { fill: '#eab308', glow: '#ffe38a', label: 'Y' },
  purple: { fill: '#a855f7', glow: '#e3b0ff', label: 'P' },
  cyan: { fill: '#06b6d4', glow: '#8ff1ff', label: 'C' },
};

const PATTERNS: PatternConfig[] = [
  {
    allowedColors: ['red', 'blue', 'green', 'yellow'],
    rows: [
      'RBGYRBGY',
      'GBYRGBYR',
      'RBGY....',
      '.GBYRBGY',
      'RBGYRBGY',
      'GBYRGBYR',
    ],
  },
  {
    allowedColors: ['red', 'blue', 'green', 'yellow', 'purple'],
    rows: [
      'RBGYPBGY',
      'GBYRPGBY',
      'PBGYRPGY',
      'YRPBGYRP',
      'GBYRPGBY',
      '.PBGYRPG',
    ],
  },
  {
    allowedColors: ['red', 'blue', 'green', 'yellow', 'purple'],
    rows: [
      'RBGYPBGY',
      'PGBYRPGB',
      'GBYRPBGY',
      'YRPGBYRP',
      'PBGYRPGY',
      'GBYRPGBY',
    ],
  },
  {
    allowedColors: ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'],
    rows: [
      'RBGYPCGY',
      'PGBYRPCG',
      'GBYRPCGY',
      'YRPCGYRP',
      'PCGYRBGY',
      'GBYRPCGY',
    ],
  },
  {
    allowedColors: ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'],
    rows: [
      'RBCGYPBC',
      'GYRPCGYR',
      'BPCGYRPC',
      'YRPCGYRP',
      'CGYRPCGY',
      'RBCGYPBC',
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function boardKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function withinBoard(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < COLS;
}

function getCenter(row: number, col: number): Point {
  const x = BOARD_LEFT + col * COL_STEP + (row % 2 === 1 ? COL_STEP / 2 : 0);
  const y = TOP_OFFSET + row * ROW_STEP;
  return { x, y };
}

function getCellFromPoint(point: Point): CellRef {
  const guessedRow = clamp(Math.round((point.y - TOP_OFFSET) / ROW_STEP), 0, BOARD_ROWS - 1);
  const guessedCol = clamp(
    Math.round((point.x - BOARD_LEFT - (guessedRow % 2 === 1 ? COL_STEP / 2 : 0)) / COL_STEP),
    0,
    COLS - 1,
  );
  return { row: guessedRow, col: guessedCol };
}

function getNeighbors(row: number, col: number): CellRef[] {
  const odd = row % 2 === 1;
  const offsets = odd
    ? [
        [0, -1],
        [0, 1],
        [-1, 0],
        [-1, 1],
        [1, 0],
        [1, 1],
      ]
    : [
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 0],
        [1, -1],
        [1, 0],
      ];

  return offsets
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter((candidate) => withinBoard(candidate.row, candidate.col));
}

function createBoard(levelIndex: number): (BubbleCell | null)[][] {
  const pattern = PATTERNS[levelIndex];
  const board = Array.from({ length: BOARD_ROWS }, () => Array<BubbleCell | null>(COLS).fill(null));
  let id = 1;

  pattern.rows.forEach((rowText, row) => {
    rowText.split('').forEach((char, col) => {
      if (char === '.') {
        return;
      }

      const colorMap: Record<string, BubbleColorKey> = {
        R: 'red',
        B: 'blue',
        G: 'green',
        Y: 'yellow',
        P: 'purple',
        C: 'cyan',
      };
      const color = colorMap[char] ?? pattern.allowedColors[(row + col) % pattern.allowedColors.length];
      board[row][col] = { id: id++, row, col, color };
    });
  });

  return board;
}

function cloneBoard(board: (BubbleCell | null)[][]): (BubbleCell | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function getAllowedColors(levelIndex: number): BubbleColorKey[] {
  return PATTERNS[levelIndex].allowedColors;
}

function isBoardEmpty(board: (BubbleCell | null)[][]): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

function hasAnyBubbleReachedLossLine(board: (BubbleCell | null)[][]): boolean {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      if (!cell) {
        continue;
      }

      const { y } = getCenter(row, col);
      if (y + BUBBLE_RADIUS >= LOSS_LINE_Y) {
        return true;
      }
    }
  }

  return false;
}

function findNearestOpenCell(board: (BubbleCell | null)[][], startRow: number, startCol: number): CellRef {
  const queue: CellRef[] = [{ row: startRow, col: startCol }];
  const visited = new Set<string>([boardKey(startRow, startCol)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (withinBoard(current.row, current.col) && board[current.row][current.col] === null) {
      return current;
    }

    getNeighbors(current.row, current.col).forEach((neighbor) => {
      const key = boardKey(neighbor.row, neighbor.col);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    });
  }

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col] === null) {
        return { row, col };
      }
    }
  }

  return { row: startRow, col: startCol };
}

function findConnectedGroup(board: (BubbleCell | null)[][], row: number, col: number): CellRef[] {
  const start = board[row][col];
  if (!start) {
    return [];
  }

  const queue: CellRef[] = [{ row, col }];
  const visited = new Set<string>([boardKey(row, col)]);
  const matches: CellRef[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const cell = board[current.row][current.col];
    if (!cell || cell.color !== start.color) {
      continue;
    }

    matches.push(current);

    getNeighbors(current.row, current.col).forEach((neighbor) => {
      const key = boardKey(neighbor.row, neighbor.col);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    });
  }

  return matches;
}

function findFloatingCells(board: (BubbleCell | null)[][]): CellRef[] {
  const connected = new Set<string>();
  const queue: CellRef[] = [];

  for (let col = 0; col < COLS; col += 1) {
    if (board[0][col]) {
      queue.push({ row: 0, col });
      connected.add(boardKey(0, col));
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    getNeighbors(current.row, current.col).forEach((neighbor) => {
      const cell = board[neighbor.row][neighbor.col];
      const key = boardKey(neighbor.row, neighbor.col);
      if (cell && !connected.has(key)) {
        connected.add(key);
        queue.push(neighbor);
      }
    });
  }

  const floating: CellRef[] = [];
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col] && !connected.has(boardKey(row, col))) {
        floating.push({ row, col });
      }
    }
  }

  return floating;
}

function drawBubbleShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: BubbleColorKey,
  scale = 1,
  alpha = 1,
  labelOverride?: string,
) {
  const meta = COLOR_META[color];
  const radius = BUBBLE_RADIUS * scale;
  const gradient = ctx.createRadialGradient(x - radius * 0.28, y - radius * 0.28, radius * 0.3, x, y, radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.14, meta.glow);
  gradient.addColorStop(0.92, meta.fill);
  gradient.addColorStop(1, '#111827');

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = meta.glow;
  ctx.shadowBlur = 16 * scale;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.35, radius * 0.36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.arc(x + radius * 0.22, y + radius * 0.22, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.max(9, radius * 0.78)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelOverride ?? COLOR_META[color].label, x, y + 0.5);
  ctx.restore();
}

function drawAimLine(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 4) {
    return;
  }

  const segments = Math.max(8, Math.floor(length / 10));
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 208, 96, 0.82)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(245, 208, 96, 0.96)';
  ctx.beginPath();
  ctx.arc(to.x, to.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  void segments;
}

function drawLauncher(ctx: CanvasRenderingContext2D, currentColor: BubbleColorKey, nextColor: BubbleColorKey, aim: Point) {
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 208, 96, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(LAUNCHER_X - 28, LAUNCHER_Y + 18);
  ctx.lineTo(LAUNCHER_X + 28, LAUNCHER_Y + 18);
  ctx.stroke();

  const angle = Math.atan2(aim.y - LAUNCHER_Y, aim.x - LAUNCHER_X);
  ctx.translate(LAUNCHER_X, LAUNCHER_Y);
  ctx.rotate(clamp(angle, -Math.PI + 0.22, -0.22));
  ctx.fillStyle = 'rgba(245, 208, 96, 0.18)';
  ctx.fillRect(-6, -22, 12, 26);
  ctx.fillStyle = 'rgba(245, 208, 96, 0.9)';
  ctx.fillRect(-4, -18, 8, 20);
  ctx.restore();

  drawBubbleShape(ctx, LAUNCHER_X, LAUNCHER_Y, currentColor, 1, 1);
  drawBubbleShape(ctx, LAUNCHER_X + 40, LAUNCHER_Y + 4, nextColor, 0.82, 0.95);

  ctx.save();
  ctx.fillStyle = 'rgba(212,175,55,0.1)';
  ctx.beginPath();
  ctx.roundRect(LAUNCHER_X - 76, LAUNCHER_Y - 52, 152, 68, 20);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, levelIndex: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#050508');
  gradient.addColorStop(1, '#10101a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const haze = ctx.createRadialGradient(CANVAS_WIDTH / 2, 120, 40, CANVAS_WIDTH / 2, 120, 280);
  haze.addColorStop(0, 'rgba(212,175,55,0.08)');
  haze.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let row = 0; row <= 14; row += 1) {
    const y = TOP_OFFSET - 20 + row * 36;
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(476, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(245, 208, 96, 0.12)';
  ctx.beginPath();
  ctx.moveTo(28, LOSS_LINE_Y);
  ctx.lineTo(472, LOSS_LINE_Y);
  ctx.stroke();

  ctx.fillStyle = 'rgba(245, 208, 96, 0.08)';
  ctx.fillRect(0, LOSS_LINE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - LOSS_LINE_Y);

  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let index = 0; index < 22; index += 1) {
    const x = (index * 37 + levelIndex * 13) % CANVAS_WIDTH;
    const y = (index * 51 + levelIndex * 17) % CANVAS_HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: (BubbleCell | null)[][],
  projectile: ProjectileBubble | null,
  effects: EffectBubble[],
  levelIndex: number,
  currentColor: BubbleColorKey,
  nextColor: BubbleColorKey,
  aim: Point,
  mode: Mode,
  now: number,
) {
  drawBackground(ctx, levelIndex);

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        return;
      }

      const center = getCenter(rowIndex, colIndex);
      drawBubbleShape(ctx, center.x, center.y, cell.color, 1, 1);
    });
  });

  effects.forEach((effect) => {
    const age = now - effect.createdAt;
    const progress = clamp(age / EFFECT_DURATION, 0, 1);

    if (effect.kind === 'pop') {
      drawBubbleShape(ctx, effect.x, effect.y, effect.color, 1 + progress * 0.45, 1 - progress);
      return;
    }

    const x = effect.x + effect.vx * progress * 10;
    const y = effect.y + effect.vy * progress * 10 + progress * progress * 120;
    drawBubbleShape(ctx, x, y, effect.color, 0.85, 1 - progress * 0.85);
  });

  if (projectile) {
    drawBubbleShape(ctx, projectile.x, projectile.y, projectile.color, 1, 1);
  }

  if (mode !== 'result') {
    drawAimLine(ctx, { x: LAUNCHER_X, y: LAUNCHER_Y }, aim);
    drawLauncher(ctx, currentColor, nextColor, aim);
  }

  if (mode !== 'playing') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d060';
    ctx.shadowColor = 'rgba(212,175,55,0.2)';
    ctx.shadowBlur = 16;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.fillText(mode === 'menu' ? 'Bubble Shooter' : 'Level Clear', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(
      mode === 'menu'
        ? 'Aim, shoot, match 3+, and clear every bubble.'
        : 'Use the controls below to continue the run.',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 14,
    );
    ctx.restore();
  }
}

export default function BubbleShooterPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const isChallengeRun = Boolean(challengeId);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const resolutionTimerRef = useRef<number | null>(null);
  const boardRef = useRef<(BubbleCell | null)[][]>(createBoard(0));
  const projectileRef = useRef<ProjectileBubble | null>(null);
  const effectsRef = useRef<EffectBubble[]>([]);
  const currentColorRef = useRef<BubbleColorKey>('red');
  const nextColorRef = useRef<BubbleColorKey>('blue');
  const aimRef = useRef<Point>({ x: LAUNCHER_X, y: LAUNCHER_Y - 180 });
  const modeRef = useRef<Mode>('menu');
  const levelIndexRef = useRef(0);
  const scoreRef = useRef(0);
  const clearedRef = useRef(0);
  const bubbleIdRef = useRef(1000);
  const effectIdRef = useRef(1);

  const [mode, setMode] = useState<Mode>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [bubblesCleared, setBubblesCleared] = useState(0);
  const [result, setResult] = useState<ResultState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [currentBubbleColor, setCurrentBubbleColor] = useState<BubbleColorKey>('red');
  const [nextBubbleColor, setNextBubbleColor] = useState<BubbleColorKey>('blue');
  const [comboText, setComboText] = useState<string | null>(null);

  const syncUi = () => {
    setScore(scoreRef.current);
    setBubblesCleared(clearedRef.current);
    setLevelIndex(levelIndexRef.current);
    setCurrentBubbleColor(currentColorRef.current);
    setNextBubbleColor(nextColorRef.current);
  };

  const clearTimers = () => {
    if (resolutionTimerRef.current !== null) {
      window.clearTimeout(resolutionTimerRef.current);
      resolutionTimerRef.current = null;
    }
  };

  const setResultState = (nextResult: ResultState) => {
    modeRef.current = 'result';
    setMode('result');
    setResult(nextResult);
    setChallengeOpen(false);
  };

  const finishLevel = (kind: ResultKind) => {
    clearTimers();
    projectileRef.current = null;
    effectsRef.current = [];
    setComboText(null);

    const finalResult: ResultState =
      kind === 'lose'
        ? {
            kind: 'lose',
            heading: 'Game Over!',
            message: 'The stack reached the bottom line.',
            score: scoreRef.current,
            bubblesCleared: clearedRef.current,
            levelReached: levelIndexRef.current + 1,
          }
        : kind === 'win'
          ? {
              kind: 'win',
              heading: 'You Win!',
              message: `Total Score: ${scoreRef.current}`,
              score: scoreRef.current,
              bubblesCleared: clearedRef.current,
              levelReached: levelIndexRef.current + 1,
            }
          : {
              kind: 'levelClear',
              heading: 'Level Cleared!',
              message: `Get ready for pattern ${levelIndexRef.current + 2}.`,
              score: scoreRef.current,
              bubblesCleared: clearedRef.current,
              levelReached: levelIndexRef.current + 1,
            };

    setResultState(finalResult);
  };

  const resetRun = (targetLevel: number, preserveScore = false) => {
    clearTimers();
    modeRef.current = 'playing';
    setMode('playing');
    levelIndexRef.current = targetLevel;
    setLevelIndex(targetLevel);
    boardRef.current = cloneBoard(createBoard(targetLevel));
    projectileRef.current = null;
    effectsRef.current = [];
    setResult(null);
    setChallengeOpen(false);
    setComboText(null);

    if (!preserveScore) {
      scoreRef.current = 0;
      clearedRef.current = 0;
    }

    const colors = getAllowedColors(targetLevel);
    currentColorRef.current = pickRandom(colors);
    nextColorRef.current = pickRandom(colors);
    aimRef.current = { x: LAUNCHER_X, y: LAUNCHER_Y - 160 };
    setCurrentBubbleColor(currentColorRef.current);
    setNextBubbleColor(nextColorRef.current);
    setScore(scoreRef.current);
    setBubblesCleared(clearedRef.current);
  };

  const startGame = () => {
    resetRun(0, false);
  };

  const showComboText = (text: string) => {
    setComboText(text);
    window.setTimeout(() => {
      setComboText((current) => (current === text ? null : current));
    }, 800);
  };

  const commitBoardMutation = (mutate: (board: (BubbleCell | null)[][]) => void) => {
    const nextBoard = cloneBoard(boardRef.current);
    mutate(nextBoard);
    boardRef.current = nextBoard;
  };

  const spawnEffect = (effect: Omit<EffectBubble, 'id' | 'createdAt'>) => {
    effectsRef.current.push({
      ...effect,
      id: effectIdRef.current++,
      createdAt: performance.now(),
    });
  };

  const scheduleResolution = (callback: () => void, delay = EFFECT_DURATION) => {
    clearTimers();
    resolutionTimerRef.current = window.setTimeout(() => {
      resolutionTimerRef.current = null;
      callback();
    }, delay);
  };

  const resolveFloatingAndCheckEnd = () => {
    const floating = findFloatingCells(boardRef.current);
    if (floating.length > 0) {
      commitBoardMutation((board) => {
        floating.forEach(({ row, col }) => {
          const cell = board[row][col];
          if (!cell) {
            return;
          }

          const center = getCenter(row, col);
          spawnEffect({
            kind: 'fall',
            x: center.x,
            y: center.y,
            vx: (Math.random() - 0.5) * 1.6,
            vy: -0.6 - Math.random() * 0.8,
            color: cell.color,
          });

          board[row][col] = null;
          scoreRef.current += 5;
          clearedRef.current += 1;
        });
      });
      syncUi();
    }

    scheduleResolution(() => {
      const board = boardRef.current;
      if (hasAnyBubbleReachedLossLine(board)) {
        finishLevel('lose');
        return;
      }

      if (isBoardEmpty(board)) {
        if (levelIndexRef.current >= PATTERNS.length - 1) {
          finishLevel('win');
        } else {
          finishLevel('levelClear');
        }
      }
    });
  };

  const handlePlacedBubble = (placed: CellRef) => {
    const board = boardRef.current;
    const group = findConnectedGroup(board, placed.row, placed.col);

    if (group.length >= 3) {
      const centerBubble = board[placed.row][placed.col];
      const poppedColor = centerBubble?.color ?? 'red';
      commitBoardMutation((nextBoard) => {
        group.forEach(({ row, col }) => {
          const cell = nextBoard[row][col];
          if (!cell) {
            return;
          }

          const center = getCenter(row, col);
          spawnEffect({
            kind: 'pop',
            x: center.x,
            y: center.y,
            vx: 0,
            vy: 0,
            color: cell.color,
          });
          nextBoard[row][col] = null;
        });
      });

      scoreRef.current += group.length * 10;
      clearedRef.current += group.length;
      setScore(scoreRef.current);
      setBubblesCleared(clearedRef.current);
      showComboText(`${group.length}x POP! +${group.length * 10}`);
    }

    scheduleResolution(() => resolveFloatingAndCheckEnd());
  };

  const settleProjectile = () => {
    const projectile = projectileRef.current;
    if (!projectile) {
      return;
    }

    const rawCell = getCellFromPoint({ x: projectile.x, y: projectile.y });
    const target = findNearestOpenCell(boardRef.current, rawCell.row, rawCell.col);
    const landing = getCenter(target.row, target.col);

    commitBoardMutation((board) => {
      board[target.row][target.col] = {
        id: bubbleIdRef.current++,
        row: target.row,
        col: target.col,
        color: projectile.color,
      };
    });

    projectileRef.current = null;
    projectile.x = landing.x;
    projectile.y = landing.y;
    handlePlacedBubble(target);
  };

  const shootBubble = () => {
    if (modeRef.current !== 'playing' || projectileRef.current) {
      return;
    }

    const aim = aimRef.current;
    let angle = Math.atan2(aim.y - LAUNCHER_Y, aim.x - LAUNCHER_X);
    angle = clamp(angle, -Math.PI + 0.24, -0.24);

    projectileRef.current = {
      id: bubbleIdRef.current++,
      x: LAUNCHER_X,
      y: LAUNCHER_Y - 2,
      vx: Math.cos(angle) * PROJECTILE_SPEED,
      vy: Math.sin(angle) * PROJECTILE_SPEED,
      color: currentColorRef.current,
    };

    currentColorRef.current = nextColorRef.current;
    nextColorRef.current = pickRandom(getAllowedColors(levelIndexRef.current));
    setCurrentBubbleColor(currentColorRef.current);
    setNextBubbleColor(nextColorRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    ctxRef.current = canvas.getContext('2d');
    const ctx = ctxRef.current;
    if (ctx) {
      drawBoard(
        ctx,
        boardRef.current,
        projectileRef.current,
        effectsRef.current,
        levelIndexRef.current,
        currentColorRef.current,
        nextColorRef.current,
        aimRef.current,
        mode,
        performance.now(),
      );
    }
  }, [mode]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (mode !== 'playing') {
      const ctx = ctxRef.current;
      if (ctx) {
        drawBoard(
          ctx,
          boardRef.current,
          projectileRef.current,
          effectsRef.current,
          levelIndexRef.current,
          currentColorRef.current,
          nextColorRef.current,
          aimRef.current,
          mode,
          performance.now(),
        );
      }
      return;
    }

    let lastFrame = performance.now();
    const frame = (timestamp: number) => {
      if (modeRef.current !== 'playing') {
        return;
      }

      const ctx = ctxRef.current;
      if (!ctx) {
        return;
      }

      const delta = Math.min(32, timestamp - lastFrame);
      const step = delta / (1000 / 60);
      lastFrame = timestamp;

      const projectile = projectileRef.current;
      if (projectile) {
        projectile.x += projectile.vx * step;
        projectile.y += projectile.vy * step;

        if (projectile.x - BUBBLE_RADIUS <= 18) {
          projectile.x = 18 + BUBBLE_RADIUS;
          projectile.vx = Math.abs(projectile.vx);
        } else if (projectile.x + BUBBLE_RADIUS >= CANVAS_WIDTH - 18) {
          projectile.x = CANVAS_WIDTH - 18 - BUBBLE_RADIUS;
          projectile.vx = -Math.abs(projectile.vx);
        }

        if (projectile.y - BUBBLE_RADIUS <= TOP_OFFSET - 8) {
          settleProjectile();
        } else {
          let collided = false;
          for (let row = 0; row < BOARD_ROWS && !collided; row += 1) {
            for (let col = 0; col < COLS && !collided; col += 1) {
              const cell = boardRef.current[row][col];
              if (!cell) {
                continue;
              }

              const center = getCenter(row, col);
              if (Math.hypot(projectile.x - center.x, projectile.y - center.y) <= BUBBLE_DIAMETER - 4) {
                collided = true;
              }
            }
          }

          if (collided) {
            settleProjectile();
          }
        }
      }

      effectsRef.current = effectsRef.current.filter((effect) => timestamp - effect.createdAt <= EFFECT_DURATION);

      drawBoard(
        ctx,
        boardRef.current,
        projectileRef.current,
        effectsRef.current,
        levelIndexRef.current,
        currentColorRef.current,
        nextColorRef.current,
        aimRef.current,
        modeRef.current,
        timestamp,
      );

      if (modeRef.current === 'playing') {
        rafRef.current = window.requestAnimationFrame(frame);
      }
    };

    rafRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    aimRef.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const finalPlayerScore = result && result.kind !== 'levelClear' ? score : 0;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Bubble Shooter</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Canvas Puzzle</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">5 patterns</HubBadge>
              {isChallengeRun ? (
                <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge Run</HubBadge>
              ) : null}
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Bubble Shooter</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Match three or more bubbles, clear floating clusters, and push through five escalating patterns.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="bubble" playerScore={result && result.kind !== 'levelClear' ? finalPlayerScore : undefined} />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  mode === 'result'
                    ? result?.kind === 'win'
                      ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      : result?.kind === 'lose'
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                }
              >
                {mode === 'menu'
                  ? 'Ready to Launch'
                  : mode === 'playing'
                    ? `Pattern ${levelIndex + 1}/5`
                    : result?.heading ?? 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {mode === 'menu'
                  ? 'Aim and clear the stack.'
                  : mode === 'playing'
                    ? 'Shoot carefully and keep the board open.'
                    : result?.heading ?? 'Result'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {mode === 'menu'
                  ? 'Match three bubbles or more, remove floating clusters, and clear every pattern.'
                  : mode === 'playing'
                    ? 'Use the pointer line to aim, then click or tap to fire the next bubble.'
                    : result?.message ?? 'Challenge the next run.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px] lg:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{score}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Cleared</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{bubblesCleared}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level</div>
                <div className="mt-1 text-2xl font-black text-white">{levelIndex + 1}/5</div>
              </div>
            </div>
          </div>

          {mode === 'menu' ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Controls</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Move the pointer to aim. Click or tap to shoot the current bubble. Match 3+ bubbles of the same color.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Scoring</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Popped bubbles are worth 10 points each. Floating bubbles earn 5 points each when they fall.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
                <div className="overflow-hidden rounded-[1.2rem] border border-[#1a1a2e] bg-black/45">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="block h-auto w-full select-none"
                    style={{ touchAction: 'none', cursor: 'crosshair' }}
                    onPointerMove={(event) => handleMove(event.clientX, event.clientY)}
                    onPointerDown={(event) => {
                      handleMove(event.clientX, event.clientY);
                      shootBubble();
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.4rem] border border-[#1a1a2e] bg-black/30 p-4">
              <div className="overflow-hidden rounded-[1.2rem] border border-[#1a1a2e] bg-black/45">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="block h-auto w-full select-none"
                  style={{ touchAction: 'none', cursor: 'crosshair' }}
                  onPointerMove={(event) => handleMove(event.clientX, event.clientY)}
                  onPointerDown={(event) => {
                    handleMove(event.clientX, event.clientY);
                    shootBubble();
                  }}
                />
              </div>

              {mode === 'playing' && comboText ? (
                <div className="pointer-events-none mt-4 flex justify-center">
                  <div className="rounded-[1.2rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(0,0,0,0.42))] px-5 py-3 text-center shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                    <div className="text-xs font-mono uppercase tracking-[0.28em] text-[#f0d79e]">Combo</div>
                    <div className="mt-1 text-2xl font-black text-[#f5d060]">{comboText}</div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {mode === 'menu' ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
              >
                Start Game
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                Clear all 5 patterns to win the run.
              </span>
            </div>
          ) : null}

          {mode === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Final Score</div>
                  <div className="mt-2 text-3xl font-black text-[#f5d060]">{result.score}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Bubbles Cleared</div>
                  <div className="mt-2 text-3xl font-black text-[#30d158]">{result.bubblesCleared}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level Reached</div>
                  <div className="mt-2 text-3xl font-black text-white">{result.levelReached}/5</div>
                </div>
              </div>

              <div
                className={`rounded-[1.6rem] border p-6 sm:p-8 ${
                  result.kind === 'win'
                    ? 'border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))]'
                    : result.kind === 'lose'
                      ? 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                      : 'border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        result.kind === 'win'
                          ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                          : result.kind === 'lose'
                            ? 'border-red-500/30 bg-red-500/10 text-red-200'
                            : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3
                      className={`mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl ${
                        result.kind === 'win' ? 'text-[#a6f4bf]' : 'text-white'
                      }`}
                    >
                      {result.heading}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">{result.message}</p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.score}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {result.kind === 'levelClear' ? (
                    <button
                      type="button"
                      onClick={() => resetRun(levelIndexRef.current + 1, true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Next Level
                    </button>
                  ) : null}
                  {result.kind !== 'levelClear' ? (
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Challenge a Friend
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={startGame}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Play Again
                  </button>
                  <Link
                    href="/game"
                    className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Back to Games
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </HubCard>
      </div>

      <ChallengeModal
        gameType="bubble"
        playerScore={finalPlayerScore}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </section>
  );
}
