'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Mode = 'menu' | 'playing' | 'result';
type Direction = 'up' | 'down' | 'left' | 'right';
type EnemyKind = 'green' | 'red' | 'purple';
type PowerUpType = 'fire' | 'bomb' | 'speed';
type CellType = 'empty' | 'wall' | 'brick';

type CellCoord = {
  row: number;
  col: number;
};

type Point = {
  x: number;
  y: number;
};

type Cell = {
  type: CellType;
};

type LevelEnemy = {
  kind: EnemyKind;
  row: number;
  col: number;
};

type LevelConfig = {
  brickChance: number;
  enemies: LevelEnemy[];
};

type PlayerStats = {
  fireLevel: number;
  bombLevel: number;
  speedLevel: number;
};

type PlayerState = Point & {
  direction: Direction | null;
  desiredDirection: Direction | null;
  invulnerableUntil: number;
};

type EnemyState = Point & {
  id: number;
  kind: EnemyKind;
  direction: Direction;
  alive: boolean;
};

type BombState = {
  id: number;
  row: number;
  col: number;
  placedAt: number;
  explodeAt: number;
};

type PowerUpState = {
  id: number;
  row: number;
  col: number;
  type: PowerUpType;
  collected: boolean;
};

type ExplosionCell = {
  row: number;
  col: number;
  direction: Direction | 'center';
};

type ExplosionState = {
  id: number;
  startedAt: number;
  expiresAt: number;
  cells: ExplosionCell[];
  hitEnemyIds: number[];
  hitPlayer: boolean;
};

type RunState = {
  levelIndex: number;
  board: Cell[][];
  player: PlayerState;
  enemies: EnemyState[];
  bombs: BombState[];
  powerUps: PowerUpState[];
  explosions: ExplosionState[];
  stats: PlayerStats;
  lives: number;
  score: number;
  enemiesKilled: number;
  activeTimeMs: number;
  nextId: number;
};

type HudState = {
  score: number;
  lives: number;
  level: number;
  enemiesLeft: number;
  enemiesKilled: number;
  elapsedSeconds: number;
  fireLevel: number;
  bombLevel: number;
  speedLevel: number;
};

type OverlayState = {
  title: string;
  message: string;
  tone: 'gold' | 'red';
  actionLabel: string;
} | null;

type ResultState = {
  heading: string;
  message: string;
  finalScore: number;
  enemiesKilled: number;
  timeSeconds: number;
  livesLeft: number;
  levelReached: number;
} | null;

type ControlState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

type PendingAction =
  | {
      type: 'advance';
      at: number;
      nextLevelIndex: number;
      bonusScore: number;
      overlay: OverlayState;
    }
  | {
      type: 'respawn';
      at: number;
      levelIndex: number;
      overlay: OverlayState;
    }
  | {
      type: 'finish';
      at: number;
      result: NonNullable<ResultState>;
    };

const CANVAS_SIZE = 560;
const GRID_SIZE = 13;
const CELL_SIZE = 40;
const BOARD_OFFSET = 20;
const BOARD_END = BOARD_OFFSET + GRID_SIZE * CELL_SIZE;
const PLAYER_SIZE = 28;
const PLAYER_HALF = PLAYER_SIZE / 2;
const ENEMY_SIZE = 28;
const ENEMY_HALF = ENEMY_SIZE / 2;
const FIXED_STEP = 1000 / 60;
const BOMB_TIMER = 2000;
const EXPLOSION_DURATION = 500;
const PLAYER_BASE_SPEED = 3;
const ENEMY_SPEEDS: Record<EnemyKind, number> = {
  green: 1.5,
  red: 2.5,
  purple: 2,
};
const POWER_UP_CHANCE = 0.2;
const MAX_LIVES = 3;
const SCORE_BRICK = 15;
const SCORE_POWER_UP = 25;
const SCORE_LEVEL_CLEAR = 250;
const SCORE_FINAL_WIN = 500;
const SCORE_ENEMY: Record<EnemyKind, number> = {
  green: 75,
  red: 120,
  purple: 180,
};
const BOMB_COLOR = '#101018';
const LEVEL_CLEAR_DELAY = 1200;
const LIFE_LOSS_DELAY = 900;
const FINAL_DELAY = 1000;
const LEVELS: LevelConfig[] = [
  {
    brickChance: 0.3,
    enemies: [
      { kind: 'green', row: 3, col: 11 },
      { kind: 'green', row: 9, col: 9 },
      { kind: 'green', row: 11, col: 3 },
    ],
  },
  {
    brickChance: 0.35,
    enemies: [
      { kind: 'green', row: 3, col: 11 },
      { kind: 'green', row: 11, col: 3 },
      { kind: 'red', row: 9, col: 9 },
      { kind: 'red', row: 5, col: 11 },
    ],
  },
  {
    brickChance: 0.4,
    enemies: [
      { kind: 'green', row: 3, col: 11 },
      { kind: 'green', row: 11, col: 3 },
      { kind: 'red', row: 9, col: 9 },
      { kind: 'red', row: 5, col: 11 },
      { kind: 'purple', row: 5, col: 5 },
    ],
  },
];

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const DIRECTION_DELTAS: Record<Direction, CellCoord> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(values.length)];
}

