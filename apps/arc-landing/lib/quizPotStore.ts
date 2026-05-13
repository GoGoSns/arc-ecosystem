import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuizPotStatus = 'open' | 'live' | 'ended';
export type QuizPotDistribution = 'winner-takes-all' | 'top3-split';

export interface QuizParticipant {
  address: string;
  name: string;
  score: number;
  submittedAt?: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface QuizPot {
  id: string;
  title: string;
  hostName: string;
  potUsd: number;
  questionCount: number;
  durationHours: number;
  status: QuizPotStatus;
  startsAt: number;
  endsAt: number;
  distribution: QuizPotDistribution;
  participants: QuizParticipant[];
  questions: QuizQuestion[];
}

export interface QuizPrizeEntry {
  place: number;
  participant: QuizParticipant;
  amountUsd: number;
  share: number;
}

export type QuizPotMutationReason =
  | 'not-found'
  | 'inactive'
  | 'duplicate'
  | 'invalid-address'
  | 'invalid-name'
  | 'invalid-question'
  | 'invalid-answer'
  | 'invalid-pot';

export type QuizPotMutationResult =
  | { ok: true; message: string }
  | { ok: false; reason: QuizPotMutationReason; message: string };

export type QuizSubmissionResult =
  | {
      ok: true;
      message: string;
      correct: boolean;
      score: number;
      answeredCount: number;
      totalQuestions: number;
      completed: boolean;
      correctIndex: number;
      answerIndex: number;
      questionId: string;
    }
  | {
      ok: false;
      reason: QuizPotMutationReason;
      message: string;
    };

type QuizAnswersByPot = Record<string, Record<string, Record<string, number>>>;

interface PersistedQuizPotState {
  pots: QuizPot[];
  answersByPot: QuizAnswersByPot;
}

interface CreateQuizPotInput {
  title: string;
  potUsd: number;
  questionCount: number;
  durationHours: number;
  distribution: QuizPotDistribution;
}

interface QuizPotStore {
  pots: QuizPot[];
  answersByPot: QuizAnswersByPot;
  createQuizPot: (input: CreateQuizPotInput) => QuizPot;
  joinQuizPot: (potId: string, address: string, name: string) => QuizPotMutationResult;
  submitQuizAnswer: (potId: string, address: string, questionId: string, answerIndex: number) => QuizSubmissionResult;
  getQuizPotById: (potId: string) => QuizPot | undefined;
  getQuizPotAnswersForAddress: (potId: string, address: string) => Record<string, number>;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const NOW = Date.now();
const HOST_NAME = 'Arc Game Desk';

const QUIZ_QUESTION_BANK: Array<Omit<QuizQuestion, 'id'>> = [
  {
    prompt: 'Which pot status means answers are currently accepted?',
    options: ['open', 'live', 'ended', 'paused'],
    correctIndex: 1,
  },
  {
    prompt: 'What prize split is used for a top 3 payout?',
    options: ['70 / 20 / 10', '50 / 30 / 20', '40 / 40 / 20', '100 / 0 / 0'],
    correctIndex: 1,
  },
  {
    prompt: 'How many options are shown for each question?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
  },
  {
    prompt: 'Which action records a selected answer?',
    options: ['Join', 'Submit', 'Claim', 'Skip'],
    correctIndex: 1,
  },
  {
    prompt: 'What should a created pot always include?',
    options: ['title', 'wallet seed', 'gas price', 'private key'],
    correctIndex: 0,
  },
  {
    prompt: 'Which hub metric is part of the quiz pot overview?',
    options: ['live pots', 'RPC latency', 'validator uptime', 'bridge fees'],
    correctIndex: 0,
  },
  {
    prompt: 'Which status means the round has finished?',
    options: ['open', 'live', 'ended', 'queued'],
    correctIndex: 2,
  },
  {
    prompt: 'How many winners does winner-takes-all pay?',
    options: ['1', '2', '3', 'all'],
    correctIndex: 0,
  },
  {
    prompt: 'What does the countdown show before a pot starts?',
    options: ['score', 'host name', 'minutes until start', 'entry count'],
    correctIndex: 2,
  },
  {
    prompt: 'Which field is required to join a pot?',
    options: ['name', 'contract address', 'email', 'private key'],
    correctIndex: 0,
  },
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}

function isQuizPotStatus(value: unknown): value is QuizPotStatus {
  return value === 'open' || value === 'live' || value === 'ended';
}

function isQuizDistribution(value: unknown): value is QuizPotDistribution {
  return value === 'winner-takes-all' || value === 'top3-split';
}

function normalizeQuizAddress(address: string): string {
  return address.trim().toLowerCase();
}

function formatQuizAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

function buildQuizQuestions(potId: string, count: number): QuizQuestion[] {
  const safeCount = clampNumber(count, 1, QUIZ_QUESTION_BANK.length);

  return Array.from({ length: safeCount }, (_, index) => {
    const template = QUIZ_QUESTION_BANK[index % QUIZ_QUESTION_BANK.length];

    return {
      id: `${potId}-q-${index + 1}`,
      prompt: template.prompt,
      options: [...template.options] as [string, string, string, string],
      correctIndex: template.correctIndex,
    };
  });
}

function createQuizPotRecord(input: CreateQuizPotInput, overrides?: Partial<QuizPot>): QuizPot {
  const title = input.title.trim() || 'Untitled Quiz Pot';
  const questionCount = clampNumber(input.questionCount, 3, QUIZ_QUESTION_BANK.length);
  const durationHours = clampNumber(input.durationHours, 1, 24);
  const potUsd = clampNumber(input.potUsd, 25, 100_000);
  const distribution = isQuizDistribution(input.distribution) ? input.distribution : 'winner-takes-all';
  const id = overrides?.id ?? `quiz-${slugify(title) || 'pot'}-${makeId('pot').slice(-4)}`;
  const startsAt = overrides?.startsAt ?? NOW + HOUR_MS;
  const endsAt = overrides?.endsAt ?? startsAt + durationHours * HOUR_MS;
  const status = isQuizPotStatus(overrides?.status) ? overrides.status : 'open';

  return {
    id,
    title,
    hostName: overrides?.hostName ?? HOST_NAME,
    potUsd,
    questionCount,
    durationHours,
    status,
    startsAt,
    endsAt,
    distribution,
    participants: overrides?.participants ?? [],
    questions: overrides?.questions ?? buildQuizQuestions(id, questionCount),
  };
}

function createInitialQuizPots(): QuizPot[] {
  return [
    createQuizPotRecord(
      {
        title: 'Midnight Arc Trivia',
        potUsd: 860,
        questionCount: 5,
        durationHours: 2,
        distribution: 'top3-split',
      },
      {
        id: 'quiz-midnight-arc',
        hostName: 'Nova Host',
        status: 'live',
        startsAt: NOW - HOUR_MS / 2,
        endsAt: NOW + HOUR_MS,
        participants: [
          { address: '0xquiz0001', name: 'Cipher', score: 3, submittedAt: NOW - 20 * 60_000 },
          { address: '0xquiz0002', name: 'Pulse', score: 4, submittedAt: NOW - 18 * 60_000 },
          { address: '0xquiz0003', name: 'Echo', score: 2, submittedAt: NOW - 30 * 60_000 },
          { address: '0xquiz0004', name: 'Flux', score: 1, submittedAt: NOW - 12 * 60_000 },
        ],
      },
    ),
    createQuizPotRecord(
      {
        title: 'Signal Sprint',
        potUsd: 420,
        questionCount: 4,
        durationHours: 1,
        distribution: 'winner-takes-all',
      },
      {
        id: 'quiz-signal-sprint',
        hostName: 'Arc Relay',
        status: 'live',
        startsAt: NOW - 15 * 60_000,
        endsAt: NOW + 45 * 60_000,
        participants: [
          { address: '0xquiz0101', name: 'Vector', score: 2, submittedAt: NOW - 10 * 60_000 },
          { address: '0xquiz0102', name: 'Delta', score: 1, submittedAt: NOW - 9 * 60_000 },
          { address: '0xquiz0103', name: 'Orbit', score: 3, submittedAt: NOW - 14 * 60_000 },
        ],
      },
    ),
    createQuizPotRecord(
      {
        title: 'Aurora Warmup',
        potUsd: 280,
        questionCount: 4,
        durationHours: 2,
        distribution: 'winner-takes-all',
      },
      {
        id: 'quiz-aurora-warmup',
        hostName: 'Pulse Desk',
        status: 'open',
        startsAt: NOW + 60 * 60_000,
        endsAt: NOW + 3 * HOUR_MS,
        participants: [],
      },
    ),
    createQuizPotRecord(
      {
        title: 'Crown Quiz Final',
        potUsd: 1_200,
        questionCount: 6,
        durationHours: 2,
        distribution: 'top3-split',
      },
      {
        id: 'quiz-crown-final',
        hostName: 'Orbit Host',
        status: 'ended',
        startsAt: NOW - 6 * HOUR_MS,
        endsAt: NOW - 4 * HOUR_MS,
        participants: [
          { address: '0xquiz0201', name: 'Nova', score: 6, submittedAt: NOW - 5 * HOUR_MS },
          { address: '0xquiz0202', name: 'Rift', score: 5, submittedAt: NOW - 5 * HOUR_MS + 90_000 },
          { address: '0xquiz0203', name: 'Glow', score: 4, submittedAt: NOW - 5 * HOUR_MS + 180_000 },
          { address: '0xquiz0204', name: 'Beam', score: 2, submittedAt: NOW - 5 * HOUR_MS + 240_000 },
        ],
      },
    ),
  ];
}

export function resolveQuizPotStatus(pot: QuizPot, now = Date.now()): QuizPotStatus {
  if (pot.status === 'ended' || now >= pot.endsAt) {
    return 'ended';
  }

  if (now >= pot.startsAt) {
    return 'live';
  }

  return 'open';
}

export function formatQuizAmount(amount: number): string {
  return `$${Math.max(0, Math.round(amount)).toLocaleString('en-US')}`;
}

export function formatQuizDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatQuizTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatQuizAddressLabel(address: string): string {
  return formatQuizAddress(address);
}

export function formatQuizTimeLeft(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatQuizCountdownParts(ms: number): { label: string; value: number }[] {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: 'DAYS', value: days },
    { label: 'HOURS', value: hours },
    { label: 'MINS', value: minutes },
    { label: 'SECS', value: seconds },
  ];
}

export function sortQuizParticipants(participants: QuizParticipant[]): QuizParticipant[] {
  return [...participants].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aSubmittedAt = a.submittedAt ?? Number.MAX_SAFE_INTEGER;
    const bSubmittedAt = b.submittedAt ?? Number.MAX_SAFE_INTEGER;
    if (aSubmittedAt !== bSubmittedAt) {
      return aSubmittedAt - bSubmittedAt;
    }

    const nameDiff = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    if (nameDiff !== 0) {
      return nameDiff;
    }

    return normalizeQuizAddress(a.address).localeCompare(normalizeQuizAddress(b.address), 'en', { sensitivity: 'base' });
  });
}

