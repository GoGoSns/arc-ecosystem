'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isAddress } from 'viem';
import { Check, Clock, AlertCircle, ExternalLink, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { sendUSDC } from '@/lib/payments';

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

interface CreatorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
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

function plansKey(addr: string)   { return `arccreator:plans:${addr.toLowerCase()}`; }
function subsKey(addr: string)    { return `arccreator:subs:${addr.toLowerCase()}`; }
function mySubsKey(addr: string)  { return `arccreator:my-subs:${addr.toLowerCase()}`; }
function profileKey(addr: string) { return `arccreator:profile:${addr.toLowerCase()}`; }

function loadPlans(addr: string): Plan[] {
  try { const r = localStorage.getItem(plansKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function loadProfile(addr: string): CreatorProfile | null {
  try { const r = localStorage.getItem(profileKey(addr)); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

function loadSubs(addr: string): Subscription[] {
  try { const r = localStorage.getItem(subsKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function loadMySubs(addr: string): Subscription[] {
  try { const r = localStorage.getItem(mySubsKey(addr)); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

function saveSub(sub: Subscription) {
  // Upsert into creator's subscriber list (replace same fan+plan)
  const creatorSubs = loadSubs(sub.creatorAddress);
  const filtered = creatorSubs.filter(
    s => !(s.fanAddress.toLowerCase() === sub.fanAddress.toLowerCase() && s.planId === sub.planId)
  );
  localStorage.setItem(subsKey(sub.creatorAddress), JSON.stringify([...filtered, sub]));

  // Upsert into fan's own list
  const fanSubs = loadMySubs(sub.fanAddress);
  const filteredFan = fanSubs.filter(
    s => !(s.creatorAddress.toLowerCase() === sub.creatorAddress.toLowerCase() && s.planId === sub.planId)
  );
  localStorage.setItem(mySubsKey(sub.fanAddress), JSON.stringify([...filteredFan, sub]));
}

function removeSub(fanAddress: string, creatorAddress: string, planId: string) {
  const creatorSubs = loadSubs(creatorAddress);
  localStorage.setItem(
    subsKey(creatorAddress),
    JSON.stringify(creatorSubs.filter(
      s => !(s.fanAddress.toLowerCase() === fanAddress.toLowerCase() && s.planId === planId)
    ))
  );
  const fanSubs = loadMySubs(fanAddress);
  localStorage.setItem(
    mySubsKey(fanAddress),
    JSON.stringify(fanSubs.filter(
      s => !(s.creatorAddress.toLowerCase() === creatorAddress.toLowerCase() && s.planId === planId)
    ))
  );
}

// ─── Expiry helpers ───────────────────────────────────────────────────────────

const PERIOD_MS: Record<Period, number> = {
  Weekly:  7   * 86_400_000,
  Monthly: 30  * 86_400_000,
  Yearly:  365 * 86_400_000,
};

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

function initials(name: string, address: string): string {
  if (name.trim()) return name.trim().slice(0, 2).toUpperCase();
  return address.slice(2, 4).toUpperCase();
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  creatorAddress,
  fanAddress,
  isConnected,
  onConnectRequest,
  existingSub,
  onSubscribeSuccess,
}: {
  plan: Plan;
  creatorAddress: string;
  fanAddress?: string;
  isConnected: boolean;
  onConnectRequest: () => void;
  existingSub: Subscription | null;
  onSubscribeSuccess: (sub: Subscription, txHash: string) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const isSelf = !!fanAddress && fanAddress.toLowerCase() === creatorAddress.toLowerCase();
  const subStatus = existingSub ? getSubStatus(existingSub) : null;
  const isRenew = !!existingSub;
  const isActiveOrExpiring = subStatus === 'active' || subStatus === 'expiring';

  async function handleSubscribe() {
    if (!isConnected) { onConnectRequest(); return; }
    if (isSelf || !fanAddress) return;
    setIsPending(true);
    setError('');
    try {
      const { txHash } = await sendUSDC(creatorAddress, plan.price);
      const now = Date.now();
      // For renewals: extend from existing expiry if still in the future
      const baseTime = isRenew && existingSub && existingSub.expiresAt > now
        ? existingSub.expiresAt
        : now;
      const sub: Subscription = {
        planId: plan.id,
        planName: plan.name,
        fanAddress,
        creatorAddress,
        amount: plan.price,
        period: plan.period,
        subscribedAt: now,
        expiresAt: baseTime + PERIOD_MS[plan.period],
        txHash,
      };
      saveSub(sub);
      onSubscribeSuccess(sub, txHash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.split('\n')[0] : 'Transaction failed');
    } finally {
      setIsPending(false);
    }
  }

  function handleCancel() {
    if (!fanAddress || !existingSub) return;
    if (!confirm('Cancel subscription? No refund will be issued.')) return;
    removeSub(fanAddress, creatorAddress, plan.id);
    window.location.reload();
  }

  const statusColors = {
    active:   { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  text: '#22c55e' },
    expiring: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)',  text: '#eab308' },
    expired:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  text: '#ef4444' },
  };

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>{plan.name}</h3>
          {plan.description && (
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>{plan.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>${plan.price}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>
            USDC / {plan.period.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Benefits */}
      {plan.benefits.length > 0 && (
        <ul className="flex flex-col gap-2">
          {plan.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--fg)' }}>
              <Check size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Current sub status banner */}
      {existingSub && subStatus && (
        <div
          className="rounded-xl p-3 flex items-center gap-2"
          style={{
            background: statusColors[subStatus].bg,
            border: `1px solid ${statusColors[subStatus].border}`,
          }}
        >
          {subStatus === 'active'   && <Check       size={14} color="#22c55e" />}
          {subStatus === 'expiring' && <Clock        size={14} color="#eab308" />}
          {subStatus === 'expired'  && <AlertCircle  size={14} color="#ef4444" />}
          <p className="text-xs" style={{ color: statusColors[subStatus].text }}>
            {subStatus === 'active'   && `Active — expires in ${daysLeft(existingSub.expiresAt)} days`}
            {subStatus === 'expiring' && `Expiring in ${daysLeft(existingSub.expiresAt)} days — renew now`}
            {subStatus === 'expired'  && 'Subscription expired — renew to regain access'}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        {isSelf ? (
          <p className="text-xs w-full text-center py-2" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            You cannot subscribe to yourself
          </p>
        ) : !isConnected ? (
          <button
            onClick={onConnectRequest}
            className="sweep flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Wallet size={15} /> Connect wallet to subscribe
          </button>
        ) : (
          <>
            <button
              onClick={handleSubscribe}
              disabled={isPending}
              className="sweep flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              {isPending
                ? 'Processing…'
                : isRenew && isActiveOrExpiring ? 'Renew'
                : isRenew ? 'Re-subscribe'
                : 'Subscribe'}
            </button>
            {existingSub && (
              <button
                onClick={handleCancel}
                className="px-4 py-3 rounded-xl text-sm font-medium border transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.7 }}
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicSubscribePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const { address: fanAddress, isConnected } = useAccount();
  const { connect } = useConnect();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [mySubs, setMySubs] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [successSub, setSuccessSub] = useState<Subscription | null>(null);
  const [successTxHash, setSuccessTxHash] = useState('');

  const isValid = isAddress(handle);

  useEffect(() => {
    if (!isValid) { setLoaded(true); return; }
    setPlans(loadPlans(handle));
    setProfile(loadProfile(handle));
    if (fanAddress) setMySubs(loadMySubs(fanAddress));
    setLoaded(true);
  }, [handle, isValid, fanAddress]);

  function handleSubscribeSuccess(sub: Subscription, txHash: string) {
    setSuccessSub(sub);
    setSuccessTxHash(txHash);
    if (fanAddress) setMySubs(loadMySubs(fanAddress));
  }

  function getExistingSub(planId: string): Subscription | null {
    if (!fanAddress) return null;
    return mySubs.find(
      s => s.planId === planId && s.creatorAddress.toLowerCase() === handle.toLowerCase()
    ) ?? null;
  }

  const displayName = profile?.name || (isValid ? shortenAddress(handle) : handle);
  const avatarInitials = isValid ? initials(profile?.name ?? '', handle) : '??';

  if (!loaded) return null;

  if (!isValid) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Invalid creator address</p>
          <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>Go home</Link>
        </main>
      </div>
    );
  }

  // Success screen
  if (successSub) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-20 flex flex-col items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.15)' }}
          >
            <Check size={36} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Subscribed! Welcome aboard 🎉
            </p>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              You subscribed to <strong>{successSub.planName}</strong> for ${successSub.amount} USDC
            </p>
          </div>
          {successTxHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${successTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              View on ArcScan <ExternalLink size={13} />
            </a>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setSuccessSub(null); setSuccessTxHash(''); }}
              className="sweep px-5 py-2.5 rounded-xl text-sm font-medium border"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)' }}
            >
              View plans
            </button>
            <Link
              href="/my-subs"
              className="sweep px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              My subscriptions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          {/* Creator identity */}
          <div className="flex flex-col items-center gap-4 py-6">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: '2px solid var(--accent)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: 'rgba(201,168,76,0.15)',
                  color: 'var(--accent)',
                  border: '2px solid var(--accent)',
                }}
              >
                {avatarInitials}
              </div>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{displayName}</h1>
              {profile?.bio && (
                <p className="text-sm mt-2 max-w-xs leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {plans.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                This creator hasn&apos;t set up any subscription plans yet.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Choose your plan</h2>
              <div className="flex flex-col gap-4">
                {plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    creatorAddress={handle}
                    fanAddress={fanAddress}
                    isConnected={isConnected}
                    onConnectRequest={() => connect({ connector: injected() })}
                    existingSub={getExistingSub(plan.id)}
                    onSubscribeSuccess={handleSubscribeSuccess}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