function sameCell(a: CellCoord, b: CellCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function isInsideGrid(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

function getCellCenter(row: number, col: number): Point {
  return {
    x: BOARD_OFFSET + col * CELL_SIZE + CELL_SIZE / 2,
    y: BOARD_OFFSET + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function getCellFromPoint(point: Point): CellCoord | null {
  const col = Math.floor((point.x - BOARD_OFFSET) / CELL_SIZE);
  const row = Math.floor((point.y - BOARD_OFFSET) / CELL_SIZE);

  if (!isInsideGrid(row, col)) {
    return null;
  }

  return { row, col };
}

function isAtCellCenter(point: Point): boolean {
  const cell = getCellFromPoint(point);
  if (!cell) {
    return false;
  }

  const center = getCellCenter(cell.row, cell.col);
  return Math.abs(point.x - center.x) < 0.001 && Math.abs(point.y - center.y) < 0.001;
}

function getLevelSafeCells(levelIndex: number): CellCoord[] {
  const safeCells: CellCoord[] = [];

  for (let row = 0; row <= 2; row += 1) {
    for (let col = 0; col <= 2; col += 1) {
      safeCells.push({ row, col });
    }
  }

  for (const enemy of LEVELS[levelIndex].enemies) {
    for (let row = Math.max(0, enemy.row - 1); row <= Math.min(GRID_SIZE - 1, enemy.row + 1); row += 1) {
      for (let col = Math.max(0, enemy.col - 1); col <= Math.min(GRID_SIZE - 1, enemy.col + 1); col += 1) {
        safeCells.push({ row, col });
      }
    }
  }

  return safeCells;
}

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ type: 'empty' as CellType })),
  );
}

function hasBombAtCell(bombs: BombState[], row: number, col: number): boolean {
  return bombs.some((bomb) => bomb.row === row && bomb.col === col);
}

function canEnterCell(board: Cell[][], bombs: BombState[], row: number, col: number): boolean {
  if (!isInsideGrid(row, col)) {
    return false;
  }

  if (hasBombAtCell(bombs, row, col)) {
    return false;
  }

  return board[row][col].type === 'empty';
}

function getAvailableDirections(board: Cell[][], bombs: BombState[], row: number, col: number): Direction[] {
  return DIRECTIONS.filter((direction) => {
    const delta = DIRECTION_DELTAS[direction];
    return canEnterCell(board, bombs, row + delta.row, col + delta.col);
  });
}

function chooseEnemyDirection(
  enemy: EnemyState,
  board: Cell[][],
  bombs: BombState[],
  player: PlayerState,
  kind: EnemyKind,
): Direction {
  const cell = getCellFromPoint(enemy);
  if (!cell) {
    return enemy.direction;
  }

  const available = getAvailableDirections(board, bombs, cell.row, cell.col);
  if (available.length === 0) {
    return enemy.direction;
  }

  if (kind === 'purple') {
    const playerCell = getCellFromPoint(player) ?? cell;
    const scored = available
      .map((direction) => {
        const delta = DIRECTION_DELTAS[direction];
        const nextRow = cell.row + delta.row;
        const nextCol = cell.col + delta.col;
        const distance = Math.abs(playerCell.row - nextRow) + Math.abs(playerCell.col - nextCol);
        return { direction, distance };
      })
      .sort((left, right) => left.distance - right.distance);

    const bestDistance = scored[0].distance;
    const bestDirections = scored.filter((entry) => entry.distance === bestDistance).map((entry) => entry.direction);
    return pickRandom(bestDirections);
  }

  if (available.includes(enemy.direction) && Math.random() > 0.3) {
    return enemy.direction;
  }

  return pickRandom(available);
}

function buildExplosionCells(board: Cell[][], origin: CellCoord, range: number): ExplosionCell[] {
  const cells: ExplosionCell[] = [{ row: origin.row, col: origin.col, direction: 'center' }];
  const directions: Direction[] = ['up', 'down', 'left', 'right'];

  for (const direction of directions) {
    const delta = DIRECTION_DELTAS[direction];
    for (let step = 1; step <= range; step += 1) {
      const row = origin.row + delta.row * step;
      const col = origin.col + delta.col * step;

      if (!isInsideGrid(row, col)) {
        break;
      }

      const cell = board[row][col];
      if (cell.type === 'wall') {
        break;
      }

      cells.push({ row, col, direction });
      if (cell.type === 'brick') {
        break;
      }
    }
  }

  return cells;
}

function bfsReachable(board: Cell[][], start: CellCoord): Set<string> {
  const visited = new Set<string>();
  const queue: CellCoord[] = [];

  if (!isInsideGrid(start.row, start.col) || board[start.row][start.col].type !== 'empty') {
    return visited;
  }

  queue.push(start);
  visited.add(cellKey(start.row, start.col));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const direction of DIRECTIONS) {
      const delta = DIRECTION_DELTAS[direction];
      const row = current.row + delta.row;
      const col = current.col + delta.col;
      const key = cellKey(row, col);

      if (!isInsideGrid(row, col) || visited.has(key) || board[row][col].type !== 'empty') {
        continue;
      }

      visited.add(key);
      queue.push({ row, col });
    }
  }

  return visited;
}

function generateBoard(levelIndex: number): Cell[][] {
  const level = LEVELS[levelIndex];
  const safeCells = getLevelSafeCells(levelIndex);
  const safeCellSet = new Set(safeCells.map((cell) => cellKey(cell.row, cell.col)));

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const board = createEmptyBoard();

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        if (safeCellSet.has(cellKey(row, col))) {
          board[row][col].type = 'empty';
          continue;
        }

        if (row % 2 === 0 && col % 2 === 0) {
          board[row][col].type = 'wall';
          continue;
        }

        board[row][col].type = Math.random() < level.brickChance ? 'brick' : 'empty';
      }
    }

    const reachable = bfsReachable(board, { row: 1, col: 1 });
    const allEnemySpawnsReachable = level.enemies.every((enemy) => reachable.has(cellKey(enemy.row, enemy.col)));

    if (allEnemySpawnsReachable) {
      return board;
    }
  }

  const fallback = createEmptyBoard();
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (safeCellSet.has(cellKey(row, col))) {
        fallback[row][col].type = 'empty';
      } else if (row % 2 === 0 && col % 2 === 0) {
        fallback[row][col].type = 'wall';
      } else {
        fallback[row][col].type = Math.random() < level.brickChance * 0.85 ? 'brick' : 'empty';
      }
    }
  }

  return fallback;
}

