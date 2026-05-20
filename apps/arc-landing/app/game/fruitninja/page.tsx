'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChallengeBar } from '@/components/ChallengeBar';
import { ChallengeModal } from '@/components/ChallengeModal';
import { HubBadge, HubCard } from '@/components/HubPrimitives';

type Mode = 'menu' | 'playing' | 'result';
type FruitKind = 'apple' | 'orange' | 'lemon' | 'grape' | 'watermelon' | 'bomb';
type ResultReason = 'time' | 'gameover';

type Point = {
  x: number;
  y: number;
};

type Fruit = {
  id: number;
  kind: FruitKind;
  label: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  sliceAt: number | null;
  sliceAngle: number;
  removed: boolean;
};

type SlashSegment = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  createdAt: number;
};

type ResultState = {
  heading: string;
  message: string;
  finalScore: number;
  bestCombo: number;
  fruitsSliced: number;
  reason: ResultReason;
} | null;

type ComboBanner = {
  text: string;
  bonus: number;
} | null;

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const ROUND_SECONDS = 60;
const MAX_LIVES = 3;
const MAX_ACTIVE_FRUITS = 5;
const FRUIT_RADIUS = 25;
const GRAVITY = 0.3;
const SLASH_FADE_MS = 300;

const FRUIT_POOL: Array<Pick<Fruit, 'kind' | 'label' | 'color'>> = [
  { kind: 'apple', label: 'A', color: '#ff5b5b' },
  { kind: 'orange', label: 'O', color: '#ff9f2b' },
  { kind: 'lemon', label: 'L', color: '#f5d948' },
  { kind: 'grape', label: 'G', color: '#9d6bff' },
  { kind: 'watermelon', label: 'W', color: '#4cd37b' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
  const cx = start.x + dx * t;
  const cy = start.y + dy * t;
  return Math.hypot(point.x - cx, point.y - cy);
}

function createFruit(id: number, now: number): Fruit {
  const bombChance = clamp(0.12 + (now / 60000) * 0.08, 0.12, 0.2);
  const isBomb = Math.random() < bombChance;
  const palette = FRUIT_POOL[Math.floor(Math.random() * FRUIT_POOL.length)];

  return {
    id,
    kind: isBomb ? 'bomb' : palette.kind,
    label: isBomb ? 'X' : palette.label,
    color: isBomb ? '#101014' : palette.color,
    x: 60 + Math.random() * (CANVAS_WIDTH - 120),
    y: CANVAS_HEIGHT + 30 + Math.random() * 40,
    vx: -3 + Math.random() * 6,
    vy: -12 + Math.random() * 4,
    radius: FRUIT_RADIUS,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: -0.12 + Math.random() * 0.24,
    sliced: false,
    sliceAt: null,
    sliceAngle: 0,
    removed: false,
  };
}

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function getTouchPoint(canvas: HTMLCanvasElement, event: TouchEvent<HTMLCanvasElement>): Point | null {
  const touch = event.touches[0] ?? event.changedTouches[0];
  if (!touch) {
    return null;
  }

  return getCanvasPoint(canvas, touch.clientX, touch.clientY);
}

function drawBackground(ctx: CanvasRenderingContext2D, now: number, mode: Mode) {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#050508');
  gradient.addColorStop(1, '#0e0e16');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const glow = ctx.createRadialGradient(CANVAS_WIDTH * 0.5, 120, 40, CANVAS_WIDTH * 0.5, 120, 340);
  glow.addColorStop(0, 'rgba(212,175,55,0.09)');
  glow.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let index = 0; index < 16; index += 1) {
    const x = (index * 43 + now * 0.015) % CANVAS_WIDTH;
    const y = 60 + (index % 7) * 80;
    ctx.fillRect(x, y, 2, 2);
  }

  if (mode !== 'playing') {
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let index = 0; index < 6; index += 1) {
      const x = 110 + index * 86 + Math.sin(now / 800 + index) * 12;
      const y = 500 - index * 42;
      ctx.beginPath();
      ctx.arc(x, y, 20 + (index % 3) * 3, 0, Math.PI * 2);
      ctx.fillStyle = index === 5 ? '#111118' : FRUIT_POOL[index % FRUIT_POOL.length].color;
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFruitFace(ctx: CanvasRenderingContext2D, fruit: Fruit) {
  ctx.save();
  ctx.shadowColor = fruit.kind === 'bomb' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
  ctx.fillStyle = fruit.color;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (fruit.kind !== 'bomb') {
    ctx.beginPath();
    ctx.arc(-6, -7, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(-7, -8, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, -14);
    ctx.lineTo(8, -25);
    ctx.strokeStyle = '#f5d060';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawWholeFruit(ctx: CanvasRenderingContext2D, fruit: Fruit) {
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rotation);

  drawFruitFace(ctx, fruit);

  ctx.fillStyle = fruit.kind === 'bomb' ? '#ff5252' : '#ffffff';
  ctx.font = '900 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = fruit.kind === 'bomb' ? 'rgba(255,82,82,0.4)' : 'rgba(255,255,255,0.25)';
  ctx.shadowBlur = 10;
  ctx.fillText(fruit.label, 0, 1);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSlicedFruit(ctx: CanvasRenderingContext2D, fruit: Fruit, now: number) {
  if (fruit.sliceAt === null) {
    return;
  }

  const age = now - fruit.sliceAt;
  const progress = clamp(age / 260, 0, 1);
  const separation = 8 + progress * 20;
  const splitRotation = fruit.sliceAngle + Math.PI / 2;
  const offsetX = Math.cos(splitRotation) * separation;
  const offsetY = Math.sin(splitRotation) * separation;

  const drawHalf = (side: 'left' | 'right') => {
    ctx.save();
    ctx.translate(
      fruit.x + (side === 'left' ? -offsetX : offsetX),
      fruit.y + (side === 'left' ? -offsetY : offsetY),
    );
    ctx.rotate(splitRotation);
    ctx.globalAlpha = 1 - progress * 0.2;
    ctx.beginPath();
    if (side === 'left') {
      ctx.arc(0, 0, fruit.radius, Math.PI / 2, (Math.PI * 3) / 2);
    } else {
      ctx.arc(0, 0, fruit.radius, -(Math.PI / 2), Math.PI / 2);
    }
    ctx.closePath();
    ctx.fillStyle = fruit.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fruit.kind === 'bomb' ? -6 : -5, -8, fruit.kind === 'bomb' ? 2 : 6, 0, Math.PI * 2);
    ctx.fillStyle = fruit.kind === 'bomb' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.restore();
  };

  drawHalf('left');
  drawHalf('right');
}

function drawSlashSegments(ctx: CanvasRenderingContext2D, segments: SlashSegment[], now: number) {
  segments.forEach((segment) => {
    const age = now - segment.createdAt;
    if (age > SLASH_FADE_MS) {
      return;
    }

    const alpha = 1 - age / SLASH_FADE_MS;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.9})`;
    ctx.shadowColor = `rgba(245,208,96,${alpha * 0.6})`;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(245,208,96,${alpha * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  fruits: Fruit[],
  segments: SlashSegment[],
  mode: Mode,
  now: number,
  flashUntil: number,
) {
  drawBackground(ctx, now, mode);

  drawSlashSegments(ctx, segments, now);

  fruits.forEach((fruit) => {
    if (fruit.removed) {
      return;
    }

    if (fruit.sliced) {
      drawSlicedFruit(ctx, fruit, now);
    } else {
      drawWholeFruit(ctx, fruit);
    }
  });

  if (now < flashUntil) {
    const alpha = (flashUntil - now) / 220;
    ctx.fillStyle = `rgba(255,40,40,${alpha * 0.18})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (mode !== 'playing') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d060';
    ctx.shadowColor = 'rgba(212,175,55,0.22)';
    ctx.shadowBlur = 16;
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.fillText(mode === 'menu' ? 'Fruit Ninja' : 'Run Complete', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(
      mode === 'menu' ? 'Swipe fast to slice fruits and avoid bombs.' : 'Check the score summary below and challenge a friend.',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 14,
    );
    ctx.restore();
  }
}

export default function FruitNinjaPage() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const isChallengeRun = Boolean(challengeId);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<Mode>('menu');
  const fruitsRef = useRef<Fruit[]>([]);
  const segmentsRef = useRef<SlashSegment[]>([]);
  const nextFruitIdRef = useRef(1);
  const nextSpawnAtRef = useRef(0);
  const lastFrameRef = useRef(0);
  const gameStartRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const timeLeftRef = useRef(ROUND_SECONDS);
  const fruitsSlicedRef = useRef(0);
  const bestComboRef = useRef(0);
  const missesThisLifeRef = useRef(0);
  const comboCountRef = useRef(0);
  const swipeActiveRef = useRef(false);
  const lastPointerRef = useRef<Point | null>(null);
  const flashUntilRef = useRef(0);
  const comboTimerRef = useRef<number | null>(null);
  const touchCooldownRef = useRef(0);

  const [mode, setMode] = useState<Mode>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [fruitsSliced, setFruitsSliced] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [result, setResult] = useState<ResultState>(null);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [comboBanner, setComboBanner] = useState<ComboBanner>(null);

  const clearComboBanner = () => {
    if (comboTimerRef.current !== null) {
      window.clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  };

  const syncUi = () => {
    setScore(scoreRef.current);
    setLives(livesRef.current);
    setTimeLeft(timeLeftRef.current);
    setFruitsSliced(fruitsSlicedRef.current);
    setBestCombo(bestComboRef.current);
  };

  const finishGame = (reason: ResultReason) => {
    if (modeRef.current !== 'playing') {
      return;
    }

    modeRef.current = 'result';
    swipeActiveRef.current = false;
    lastPointerRef.current = null;
    setMode('result');
    setResult({
      heading: reason === 'time' ? "Time's Up!" : 'Game Over!',
      message:
        reason === 'time'
          ? 'The clock hit zero. Final score locked in.'
          : 'You ran out of lives before the timer expired.',
      finalScore: scoreRef.current,
      bestCombo: bestComboRef.current,
      fruitsSliced: fruitsSlicedRef.current,
      reason,
    });
  };

  const spawnFruit = (now: number) => {
    fruitsRef.current.push(createFruit(nextFruitIdRef.current, now));
    nextFruitIdRef.current += 1;
  };

  const showComboBanner = (hits: number) => {
    if (hits < 3) {
      return;
    }

    const bonus = hits * 10;
    clearComboBanner();
    setComboBanner({ text: `${hits}x COMBO! +${bonus}`, bonus });
    comboTimerRef.current = window.setTimeout(() => {
      setComboBanner(null);
      comboTimerRef.current = null;
    }, 900);
  };

  const finishSwipe = () => {
    swipeActiveRef.current = false;

    const hits = comboCountRef.current;
    if (hits >= 3) {
      const bonus = hits * 10;
      scoreRef.current += bonus;
      setScore(scoreRef.current);
      showComboBanner(hits);
    }

    bestComboRef.current = Math.max(bestComboRef.current, hits);
    setBestCombo(bestComboRef.current);

    comboCountRef.current = 0;
    lastPointerRef.current = null;
  };

  const sliceAlongSegment = (start: Point, end: Point, now: number) => {
    let slicedAny = false;

    fruitsRef.current.forEach((fruit) => {
      if (fruit.removed || fruit.sliced) {
        return;
      }

      const hitDistance = distanceToSegment({ x: fruit.x, y: fruit.y }, start, end);
      if (hitDistance > fruit.radius) {
        return;
      }

      fruit.sliced = true;
      fruit.sliceAt = now;
      fruit.sliceAngle = Math.atan2(end.y - start.y, end.x - start.x);

      if (fruit.kind === 'bomb') {
        scoreRef.current = Math.max(0, scoreRef.current - 10);
        setScore(scoreRef.current);
        flashUntilRef.current = now + 220;
        fruit.removed = true;
      } else {
        scoreRef.current += 10;
        fruitsSlicedRef.current += 1;
        comboCountRef.current += 1;
        setScore(scoreRef.current);
        setFruitsSliced(fruitsSlicedRef.current);
      }

      slicedAny = true;
    });

    return slicedAny;
  };

  const beginSwipe = (point: Point, now: number) => {
    if (modeRef.current !== 'playing') {
      return;
    }

    swipeActiveRef.current = true;
    comboCountRef.current = 0;
    lastPointerRef.current = point;
    sliceAlongSegment(point, point, now);
  };

  const moveSwipe = (point: Point, now: number) => {
    if (modeRef.current !== 'playing' || !swipeActiveRef.current) {
      return;
    }

    const last = lastPointerRef.current;
    if (last) {
      segmentsRef.current.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        x1: last.x,
        y1: last.y,
        x2: point.x,
        y2: point.y,
        createdAt: now,
      });
      if (segmentsRef.current.length > 32) {
        segmentsRef.current = segmentsRef.current.slice(-32);
      }

      sliceAlongSegment(last, point, now);
    }

    lastPointerRef.current = point;
  };

  const handlePointerDownPoint = (point: Point, now: number) => {
    beginSwipe(point, now);
  };

  const handlePointerMovePoint = (point: Point, now: number) => {
    moveSwipe(point, now);
  };

  const handlePointerUpPoint = () => {
    if (!swipeActiveRef.current) {
      return;
    }

    finishSwipe();
  };

  const startGame = () => {
    clearComboBanner();
    setComboBanner(null);
    modeRef.current = 'playing';
    setMode('playing');
    setResult(null);
    setChallengeOpen(false);

    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    timeLeftRef.current = ROUND_SECONDS;
    fruitsSlicedRef.current = 0;
    bestComboRef.current = 0;
    missesThisLifeRef.current = 0;
    comboCountRef.current = 0;
    swipeActiveRef.current = false;
    lastPointerRef.current = null;
    flashUntilRef.current = 0;

    fruitsRef.current = [];
    segmentsRef.current = [];
    nextFruitIdRef.current = 1;

    const now = performance.now();
    gameStartRef.current = now;
    lastFrameRef.current = now;
    nextSpawnAtRef.current = now + 450;

    syncUi();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    ctxRef.current = canvas.getContext('2d');
  }, [mode]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (mode !== 'playing') {
      const ctx = ctxRef.current;
      if (ctx) {
        drawScene(ctx, fruitsRef.current, segmentsRef.current, mode, performance.now(), flashUntilRef.current);
      }
      return;
    }

    const frame = (timestamp: number) => {
      if (modeRef.current !== 'playing') {
        return;
      }

      const ctx = ctxRef.current;
      if (!ctx) {
        return;
      }

      const delta = Math.min(32, timestamp - lastFrameRef.current);
      lastFrameRef.current = timestamp;
      const step = delta / (1000 / 60);

      const elapsedSeconds = Math.floor((timestamp - gameStartRef.current) / 1000);
      const nextTimeLeft = clamp(ROUND_SECONDS - elapsedSeconds, 0, ROUND_SECONDS);
      if (nextTimeLeft !== timeLeftRef.current) {
        timeLeftRef.current = nextTimeLeft;
        setTimeLeft(nextTimeLeft);
      }

      if (nextTimeLeft <= 0) {
        finishGame('time');
        drawScene(ctx, fruitsRef.current, segmentsRef.current, 'result', timestamp, flashUntilRef.current);
        return;
      }

      while (timestamp >= nextSpawnAtRef.current && fruitsRef.current.filter((fruit) => !fruit.removed).length < MAX_ACTIVE_FRUITS) {
        spawnFruit(timestamp);
        const difficulty = clamp((ROUND_SECONDS - nextTimeLeft) / ROUND_SECONDS, 0, 1);
        const minDelay = 800 - difficulty * 320;
        const maxDelay = 1500 - difficulty * 650;
        nextSpawnAtRef.current = timestamp + (minDelay + Math.random() * (maxDelay - minDelay));
      }

      fruitsRef.current.forEach((fruit) => {
        if (fruit.removed) {
          return;
        }

        fruit.vy += GRAVITY * step;
        fruit.x += fruit.vx * step;
        fruit.y += fruit.vy * step;
        fruit.rotation += fruit.rotationSpeed * step;

        if (fruit.sliced && fruit.sliceAt !== null && timestamp - fruit.sliceAt > 420) {
          fruit.removed = true;
        }

        if (!fruit.sliced && fruit.y - fruit.radius > CANVAS_HEIGHT + 50) {
          if (fruit.kind !== 'bomb') {
            missesThisLifeRef.current += 1;
            if (missesThisLifeRef.current >= 3) {
              missesThisLifeRef.current = 0;
              livesRef.current = Math.max(0, livesRef.current - 1);
              setLives(livesRef.current);
              if (livesRef.current <= 0) {
                finishGame('gameover');
                return;
              }
            }
          }

          fruit.removed = true;
        }

        if (fruit.x < -80 || fruit.x > CANVAS_WIDTH + 80) {
          fruit.removed = true;
        }
      });

      segmentsRef.current = segmentsRef.current.filter((segment) => timestamp - segment.createdAt <= SLASH_FADE_MS);
      fruitsRef.current = fruitsRef.current.filter((fruit) => !fruit.removed || (fruit.sliced && fruit.sliceAt !== null && timestamp - fruit.sliceAt <= 420));

      drawScene(ctx, fruitsRef.current, segmentsRef.current, modeRef.current, timestamp, flashUntilRef.current);
      rafRef.current = window.requestAnimationFrame(frame);
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
    if (mode === 'playing') {
      return;
    }

    const ctx = ctxRef.current;
    if (ctx) {
      drawScene(ctx, fruitsRef.current, segmentsRef.current, mode, performance.now(), flashUntilRef.current);
    }
  }, [mode, result, score, lives, timeLeft, comboBanner]);

  useEffect(() => {
    return () => {
      clearComboBanner();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || Date.now() - touchCooldownRef.current < 500) {
      return;
    }

    const point = getCanvasPoint(canvasRef.current, event.clientX, event.clientY);
    handlePointerDownPoint(point, performance.now());
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !swipeActiveRef.current || Date.now() - touchCooldownRef.current < 500) {
      return;
    }

    const point = getCanvasPoint(canvasRef.current, event.clientX, event.clientY);
    handlePointerMovePoint(point, performance.now());
  };

  const handleMouseUp = () => {
    if (Date.now() - touchCooldownRef.current < 500) {
      return;
    }

    handlePointerUpPoint();
  };

  const handleTouchStart = (event: TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!canvasRef.current) {
      return;
    }

    touchCooldownRef.current = Date.now();
    const point = getTouchPoint(canvasRef.current, event);
    if (point) {
      handlePointerDownPoint(point, performance.now());
    }
  };

  const handleTouchMove = (event: TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!canvasRef.current) {
      return;
    }

    const point = getTouchPoint(canvasRef.current, event);
    if (point) {
      handlePointerMovePoint(point, performance.now());
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    touchCooldownRef.current = Date.now();
    handlePointerUpPoint();
  };

  const finalScore = result?.finalScore ?? 0;
  const resultTitle = result?.heading ?? 'Game Over!';

  return (
    <section className="px-4 pt-4 pb-20 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f0d79e]">Fruit Ninja</HubBadge>
              <HubBadge className="border-[#1a1a2e] bg-white/[0.02] text-[#8a8a8a]">Swipe Slice</HubBadge>
              <HubBadge className="border-[#30d158]/20 bg-[#30d158]/10 text-[#a6f4bf]">60 second run</HubBadge>
              {isChallengeRun ? (
                <HubBadge className="border-[#d4af37]/25 bg-[#d4af37]/10 text-[#f5d060]">Challenge Run</HubBadge>
              ) : null}
            </div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">Fruit Ninja</h1>
            <p className="max-w-3xl text-base leading-7 text-[#8a8a8a] sm:text-lg">
              Slice fruits, dodge bombs, and stack combos before the timer expires.
            </p>
          </div>

          <Link
            href="/game"
            className="bracket-button shrink-0 px-3 py-2 text-[10px] focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Back to Games
          </Link>
        </div>

        <ChallengeBar gameType="fruitninja" playerScore={mode === 'result' ? finalScore : undefined} />

        <HubCard as="section" className="overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <HubBadge
                className={
                  mode === 'result'
                    ? result?.reason === 'time'
                      ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                      : 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f5d060]'
                }
              >
                {mode === 'menu' ? 'Ready to Slice' : mode === 'playing' ? 'Clock is ticking' : resultTitle}
              </HubBadge>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                {mode === 'menu'
                  ? 'Swipe into the round.'
                  : mode === 'playing'
                    ? 'Slice fast and keep the combo alive.'
                    : resultTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">
                {mode === 'menu'
                  ? 'Use a fast swipe to cut fruits, avoid bombs, and build combo bonuses.'
                  : mode === 'playing'
                    ? 'Hit three or more fruits in one swipe to trigger a combo bonus.'
                    : result?.message ?? 'Challenge the next run.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[520px] lg:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Score</div>
                <div className="mt-1 text-2xl font-black text-[#f5d060]">{score}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Timer</div>
                <div className={`mt-1 text-2xl font-black ${timeLeft <= 10 ? 'text-red-200' : 'text-white'}`}>{timeLeft}s</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Lives</div>
                <div className="mt-1 text-lg font-black text-[#ffb4b4]">{'❤️'.repeat(lives)}</div>
              </div>
              <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Fruits</div>
                <div className="mt-1 text-2xl font-black text-[#30d158]">{fruitsSliced}</div>
              </div>
            </div>
          </div>

          {mode === 'menu' ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Controls</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Swipe with a mouse or finger. Fast moves cut fruit, and touching a bomb costs score.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">Scoring</p>
                  <p className="mt-3 text-sm leading-7 text-[#8a8a9a]">
                    Each fruit is worth 10 points. Slice 3 or more in one swipe for a combo bonus equal to the combo count times 10.
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
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.4rem] border border-[#1a1a2e] bg-black/30 p-4">
              <div className="relative overflow-hidden rounded-[1.2rem] border border-[#1a1a2e] bg-black/45">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="block h-auto w-full select-none"
                  style={{ touchAction: 'none', cursor: 'crosshair' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                />

                {mode === 'playing' ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="rounded-full border border-[#1a1a2e] bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#8a8a8a]">
                        Slice fast
                      </div>
                      <div className="rounded-full border border-[#1a1a2e] bg-black/45 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#8a8a8a]">
                        Swipe to cut
                      </div>
                    </div>

                    <div className="flex flex-1 items-center justify-center">
                      {comboBanner ? (
                        <div className="rounded-[1.2rem] border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(0,0,0,0.42))] px-5 py-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.12)]">
                          <div className="text-xs font-mono uppercase tracking-[0.28em] text-[#f0d79e]">Combo</div>
                          <div className="mt-2 text-3xl font-black text-[#f5d060]">{comboBanner.text}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
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
                Avoid bombs. Score combo bonuses. Challenge friends on the final score.
              </span>
            </div>
          ) : null}

          {mode === 'result' && result ? (
            <div className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Final Score</div>
                  <div className="mt-2 text-3xl font-black text-[#f5d060]">{result.finalScore}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Best Combo</div>
                  <div className="mt-2 text-3xl font-black text-[#30d158]">{result.bestCombo}</div>
                </div>
                <div className="rounded-2xl border border-[#1a1a2e] bg-black/30 px-4 py-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#8a8a8a]">Fruits Sliced</div>
                  <div className="mt-2 text-3xl font-black text-white">{result.fruitsSliced}</div>
                </div>
              </div>

              <div
                className={`rounded-[1.6rem] border p-6 sm:p-8 ${
                  result.reason === 'time'
                    ? 'border-[#30d158]/25 bg-[linear-gradient(135deg,rgba(48,209,88,0.12),rgba(255,255,255,0.02))]'
                    : 'border-red-500/25 bg-[linear-gradient(135deg,rgba(239,68,68,0.12),rgba(13,13,18,0.96))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <HubBadge
                      className={
                        result.reason === 'time'
                          ? 'border-[#30d158]/30 bg-[#30d158]/10 text-[#a6f4bf]'
                          : 'border-red-500/30 bg-red-500/10 text-red-200'
                      }
                    >
                      Result
                    </HubBadge>
                    <h3 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-5xl text-white">{resultTitle}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a8a8a]">{result.message}</p>
                  </div>

                  <div className="rounded-3xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4 text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#f0d79e]">Score</div>
                    <div className="mt-2 text-4xl font-black text-[#f5d060]">{result.finalScore}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setChallengeOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#f5d060]"
                  >
                    Challenge a Friend
                  </button>
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
        gameType="fruitninja"
        playerScore={finalScore}
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </section>
  );
}
