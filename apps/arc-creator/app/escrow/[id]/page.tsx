'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import {
  Lock,
  Unlock,
  Check,
  X,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import {
  useEscrowStore,
  STATUS_CONFIG,
  deadlineLabel,
  getDaysLeft,
  shortenAddr,
  fmtTs,
  fmtDateTime,
  type EscrowDeal,
  type EscrowStatus,
  type ActivityEntry,
} from '@/lib/escrowStore';
import { sendUSDC } from '@/lib/payments';

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, large }: { status: EscrowStatus; large?: boolean }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={`font-bold rounded-full ${large ? 'text-sm px-4 py-1.5' : 'text-xs px-2.5 py-0.5'}`}
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ─── Deadline display ──────────────────────────────────────────────────────────

function DeadlineDisplay({ deal }: { deal: EscrowDeal }) {
  const dl = deadlineLabel(deal);
  if (!dl.text) {
    return (
      <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.45 }}>
        {deal.deadline}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {dl.overdue ? (
        <AlertTriangle size={12} style={{ color: '#f87171' }} />
      ) : (
        <Clock size={12} style={{ color: 'var(--fg)', opacity: 0.45 }} />
      )}
      <p
        className="text-xs font-medium"
        style={{ color: dl.overdue ? '#f87171' : 'var(--fg)', opacity: dl.overdue ? 1 : 0.55 }}
      >
        {deal.deadline} · {dl.text}
      </p>
    </div>
  );
}

// ─── Activity timeline ─────────────────────────────────────────────────────────