function createEnemySpawn(kind: EnemyKind, row: number, col: number, id: number): EnemyState {
  const center = getCellCenter(row, col);
  return {
    id,
    kind,
    x: center.x,
    y: center.y,
    direction: pickRandom(DIRECTIONS),
    alive: true,
  };
}

function createRunState(levelIndex: number): RunState {
  const level = LEVELS[levelIndex];
  const board = generateBoard(levelIndex);
  const playerCenter = getCellCenter(1, 1);

  return {
    levelIndex,
    board,
    player: {
      x: playerCenter.x,
      y: playerCenter.y,
      direction: null,
      desiredDirection: null,
      invulnerableUntil: 0,
    },
    enemies: level.enemies.map((enemy, index) =>
      createEnemySpawn(enemy.kind, enemy.row, enemy.col, index + 1),
    ),
    bombs: [],
    powerUps: [],
    explosions: [],
    stats: {
      fireLevel: 0,
      bombLevel: 0,
      speedLevel: 0,
    },
    lives: MAX_LIVES,
    score: 0,
    enemiesKilled: 0,
    activeTimeMs: 0,
    nextId: level.enemies.length + 1,
  };
}

function resetLevelState(run: RunState, levelIndex: number, now: number): void {
  const board = generateBoard(levelIndex);
  const level = LEVELS[levelIndex];
  const playerCenter = getCellCenter(1, 1);

  run.levelIndex = levelIndex;
  run.board = board;
  run.player = {
    x: playerCenter.x,
    y: playerCenter.y,
    direction: null,
    desiredDirection: null,
    invulnerableUntil: now + 1000,
  };
  run.enemies = level.enemies.map((enemy, index) => createEnemySpawn(enemy.kind, enemy.row, enemy.col, run.nextId + index + 1));
  run.nextId += level.enemies.length;
  run.bombs = [];
  run.powerUps = [];
  run.explosions = [];
}

function getPlayerSpeed(stats: PlayerStats): number {
  return PLAYER_BASE_SPEED + stats.speedLevel * 0.5;
}

function getFireRange(stats: PlayerStats): number {
  return 2 + stats.fireLevel;
}

function getBombLimit(stats: PlayerStats): number {
  return 1 + stats.bombLevel;
}

function getPowerUpLabel(type: PowerUpType): string {
  switch (type) {
    case 'fire':
      return 'F';
    case 'bomb':
      return 'B';
    case 'speed':
      return 'S';
  }
}

function getPowerUpColor(type: PowerUpType): string {
  switch (type) {
    case 'fire':
      return '#ff8a3d';
    case 'bomb':
      return '#7dd3fc';
    case 'speed':
      return '#7cf7b6';
  }
}

function getEnemyColor(kind: EnemyKind): string {
  switch (kind) {
    case 'green':
      return '#30d158';
    case 'red':
      return '#ef4444';
    case 'purple':
      return '#a855f7';
  }
}

function getCellTypeColor(type: CellType): string {
  switch (type) {
    case 'empty':
      return '#0d0d12';
    case 'wall':
      return '#2a2a4e';
    case 'brick':
      return '#1a1a2e';
  }
}

function drawRoundedCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoardCell(ctx: CanvasRenderingContext2D, row: number, col: number, type: CellType): void {
  const x = BOARD_OFFSET + col * CELL_SIZE;
  const y = BOARD_OFFSET + row * CELL_SIZE;

  ctx.fillStyle = getCellTypeColor(type);
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  if (type === 'wall') {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    return;
  }

  if (type === 'brick') {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let stripe = 0; stripe < 4; stripe += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 8 + stripe * 8);
      ctx.lineTo(x + CELL_SIZE - 4, y + 6 + stripe * 8);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 6, y + CELL_SIZE - 8, CELL_SIZE - 12, 2);
  }
}

function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUpState): void {
  const center = getCellCenter(powerUp.row, powerUp.col);
  const radius = 10;

  ctx.save();
  ctx.shadowColor = getPowerUpColor(powerUp.type);
  ctx.shadowBlur = 18;
  ctx.fillStyle = getPowerUpColor(powerUp.type);
  drawRoundedCircle(ctx, center.x, center.y, radius);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#050508';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getPowerUpLabel(powerUp.type), center.x, center.y + 0.5);
  ctx.restore();
}

