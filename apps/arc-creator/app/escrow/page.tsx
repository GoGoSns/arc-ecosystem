'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isAddress } from 'viem';
import {
  Lock,
  Plus,
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  Wallet,
  FileText,
} from 'lucide-react';
import {
  useEscrowStore,
  STATUS_CONFIG,
  deadlineLabel,
  shortenAddr,
  fmtTs,
  type EscrowDeal,
  type EscrowStatus,
} from '@/lib/escrowStore';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EscrowStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ─── Deal card ─────────────────────────────────────────────────────────────────

function DealCard({
  deal,
  role,
}: {
  deal: EscrowDeal;
  role: 'buyer' | 'seller';
}) {
  const counterparty =
    role === 'buyer' ? deal.sellerAddress : deal.buyerAddress;
  const counterLabel = role === 'buyer' ? 'Seller' : 'Buyer';
  const dl = deadlineLabel(deal);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <p
            className="text-base font-bold leading-tight truncate"
            style={{ color: 'var(--fg)' }}
          >
            {deal.title}
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.5 }}>
            {counterLabel}: {shortenAddr(counterparty)}
          </p>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      {/* Amount */}
      <p className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
        ${deal.amount}{' '}
        <span className="text-sm font-medium" style={{ color: 'var(--fg)', opacity: 0.6 }}>
          USDC
        </span>
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5">
          {dl.text && (
            <p
              className="text-xs flex items-center gap-1"
              style={{ color: dl.overdue ? '#f87171' : 'var(--fg)', opacity: dl.overdue ? 1 : 0.5 }}
            >
              {dl.overdue ? (
                <AlertTriangle size={11} />
              ) : (
                <Clock size={11} />
              )}
              {dl.text}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.35 }}>
            Created {fmtTs(deal.createdAt)}
          </p>
        </div>
        <Link
          href={`/escrow/${deal.id}`}
          className="sweep flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            background: 'rgba(201,168,76,0.12)',
            color: 'var(--accent)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          View Deal
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── New deal modal ─────────────────────────────────────────────────────────────