function ActivityTimeline({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) return null;
  return (
    <div className="flex flex-col gap-0">
      {[...activity].reverse().map((entry, i) => {
        const isLast = i === activity.length - 1;
        return (
          <div key={i} className="flex gap-3 relative">
            {!isLast && (
              <div
                className="absolute left-[10px] top-5 bottom-0 w-px"
                style={{ background: 'var(--border)' }}
              />
            )}
            <div
              className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 z-10"
              style={{
                borderColor: 'var(--accent)',
                background: 'var(--bg)',
              }}
            />
            <div className="pb-4 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                {entry.action}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                {fmtDateTime(entry.at)} · {shortenAddr(entry.by)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div
        className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest"
        style={{
          background: 'rgba(201,168,76,0.07)',
          color: 'var(--accent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Actions panel ─────────────────────────────────────────────────────────────

function ActionsPanel({
  deal,
  isBuyer,
  isSeller,
  connectedAddress,
}: {
  deal: EscrowDeal;
  isBuyer: boolean;
  isSeller: boolean;
  connectedAddress: string;
}) {
  const updateDeal = useEscrowStore((s) => s.updateDeal);
  const [isPending, setIsPending] = useState(false);
  const [sendError, setSendError] = useState('');

  function pushStatus(
    newStatus: EscrowStatus,
    actionLabel: string,
    extra?: Partial<EscrowDeal>
  ) {
    const entry: ActivityEntry = { action: actionLabel, by: connectedAddress, at: Date.now() };
    updateDeal(deal.id, {
      status: newStatus,
      activity: [...deal.activity, entry],
      ...extra,
    });
  }

  async function handleRelease() {
    setIsPending(true);
    setSendError('');
    try {
      const { txHash } = await sendUSDC(deal.sellerAddress, deal.amount);
      const entry: ActivityEntry = {
        action: 'Funds released to seller',
        by: connectedAddress,
        at: Date.now(),
      };
      updateDeal(deal.id, {
        status: 'RELEASED',
        txHash,
        activity: [...deal.activity, entry],
      });
    } catch (err: unknown) {
      setSendError(
        err instanceof Error ? err.message.split('\n')[0] : 'Transaction failed'
      );
    } finally {
      setIsPending(false);
    }
  }

  const { status } = deal;
  const terminal = status === 'RELEASED' || status === 'CANCELLED';

  // ── RELEASED ──────────────────────────────────────────────────────────────
  if (status === 'RELEASED') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(74,222,128,0.12)' }}
        >
          <Check size={28} style={{ color: '#4ade80' }} />
        </div>
        <p className="font-semibold" style={{ color: '#4ade80' }}>
          Funds released!
        </p>
        {deal.txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${deal.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            View on ArcScan <ExternalLink size={13} />
          </a>
        )}
      </div>
    );
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (status === 'CANCELLED') {
    return (
      <div
        className="flex flex-col items-center gap-2 py-6 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <X size={24} style={{ color: 'var(--fg)', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.45 }}>
          Deal cancelled
        </p>
      </div>
    );
  }

  // ── Buyer actions ─────────────────────────────────────────────────────────
  if (isBuyer) {
    if (status === 'CREATED') {
      return (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => pushStatus('FUNDED', 'Deal funded by buyer')}
            className="sweep w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Lock size={15} />
            Fund Deal
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            Marks this deal as funded. Funds remain in your wallet until you release them.
          </p>
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by buyer')}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: '#f87171', opacity: 0.7 }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }

    if (status === 'FUNDED') {
      return (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa' }}
          >
            <Lock size={14} />
            Waiting for seller to deliver work
          </div>
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by buyer')}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: '#f87171', opacity: 0.7 }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }

    if (status === 'WORK_DELIVERED') {
      return (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRelease}
            disabled={isPending}
            className="sweep w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Unlock size={15} />
            {isPending ? 'Sending…' : `Release $${deal.amount} USDC to Seller`}
          </button>
          {sendError && (
            <p className="text-xs text-red-400 text-center">{sendError}</p>
          )}
          <button
            onClick={() => pushStatus('DISPUTED', 'Dispute raised by buyer')}
            className="sweep w-full py-2.5 rounded-xl text-sm font-medium border transition-opacity"
            style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}
          >
            Dispute
          </button>
        </div>
      );
    }

    if (status === 'DISPUTED') {
      return (
        <div className="flex flex-col gap-3">
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>Both parties must agree to resolve this dispute.</span>
          </div>
          <button
            onClick={handleRelease}
            disabled={isPending}
            className="sweep w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Unlock size={15} />
            {isPending ? 'Sending…' : 'Approve Release'}
          </button>
          {sendError && (
            <p className="text-xs text-red-400 text-center">{sendError}</p>
          )}
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by buyer')}
            className="sweep w-full py-2.5 rounded-xl text-sm font-medium border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }
  }

  // ── Seller actions ────────────────────────────────────────────────────────
  if (isSeller) {
    if (status === 'CREATED' || status === 'FUNDED') {
      return (
        <div className="flex flex-col gap-2">
          {status === 'CREATED' && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
              style={{ background: 'rgba(128,128,128,0.07)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.6 }}
            >
              <Clock size={12} />
              Waiting for buyer to fund the deal
            </div>
          )}
          <button
            onClick={() =>
              pushStatus('WORK_DELIVERED', 'Work marked as delivered by seller')
            }
            className="sweep w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <Check size={15} />
            Mark Work as Delivered
          </button>
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by seller')}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: '#f87171', opacity: 0.7 }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }

    if (status === 'WORK_DELIVERED') {
      return (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
          >
            <Clock size={14} />
            Awaiting buyer approval to release funds…
          </div>
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by seller')}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: '#f87171', opacity: 0.7 }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }

    if (status === 'DISPUTED') {
      return (
        <div className="flex flex-col gap-3">
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>This deal is in dispute. Contact the buyer to resolve.</span>
          </div>
          <button
            onClick={() =>
              pushStatus('WORK_DELIVERED', 'Work re-marked as delivered by seller')
            }
            className="sweep w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            <ArrowRight size={15} />
            Re-mark as Delivered
          </button>
          <button
            onClick={() => pushStatus('CANCELLED', 'Deal cancelled by seller')}
            className="sweep w-full py-2.5 rounded-xl text-sm font-medium border"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            Cancel Deal
          </button>
        </div>
      );
    }
  }

  // ── Observer / both actions blocked ───────────────────────────────────────
  if (!terminal) {
    return (
      <div
        className="px-4 py-3 rounded-xl text-sm text-center"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.5 }}
      >
        Connect as buyer or seller to take actions
      </div>
    );
  }

  return null;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setHydrated(true), []);

  const deal = useEscrowStore((s) => s.deals[id]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const addr = address?.toLowerCase() ?? '';
  const isBuyer = isConnected && !!addr && addr === deal?.buyerAddress.toLowerCase();
  const isSeller = isConnected && !!addr && addr === deal?.sellerAddress.toLowerCase();
  const isParty = isBuyer || isSeller;

  const dl = deal ? deadlineLabel(deal) : null;
  const daysLeft = deal ? getDaysLeft(deal.deadline) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--bg-nav)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href="/escrow"
            className="text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--fg)', opacity: 0.6 }}
          >
            ← Escrow
          </Link>
          <Link href="/" className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Arc Pay
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {!hydrated ? (
          <div
            className="rounded-2xl h-96 animate-pulse"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          />
        ) : !deal ? (
          /* ── Not found ── */
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Lock size={40} style={{ color: 'var(--fg)', opacity: 0.2 }} />
            <div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--fg)' }}>
                Deal not found
              </p>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                This link only works on the device where the deal was created.
              </p>
            </div>
            <Link
              href="/escrow"
              className="text-sm"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              Back to Escrow
            </Link>
          </div>
        ) : (
          /* ── Deal found ── */
          <div className="flex flex-col gap-5">

            {/* Deal title + status */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--fg)' }}>
                  {deal.title}
                </h1>
                <StatusBadge status={deal.status} large />
              </div>

              {deal.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.65 }}>
                  {deal.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                  {deal.id.slice(0, 12)}…
                </p>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}
                >
                  <Copy size={11} />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            </div>

            {/* Amount */}
            <Section title="Amount">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                    ${deal.amount}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                    USDC on Arc Testnet
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background:
                      deal.status === 'FUNDED' || deal.status === 'WORK_DELIVERED' || deal.status === 'DISPUTED'
                        ? 'rgba(96,165,250,0.1)'
                        : 'rgba(128,128,128,0.08)',
                    color:
                      deal.status === 'FUNDED' || deal.status === 'WORK_DELIVERED' || deal.status === 'DISPUTED'
                        ? '#60a5fa'
                        : 'var(--fg)',
                    opacity:
                      deal.status === 'FUNDED' || deal.status === 'WORK_DELIVERED' || deal.status === 'DISPUTED'
                        ? 1
                        : 0.5,
                  }}
                >
                  {deal.status === 'FUNDED' ||
                  deal.status === 'WORK_DELIVERED' ||
                  deal.status === 'DISPUTED' ? (
                    <>
                      <Lock size={12} />
                      In buyer's wallet
                    </>
                  ) : deal.status === 'RELEASED' ? (
                    <>
                      <Unlock size={12} />
                      Released
                    </>
                  ) : (
                    <>
                      <Lock size={12} />
                      Unfunded
                    </>
                  )}
                </div>
              </div>
            </Section>

            {/* Parties */}
            <Section title="Parties">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Buyer */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                    Buyer{isBuyer ? ' (You)' : ''}
                  </p>
                  <p
                    className="text-sm font-mono font-medium"
                    style={{ color: 'var(--fg)' }}
                  >
                    {shortenAddr(deal.buyerAddress)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                    Created {fmtTs(deal.createdAt)}
                  </p>
                </div>
                {/* Seller */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--fg)', opacity: 0.35 }}>
                    Seller{isSeller ? ' (You)' : ''}
                  </p>
                  <p
                    className="text-sm font-mono font-medium"
                    style={{ color: 'var(--fg)' }}
                  >
                    {shortenAddr(deal.sellerAddress)}
                  </p>
                  <DeadlineDisplay deal={deal} />
                </div>
              </div>

              {/* Overdue banner */}
              {dl?.overdue && (
                <div
                  className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
                >
                  <AlertTriangle size={12} />
                  {dl.text} — take action to resolve.
                </div>
              )}

              {/* Observer note */}
              {!isConnected && (
                <div
                  className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.55 }}
                >
                  <Wallet size={12} />
                  <span>
                    This deal is between{' '}
                    <strong>{shortenAddr(deal.buyerAddress)}</strong> (buyer) and{' '}
                    <strong>{shortenAddr(deal.sellerAddress)}</strong> (seller).
                  </span>
                </div>
              )}
              {isConnected && !isParty && (
                <div
                  className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.55 }}
                >
                  <Wallet size={12} />
                  You are viewing this deal as an observer.
                </div>
              )}
            </Section>

            {/* Actions */}
            <Section title="Actions">
              {!isConnected ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <p className="text-sm text-center" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                    Connect your wallet to take actions on this deal.
                  </p>
                  <button
                    onClick={() => connect({ connector: injected() })}
                    className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                  >
                    <Wallet size={15} />
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <ActionsPanel
                  deal={deal}
                  isBuyer={isBuyer}
                  isSeller={isSeller}
                  connectedAddress={address!}
                />
              )}
            </Section>

            {/* Activity log */}
            {deal.activity.length > 0 && (
              <Section title="Activity">
                <ActivityTimeline activity={deal.activity} />
              </Section>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.3 }}>
          Powered by Arc Pay · Trust-based escrow on Arc Testnet
        </p>
      </footer>
    </div>
  );
}