function drawBomb(ctx: CanvasRenderingContext2D, bomb: BombState, now: number): void {
  const center = getCellCenter(bomb.row, bomb.col);
  const remaining = clamp((bomb.explodeAt - now) / BOMB_TIMER, 0, 1);
  const pulse = 1 + Math.sin(now / 90) * 0.08 + (1 - remaining) * 0.08;
  const radius = 11 * pulse;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = BOMB_COLOR;
  drawRoundedCircle(ctx, center.x, center.y, radius);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center.x + 4, center.y - 10);
  ctx.lineTo(center.x + 12, center.y - 18);
  ctx.stroke();

  ctx.fillStyle = '#f5d060';
  drawRoundedCircle(ctx, center.x + 12, center.y - 18, 2);

  ctx.strokeStyle = 'rgba(245,208,96,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - remaining), false);
  ctx.stroke();
  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, explosion: ExplosionState, now: number): void {
  const progress = clamp((now - explosion.startedAt) / EXPLOSION_DURATION, 0, 1);
  const fade = 1 - progress;
  const scale = 0.55 + 0.45 * progress;

  ctx.save();
  ctx.globalAlpha = fade;

  for (const cell of explosion.cells) {
    const x = BOARD_OFFSET + cell.col * CELL_SIZE;
    const y = BOARD_OFFSET + cell.row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    const size = CELL_SIZE * scale;
    const half = size / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, half);
    gradient.addColorStop(0, 'rgba(255,245,204,0.95)');
    gradient.addColorStop(0.35, 'rgba(255,198,82,0.95)');
    gradient.addColorStop(0.72, 'rgba(255,94,31,0.8)');
    gradient.addColorStop(1, 'rgba(161,31,23,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(cx - half, cy - half, size, size);

    ctx.fillStyle = cell.direction === 'center' ? 'rgba(255,250,236,0.9)' : 'rgba(255,152,82,0.45)';
    drawRoundedCircle(ctx, cx, cy, cell.direction === 'center' ? 8 * scale : 5 * scale);
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, now: number): void {
  const pulse = 1 + Math.sin(now / 120) * 0.04;
  const center = player;
  const baseRadius = PLAYER_HALF * pulse;
  const invulnerable = now < player.invulnerableUntil;

  ctx.save();
  ctx.shadowColor = invulnerable ? 'rgba(245,208,96,0.7)' : 'rgba(245,208,96,0.35)';
  ctx.shadowBlur = invulnerable ? 22 : 12;
  ctx.fillStyle = '#f5d060';
  drawRoundedCircle(ctx, center.x, center.y, baseRadius);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#201806';
  drawRoundedCircle(ctx, center.x - 6, center.y - 4, 2.5);
  drawRoundedCircle(ctx, center.x + 6, center.y - 4, 2.5);

  ctx.strokeStyle = '#201806';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y + 2, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyState, now: number): void {
  const pulse = 1 + Math.sin((now + enemy.id * 37) / 160) * 0.05;
  const radius = ENEMY_HALF * pulse;
  const color = getEnemyColor(enemy.kind);

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  drawRoundedCircle(ctx, enemy.x, enemy.y, radius);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#08110a';
  drawRoundedCircle(ctx, enemy.x - 5, enemy.y - 4, 2.4);
  drawRoundedCircle(ctx, enemy.x + 5, enemy.y - 4, 2.4);

  ctx.strokeStyle = 'rgba(5,5,8,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + 1, 5.5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, run: RunState, now: number): void {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = '#0b0b10';
  ctx.fillRect(BOARD_OFFSET - 2, BOARD_OFFSET - 2, GRID_SIZE * CELL_SIZE + 4, GRID_SIZE * CELL_SIZE + 4);

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      drawBoardCell(ctx, row, col, run.board[row][col].type);
    }
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let index = 0; index <= GRID_SIZE; index += 1) {
    const pos = BOARD_OFFSET + index * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(BOARD_OFFSET, pos);
    ctx.lineTo(BOARD_END, pos);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos, BOARD_OFFSET);
    ctx.lineTo(pos, BOARD_END);
    ctx.stroke();
  }
  ctx.restore();

  for (const powerUp of run.powerUps) {
    if (!powerUp.collected) {
      drawPowerUp(ctx, powerUp);
    }
  }

  for (const bomb of run.bombs) {
    drawBomb(ctx, bomb, now);
  }

  for (const explosion of run.explosions) {
    if (now <= explosion.expiresAt) {
      drawExplosion(ctx, explosion, now);
    }
  }

  for (const enemy of run.enemies) {
    if (enemy.alive) {
      drawEnemy(ctx, enemy, now);
    }
  }

  drawPlayer(ctx, run.player, now);

  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.12)';
  ctx.lineWidth = 3;
  ctx.strokeRect(BOARD_OFFSET - 1, BOARD_OFFSET - 1, GRID_SIZE * CELL_SIZE + 2, GRID_SIZE * CELL_SIZE + 2);
  ctx.restore();
}

function addScore(run: RunState, amount: number): void {
  run.score += amount;
}

function collectPowerUps(run: RunState): void {
  const playerCell = getCellFromPoint(run.player);
  if (!playerCell) {
    return;
  }

  for (const powerUp of run.powerUps) {
    if (powerUp.collected || powerUp.row !== playerCell.row || powerUp.col !== playerCell.col) {
      continue;
    }

    powerUp.collected = true;
    addScore(run, SCORE_POWER_UP);

    if (powerUp.type === 'fire') {
      run.stats.fireLevel += 1;
    } else if (powerUp.type === 'bomb') {
      run.stats.bombLevel += 1;
    } else {
      run.stats.speedLevel += 1;
    }
  }

  run.powerUps = run.powerUps.filter((powerUp) => !powerUp.collected);
}

function createPowerUp(row: number, col: number, nextId: number): PowerUpState {
  const types: PowerUpType[] = ['fire', 'bomb', 'speed'];
  return {
    id: nextId,
    row,
    col,
    type: pickRandom(types),
    collected: false,
  };
}

function getEntityCell(entity: Point): CellCoord | null {
  return getCellFromPoint(entity);
}

function handleExplosionEffects(run: RunState, now: number): boolean {
  let playerKilled = false;

  for (const explosion of run.explosions) {
    if (now > explosion.expiresAt) {
      continue;
    }

    const affected = new Set(explosion.cells.map((cell) => cellKey(cell.row, cell.col)));

    if (!explosion.hitPlayer && now >= run.player.invulnerableUntil) {
      const playerCell = getEntityCell(run.player);
      if (playerCell && affected.has(cellKey(playerCell.row, playerCell.col))) {
        explosion.hitPlayer = true;
        playerKilled = true;
      }
    }

    for (const enemy of run.enemies) {
      if (!enemy.alive || explosion.hitEnemyIds.includes(enemy.id)) {
        continue;
      }

      const enemyCell = getEntityCell(enemy);
      if (enemyCell && affected.has(cellKey(enemyCell.row, enemyCell.col))) {
        explosion.hitEnemyIds.push(enemy.id);
        enemy.alive = false;
        addScore(run, SCORE_ENEMY[enemy.kind]);
        run.enemiesKilled += 1;
      }
    }
  }

  run.enemies = run.enemies.filter((enemy) => enemy.alive);
  return playerKilled;
}