function NewDealModal({
  buyerAddress,
  onClose,
  onCreated,
}: {
  buyerAddress: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const addDeal = useEscrowStore((s) => s.addDeal);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sellerAddr, setSellerAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState(() => plusDays(14));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Required';
    if (!sellerAddr.trim()) {
      errs.sellerAddr = 'Required';
    } else if (!isAddress(sellerAddr.trim())) {
      errs.sellerAddr = 'Invalid Ethereum address';
    } else if (sellerAddr.trim().toLowerCase() === buyerAddress.toLowerCase()) {
      errs.sellerAddr = 'Seller cannot be the same as buyer';
    }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Must be greater than 0';
    if (!deadline || deadline < todayStr()) errs.deadline = 'Must be a future date';
    return errs;
  }

  function create() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const id = crypto.randomUUID();
    const now = Date.now();
    const deal: import('@/lib/escrowStore').EscrowDeal = {
      id,
      title: title.trim(),
      description: description.trim() || undefined,
      buyerAddress: buyerAddress,
      sellerAddress: sellerAddr.trim(),
      amount: parseFloat(amount).toFixed(2),
      deadline,
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
      activity: [{ action: 'Deal created', by: buyerAddress, at: now }],
    };
    addDeal(deal);
    onCreated(id);
  }

  const inputBase: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--fg)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 my-8"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--fg)' }}>
              New Escrow Deal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-opacity hover:opacity-70"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Deal Title *
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
            style={{ ...inputBase, borderColor: errors.title ? '#f87171' : 'var(--border)' }}
            placeholder="Website redesign, logo design, consulting…"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = errors.title ? '#f87171' : 'var(--border)')}
          />
          {errors.title && <p className="text-xs text-red-400 mt-0.5">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Description (optional)
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none transition-colors"
            style={inputBase}
            placeholder="Deliverables, milestones, terms…"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Seller address */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Seller Wallet Address *
          </label>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none transition-colors"
            style={{ ...inputBase, borderColor: errors.sellerAddr ? '#f87171' : 'var(--border)' }}
            placeholder="0x…"
            value={sellerAddr}
            onChange={(e) => { setSellerAddr(e.target.value); setErrors((p) => ({ ...p, sellerAddr: '' })); }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = errors.sellerAddr ? '#f87171' : 'var(--border)')}
          />
          {errors.sellerAddr && <p className="text-xs text-red-400 mt-0.5">{errors.sellerAddr}</p>}
        </div>

        {/* Amount + Deadline */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              Amount (USDC) *
            </label>
            <div className="relative">
              <span
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold"
                style={{ color: 'var(--accent)' }}
              >
                USDC
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full pl-12 pr-2 py-2 rounded-lg text-sm font-mono text-right border outline-none transition-colors"
                style={{ ...inputBase, borderColor: errors.amount ? '#f87171' : 'var(--border)' }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = errors.amount ? '#f87171' : 'var(--border)')}
              />
            </div>
            {errors.amount && <p className="text-xs text-red-400 mt-0.5">{errors.amount}</p>}
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              Deadline *
            </label>
            <input
              type="date"
              min={plusDays(1)}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
              style={{ ...inputBase, borderColor: errors.deadline ? '#f87171' : 'var(--border)' }}
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: '' })); }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = errors.deadline ? '#f87171' : 'var(--border)')}
            />
            {errors.deadline && <p className="text-xs text-red-400 mt-0.5">{errors.deadline}</p>}
          </div>
        </div>

        {/* Buyer info row */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.6 }}
        >
          <Wallet size={12} />
          You are the buyer: {shortenAddr(buyerAddress)}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={create}
            className="sweep flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Create Deal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ role, onNew }: { role: 'buyer' | 'seller'; onNew: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-20 rounded-2xl"
      style={{ border: '1px dashed var(--border)' }}
    >
      <FileText size={36} style={{ color: 'var(--fg)', opacity: 0.15 }} />
      {role === 'buyer' ? (
        <>
          <p className="text-sm text-center" style={{ color: 'var(--fg)', opacity: 0.45 }}>
            No deals yet. Create your first one.
          </p>
          <button
            onClick={onNew}
            className="sweep flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium mt-1"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Plus size={13} />
            New Deal
          </button>
        </>
      ) : (
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
          No deals yet. Share your wallet address with buyers so they can create a deal with you.
        </p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'buyer' | 'seller';

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [tab, setTab] = useState<Tab>('buyer');
  const [modalOpen, setModalOpen] = useState(false);

  const deals = useEscrowStore((s) => s.deals);

  const addr = address?.toLowerCase() ?? '';
  const allDeals = Object.values(deals);
  const buyerDeals = allDeals
    .filter((d) => d.buyerAddress.toLowerCase() === addr)
    .sort((a, b) => b.createdAt - a.createdAt);
  const sellerDeals = allDeals
    .filter((d) => d.sellerAddress.toLowerCase() === addr)
    .sort((a, b) => b.createdAt - a.createdAt);
  const tabDeals = tab === 'buyer' ? buyerDeals : sellerDeals;

  if (!hydrated) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)' }}
          >
            <Lock size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
            Connect your wallet
          </h2>
          <p className="text-sm max-w-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Connect to manage your escrow deals on Arc Testnet.
          </p>
          <button
            onClick={() => connect({ connector: injected() })}
            className="sweep px-6 py-2.5 rounded-xl text-sm font-bold mt-2"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Connect Wallet
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Escrow</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                Secure deals between buyer and seller
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="sweep flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold self-start sm:self-auto"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={15} />
              New Deal
            </button>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {(['buyer', 'seller'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#0a0a0a' : 'var(--fg)',
                  opacity: tab === t ? 1 : 0.55,
                }}
              >
                As {t === 'buyer' ? 'Buyer' : 'Seller'}
                {tab === t && tabDeals.length > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({tabDeals.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Deal list */}
          {tabDeals.length === 0 ? (
            <EmptyState role={tab} onNew={() => setModalOpen(true)} />
          ) : (
            <div className="flex flex-col gap-3">
              {tabDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} role={tab} />
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && address && (
        <NewDealModal
          buyerAddress={address}
          onClose={() => setModalOpen(false)}
          onCreated={(id) => {
            setModalOpen(false);
            router.push(`/escrow/${id}`);
          }}
        />
      )}
    </div>
  );
}
