'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Repeat, Plus, Edit, Trash2, Copy, Check,
  Clock, AlertCircle, ExternalLink, Wallet, X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'Weekly' | 'Monthly' | 'Yearly';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: Period;
  description: string;
  benefits: string[];
  createdAt: number;
}

interface Subscription {
  planId: string;
  planName: string;
  fanAddress: string;
  creatorAddress: string;
  amount: string;
  period: Period;
  subscribedAt: number;
  expiresAt: number;
  txHash: string;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

function plansKey(addr: string) { return `arccreator:plans:${addr.toLowerCase()}`; }
function subsKey(addr: string) { return `arccreator:subs:${addr.toLowerCase()}`; }

function loadPlans(addr: string): Plan[] {
  try { const r = localStorage.getItem(plansKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function savePlansToStorage(addr: string, plans: Plan[]) {
  localStorage.setItem(plansKey(addr), JSON.stringify(plans));
}

function loadSubs(addr: string): Subscription[] {
  try { const r = localStorage.getItem(subsKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

// ─── Expiry helpers ───────────────────────────────────────────────────────────

const THREE_DAYS_MS = 3 * 86_400_000;

type SubStatus = 'active' | 'expiring' | 'expired';

function getSubStatus(sub: Subscription): SubStatus {
  const now = Date.now();
  if (now >= sub.expiresAt) return 'expired';
  if (now >= sub.expiresAt - THREE_DAYS_MS) return 'expiring';
  return 'active';
}

function daysLeft(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortenAddress(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ sub }: { sub: Subscription }) {
  const status = getSubStatus(sub);
  const days = daysLeft(sub.expiresAt);

  const cfg = {
    active:   { label: 'Active',              color: '#22c55e', Icon: Check },
    expiring: { label: `Expires in ${days}d`, color: '#eab308', Icon: Clock },
    expired:  { label: 'Expired',             color: '#ef4444', Icon: AlertCircle },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}18`, color: cfg.color }}
    >
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Plan modal ───────────────────────────────────────────────────────────────

const PERIODS: Period[] = ['Weekly', 'Monthly', 'Yearly'];

interface PlanFormState {
  name: string;
  price: string;
  period: Period;
  description: string;
  benefits: string[];
}

function PlanModal({
  initial,
  existingNames,
  onSave,
  onClose,
}: {
  initial?: Plan;
  existingNames: string[];
  onSave: (data: PlanFormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PlanFormState>({
    name:        initial?.name        ?? '',
    price:       initial?.price       ?? '',
    period:      initial?.period      ?? 'Monthly',
    description: initial?.description ?? '',
    benefits:    initial?.benefits.length ? initial.benefits : [''],
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    } else if (existingNames.filter(n => n !== initial?.name).includes(form.name.trim())) {
      errs.name = 'A plan with this name already exists';
    }
    const price = parseFloat(form.price);
    if (!form.price || isNaN(price) || price <= 0) errs.price = 'Price must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ ...form, name: form.name.trim(), benefits: form.benefits.filter(b => b.trim()) });
  }

  function updateBenefit(i: number, val: string) {
    const next = [...form.benefits];
    next[i] = val;
    setForm(f => ({ ...f, benefits: next }));
  }

  function removeBenefit(i: number) {
    const next = form.benefits.filter((_, idx) => idx !== i);
    setForm(f => ({ ...f, benefits: next.length ? next : [''] }));
  }

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--accent)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border)';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
            {initial ? 'Edit plan' : 'Create plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: 'var(--fg)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Plan name <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Premium Tier"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            maxLength={60}
            className="px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              Price (USDC) <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--accent)' }}>$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="5.00"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full pl-6 pr-3 py-2.5 rounded-xl text-sm border outline-none"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>Billing period</label>
            <select
              value={form.period}
              onChange={e => setForm(f => ({ ...f, period: e.target.value as Period }))}
              className="px-3 py-2.5 rounded-xl text-sm border outline-none h-[42px]"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Description <span style={{ opacity: 0.4 }}>(optional)</span>
          </label>
          <textarea
            placeholder="What do subscribers get?"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={200}
            rows={2}
            className="px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Benefits <span style={{ opacity: 0.4 }}>(optional)</span>
          </label>
          {form.benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Benefit ${i + 1}`}
                value={b}
                onChange={e => updateBenefit(i, e.target.value)}
                maxLength={80}
                className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              {form.benefits.length > 1 && (
                <button
                  onClick={() => removeBenefit(i)}
                  className="p-1 rounded-lg transition-opacity hover:opacity-60"
                  style={{ color: 'var(--fg)', opacity: 0.4 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setForm(f => ({ ...f, benefits: [...f.benefits, ''] }))}
            className="flex items-center gap-1.5 text-xs self-start mt-1 transition-opacity hover:opacity-100"
            style={{ color: 'var(--accent)', opacity: 0.7 }}
          >
            <Plus size={13} /> Add benefit
          </button>
        </div>

        <button
          onClick={handleSave}
          className="sweep w-full py-3 rounded-xl text-sm font-bold mt-1"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          Save plan
        </button>
      </div>
    </div>
  );
}

// ─── Creator dashboard ────────────────────────────────────────────────────────

function CreatorDashboard({ address }: { address: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | undefined>();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/subscription/${address}`;

  useEffect(() => {
    setPlans(loadPlans(address));
    setSubs(loadSubs(address));
  }, [address]);

  function handleSavePlan(data: PlanFormState) {
    const next = editPlan
      ? plans.map(p => p.id === editPlan.id ? { ...editPlan, ...data } : p)
      : [...plans, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          ...data,
        }];
    setPlans(next);
    savePlansToStorage(address, next);
    setModalOpen(false);
    setEditPlan(undefined);
  }

  function openEdit(plan: Plan) {
    setEditPlan(plan);
    setModalOpen(true);
  }

  function deletePlan(id: string) {
    if (!confirm("Delete this plan? Existing subscribers won't be affected.")) return;
    const next = plans.filter(p => p.id !== id);
    setPlans(next);
    savePlansToStorage(address, next);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {modalOpen && (
        <PlanModal
          initial={editPlan}
          existingNames={plans.map(p => p.name)}
          onSave={handleSavePlan}
          onClose={() => { setModalOpen(false); setEditPlan(undefined); }}
        />
      )}

      <div className="flex flex-col gap-8">
        {/* Section A — Plans */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              Your plans
            </h2>
            <button
              onClick={() => { setEditPlan(undefined); setModalOpen(true); }}
              className="sweep flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              <Plus size={13} /> Create plan
            </button>
          </div>

          {plans.length === 0 ? (
            <div
              className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
              style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}
            >
              <Repeat size={24} style={{ color: 'var(--accent)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                No plans yet — create your first subscription plan
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {plans.map(plan => {
                const planSubCount = subs.filter(s => s.planId === plan.id).length;
                return (
                  <div
                    key={plan.id}
                    className="rounded-xl p-4 flex items-start justify-between gap-4"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{plan.name}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
                        ${plan.price} USDC / {plan.period}
                      </span>
                      {plan.description && (
                        <span className="text-xs truncate" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                          {plan.description}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.3 }}>
                        {planSubCount} subscriber{planSubCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(plan)}
                        title="Edit"
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                        style={{ color: 'var(--fg)', opacity: 0.5 }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                        style={{ color: '#ef4444', opacity: 0.6 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section B — Public page */}
        <section
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            Your public page
          </p>
          {plans.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.35 }}>
              Create at least one plan to activate your public page.
            </p>
          )}
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs font-mono truncate px-3 py-2 rounded-lg"
              style={{ background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}
            >
              {pageUrl}
            </code>
            <button
              onClick={copyLink}
              className="sweep shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
            >
              {copied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <a
            href={`/subscription/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs self-start transition-opacity hover:opacity-100"
            style={{ color: 'var(--accent)', opacity: 0.7 }}
          >
            Preview your subscribe page <ExternalLink size={11} />
          </a>
        </section>

        {/* Section C — Subscribers */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            Subscribers
          </h2>

          {subs.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                No subscribers yet — share your link to get started
              </p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {/* Mobile cards */}
              <div className="md:hidden flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {subs.map((sub, i) => (
                  <div key={i} className="p-4 flex flex-col gap-2" style={{ background: 'var(--card)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                        {shortenAddress(sub.fanAddress)}
                      </span>
                      <StatusBadge sub={sub} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{sub.planName}</span>
                    <div className="flex gap-4 text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                      <span>Since {fmtDate(sub.subscribedAt)}</span>
                      <span>Expires {fmtDate(sub.expiresAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Subscriber', 'Plan', 'Subscribed', 'Expires', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                        style={{ color: 'var(--fg)', opacity: 0.4 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                          {shortenAddress(sub.fanAddress)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--fg)' }}>{sub.planName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                          {fmtDate(sub.subscribedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                          {fmtDate(sub.expiresAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge sub={sub} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          <div>
            <Link
              href="/"
              className="text-xs mb-4 inline-block transition-opacity hover:opacity-100"
              style={{ color: 'var(--fg)', opacity: 0.4 }}
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
              Subscription
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Recurring USDC subscriptions for your content
            </p>
          </div>

          {!isConnected ? (
            <div
              className="flex flex-col items-center gap-5 rounded-2xl p-10"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.12)' }}
              >
                <Repeat size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                  Connect wallet to manage your plans
                </p>
                <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                  Your wallet address is your creator identity
                </p>
              </div>
              <button
                onClick={() => connect({ connector: injected() })}
                className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                <Wallet size={15} />
                Connect wallet
              </button>
            </div>
          ) : (
            <CreatorDashboard address={address!} />
          )}
        </div>
      </main>
    </div>
  );
}