function explodeBomb(run: RunState, bombId: number, now: number): void {
  const index = run.bombs.findIndex((bomb) => bomb.id === bombId);
  if (index === -1) {
    return;
  }

  const [bomb] = run.bombs.splice(index, 1);
  const range = getFireRange(run.stats);
  const cells = buildExplosionCells(run.board, { row: bomb.row, col: bomb.col }, range);
  const explosion: ExplosionState = {
    id: run.nextId += 1,
    startedAt: now,
    expiresAt: now + EXPLOSION_DURATION,
    cells,
    hitEnemyIds: [],
    hitPlayer: false,
  };

  run.explosions.push(explosion);

  for (const cell of cells) {
    const boardCell = run.board[cell.row][cell.col];
    if (boardCell.type !== 'brick') {
      continue;
    }

    boardCell.type = 'empty';
    addScore(run, SCORE_BRICK);
    if (Math.random() < POWER_UP_CHANCE) {
      run.powerUps.push(createPowerUp(cell.row, cell.col, run.nextId += 1));
    }
  }

  const chainBombs = run.bombs
    .filter((otherBomb) => cells.some((cell) => cell.row === otherBomb.row && cell.col === otherBomb.col))
    .map((otherBomb) => otherBomb.id);

  for (const chainedBomb of chainBombs) {
    explodeBomb(run, chainedBomb, now);
  }
}

function placeBomb(run: RunState, now: number): void {
  const playerCell = getEntityCell(run.player);
  if (!playerCell) {
    return;
  }

  if (run.bombs.length >= getBombLimit(run.stats)) {
    return;
  }

  if (run.bombs.some((bomb) => bomb.row === playerCell.row && bomb.col === playerCell.col)) {
    return;
  }

  run.bombs.push({
    id: run.nextId += 1,
    row: playerCell.row,
    col: playerCell.col,
    placedAt: now,
    explodeAt: now + BOMB_TIMER,
  });
}

function updatePlayer(run: RunState): void {
  const player = run.player;
  const cell = getEntityCell(player);
  if (!cell) {
    return;
  }

  const targetDirection = player.desiredDirection;
  if (!targetDirection) {
    player.direction = null;
    return;
  }

  const delta = DIRECTION_DELTAS[targetDirection];
  const targetRow = cell.row + delta.row;
  const targetCol = cell.col + delta.col;
  if (!canEnterCell(run.board, run.bombs, targetRow, targetCol)) {
    if (player.direction === targetDirection) {
      player.direction = null;
    }
    return;
  }

  const target = getCellCenter(targetRow, targetCol);
  const speed = getPlayerSpeed(run.stats);

  if (targetDirection === 'left' || targetDirection === 'right') {
    const distance = target.x - player.x;
    if (Math.abs(distance) <= speed) {
      player.x = target.x;
    } else {
      player.x += Math.sign(distance) * speed;
    }
  } else {
    const distance = target.y - player.y;
    if (Math.abs(distance) <= speed) {
      player.y = target.y;
    } else {
      player.y += Math.sign(distance) * speed;
    }
  }

  player.direction = targetDirection;
}

function updateEnemy(run: RunState, enemy: EnemyState, player: PlayerState): void {
  const cell = getEntityCell(enemy);
  if (!cell) {
    return;
  }

  if (isAtCellCenter(enemy)) {
    enemy.direction = chooseEnemyDirection(enemy, run.board, run.bombs, player, enemy.kind);
  }

  const delta = DIRECTION_DELTAS[enemy.direction];
  const targetRow = cell.row + delta.row;
  const targetCol = cell.col + delta.col;

  if (!canEnterCell(run.board, run.bombs, targetRow, targetCol)) {
    enemy.direction = chooseEnemyDirection(enemy, run.board, run.bombs, player, enemy.kind);
    const retryDelta = DIRECTION_DELTAS[enemy.direction];
    const retryRow = cell.row + retryDelta.row;
    const retryCol = cell.col + retryDelta.col;

    if (!canEnterCell(run.board, run.bombs, retryRow, retryCol)) {
      return;
    }
  }

  const target = getCellCenter(targetRow, targetCol);
  const speed = ENEMY_SPEEDS[enemy.kind];

  if (enemy.direction === 'left' || enemy.direction === 'right') {
    const distance = target.x - enemy.x;
    if (Math.abs(distance) <= speed) {
      enemy.x = target.x;
    } else {
      enemy.x += Math.sign(distance) * speed;
    }
  } else {
    const distance = target.y - enemy.y;
    if (Math.abs(distance) <= speed) {
      enemy.y = target.y;
    } else {
      enemy.y += Math.sign(distance) * speed;
    }
  }
}

function updateBombs(run: RunState, now: number): void {
  const readyBombs = run.bombs.filter((bomb) => bomb.explodeAt <= now).map((bomb) => bomb.id);
  for (const bombId of readyBombs) {
    explodeBomb(run, bombId, now);
  }

  run.explosions = run.explosions.filter((explosion) => now <= explosion.expiresAt);
}

