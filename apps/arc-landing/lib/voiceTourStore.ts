import { create } from 'zustand';
import type { Lang } from '@/lib/translations';

export type VoiceTourSectionId = 'pay' | 'creator' | 'play' | 'gameHub';
export type VoiceTourSpeed = 0.9 | 1 | 1.1;
export type VoiceTourStatus = 'idle' | 'playing' | 'paused';
export type VoiceTourRequestMode = 'tour' | 'section';

export const voiceTourOrder = ['pay', 'creator', 'play', 'gameHub'] as const satisfies readonly VoiceTourSectionId[];

export const voiceTourNarration: Record<VoiceTourSectionId, Record<Lang, string>> = {
  pay: {
    en: 'Arc Pay is the fastest way to move USDC. It turns payments into a premium flow with cards, invoices, splits, and escrow-ready paths built for the Arc economy.',
    tr: "Arc Pay, USDC taşımak için en hızlı yoldur. Ödemeleri kartlar, faturalar, bölüştürme akışları ve Arc ekonomisi için hazırlanan emanet yollarıyla premium bir deneyime dönüştürür.",
  },
  creator: {
    en: 'Arc Creator helps creators monetize directly. Tips, subscriptions, bounties, and future marketplaces keep the creator economy on the same stablecoin rails.',
    tr: 'Arc Creator, üreticilerin doğrudan gelir elde etmesine yardımcı olur. Bahşişler, abonelikler, ödül panoları ve gelecekteki pazar yerleri yaratıcı ekonomiyi aynı stabilcoin altyapısında tutar.',
  },
  play: {
    en: 'Arc Play is where gaming meets DeFi. Track progress, open weighted lucky packs, and preview on-chain competition without leaving the Arc experience.',
    tr: 'Arc Play, oyunun DeFi ile buluştuğu yerdir. İlerlemeyi takip et, ağırlıklı şans kartlarını aç ve Arc deneyiminden çıkmadan zincir üstü rekabeti incele.',
  },
  gameHub: {
    en: 'Game Hub ties the arcade together. Challenges, quiz pots, lucky reveals, and history tracking keep the local demo loop moving with clear progress and rewards.',
    tr: 'Oyun Merkezi, arcade deneyimini birbirine bağlar. Görevler, bilgi havuzları, şans kartları ve geçmiş takibi, yerel demo döngüsünü net ilerleme ve ödüllerle canlı tutar.',
  },
};

interface VoiceTourRequest {
  id: number;
  mode: VoiceTourRequestMode;
  sectionId: VoiceTourSectionId | null;
}

export interface VoiceTourState {
  supported: boolean;
  language: Lang;
  speed: VoiceTourSpeed;
  status: VoiceTourStatus;
  activeSectionId: VoiceTourSectionId | null;
  activeSectionIndex: number;
  request: VoiceTourRequest;
  error: string | null;
  setSupported: (supported: boolean) => void;
  setLanguage: (language: Lang) => void;
  setSpeed: (speed: VoiceTourSpeed) => void;
  setStatus: (status: VoiceTourStatus) => void;
  setActiveSection: (sectionId: VoiceTourSectionId | null, sectionIndex?: number) => void;
  setError: (error: string | null) => void;
  requestTour: (mode: VoiceTourRequestMode, sectionId?: VoiceTourSectionId | null) => void;
  resetTour: () => void;
}

export const useVoiceTourStore = create<VoiceTourState>()((set) => ({
  supported: false,
  language: 'en',
  speed: 1,
  status: 'idle',
  activeSectionId: null,
  activeSectionIndex: -1,
  request: {
    id: 0,
    mode: 'tour',
    sectionId: null,
  },
  error: null,
  setSupported: (supported) => set({ supported }),
  setLanguage: (language) => set({ language }),
  setSpeed: (speed) => set({ speed }),
  setStatus: (status) => set({ status }),
  setActiveSection: (sectionId, sectionIndex = -1) =>
    set({
      activeSectionId: sectionId,
      activeSectionIndex: sectionIndex,
    }),
  setError: (error) => set({ error }),
  requestTour: (mode, sectionId = null) =>
    set((state) => ({
      request: {
        id: state.request.id + 1,
        mode,
        sectionId,
      },
      error: null,
    })),
  resetTour: () =>
    set({
      status: 'idle',
      activeSectionId: null,
      activeSectionIndex: -1,
      error: null,
    }),
}));
