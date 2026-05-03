'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Check, Clock, AlertCircle, Wallet, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'Weekly' | 'Monthly' | 'Yearly';

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

interface CreatorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

function mySubsKey(addr: string)  { return `arccreator:my-subs:${addr.toLowerCase()}`; }
function subsKey(addr: string)    { return `arccreator:subs:${addr.toLowerCase()}`; }
function profileKey(addr: string) { return `arccreator:profile:${addr.toLowerCase()}`; }

function loadMySubs(addr: string): Subscription[] {
  try { const r = localStorage.getItem(mySubsKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function loadCreatorProfile(addr: string): CreatorProfile | null {
  try { const r = localStorage.getItem(profileKey(addr)); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

function removeSub(fanAddress: string, creatorAddress: string, planId: string) {
  try {
    const myRaw = localStorage.getItem(mySubsKey(fanAddress));
    if (myRaw) {
      const subs: Subscription[] = JSON.parse(myRaw);
      localStorage.setItem(mySubsKey(fanAddress), JSON.stringify(
        subs.filter(s => !(s.creatorAddress.toLowerCase() === creatorAddress.toLowerCase() && s.planId === planId))
      ));
    }
  } catch {}
  try {
    const creatorRaw = localStorage.getItem(subsKey(creatorAddress));
    if (creatorRaw) {
      const subs: Subscription[] = JSON.parse(creatorRaw);
      localStorage.setItem(subsKey(creatorAddress), JSON.stringify(
        subs.filter(s => !(s.fanAddress.toLowerCase() === fanAddress.toLowerCase() && s.planId === planId))
      ));
    }
  } catch {}
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

function shortenAddress(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Sub card ─────────────────────────────────────────────────────────────────

function SubCard({ sub, fanAddress, onCancel }: { sub: Subscription; fanAddress: string; onCancel: () => void }) {
  const status = getSubStatus(sub);
  const profile = loadCreatorProfile(sub.creatorAddress);
  const creatorName = profile?.name || shortenAddress(sub.creatorAddress);

  const statusCfg = {
    active:   { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', Icon: Check,        label: 'Active' },
    expiring: { bg: 'rgba(234,179,8,0.1)',  color: '#eab308', Icon: Clock,        label: 'Expiring' },
    expired:  { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', Icon: AlertCircle,  label: 'Expired' },
  }[status];

  function handleCancel() {
    if (!confirm('Cancel subscription? No refund will be issued.')) return;
    removeSub(fanAddress, sub.creatorAddress, sub.planId);
    onCancel();
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{creatorName}</span>
          <span className="text-sm" style={{ color: 'var(--fg)' }}>{sub.planName}</span>
          <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            ${sub.amount} USDC / {sub.period}
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full shrink-0"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          <statusCfg.Icon size={11} /> {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
        <div>
          <span className="block font-medium mb-0.5" style={{ opacity: 0.6 }}>Subscribed</span>
          {fmtDate(sub.subscribedAt)}
        </div>
        <div>
          <span className="block font-medium mb-0.5" style={{ opacity: 0.6 }}>
            {status === 'expired' ? 'Expired' : 'Expires'}
          </span>
          {status !== 'expired'
            ? `in ${daysLeft(sub.expiresAt)} days`
            : fmtDate(sub.expiresAt)}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/subscription/${sub.creatorAddress}`}
          className="sweep flex-1 text-center py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          {status === 'expired' ? 'Re-subscribe' : 'Renew'}
        </Link>
        <button
          onClick={handleCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-70"
          style={{ border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.6 }}
        >
          Cancel
        </button>
        {sub.txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${sub.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on ArcScan"
            className="p-2.5 rounded-xl border transition-opacity hover:opacity-70"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.4 }}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MySubsPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    if (address) setSubs(loadMySubs(address));
  }, [address]);

  function handleCancel() {
    if (address) setSubs(loadMySubs(address));
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
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
              My Subscriptions
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              All your active subscriptions across creators
            </p>
          </div>

          {!isConnected ? (
            <div
              className="flex flex-col items-center gap-5 rounded-2xl p-10"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                Connect your wallet to view your subscriptions
              </p>
              <button
                onClick={() => connect({ connector: injected() })}
                className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                <Wallet size={15} />
                Connect wallet
              </button>
            </div>
          ) : subs.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm mb-3" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                No subscriptions yet
              </p>
              <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>
                Browse creators →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {subs.map((sub, i) => (
                <SubCard key={i} sub={sub} fanAddress={address!} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
