import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MarketListingStatus = 'active' | 'sold';
export type MarketOrderStatus = 'pending' | 'paid' | 'cancelled';

export const MARKET_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home',
  'Collectibles',
  'Gaming',
  'Vehicles',
  'Services',
] as const;

export const MARKET_CONDITIONS = [
  'New',
  'Like New',
  'Excellent',
  'Good',
  'Refurbished',
] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];
export type MarketCondition = (typeof MARKET_CONDITIONS)[number];

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  priceUsd: number;
  city: string;
  condition: MarketCondition;
  images: string[];
  sellerName: string;
  sellerRating: number;
  createdAt: number;
  status: MarketListingStatus;
}

export interface Order {
  id: string;
  listingId: string;
  buyerName: string;
  amountUsd: number;
  status: MarketOrderStatus;
  createdAt: number;
}

export interface CreateListingInput {
  title: string;
  description: string;
  category: MarketCategory;
  priceUsd: number;
  city: string;
  condition: MarketCondition;
  imageUrl: string;
}

export interface MarketStore {
  listings: Listing[];
  orders: Order[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  createListing: (input: CreateListingInput) => Listing;
}

const FIXED_NOW = Date.parse('2026-05-13T12:00:00Z');

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Güvenli Unsplash yapılandırıcı
function buildImages(baseUrl: string): string[] {
  return [`${baseUrl}&auto=format&fit=crop&w=800&q=80`];
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }
  return Math.max(1, Math.min(5, Math.round(value * 10) / 10));
}

const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'listing-arc-scanner-x2',
    title: 'Arc Scanner X2',
    description: 'A compact field scanner with premium battery life and a clean matte finish.',
    category: 'Electronics',
    priceUsd: 420,
    city: 'Istanbul',
    condition: 'Excellent',
    images: buildImages('https://images.unsplash.com/photo-1550009158-9effb619a647?ixlib=rb-4.0.3'), // Temiz teknoloji resmi
    sellerName: 'Mina K.',
    sellerRating: 4.9,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 12,
    status: 'active',
  },
  {
    id: 'listing-signal-jacket',
    title: 'Signal Jacket',
    description: 'Minimal weatherproof jacket with reflective stitching and a premium city fit.',
    category: 'Fashion',
    priceUsd: 145,
    city: 'Paris',
    condition: 'New',
    images: buildImages('https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3'), // Deri/Şık ceket resmi
    sellerName: 'Aylin R.',
    sellerRating: 4.7,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 18,
    status: 'active',
  },
  {
    id: 'listing-studio-desk-light',
    title: 'Studio Desk Light',
    description: 'Warm gold desk lighting for creators, streamers, and late-night builders.',
    category: 'Home',
    priceUsd: 88,
    city: 'Berlin',
    condition: 'Like New',
    images: buildImages('https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3'), // Şık masa lambası
    sellerName: 'Jonas P.',
    sellerRating: 4.8,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 30,
    status: 'active',
  },
  {
    id: 'listing-collector-figure',
    title: 'Arc Collector Figure',
    description: 'Numbered vinyl figure from a limited creator drop with display stand included.',
    category: 'Collectibles',
    priceUsd: 260,
    city: 'Singapore',
    condition: 'New',
    images: buildImages('https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?ixlib=rb-4.0.3'), // Koleksiyon figürü
    sellerName: 'Noah S.',
    sellerRating: 5,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 6,
    status: 'sold',
  },
  {
    id: 'listing-arc-monitor',
    title: 'Portable Monitor 14"',
    description: 'Slim 14-inch portable display tuned for travel, editing, and multi-app workflows.',
    category: 'Electronics',
    priceUsd: 230,
    city: 'Lisbon',
    condition: 'Excellent',
    images: buildImages('https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3'), // Şık monitör
    sellerName: 'Lea M.',
    sellerRating: 4.6,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 8,
    status: 'active',
  },
  {
    id: 'listing-ebike-pack',
    title: 'E-Bike Battery Pack',
    description: 'High-capacity replacement pack with fast-charge support and a sturdy shell.',
    category: 'Vehicles',
    priceUsd: 980,
    city: 'Dubai',
    condition: 'Refurbished',
    images: buildImages('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?ixlib=rb-4.0.3'), // Bisiklet/Batarya
    sellerName: 'Sana A.',
    sellerRating: 4.9,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 22,
    status: 'active',
  },
  {
    id: 'listing-arc-game-speakers',
    title: 'Game Room Speaker Set',
    description: 'Balanced stereo speakers with a sharp profile for desks, rooms, or a market stall.',
    category: 'Gaming',
    priceUsd: 340,
    city: 'London',
    condition: 'Good',
    images: buildImages('https://images.unsplash.com/photo-1545454675-3531b543be5d?ixlib=rb-4.0.3'), // Premium hoparlör seti
    sellerName: 'Theo B.',
    sellerRating: 4.8,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 14,
    status: 'active',
  },
  {
    id: 'listing-strategy-session-pack',
    title: 'Strategy Session Pack',
    description: 'A consulting-style service bundle for founders who want structured launch feedback.',
    category: 'Services',
    priceUsd: 160,
    city: 'Remote',
    condition: 'New',
    images: buildImages('https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3'), // Toplantı/Strateji
    sellerName: 'Arc Studio',
    sellerRating: 5,
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 4,
    status: 'active',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-arc-scanner-x2',
    listingId: 'listing-arc-scanner-x2',
    buyerName: 'Orion Labs',
    amountUsd: 420,
    status: 'paid',
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 2,
  },
  {
    id: 'order-signal-jacket',
    listingId: 'listing-signal-jacket',
    buyerName: 'Northwind',
    amountUsd: 145,
    status: 'pending',
    createdAt: FIXED_NOW - 1_000 * 60 * 45,
  },
  {
    id: 'order-studio-light',
    listingId: 'listing-studio-desk-light',
    buyerName: 'Luna House',
    amountUsd: 88,
    status: 'paid',
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 8,
  },
  {
    id: 'order-ebike-pack',
    listingId: 'listing-ebike-pack',
    buyerName: 'Orbit Mobility',
    amountUsd: 980,
    status: 'cancelled',
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 5,
  },
  {
    id: 'order-monitor-14',
    listingId: 'listing-arc-monitor',
    buyerName: 'Frame Studio',
    amountUsd: 230,
    status: 'paid',
    createdAt: FIXED_NOW - 1_000 * 60 * 60 * 9,
  },
];