export function buildQuizPrizeBreakdown(pot: QuizPot, participants: QuizParticipant[] = pot.participants): QuizPrizeEntry[] {
  const ranked = sortQuizParticipants(participants);
  if (ranked.length === 0) {
    return [];
  }

  if (pot.distribution === 'winner-takes-all') {
    return [
      {
        place: 1,
        participant: ranked[0],
        amountUsd: pot.potUsd,
        share: 100,
      },
    ];
  }

  const shares = [50, 30, 20];
  const winners = ranked.slice(0, 3);
  const baseAmounts = shares.map((share) => Math.floor((pot.potUsd * share) / 100));
  const remainder = Math.max(0, pot.potUsd - baseAmounts.reduce((sum, value) => sum + value, 0));

  return winners.map((participant, index) => ({
    place: index + 1,
    participant,
    amountUsd: index === winners.length - 1 ? baseAmounts[index] + remainder : baseAmounts[index],
    share: shares[index],
  }));
}

function normalizeQuizPot(participant: unknown): QuizParticipant | null {
  if (!participant || typeof participant !== 'object') {
    return null;
  }

  const candidate = participant as Partial<QuizParticipant>;
  const address = typeof candidate.address === 'string' ? candidate.address.trim() : '';
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';

  if (!address || !name) {
    return null;
  }

  return {
    address,
    name,
    score: Math.max(0, Math.round(Number(candidate.score ?? 0) || 0)),
    submittedAt: typeof candidate.submittedAt === 'number' && Number.isFinite(candidate.submittedAt) ? candidate.submittedAt : undefined,
  };
}