function buildHud(run: RunState): HudState {
  return {
    score: run.score,
    lives: run.lives,
    level: run.levelIndex + 1,
    enemiesLeft: run.enemies.length,
    enemiesKilled: run.enemiesKilled,
    elapsedSeconds: Math.floor(run.activeTimeMs / 1000),
    fireLevel: run.stats.fireLevel,
    bombLevel: run.stats.bombLevel,
    speedLevel: run.stats.speedLevel,
  };
}

function buildResult(run: RunState): NonNullable<ResultState> {
  const finalScore = run.score + (run.lives > 0 ? run.lives * 100 + SCORE_FINAL_WIN : 0);

  return {
    heading: run.lives > 0 ? 'Level Complete!' : 'Game Over',
    message: run.lives > 0
      ? 'You cleared all three levels and kept the Arc arena in pieces.'
      : 'The blast got you before the board was cleared. Try another run.',
    finalScore,
    enemiesKilled: run.enemiesKilled,
    timeSeconds: Math.floor(run.activeTimeMs / 1000),
    livesLeft: run.lives,
    levelReached: run.levelIndex + 1,
  };
}

export default function BombermanPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const runRef = useRef<RunState>(createRunState(0));
  const controlsRef = useRef<ControlState>({ up: false, down: false, left: false, right: false });
  const pendingActionRef = useRef<PendingAction | null>(null);
  const lastFrameRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('menu');
  const overlayRef = useRef<OverlayState>(null);
  const challengeOpenRef = useRef(false);

  const [mode, setMode] = useState<Mode>('menu');
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [hud, setHud] = useState<HudState>(() => buildHud(runRef.current));
  const [result, setResult] = useState<ResultState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [controls, setControls] = useState<ControlState>(controlsRef.current);

  const syncHud = () => {
    setHud(buildHud(runRef.current));
  };

  const queuePlayerDeath = (now: number, overlayMessage: string) => {
    const run = runRef.current;
    run.lives = Math.max(0, run.lives - 1);
    run.player.invulnerableUntil = now + 1000;

    if (run.lives <= 0) {
      pendingActionRef.current = {
        type: 'finish',
        at: now + LIFE_LOSS_DELAY,
        result: buildResult(run),
      };
      applyOverlay({
        title: 'Game Over',
        message: overlayMessage,
        tone: 'red',
        actionLabel: 'Restart Run',
      });
    } else {
      pendingActionRef.current = {
        type: 'respawn',
        at: now + LIFE_LOSS_DELAY,
        levelIndex: run.levelIndex,
        overlay: {
          title: 'Life Lost',
          message: overlayMessage,
          tone: 'red',
          actionLabel: 'Hold Tight',
        },
      };
      applyOverlay(pendingActionRef.current.overlay);
    }

    syncHud();
  };

  const applyMode = (nextMode: Mode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
  };

  const applyOverlay = (nextOverlay: OverlayState) => {
    overlayRef.current = nextOverlay;
    setOverlay(nextOverlay);
  };

  const applyResult = (nextResult: ResultState) => {
    setResult(nextResult);
  };

  const applyChallengeOpen = (nextOpen: boolean) => {
    challengeOpenRef.current = nextOpen;
    setChallengeOpen(nextOpen);
  };

  const setControl = (direction: keyof ControlState, active: boolean) => {
    controlsRef.current = {
      ...controlsRef.current,
      [direction]: active,
    };
    setControls(controlsRef.current);
  };

  const startRun = (now: number) => {
    const nextRun = createRunState(0);
    nextRun.player.invulnerableUntil = now + 1000;
    runRef.current = nextRun;
    controlsRef.current = { up: false, down: false, left: false, right: false };
    setControls(controlsRef.current);
    pendingActionRef.current = null;
    applyOverlay(null);
    applyResult(null);
    applyChallengeOpen(false);
    applyMode('playing');
    syncHud();
  };

  const restartCurrentLevel = (now: number) => {
    const run = runRef.current;
    resetLevelState(run, run.levelIndex, now);
    run.player.invulnerableUntil = now + 1000;
    pendingActionRef.current = null;
    applyOverlay(null);
    syncHud();
  };

  const advanceToNextLevel = (now: number, nextLevelIndex: number) => {
    const run = runRef.current;
    resetLevelState(run, nextLevelIndex, now);
    run.player.invulnerableUntil = now + 1000;
    pendingActionRef.current = null;
    applyOverlay(null);
    syncHud();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvasCtxRef.current = canvas.getContext('2d');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (challengeOpenRef.current) {
        return;
      }

      const key = event.key.toLowerCase();

      if (modeRef.current === 'menu' && (key === 'enter' || key === ' ')) {
        event.preventDefault();
        startRun(performance.now());
        return;
      }

      if (modeRef.current === 'result' && (key === 'enter' || key === ' ')) {
        event.preventDefault();
        startRun(performance.now());
        return;
      }

      if (modeRef.current !== 'playing' || overlayRef.current) {
        return;
      }

      if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        setControl('up', true);
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        setControl('down', true);
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        setControl('left', true);
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        setControl('right', true);
      } else if (key === ' ' || key === 'enter') {
        event.preventDefault();
        placeBomb(runRef.current, performance.now());
        syncHud();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        setControl('up', false);
      } else if (key === 'arrowdown' || key === 's') {
        setControl('down', false);
      } else if (key === 'arrowleft' || key === 'a') {
        setControl('left', false);
      } else if (key === 'arrowright' || key === 'd') {
        setControl('right', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const frame = (timestamp: number) => {
      if (!active) {
        return;
      }

      const ctx = canvasCtxRef.current;
      const run = runRef.current;

      if (!ctx) {
        lastFrameRef.current = timestamp;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
      }

      const delta = Math.min(1000, timestamp - lastFrameRef.current);
      lastFrameRef.current = timestamp;

      if (modeRef.current !== 'playing' || challengeOpenRef.current) {
        accumulatorRef.current = 0;
        drawScene(ctx, run, timestamp);
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      accumulatorRef.current += delta;

      while (accumulatorRef.current >= FIXED_STEP) {
        accumulatorRef.current -= FIXED_STEP;
        const now = timestamp;

        if (pendingActionRef.current) {
          if (now >= pendingActionRef.current.at) {
            const action = pendingActionRef.current;
            if (action.type === 'advance') {
              run.score += action.bonusScore;
              advanceToNextLevel(now, action.nextLevelIndex);
            } else if (action.type === 'respawn') {
              restartCurrentLevel(now);
            } else if (action.type === 'finish') {
              pendingActionRef.current = null;
              applyOverlay(null);
              run.score = action.result.finalScore;
              applyResult(action.result);
              applyMode('result');
              syncHud();
            }
          }

          continue;
        }

        run.activeTimeMs += FIXED_STEP;

        const player = run.player;
        player.desiredDirection = controlsRef.current.up
          ? 'up'
          : controlsRef.current.down
            ? 'down'
            : controlsRef.current.left
              ? 'left'
              : controlsRef.current.right
                ? 'right'
                : null;

        updatePlayer(run);

        for (const enemy of run.enemies) {
          if (enemy.alive) {
            updateEnemy(run, enemy, run.player);
          }
        }

        collectPowerUps(run);
        updateBombs(run, now);

        const playerKilledByExplosion = handleExplosionEffects(run, now);
        if (playerKilledByExplosion) {
          queuePlayerDeath(now, 'You were caught in the blast. The run ends here.');
          break;
        }

        const playerCell = getEntityCell(run.player);
        if (playerCell && now >= run.player.invulnerableUntil) {
          const touchedEnemy = run.enemies.some((enemy) => {
            const enemyCell = getEntityCell(enemy);
            return enemyCell ? sameCell(playerCell, enemyCell) : false;
          });

          if (touchedEnemy) {
            queuePlayerDeath(now, 'An enemy caught you. Rebuilding the board.');
            break;
          }
        }

        if (run.enemies.length === 0) {
          if (run.levelIndex < LEVELS.length - 1) {
            pendingActionRef.current = {
              type: 'advance',
              at: now + LEVEL_CLEAR_DELAY,
              nextLevelIndex: run.levelIndex + 1,
              bonusScore: SCORE_LEVEL_CLEAR,
              overlay: {
                title: 'Level Complete!',
                message: `Level ${run.levelIndex + 1} cleared. Loading the next board...`,
                tone: 'gold',
                actionLabel: 'Next Level',
              },
            };
            applyOverlay(pendingActionRef.current.overlay);
          } else {
            pendingActionRef.current = {
              type: 'finish',
              at: now + FINAL_DELAY,
              result: buildResult(run),
            };
            applyOverlay({
              title: 'Level Complete!',
              message: 'All three levels are clear. The arena is yours.',
              tone: 'gold',
              actionLabel: 'Show Result',
            });
          }

          syncHud();
          break;
        }

        syncHud();
      }

      drawScene(ctx, run, timestamp);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleStart = () => {
    startRun(performance.now());
  };

  const handleBomb = () => {
    if (modeRef.current !== 'playing' || overlayRef.current || challengeOpenRef.current) {
      return;
    }

    placeBomb(runRef.current, performance.now());
    syncHud();
  };

  const resultScore = result?.finalScore ?? 0;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ChallengeBar gameType="bomberman" playerScore={mode === 'result' ? resultScore : undefined} />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Bomberman</HubBadge>
            <h1 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
              Boom the board.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#8a8a9a] sm:text-lg">
              Clear bricks, chain blasts, and survive three escalating levels with Arc challenge support.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="primary-button focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              New Run
            </button>
            <Link
              href="/game"
              className="bracket-button focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Back to Hub
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <HubCard className="relative overflow-hidden p-4 sm:p-5">
            <div className="relative mx-auto w-full max-w-[560px]">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="block h-auto w-full rounded-[1.75rem] border border-[#1a1a2e] bg-black"
                style={{ touchAction: 'none' }}
              />

              {mode === 'menu' ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(5,5,8,0.3),rgba(5,5,8,0.72))] p-6">
                  <div className="pointer-events-auto max-w-md rounded-[1.75rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(13,13,18,0.94))] p-6 text-center shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                    <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Start Run</HubBadge>
                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight">Classic Bomberman</h2>
                    <p className="mt-3 text-sm leading-7 text-[#c9c9d6]">
                      Use arrows or WASD to move. Drop bombs with Space or Enter, break bricks, collect power-ups,
                      and clear the board.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.28em] text-[#8a8a8a]">
                      <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">3 lives</span>
                      <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">3 levels</span>
                      <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">Challenge ready</span>
                    </div>
                    <button type="button" onClick={handleStart} className="primary-button mt-6 w-full justify-center">
                      Start Game
                    </button>
                  </div>
                </div>
              ) : null}

              {overlay ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(5,5,8,0.3),rgba(5,5,8,0.8))] p-6">
                  <div
                    className={`pointer-events-auto max-w-md rounded-[1.75rem] border p-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.35)] ${
                      overlay.tone === 'gold'
                        ? 'border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(13,13,18,0.96))]'
                        : 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                    }`}
                  >
                    <HubBadge
                      className={
                        overlay.tone === 'gold'
                          ? 'border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]'
                          : 'border-red-500/25 bg-red-500/10 text-red-100'
                      }
                    >
                      {overlay.title}
                    </HubBadge>
                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight">{overlay.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#c9c9d6]">{overlay.message}</p>
                    <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.3em] text-[#8a8a8a]">
                      {overlay.actionLabel}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives</div>
                <div className="mt-2 flex items-center gap-2 text-[#f5d060]">
                  {Array.from({ length: MAX_LIVES }, (_, index) => (
                    <span key={index} className={`text-lg ${index < hud.lives ? 'opacity-100' : 'opacity-20'}`}>
                      ♥
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-2 text-2xl font-black text-[#f5d060]">{hud.score}</div>
              </div>

              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level</div>
                <div className="mt-2 text-2xl font-black text-white">{hud.level} / 3</div>
              </div>

              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Time</div>
                <div className="mt-2 text-2xl font-black text-white">{hud.elapsedSeconds}s</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8a8a8a]">
              <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">
                Enemies Left: {hud.enemiesLeft}
              </span>
              <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">
                Fire +{hud.fireLevel}
              </span>
              <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">
                Bomb +{hud.bombLevel}
              </span>
              <span className="rounded-full border border-[#1a1a2e] bg-black/35 px-3 py-2">
                Speed +{hud.speedLevel}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1.25fr_1fr]">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Controls</div>
                <p className="mt-2 text-sm leading-7 text-[#c9c9d6]">
                  Move with arrow keys or WASD. Space / Enter place a bomb. Bombs explode after two seconds, clear
                  bricks, and can kill enemies or the player.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Power-ups</div>
                <p className="mt-2 text-sm leading-7 text-[#c9c9d6]">
                  Fire extends blast range, Bomb increases the bomb cap, and Speed makes movement faster.
                </p>
              </div>
            </div>
          </HubCard>

          <div className="space-y-4">
            <HubCard className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Arena HUD</HubBadge>
                  <h2 className="mt-4 text-2xl font-black uppercase">Run stats</h2>
                </div>
                <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Live</HubBadge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Enemies Killed</div>
                  <div className="mt-2 text-2xl font-black text-white">{hud.enemiesKilled}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Challenge Score</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">
                    {mode === 'result' && result ? result.finalScore : hud.score}
                  </div>
                </div>
              </div>
            </HubCard>

            <HubCard className="p-5 sm:p-6">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Mobile</HubBadge>
              <h2 className="mt-4 text-2xl font-black uppercase">Touch controls</h2>
              <p className="mt-2 text-sm leading-7 text-[#8a8a9a]">
                Hold a direction to move. Tap bomb to drop one in the current cell.
              </p>

              <div className="mt-5 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 max-w-[260px]">
                <div />
                <button
                  type="button"
                  onPointerDown={() => setControl('up', true)}
                  onPointerUp={() => setControl('up', false)}
                  onPointerCancel={() => setControl('up', false)}
                  onPointerLeave={() => setControl('up', false)}
                  className={`rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                    controls.up
                      ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-black/35 text-[#c9c9d6]'
                  }`}
                >
                  Up
                </button>
                <div />
                <button
                  type="button"
                  onPointerDown={() => setControl('left', true)}
                  onPointerUp={() => setControl('left', false)}
                  onPointerCancel={() => setControl('left', false)}
                  onPointerLeave={() => setControl('left', false)}
                  className={`rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                    controls.left
                      ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-black/35 text-[#c9c9d6]'
                  }`}
                >
                  Left
                </button>
                <div className="flex items-center justify-center rounded-2xl border border-[#1a1a2e] bg-black/20 text-[10px] font-mono uppercase tracking-[0.26em] text-[#8a8a8a]">
                  D-Pad
                </div>
                <button
                  type="button"
                  onPointerDown={handleBomb}
                  className="rounded-2xl border border-[#d4af37]/45 bg-[#d4af37] px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-[#f5d060]"
                >
                  Bomb
                </button>
                <button
                  type="button"
                  onPointerDown={() => setControl('right', true)}
                  onPointerUp={() => setControl('right', false)}
                  onPointerCancel={() => setControl('right', false)}
                  onPointerLeave={() => setControl('right', false)}
                  className={`rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                    controls.right
                      ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-black/35 text-[#c9c9d6]'
                  }`}
                >
                  Right
                </button>
                <div />
                <button
                  type="button"
                  onPointerDown={() => setControl('down', true)}
                  onPointerUp={() => setControl('down', false)}
                  onPointerCancel={() => setControl('down', false)}
                  onPointerLeave={() => setControl('down', false)}
                  className={`rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                    controls.down
                      ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060]'
                      : 'border-[#1a1a2e] bg-black/35 text-[#c9c9d6]'
                  }`}
                >
                  Down
                </button>
                <div />
              </div>
            </HubCard>

            {mode === 'result' && result ? (
              <HubCard className="p-5 sm:p-6">
                <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">
                  {result.heading}
                </HubBadge>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">{result.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-[#8a8a8a]">{result.message}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                    <div className="mt-2 text-2xl font-black text-[#f5d060]">{result.finalScore}</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Enemies Killed</div>
                    <div className="mt-2 text-2xl font-black text-white">{result.enemiesKilled}</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Time</div>
                    <div className="mt-2 text-2xl font-black text-white">{result.timeSeconds}s</div>
                  </div>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives Left</div>
                    <div className="mt-2 text-2xl font-black text-white">{result.livesLeft}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => applyChallengeOpen(true)}
                    className="primary-button focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Challenge a Friend
                  </button>
                  <button
                    type="button"
                    onClick={handleStart}
                    className="bracket-button focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    Play Again
                  </button>
                </div>
              </HubCard>
            ) : null}
          </div>
        </div>
      </div>

      <ChallengeModal
        gameType="bomberman"
        playerScore={result?.finalScore ?? hud.score}
        isOpen={challengeOpen}
        onClose={() => applyChallengeOpen(false)}
      />
    </section>
  );
}
