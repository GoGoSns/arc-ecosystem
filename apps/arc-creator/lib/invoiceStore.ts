import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  from: {
    name: string;
    wallet: string;
    email: string;
    website: string;
  };
  to: {
    name: string;
    email: string;
    wallet: string;
  };
  items: LineItem[];
  taxPercent: string;
  notes: string;
  status: 'unpaid' | 'pending' | 'paid';
  txHash?: string;
  createdAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function fmtMoney(n: number): string {
  return n.toFixed(2);
}

export function calcRowTotal(qty: string, price: string): number {
  return (parseFloat(qty) || 0) * (parseFloat(price) || 0);
}

export function calcTotals(
  items: LineItem[],
  taxPct: string
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((s, it) => s + calcRowTotal(it.quantity, it.unitPrice), 0);
  const tax = subtotal * ((parseFloat(taxPct) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface InvoiceStore {
  invoices: Record<string, Invoice>;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      invoices: {},
      addInvoice: (invoice) =>
        set((s) => ({ invoices: { ...s.invoices, [invoice.id]: invoice } })),
      updateInvoice: (id, updates) =>
        set((s) => ({
          invoices: {
            ...s.invoices,
            [id]: { ...s.invoices[id], ...updates },
          },
        })),
    }),
    { name: 'arcpay:invoices' }
  )
);
