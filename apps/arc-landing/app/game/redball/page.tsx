'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Mode = 'menu' | 'playing' | 'result';
type ResultKind = 'levelComplete' | 'finalWin' | 'gameOver';

type Vec2 = {
  x: number;
  y: number;
};

type ControlState = {
  left: boolean;
  right: boolean;
  jumpQueued: boolean;
};

type PlatformDefinition = {
  x: number;
  y: number;
  width: number;
  height: number;
  moving?: {
    minX: number;
    maxX: number;
    speed: number;
    direction: number;
  };
};

type EnemyDefinition = {
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  speed: number;
  direction: number;
};

type CheckpointDefinition = Vec2;

type LevelDefinition = {
  name: string;
  worldWidth: number;
  spawn: Vec2;
  flag: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  platforms: PlatformDefinition[];
  stars: Vec2[];
  enemies: EnemyDefinition[];
  checkpoints: CheckpointDefinition[];
};

type RuntimePlatform = PlatformDefinition & {
  id: number;
  prevX: number;
};

type RuntimeStar = Vec2 & {
  id: number;
  collected: boolean;
};

type RuntimeEnemy = EnemyDefinition & {
  id: number;
};

type RuntimeCheckpoint = CheckpointDefinition & {
  id: number;
  reached: boolean;
};

type RuntimeLevel = {
  definition: LevelDefinition;
  platforms: RuntimePlatform[];
  stars: RuntimeStar[];
  enemies: RuntimeEnemy[];
  checkpoints: RuntimeCheckpoint[];
};

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundedPlatformId: number | null;
  invulnerableUntil: number;
};

type ResultState = {
  kind: ResultKind;
  heading: string;
  message: string;
  levelIndex: number;
  levelScore: number;
  starsCollected: number;
  totalScore: number;
  totalStars: number;
  livesLeft: number;
} | null;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PLAYER_SIZE = 30;
const PLAYER_RADIUS = 15;
const MOVE_SPEED = 4;
const GRAVITY = 0.5;
const JUMP_VELOCITY = -10;
const MAX_LIVES = 3;
const MAX_TIME = 60;
const FIXED_STEP = 1000 / 60;