export function formatMarketPrice(amountUsd: number): string {
  return `$${Math.max(0, Math.round(amountUsd)).toLocaleString('en-US')}`;
}

export function formatMarketDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatMarketDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function getMarketListingStatusLabel(status: MarketListingStatus): string {
  return status === 'sold' ? 'Sold' : 'Active';
}

export function getMarketOrderStatusLabel(status: MarketOrderStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'cancelled':
      return 'Cancelled';
    case 'pending':
    default:
      return 'Pending';
  }
}

export function getMarketOrderStatusTone(status: MarketOrderStatus): 'emerald' | 'amber' | 'red' {
  switch (status) {
    case 'paid':
      return 'emerald';
    case 'cancelled':
      return 'red';
    case 'pending':
    default:
      return 'amber';
  }
}

export function getMarketCategoryOptions(): MarketCategory[] {
  return [...MARKET_CATEGORIES];
}

interface PersistedMarketState {
  listings: Listing[];
  orders: Order[];
}

interface MarketState extends MarketStore {}

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      listings: INITIAL_LISTINGS,
      orders: INITIAL_ORDERS,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      createListing: (input) => {
        const listing: Listing = {
          id: makeId('listing'),
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category,
          priceUsd: Math.max(0, Math.round(input.priceUsd)),
          city: input.city.trim(),
          condition: input.condition,
          images: [input.imageUrl.trim()],
          sellerName: 'GoGo',
          sellerRating: 5,
          createdAt: Date.now(),
          status: 'active',
        };

        set((state) => ({
          listings: [listing, ...state.listings],
        }));

        return listing;
      },
    }),
    {
      name: 'arc-market-store-v2',
      partialize: (state): PersistedMarketState => ({
        listings: state.listings,
        orders: state.orders,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
