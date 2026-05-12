import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ServiceTier {
  price: number;
  deliveryDays: number;
  revisions: number;
  description: string;
  features: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: 'design' | 'development' | 'writing' | 'video' | 'marketing' | 'other';
  pricingMode: 'single' | 'tiered' | 'hourly';
  singlePrice?: number;
  singleDeliveryDays?: number;
  tiers?: {
    basic: ServiceTier;
    standard: ServiceTier;
    premium: ServiceTier;
  };
  hourlyRate?: number;
  minHours?: number;
  skills: string[];
  sellerAddress: string;
  sellerName?: string;
  sellerBio?: string;
  sellerAvatar?: string;
  ordersCompleted: number;
  rating: number;
  ratingCount: number;
  status: 'active' | 'paused' | 'archived';
  createdAt: number;
}

export interface Order {
  id: string;
  serviceId: string;
  service: Pick<Service, 'id' | 'title' | 'sellerAddress' | 'category'>;
  selectedTier?: 'basic' | 'standard' | 'premium' | 'single';
  selectedHours?: number;
  totalAmount: number;
  deliveryDays: number;
  buyerAddress: string;
  sellerAddress: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  requirements: string;
  attachmentUrl?: string;
  paymentTxHash: string;
  deliveryUrl?: string;
  deliveryNote?: string;
  deliveredAt?: number;
  completedAt?: number;
  rating?: number;
  review?: string;
  createdAt: number;
  cancelledAt?: number;
  refundTxHash?: string;
}

interface MarketplaceStore {
  services: Service[];
  orders: Order[];
  addService: (service: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
}

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set) => ({
      services: [],
      orders: [],
      addService: (service) =>
        set((state) => ({ services: [service, ...state.services] })),
      updateService: (id, updates) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),
      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
    }),
    {
      name: 'arccreator:marketplace',
    }
  )
);