const LEVELS: LevelDefinition[] = [
  {
    name: 'Easy',
    worldWidth: 2220,
    spawn: { x: 60, y: 300 },
    flag: { x: 2060, y: 245, width: 18, height: 90 },
    platforms: [
      { x: 0, y: 330, width: 520, height: 70 },
      { x: 650, y: 330, width: 560, height: 70 },
      { x: 1370, y: 330, width: 630, height: 70 },
    ],
    stars: [
      { x: 170, y: 268 },
      { x: 420, y: 228 },
      { x: 770, y: 250 },
      { x: 1110, y: 220 },
      { x: 1740, y: 252 },
    ],
    enemies: [],
    checkpoints: [
      { x: 240, y: 300 },
      { x: 920, y: 300 },
      { x: 1680, y: 300 },
    ],
  },
  {
    name: 'Medium',
    worldWidth: 2820,
    spawn: { x: 60, y: 300 },
    flag: { x: 2600, y: 245, width: 18, height: 90 },
    platforms: [
      { x: 0, y: 330, width: 330, height: 70 },
      { x: 380, y: 280, width: 220, height: 18 },
      {
        x: 700, y: 230, width: 160, height: 18,
        moving: { minX: 620, maxX: 940, speed: 1.5, direction: 1 },
      },
      { x: 1020, y: 195, width: 270, height: 18 },
      { x: 1390, y: 255, width: 220, height: 18 },
      { x: 1730, y: 330, width: 1090, height: 70 },
      { x: 1880, y: 220, width: 180, height: 18 },
    ],
    stars: [
      { x: 130, y: 262 },
      { x: 430, y: 240 },
      { x: 520, y: 205 },
      { x: 760, y: 188 },
      { x: 1100, y: 160 },
      { x: 1460, y: 226 },
      { x: 1900, y: 188 },
      { x: 2330, y: 250 },
    ],
    enemies: [
      { x: 1440, y: 235, width: 20, height: 20, minX: 1410, maxX: 1560, speed: 1.25, direction: 1 },
    ],
    checkpoints: [
      { x: 180, y: 300 },
      { x: 470, y: 250 },
      { x: 1090, y: 165 },
      { x: 1820, y: 300 },
      { x: 2380, y: 300 },
    ],
  },
  {
    name: 'Hard',
    worldWidth: 3420,
    spawn: { x: 60, y: 300 },
    flag: { x: 3260, y: 245, width: 18, height: 90 },
    platforms: [
      { x: 0, y: 330, width: 260, height: 70 },
      { x: 320, y: 290, width: 190, height: 18 },
      {
        x: 640, y: 240, width: 130, height: 18,
        moving: { minX: 620, maxX: 920, speed: 1.8, direction: 1 },
      },
      { x: 960, y: 200, width: 230, height: 18 },
      { x: 1270, y: 260, width: 240, height: 18 },
      {
        x: 1640, y: 185, width: 140, height: 18,
        moving: { minX: 1620, maxX: 1980, speed: 2, direction: -1 },
      },
      { x: 2060, y: 220, width: 230, height: 18 },
      { x: 2360, y: 330, width: 1060, height: 70 },
    ],
    stars: [
      { x: 110, y: 258 },
      { x: 360, y: 252 },
      { x: 700, y: 194 },
      { x: 860, y: 168 },
      { x: 1030, y: 160 },
      { x: 1380, y: 226 },
      { x: 1690, y: 150 },
      { x: 1830, y: 128 },
      { x: 2140, y: 188 },
      { x: 2910, y: 252 },
    ],
    enemies: [
      { x: 430, y: 270, width: 20, height: 20, minX: 350, maxX: 470, speed: 1.15, direction: 1 },
      { x: 1360, y: 240, width: 20, height: 20, minX: 1290, maxX: 1460, speed: 1.35, direction: -1 },
      { x: 2550, y: 310, width: 20, height: 20, minX: 2460, maxX: 2840, speed: 1.5, direction: 1 },
    ],
    checkpoints: [
      { x: 150, y: 300 },
      { x: 390, y: 260 },
      { x: 1040, y: 170 },
      { x: 1730, y: 155 },
      { x: 2480, y: 300 },
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(
  leftA: number,
  topA: number,
  widthA: number,
  heightA: number,
  leftB: number,
  topB: number,
  widthB: number,
  heightB: number,
): boolean {
  return leftA < leftB + widthB && leftA + widthA > leftB && topA < topB + heightB && topA + heightA > topB;
}

function createRuntimeLevel(levelIndex: number): RuntimeLevel {
  const definition = LEVELS[levelIndex];

  return {
    definition,
    platforms: definition.platforms.map((platform, index) => ({
      ...platform,
      id: index,
      prevX: platform.x,
      moving: platform.moving ? { ...platform.moving } : undefined,
    })),
    stars: definition.stars.map((star, index) => ({
      ...star,
      id: index,
      collected: false,
    })),
    enemies: definition.enemies.map((enemy, index) => ({
      ...enemy,
      id: index,
    })),
    checkpoints: definition.checkpoints.map((checkpoint, index) => ({
      ...checkpoint,
      id: index,
      reached: index === 0,
    })),
  };
}

function createPlayer(spawn: Vec2): Player {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    groundedPlatformId: null,
    invulnerableUntil: 0,
  };
}

function getPlayerRect(player: Player) {
  return {
    left: player.x,
    top: player.y,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  };
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: RuntimePlatform) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = 'rgba(212,175,55,0.9)';
  ctx.fillRect(platform.x, platform.y, platform.width, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(platform.x, platform.y + 3, platform.width, 1);
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, checkpoint: RuntimeCheckpoint, now: number) {
  const pulse = 0.5 + Math.sin(now / 220 + checkpoint.id) * 0.18;
  const baseX = checkpoint.x + PLAYER_SIZE / 2;
  const baseY = checkpoint.y + PLAYER_SIZE;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.strokeStyle = checkpoint.reached ? 'rgba(245,208,96,0.9)' : 'rgba(245,208,96,0.35)';
  ctx.fillStyle = checkpoint.reached ? 'rgba(245,208,96,0.15)' : 'rgba(245,208,96,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 11 + pulse * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -18, 4 + pulse * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlag(ctx: CanvasRenderingContext2D, flag: LevelDefinition['flag']) {
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(flag.x, flag.y - 5, 4, flag.height + 5);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(flag.x + 4, flag.y, 22, 22);
  ctx.fillStyle = '#ff8b8b';
  ctx.fillRect(flag.x + 4, flag.y + 22, 22, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(flag.x + 6, flag.y + 4, 4, 14);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, now: number) {
  const centerX = player.x + PLAYER_RADIUS;
  const centerY = player.y + PLAYER_RADIUS;
  const blinking = player.invulnerableUntil > now;
  const alpha = blinking ? 0.5 + Math.sin(now / 50) * 0.3 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(239,68,68,0.45)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#e03131';
  ctx.beginPath();
  ctx.arc(centerX, centerY, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX + 5, centerY - 4, 2.1, 0, Math.PI * 2);
  ctx.arc(centerX + 9, centerY - 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: RuntimeEnemy, now: number) {
  const pulse = 0.92 + Math.sin(now / 220 + enemy.id) * 0.04;
  ctx.save();
  ctx.fillStyle = '#2a2a34';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 10;
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#90909a';
  ctx.fillRect(enemy.x + 4, enemy.y + 4, enemy.width - 8, enemy.height - 8);
  ctx.fillStyle = `rgba(255,255,255,${pulse})`;
  ctx.fillRect(enemy.x + 5, enemy.y + 6, 3, 3);
  ctx.fillRect(enemy.x + 12, enemy.y + 6, 3, 3);
  ctx.fillStyle = '#0f0f16';
  ctx.fillRect(enemy.x + 6, enemy.y + 13, 8, 2);
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, star: RuntimeStar, now: number) {
  const centerX = star.x + 14;
  const centerY = star.y + 14;
  const angle = (now / 550 + star.id) % (Math.PI * 2);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.shadowColor = 'rgba(245,208,96,0.45)';
  ctx.shadowBlur = 16;
  drawDiamond(ctx, 0, 0, 12, star.collected ? 'rgba(245,208,96,0.28)' : '#f5d060', '#fff3bf');
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2, -8, 4, 16);
  ctx.fillRect(-8, -2, 16, 4);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, level: RuntimeLevel, cameraX: number, now: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0d0d12');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(212,175,55,0.03)';
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 160 - cameraX * 0.2) % (CANVAS_WIDTH + 220)) - 110;
    const width = 60 + (index % 4) * 20;
    const height = 30 + (index % 3) * 12;
    ctx.fillRect(x, 60 + (index % 5) * 18 + Math.sin(now / 600 + index) * 4, width, height);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let index = 0; index < 20; index += 1) {
    const x = ((index * 70 + now * 0.01) % CANVAS_WIDTH);
    const y = (index * 23) % CANVAS_HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }

  const haze = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
  haze.addColorStop(0, 'rgba(212,175,55,0.04)');
  haze.addColorStop(0.5, 'rgba(255,255,255,0.01)');
  haze.addColorStop(1, 'rgba(212,175,55,0.02)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(212,175,55,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= CANVAS_WIDTH; x += 48) {
    ctx.moveTo(x + (cameraX * 0.1) % 48, 0);
    ctx.lineTo(x + (cameraX * 0.1) % 48, CANVAS_HEIGHT);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(CANVAS_WIDTH, 0);
  ctx.stroke();

  // Foreground ground glow
  ctx.fillStyle = 'rgba(212,175,55,0.05)';
  ctx.fillRect(0, CANVAS_HEIGHT - 46, CANVAS_WIDTH, 46);

  // subtle parallax silhouette
  ctx.save();
  ctx.translate(-(cameraX * 0.35) % (CANVAS_WIDTH + 200), 0);
  ctx.fillStyle = 'rgba(10,10,16,0.55)';
  for (let i = 0; i < 8; i += 1) {
    const x = i * 220;
    ctx.beginPath();
    ctx.roundRect(x, 120 + (i % 3) * 18, 140, 120, 18);
    ctx.fill();
  }
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  level: RuntimeLevel,
  player: Player,
  cameraX: number,
  now: number,
  options: {
    mode: Mode;
    levelIndex: number;
    runScore: number;
    levelStars: number;
    lives: number;
    result: ResultState;
  },
) {
  drawBackground(ctx, level, cameraX, now);

  ctx.save();
  ctx.translate(-cameraX, 0);

  level.platforms.forEach((platform) => drawPlatform(ctx, platform));
  level.checkpoints.forEach((checkpoint) => drawCheckpoint(ctx, checkpoint, now));
  level.enemies.forEach((enemy) => drawEnemy(ctx, enemy, now));
  level.stars.forEach((star) => {
    if (!star.collected) {
      drawStar(ctx, star, now);
    }
  });
  drawFlag(ctx, level.definition.flag);
  drawPlayer(ctx, player, now);

  ctx.restore();

  if (options.mode !== 'playing') {
    ctx.fillStyle = 'rgba(4,4,8,0.46)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#f5d060';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(212,175,55,0.2)';
    ctx.shadowBlur = 14;
    ctx.font = '900 38px system-ui, sans-serif';
    ctx.fillText(
      options.mode === 'menu'
        ? 'Red Ball'
        : options.result?.heading ?? 'Level Complete!',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 - 10,
    );
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText(
      options.mode === 'menu'
        ? 'Arrow Keys / WASD to move, Space to jump'
        : options.result?.message ?? 'Challenge the next run.',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 24,
    );
  }
}

export default function RedBallPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const isChallengeRun = Boolean(challengeId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<Mode>('menu');
  const levelIndexRef = useRef(0);
  const runScoreRef = useRef(0);
  const runStarsRef = useRef(0);
  const levelStarsRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const timeLeftRef = useRef(MAX_TIME);
  const playerRef = useRef<Player>(createPlayer(LEVELS[0].spawn));
  const levelRef = useRef<RuntimeLevel>(createRuntimeLevel(0));
  const controlsRef = useRef<ControlState>({ left: false, right: false, jumpQueued: false });
  const startTimeRef = useRef<number>(0);
  const accumulatorRef = useRef(0);
  const lastFrameRef = useRef<number>(0);
  const nextCheckpointIndexRef = useRef(1);
  const respawnRef = useRef<Vec2>(LEVELS[0].spawn);
  const rafRef = useRef<number | null>(null);
  const damageFlashUntilRef = useRef(0);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [mode, setMode] = useState<Mode>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [runScore, setRunScore] = useState(0);
  const [levelStars, setLevelStars] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [result, setResult] = useState<ResultState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvasCtxRef.current = canvas.getContext('2d');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        controlsRef.current.left = true;
        event.preventDefault();
      }

      if (key === 'arrowright' || key === 'd') {
        controlsRef.current.right = true;
        event.preventDefault();
      }

      if (key === 'arrowup' || key === 'w' || key === ' ' || key === 'enter') {
        if (modeRef.current === 'playing') {
          controlsRef.current.jumpQueued = true;
        } else if (modeRef.current === 'menu' && (key === ' ' || key === 'enter')) {
          startRun(0);
        } else if (modeRef.current === 'result' && result?.kind === 'levelComplete') {
          handleNextLevel();
        } else if (modeRef.current === 'result' && result?.kind !== 'levelComplete') {
          startRun(levelIndexRef.current);
        }
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === 'arrowleft' || key === 'a') {
        controlsRef.current.left = false;
        event.preventDefault();
      }

      if (key === 'arrowright' || key === 'd') {
        controlsRef.current.right = false;
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const syncUiState = () => {
    setRunScore(runScoreRef.current);
    setLevelStars(levelStarsRef.current);
    setLives(livesRef.current);
    setTimeLeft(timeLeftRef.current);
  };

  function setNewLevel(levelIdx: number, preserveRunScore: boolean) {
    levelIndexRef.current = levelIdx;
    setLevelIndex(levelIdx);
    levelRef.current = createRuntimeLevel(levelIdx);
    playerRef.current = createPlayer(LEVELS[levelIdx].spawn);
    respawnRef.current = LEVELS[levelIdx].spawn;
    nextCheckpointIndexRef.current = 1;
    controlsRef.current = { left: false, right: false, jumpQueued: false };
    livesRef.current = MAX_LIVES;
    levelStarsRef.current = 0;
    timeLeftRef.current = MAX_TIME;
    startTimeRef.current = performance.now();
    damageFlashUntilRef.current = 0;

    if (!preserveRunScore) {
      runScoreRef.current = 0;
      runStarsRef.current = 0;
      setRunScore(0);
    }

    setResult(null);
    setChallengeOpen(false);
    setMode('playing');
    setLives(MAX_LIVES);
    setLevelStars(0);
    setTimeLeft(MAX_TIME);
    if (!preserveRunScore) {
      setRunScore(0);
    }
  }

  function startRun(levelIdx: number) {
    runScoreRef.current = 0;
    runStarsRef.current = 0;
    setNewLevel(levelIdx, false);
  }

  function handleDamage(reason: 'enemy' | 'fall') {
    if (modeRef.current !== 'playing') {
      return;
    }

    const now = performance.now();
    if (now < playerRef.current.invulnerableUntil) {
      return;
    }

    livesRef.current = Math.max(livesRef.current - 1, 0);
    setLives(livesRef.current);
    damageFlashUntilRef.current = now + 260;

    if (livesRef.current <= 0) {
      setResult({
        kind: 'gameOver',
        heading: 'Game Over!',
        message: reason === 'fall' ? 'The jump missed and the run is over.' : 'The enemy caught you out.',
        levelIndex: levelIndexRef.current,
        levelScore: levelStarsRef.current * 10,
        starsCollected: levelStarsRef.current,
        totalScore: runScoreRef.current,
        totalStars: runStarsRef.current,
        livesLeft: 0,
      });
      setMode('result');
      return;
    }

    const respawn = respawnRef.current;
    playerRef.current = {
      ...playerRef.current,
      x: respawn.x,
      y: respawn.y,
      vx: 0,
      vy: 0,
      groundedPlatformId: null,
      invulnerableUntil: now + 1200,
    };
    controlsRef.current.jumpQueued = false;
  }

  function completeLevel() {
    if (modeRef.current !== 'playing') {
      return;
    }

    const nextLevelScore = levelStarsRef.current * 10;
    const nextTotalScore = runScoreRef.current;
    const finalLevel = levelIndexRef.current >= LEVELS.length - 1;

    setResult({
      kind: finalLevel ? 'finalWin' : 'levelComplete',
      heading: finalLevel ? 'You Win!' : 'Level Complete!',
      message: finalLevel
        ? `Total Score: ${nextTotalScore}`
        : `Next up: ${LEVELS[levelIndexRef.current + 1]?.name ?? 'the next stage'}.`,
      levelIndex: levelIndexRef.current,
      levelScore: nextLevelScore,
      starsCollected: levelStarsRef.current,
      totalScore: nextTotalScore,
      totalStars: runStarsRef.current,
      livesLeft: livesRef.current,
    });
    setMode('result');
  }

  function handleNextLevel() {
    if (levelIndexRef.current >= LEVELS.length - 1) {
      startRun(0);
      return;
    }

    runScoreRef.current = runScoreRef.current;
    runStarsRef.current = runStarsRef.current;
    setNewLevel(levelIndexRef.current + 1, true);
  }

  function handlePointerControl(control: 'left' | 'right' | 'jump', active: boolean) {
    if (control === 'jump') {
      if (active && modeRef.current === 'playing') {
        controlsRef.current.jumpQueued = true;
      }
      return;
    }

    controlsRef.current[control] = active;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvasCtxRef.current;
    if (!canvas || !ctx) {
      return;
    }

    const drawStatic = () => {
      drawScene(ctx, levelRef.current, playerRef.current, 0, performance.now(), {
        mode,
        levelIndex,
        runScore,
        levelStars,
        lives,
        result,
      });
    };

    if (mode !== 'playing') {
      drawStatic();
      return;
    }

    accumulatorRef.current = 0;
    lastFrameRef.current = performance.now();

    const frame = (timestamp: number) => {
      if (modeRef.current !== 'playing') {
        return;
      }

      const ctx2d = canvasCtxRef.current;
      if (!ctx2d) {
        return;
      }

      const delta = Math.min(1000, timestamp - lastFrameRef.current);
      lastFrameRef.current = timestamp;
      accumulatorRef.current += delta;

      while (accumulatorRef.current >= FIXED_STEP) {
        const now = timestamp;
        const level = levelRef.current;
        const player = playerRef.current;

        // Move platforms and carry the player when standing on one.
        level.platforms.forEach((platform) => {
          platform.prevX = platform.x;
          if (platform.moving) {
            platform.x += platform.moving.speed * platform.moving.direction;
            if (platform.x <= platform.moving.minX) {
              platform.x = platform.moving.minX;
              platform.moving.direction = 1;
            } else if (platform.x >= platform.moving.maxX) {
              platform.x = platform.moving.maxX;
              platform.moving.direction = -1;
            }
          }
        });

        if (player.groundedPlatformId !== null) {
          const grounded = level.platforms.find((platform) => platform.id === player.groundedPlatformId);
          if (grounded && grounded.moving) {
            player.x += grounded.x - grounded.prevX;
          }
        }

        const moveDirection = (controlsRef.current.left ? -1 : 0) + (controlsRef.current.right ? 1 : 0);
        player.vx = moveDirection * MOVE_SPEED;

        if (controlsRef.current.jumpQueued && player.groundedPlatformId !== null) {
          player.vy = JUMP_VELOCITY;
          player.groundedPlatformId = null;
        }
        controlsRef.current.jumpQueued = false;

        player.vy += GRAVITY;
        player.vy = clamp(player.vy, -20, 12);

        const previousRect = getPlayerRect(player);

        let nextX = player.x + player.vx;
        const horizontalRect = {
          left: nextX,
          top: player.y,
          width: PLAYER_SIZE,
          height: PLAYER_SIZE,
        };

        for (const platform of level.platforms) {
          const horizontalOverlap =
            horizontalRect.top < platform.y + platform.height && horizontalRect.top + horizontalRect.height > platform.y;

          if (!horizontalOverlap) {
            continue;
          }

          if (
            player.vx > 0 &&
            previousRect.left + previousRect.width <= platform.x &&
            nextX + PLAYER_SIZE > platform.x
          ) {
            nextX = platform.x - PLAYER_SIZE;
          } else if (
            player.vx < 0 &&
            previousRect.left >= platform.x + platform.width &&
            nextX < platform.x + platform.width
          ) {
            nextX = platform.x + platform.width;
          }
        }

        player.x = clamp(nextX, 0, level.definition.worldWidth - PLAYER_SIZE);

        let nextY = player.y + player.vy;
        let groundedPlatformId: number | null = null;

        for (const platform of level.platforms) {
          const horizontalOverlap = player.x + PLAYER_SIZE > platform.x && player.x < platform.x + platform.width;
          if (!horizontalOverlap) {
            continue;
          }

          const prevBottom = previousRect.top + previousRect.height;
          const nextBottom = nextY + PLAYER_SIZE;
          const prevTop = previousRect.top;
          const nextTop = nextY;

          if (player.vy >= 0 && prevBottom <= platform.y && nextBottom >= platform.y) {
            nextY = platform.y - PLAYER_SIZE;
            player.vy = 0;
            groundedPlatformId = platform.id;
          } else if (player.vy < 0 && prevTop >= platform.y + platform.height && nextTop <= platform.y + platform.height) {
            nextY = platform.y + platform.height;
            player.vy = 0;
          }
        }

        player.y = nextY;
        player.groundedPlatformId = groundedPlatformId;

        const playerCenterX = player.x + PLAYER_RADIUS;
        const playerCenterY = player.y + PLAYER_RADIUS;
        const checkpoint = level.checkpoints[nextCheckpointIndexRef.current];
        if (checkpoint && playerCenterX >= checkpoint.x) {
          checkpoint.reached = true;
          respawnRef.current = { x: checkpoint.x, y: checkpoint.y };
          nextCheckpointIndexRef.current += 1;
        }

        for (const star of level.stars) {
          if (star.collected) {
            continue;
          }

          const dx = playerCenterX - (star.x + 14);
          const dy = playerCenterY - (star.y + 14);
          if (Math.hypot(dx, dy) <= 22) {
            star.collected = true;
            runScoreRef.current += 10;
            runStarsRef.current += 1;
            levelStarsRef.current += 1;
            setRunScore(runScoreRef.current);
            setLevelStars(levelStarsRef.current);
          }
        }

        if (player.y > CANVAS_HEIGHT + 140) {
          handleDamage('fall');
          break;
        }

        const playerBox = getPlayerRect(player);

        if (now >= player.invulnerableUntil) {
          for (const enemy of level.enemies) {
            if (rectsOverlap(playerBox.left, playerBox.top, playerBox.width, playerBox.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
              handleDamage('enemy');
              break;
            }
          }
        }

        const flag = level.definition.flag;
        if (
          rectsOverlap(
            playerBox.left,
            playerBox.top,
            playerBox.width,
            playerBox.height,
            flag.x,
            flag.y,
            flag.width,
            flag.height,
          )
        ) {
          completeLevel();
          break;
        }

        const elapsedSeconds = Math.floor((timestamp - startTimeRef.current) / 1000);
        const nextTimeLeft = clamp(MAX_TIME - elapsedSeconds, 0, MAX_TIME);
        if (nextTimeLeft !== timeLeftRef.current) {
          timeLeftRef.current = nextTimeLeft;
          setTimeLeft(nextTimeLeft);
        }

        if (nextTimeLeft <= 0) {
          setResult({
            kind: 'gameOver',
            heading: 'Time Up!',
            message: 'The clock ran out before you reached the flag.',
            levelIndex: levelIndexRef.current,
            levelScore: levelStarsRef.current * 10,
            starsCollected: levelStarsRef.current,
            totalScore: runScoreRef.current,
            totalStars: runStarsRef.current,
            livesLeft: livesRef.current,
          });
          setMode('result');
          break;
        }

        accumulatorRef.current -= FIXED_STEP;
      }

      drawScene(ctx2d, levelRef.current, playerRef.current, clamp(playerRef.current.x + PLAYER_RADIUS - CANVAS_WIDTH / 2, 0, Math.max(0, levelRef.current.definition.worldWidth - CANVAS_WIDTH)), timestamp, {
        mode: modeRef.current,
        levelIndex: levelIndexRef.current,
        runScore: runScoreRef.current,
        levelStars: levelStarsRef.current,
        lives: livesRef.current,
        result,
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, levelIndex, result]);

  useEffect(() => {
    if (mode !== 'playing') {
      const canvas = canvasRef.current;
      const ctx = canvasCtxRef.current;
      if (canvas && ctx) {
        drawScene(ctx, levelRef.current, playerRef.current, 0, performance.now(), {
          mode,
          levelIndex,
          runScore,
          levelStars,
          lives,
          result,
        });
      }
    }
  }, [mode, levelIndex, runScore, levelStars, lives, result]);

  const startButtonLabel = levelIndex === 0 ? 'Start Game' : 'Restart Game';
  const currentLevelName = LEVELS[levelIndex]?.name ?? 'Easy';
  const isFinalResult = result?.kind === 'finalWin';
  const challengeScore = result && result.kind !== 'levelComplete' ? result.totalScore : 0;

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Red Ball</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">2D Platformer</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">3 levels</HubBadge>
              {isChallengeRun ? (
                <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge Run</HubBadge>
              ) : null}
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Red Ball</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Run, jump, collect stars, dodge enemies, and race the red ball to the flag across three side-scrolling stages.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar
          gameType="redball"
          playerScore={isFinalResult || result?.kind === 'gameOver' ? challengeScore : undefined}
        />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  mode === 'result'
                    ? result?.kind === 'finalWin'
                      ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      : result?.kind === 'gameOver'
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                    : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                }
              >
                {mode === 'menu'
                  ? 'Ready to Roll'
                  : mode === 'playing'
                    ? `Level ${levelIndex + 1}`
                    : result?.heading ?? 'Result'}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {mode === 'menu'
                  ? 'Press start and go.'
                  : mode === 'playing'
                    ? `${currentLevelName} stage`
                    : result?.heading ?? 'Level Complete!'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {mode === 'menu'
                  ? 'Arrow Keys / WASD to move, Space to jump.'
                  : mode === 'playing'
                    ? 'Grab stars for points, land on platforms, and use checkpoints to keep the run moving.'
                    : result?.message ?? 'Challenge the next run.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[420px] lg:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives</div>
                <div className="mt-1 text-lg font-black text-[#ffb4b4]">
                  {'❤️'.repeat(lives)}
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{runScore}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{levelIndex + 1}/3</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Stars</div>
                <div className="mt-1 text-2xl font-black text-white">{levelStars}</div>
              </div>
            </div>
          </div>

          {mode === 'menu' ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Controls</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Move with Arrow Keys or WASD. Jump with Space, Up, or W. On mobile, use the on-screen buttons.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Objective</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Collect stars for points, hit checkpoints, avoid enemy squares, and reach the red flag at the end of each stage.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {LEVELS.map((level, index) => (
                  <button
                    key={level.name}
                    type="button"
                    onClick={() => {
                      if (index === 0) {
                        setLevelIndex(0);
                      }
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      index === levelIndex
                        ? 'border-[#d4af37]/45 bg-[#d4af37]/10 text-[#f5d060]'
                        : 'border-[#1a1a2e] bg-black/30 text-[#8a8a8a]'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em]">Level {index + 1}</div>
                    <div className="mt-2 text-lg font-black uppercase text-white">{level.name}</div>
                    <div className="mt-2 text-sm text-[#8a8a8a]">
                      {index === 0 ? 'Gaps and stars' : index === 1 ? 'Moving platforms and an enemy' : 'Longer course with more hazards'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mode === 'menu' || mode === 'playing' || mode === 'result' ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-[1.6rem] border border-[#1a1a2e] bg-black/30 p-4 sm:p-5">
                <div className="overflow-hidden rounded-[1.35rem] border border-[#1a1a2e] bg-[linear-gradient(180deg,#0b0b10_0%,#11111a_55%,#17172a_100%)]">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="block h-auto w-full"
                    style={{ touchAction: 'none' }}
                  />
                </div>
              </div>

              {mode === 'playing' ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  <button
                    type="button"
                    onPointerDown={() => handlePointerControl('left', true)}
                    onPointerUp={() => handlePointerControl('left', false)}
                    onPointerLeave={() => handlePointerControl('left', false)}
                    onPointerCancel={() => handlePointerControl('left', false)}
                    className="rounded-2xl border border-[#1a1a2e] bg-white/[0.03] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    style={{ touchAction: 'none' }}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => handlePointerControl('jump', true)}
                    onPointerUp={() => handlePointerControl('jump', false)}
                    onPointerLeave={() => handlePointerControl('jump', false)}
                    onPointerCancel={() => handlePointerControl('jump', false)}
                    className="rounded-2xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#f5d060] transition-colors hover:bg-[#d4af37]/20"
                    style={{ touchAction: 'none' }}
                  >
                    Jump
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => handlePointerControl('right', true)}
                    onPointerUp={() => handlePointerControl('right', false)}
                    onPointerLeave={() => handlePointerControl('right', false)}
                    onPointerCancel={() => handlePointerControl('right', false)}
                    className="rounded-2xl border border-[#1a1a2e] bg-white/[0.03] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    style={{ touchAction: 'none' }}
                  >
                    Right
                  </button>
                  <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4 text-left">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Timer</div>
                    <div className="mt-1 text-2xl font-black text-white">{timeLeft}s</div>
                  </div>
                </div>
              ) : null}

              {mode === 'menu' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startRun(0)}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                  >
                    {startButtonLabel}
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
                    Collect stars. Reach checkpoints. Touch the flag.
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Level Score</div>
                  <div className="mt-2 text-2xl font-black text-white">{result.levelScore}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Total Score</div>
                  <div className="mt-2 text-2xl font-black text-[#f5d060]">{result.totalScore}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Stars Collected</div>
                  <div className="mt-2 text-2xl font-black text-[#30d158]">{result.starsCollected}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives Left</div>
                  <div className="mt-2 text-2xl font-black text-white">{result.livesLeft}</div>
                </div>
              </div>

              <div
                className={`rounded-[1.6rem] border p-6 sm:p-8 ${
                  result.kind === 'finalWin'
                    ? 'border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))]'
                    : result.kind === 'gameOver'
                      ? 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                      : 'border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        result.kind === 'finalWin'
                          ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                          : result.kind === 'gameOver'
                            ? 'border-red-500/30 bg-red-500/10 text-red-200'
                            : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3 className={`mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl ${
                      result.kind === 'finalWin' ? 'text-[#a6f4bf]' : 'text-white'
                    }`}>
                      {result.heading}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">{result.message}</p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.totalScore}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {result.kind === 'levelComplete' ? (
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                    >
                      Next Level
                    </button>
                  ) : null}
                  {result.kind === 'finalWin' ? (
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                    >
                      Challenge a Friend
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => startRun(levelIndexRef.current)}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    {result.kind === 'gameOver' ? 'Retry Level' : 'Play Again'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('menu');
                      setResult(null);
                      setChallengeOpen(false);
                      runScoreRef.current = 0;
                      runStarsRef.current = 0;
                      levelStarsRef.current = 0;
                      livesRef.current = MAX_LIVES;
                      timeLeftRef.current = MAX_TIME;
                      setRunScore(0);
                      setLevelStars(0);
                      setLives(MAX_LIVES);
                      setTimeLeft(MAX_TIME);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-[#1a1a2e] bg-white/[0.04] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/30 hover:bg-[#d4af37]/10"
                  >
                    Back to Menu
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
        gameType="redball"
        playerScore={challengeScore}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </section>
  );
}