function normalizeQuizParticipants(participants: unknown): QuizParticipant[] {
  if (!Array.isArray(participants)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: QuizParticipant[] = [];

  for (const participant of participants) {
    const next = normalizeQuizPot(participant);
    if (!next) {
      continue;
    }

    const key = normalizeQuizAddress(next.address);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(next);
  }

  return normalized;
}

function normalizeQuizQuestions(questions: unknown): QuizQuestion[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((question): QuizQuestion | null => {
      if (!question || typeof question !== 'object') {
        return null;
      }

      const candidate = question as Partial<QuizQuestion>;
      const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
      const prompt = typeof candidate.prompt === 'string' ? candidate.prompt.trim() : '';
      const options = Array.isArray(candidate.options) ? candidate.options : [];
      const correctIndex = typeof candidate.correctIndex === 'number' ? candidate.correctIndex : -1;

      if (!id || !prompt || options.length !== 4 || !options.every((option) => typeof option === 'string' && option.trim()) || correctIndex < 0 || correctIndex > 3) {
        return null;
      }

      return {
        id,
        prompt,
        options: options.map((option) => option.trim()) as [string, string, string, string],
        correctIndex,
      };
    })
    .filter((question): question is QuizQuestion => question !== null);
}

function normalizeQuizPotRecord(pot: unknown): QuizPot | null {
  if (!pot || typeof pot !== 'object') {
    return null;
  }

  const candidate = pot as Partial<QuizPot>;
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';

  if (!id) {
    return null;
  }

  const title = typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : 'Untitled Quiz Pot';
  const hostName = typeof candidate.hostName === 'string' && candidate.hostName.trim() ? candidate.hostName.trim() : HOST_NAME;
  const potUsd = clampNumber(Number(candidate.potUsd ?? 0), 25, 100_000);
  const questionCount = clampNumber(Number(candidate.questionCount ?? 3), 3, QUIZ_QUESTION_BANK.length);
  const durationHours = clampNumber(Number(candidate.durationHours ?? 1), 1, 24);
  const startsAtCandidate = Number(candidate.startsAt);
  const endsAtCandidate = Number(candidate.endsAt);
  const startsAt = Number.isFinite(startsAtCandidate) ? Math.round(startsAtCandidate) : NOW + HOUR_MS;
  const endsAt = Number.isFinite(endsAtCandidate) ? Math.max(startsAt, Math.round(endsAtCandidate)) : startsAt + durationHours * HOUR_MS;
  const status = isQuizPotStatus(candidate.status) ? candidate.status : 'open';
  const distribution = isQuizDistribution(candidate.distribution) ? candidate.distribution : 'winner-takes-all';
  const participants = normalizeQuizParticipants(candidate.participants);
  const questions = normalizeQuizQuestions(candidate.questions);

  return {
    id,
    title,
    hostName,
    potUsd,
    questionCount,
    durationHours,
    status,
    startsAt,
    endsAt,
    distribution,
    participants,
    questions: questions.length > 0 ? questions : buildQuizQuestions(id, questionCount),
  };
}

function normalizeQuizPotCollection(pots: unknown): QuizPot[] {
  if (!Array.isArray(pots)) {
    return [];
  }

  return pots.map((pot) => normalizeQuizPotRecord(pot)).filter((pot): pot is QuizPot => pot !== null);
}

function getParticipantAnswers(potId: string, address: string, answersByPot: QuizAnswersByPot): Record<string, number> {
  const potAnswers = answersByPot[potId] ?? {};
  return potAnswers[normalizeQuizAddress(address)] ?? {};
}

export const useQuizPotStore = create<QuizPotStore>()(
  persist(
    (set, get) => ({
      pots: createInitialQuizPots(),
      answersByPot: {},
      createQuizPot: (input) => {
        const pot = createQuizPotRecord(input, { id: `quiz-${slugify(input.title) || 'pot'}-${makeId('new').slice(-4)}` });

        set((state) => ({
          pots: [pot, ...state.pots],
          answersByPot: {
            ...state.answersByPot,
            [pot.id]: {},
          },
        }));

        return pot;
      },
      joinQuizPot: (potId, address, name) => {
        const normalizedAddress = normalizeQuizAddress(address);
        const trimmedName = name.trim();

        if (!normalizedAddress) {
          return {
            ok: false,
            reason: 'invalid-address',
            message: 'A valid participant address is required.',
          };
        }

        if (!trimmedName) {
          return {
            ok: false,
            reason: 'invalid-name',
            message: 'A display name is required to join the quiz pot.',
          };
        }

        const current = get().pots.find((pot) => pot.id === potId);
        if (!current) {
          return { ok: false, reason: 'not-found', message: 'Quiz pot not found.' };
        }

        if (resolveQuizPotStatus(current) === 'ended') {
          return {
            ok: false,
            reason: 'inactive',
            message: 'This quiz pot has already ended.',
          };
        }

        const alreadyJoined = current.participants.find((participant) => normalizeQuizAddress(participant.address) === normalizedAddress);
        const joinedAt = alreadyJoined?.submittedAt ?? Date.now();

        set((state) => ({
          pots: state.pots.map((pot) =>
            pot.id === potId
              ? {
                  ...pot,
                  participants: alreadyJoined
                    ? pot.participants.map((participant) =>
                        normalizeQuizAddress(participant.address) === normalizedAddress
                          ? {
                              ...participant,
                              name: trimmedName,
                              submittedAt: participant.submittedAt ?? joinedAt,
                            }
                          : participant,
                      )
                    : [
                        {
                          address: normalizedAddress,
                          name: trimmedName,
                          score: 0,
                          submittedAt: joinedAt,
                        },
                        ...pot.participants,
                      ],
                }
              : pot,
          ),
          answersByPot: {
            ...state.answersByPot,
            [potId]: {
              ...(state.answersByPot[potId] ?? {}),
              [normalizedAddress]: state.answersByPot[potId]?.[normalizedAddress] ?? {},
            },
          },
        }));

        return {
          ok: true,
          message: alreadyJoined ? 'Quiz entry updated.' : 'Joined the quiz pot.',
        };
      },
      submitQuizAnswer: (potId, address, questionId, answerIndex) => {
        const normalizedAddress = normalizeQuizAddress(address);
        const currentPot = get().pots.find((pot) => pot.id === potId);

        if (!currentPot) {
          return { ok: false, reason: 'not-found', message: 'Quiz pot not found.' };
        }

        if (resolveQuizPotStatus(currentPot) !== 'live') {
          return {
            ok: false,
            reason: 'inactive',
            message: 'Answers can only be submitted while the pot is live.',
          };
        }

        const participant = currentPot.participants.find((entry) => normalizeQuizAddress(entry.address) === normalizedAddress);
        if (!participant) {
          return {
            ok: false,
            reason: 'inactive',
            message: 'Join the pot before submitting answers.',
          };
        }

        const question = currentPot.questions.find((entry) => entry.id === questionId);
        if (!question) {
          return { ok: false, reason: 'invalid-question', message: 'Question not found.' };
        }

        if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
          return { ok: false, reason: 'invalid-answer', message: 'Pick one of the available answers.' };
        }

        const potAnswers = get().answersByPot[potId] ?? {};
        const participantAnswers = potAnswers[normalizedAddress] ?? {};
        if (Object.prototype.hasOwnProperty.call(participantAnswers, questionId)) {
          return {
            ok: false,
            reason: 'duplicate',
            message: 'This question has already been submitted.',
          };
        }

        const correct = answerIndex === question.correctIndex;
        const nextScore = participant.score + (correct ? 1 : 0);
        const nextAnswers = {
          ...participantAnswers,
          [questionId]: answerIndex,
        };
        const answeredCount = Object.keys(nextAnswers).length;
        const completed = answeredCount >= currentPot.questions.length;
        const submittedAt = participant.submittedAt ?? Date.now();

        set((state) => ({
          pots: state.pots.map((pot) =>
            pot.id === potId
              ? {
                  ...pot,
                  participants: pot.participants.map((entry) =>
                    normalizeQuizAddress(entry.address) === normalizedAddress
                      ? {
                          ...entry,
                          score: nextScore,
                          submittedAt,
                        }
                      : entry,
                  ),
                }
              : pot,
          ),
          answersByPot: {
            ...state.answersByPot,
            [potId]: {
              ...(state.answersByPot[potId] ?? {}),
              [normalizedAddress]: nextAnswers,
            },
          },
        }));

        return {
          ok: true,
          message: correct ? 'Correct answer recorded.' : 'Answer recorded.',
          correct,
          score: nextScore,
          answeredCount,
          totalQuestions: currentPot.questions.length,
          completed,
          correctIndex: question.correctIndex,
          answerIndex,
          questionId,
        };
      },
      getQuizPotById: (potId) => get().pots.find((pot) => pot.id === potId),
      getQuizPotAnswersForAddress: (potId, address) => {
        const answers = getParticipantAnswers(potId, address, get().answersByPot);
        return answers;
      },
    }),
    {
      name: 'arclanding:quiz-pot',
      partialize: (state): PersistedQuizPotState => ({
        pots: state.pots,
        answersByPot: state.answersByPot,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedQuizPotState> | undefined;
        const pots = persisted?.pots ? normalizeQuizPotCollection(persisted.pots) : currentState.pots;
        const answersByPot = persisted?.answersByPot && typeof persisted.answersByPot === 'object' ? persisted.answersByPot : currentState.answersByPot;

        return {
          ...currentState,
          pots,
          answersByPot,
        };
      },
    },
  ),
);
