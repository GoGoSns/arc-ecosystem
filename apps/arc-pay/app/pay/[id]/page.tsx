'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Check, Download, ExternalLink, FileText, Wallet } from 'lucide-react';
import {
  useInvoiceStore,
  calcTotals,
  calcRowTotal,
  fmtMoney,
  type Invoice,
} from '@/lib/invoiceStore';
import { downloadInvoicePDF } from '@/lib/invoicePdf';
import { sendUSDC } from '@/lib/payments';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string): string {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const config = {
    unpaid: { label: 'Unpaid', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    pending: { label: 'Pending', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    paid: { label: 'Paid', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  }[status];

  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────

function PaidScreen({ txHash, invoice }: { txHash: string; invoice: Invoice }) {
  const [downloading, setDownloading] = useState(false);

  async function pdf() {
    setDownloading(true);
    try { await downloadInvoicePDF(invoice); } finally { setDownloading(false); }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
      >
        <Check size={36} strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold mb-1" style={{ color: '#22c55e' }}>
          Payment sent!
        </p>
        <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
          {invoice.invoiceNumber} is now paid
        </p>
      </div>
      <a
        href={`https://testnet.arcscan.app/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm"
        style={{ color: 'var(--accent)', textDecoration: 'underline' }}
      >
        View on ArcScan <ExternalLink size={13} />
      </a>
      <button
        onClick={pdf}
        disabled={downloading}
        className="sweep flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50"
        style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)' }}
      >
        <Download size={14} />
        {downloading ? 'Generating…' : 'Download PDF'}
      </button>
    </div>
  );
}

// ─── Payment button ────────────────────────────────────────────────────────────

function PayButton({
  invoice,
  onPaid,
}: {
  invoice: Invoice;
  onPaid: (txHash: string) => void;
}) {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { totals } = (() => {
    const t = calcTotals(invoice.items, invoice.taxPercent);
    return { totals: t };
  })();

  const [isPending, setIsPending] = useState(false);
  const [sendError, setSendError] = useState('');

  async function handlePay() {
    setIsPending(true);
    setSendError('');
    try {
      const { txHash } = await sendUSDC(
        invoice.from.wallet,
        totals.total.toFixed(2)
      );
      onPaid(txHash);
    } catch (err: unknown) {
      setSendError(
        err instanceof Error ? err.message.split('\n')[0] : 'Transaction failed'
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        className="sweep w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
        style={{ background: 'var(--accent)', color: '#0a0a0a' }}
      >
        <Wallet size={18} />
        Connect Wallet to Pay
      </button>
    );
  }

  if (isPending) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-xl text-base font-bold opacity-70"
        style={{ background: 'var(--accent)', color: '#0a0a0a' }}
      >
        Sending…
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePay}
        className="sweep w-full py-4 rounded-xl text-base font-bold"
        style={{ background: 'var(--accent)', color: '#0a0a0a' }}
      >
        Pay ${fmtMoney(totals.total)} USDC
      </button>
      {sendError && (
        <p className="text-xs text-red-400 text-center">
          {sendError}
        </p>
      )}
    </div>
  );
}

// ─── Invoice view ──────────────────────────────────────────────────────────────

function InvoiceView({ invoice: initialInvoice }: { invoice: Invoice }) {
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const liveInvoice = useInvoiceStore((s) => s.invoices[initialInvoice.id]) ?? initialInvoice;

  const [downloading, setDownloading] = useState(false);
  const { subtotal, tax, total } = calcTotals(liveInvoice.items, liveInvoice.taxPercent);

  function handlePaid(txHash: string) {
    updateInvoice(liveInvoice.id, { status: 'paid', txHash });
  }

  async function pdf() {
    setDownloading(true);
    try { await downloadInvoicePDF(liveInvoice); } finally { setDownloading(false); }
  }

  const alreadyPaid = liveInvoice.status === 'paid';

  return (
    <div className="flex flex-col gap-0">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--fg)', opacity: 0.7 }}>
            {liveInvoice.invoiceNumber}
          </span>
        </div>
        <StatusBadge status={liveInvoice.status} />
      </div>

      <div className="p-6 flex flex-col gap-6">
        {alreadyPaid && liveInvoice.txHash ? (
          <PaidScreen txHash={liveInvoice.txHash} invoice={liveInvoice} />
        ) : (
          <>
            {/* From / To */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--fg)', opacity: 0.4 }}>From</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{liveInvoice.from.name || '—'}</p>
                {liveInvoice.from.email && <p className="text-xs mt-0.5" style={{ color: 'var(--fg)', opacity: 0.55 }}>{liveInvoice.from.email}</p>}
                {liveInvoice.from.wallet && (
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                    {shortenAddress(liveInvoice.from.wallet)}
                  </p>
                )}
                {liveInvoice.from.website && <p className="text-xs mt-0.5" style={{ color: 'var(--accent)', opacity: 0.8 }}>{liveInvoice.from.website}</p>}
              </div>
              <div>
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--fg)', opacity: 0.4 }}>To</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{liveInvoice.to.name || '—'}</p>
                {liveInvoice.to.email && <p className="text-xs mt-0.5" style={{ color: 'var(--fg)', opacity: 0.55 }}>{liveInvoice.to.email}</p>}
                {liveInvoice.to.wallet && (
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--fg)', opacity: 0.45 }}>
                    {shortenAddress(liveInvoice.to.wallet)}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div
              className="grid grid-cols-2 gap-4 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--fg)', opacity: 0.4 }}>Issue date</p>
                <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{fmtDate(liveInvoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--fg)', opacity: 0.4 }}>Due date</p>
                <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{fmtDate(liveInvoice.dueDate)}</p>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div
                className="hidden sm:grid text-xs gap-3 px-3 pb-2 mb-1"
                style={{
                  gridTemplateColumns: '1fr 48px 80px 72px',
                  color: 'var(--fg)',
                  opacity: 0.4,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Total</span>
              </div>

              <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {liveInvoice.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex sm:grid items-center justify-between gap-2 sm:gap-3 py-2.5 px-3"
                    style={{ gridTemplateColumns: '1fr 48px 80px 72px' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--fg)' }}>{it.description}</span>
                    <span className="hidden sm:block text-sm text-right" style={{ color: 'var(--fg)', opacity: 0.6 }}>{it.quantity}</span>
                    <span className="hidden sm:block text-sm font-mono text-right" style={{ color: 'var(--fg)', opacity: 0.6 }}>
                      ${fmtMoney(parseFloat(it.unitPrice) || 0)}
                    </span>
                    <span className="text-sm font-mono text-right" style={{ color: 'var(--fg)' }}>
                      ${fmtMoney(calcRowTotal(it.quantity, it.unitPrice))}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="flex flex-col gap-1.5 mt-3 pt-3 px-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--fg)', opacity: 0.55 }}>Subtotal</span>
                  <span className="font-mono" style={{ color: 'var(--fg)' }}>${fmtMoney(subtotal)}</span>
                </div>
                {(parseFloat(liveInvoice.taxPercent) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--fg)', opacity: 0.55 }}>Tax ({liveInvoice.taxPercent}%)</span>
                    <span className="font-mono" style={{ color: 'var(--fg)' }}>${fmtMoney(tax)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between items-center pt-2 mt-1"
                  style={{ borderTop: '2px solid var(--border)' }}
                >
                  <span className="font-bold text-lg" style={{ color: 'var(--fg)' }}>Total</span>
                  <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                    ${fmtMoney(total)}{' '}
                    <span className="text-base font-medium">USDC</span>
                  </span>
                </div>
              </div>
            </div>

            {liveInvoice.notes && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  opacity: 0.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {liveInvoice.notes}
              </div>
            )}

            {liveInvoice.from.wallet ? (
              <PayButton invoice={liveInvoice} onPaid={handlePaid} />
            ) : (
              <div
                className="w-full py-4 rounded-xl text-sm text-center"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.5 }}
              >
                No recipient wallet address — contact the sender
              </div>
            )}

            <button
              onClick={pdf}
              disabled={downloading}
              className="sweep w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50"
              style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)' }}
            >
              <Download size={14} />
              {downloading ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hydrated, setHydrated] = useState(false);
  const invoice = useInvoiceStore((s) => s.invoices[id]);

  useEffect(() => setHydrated(true), []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--bg-nav)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Arc Pay
          </Link>
          <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            Invoice Payment
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {!hydrated ? (
          <div
            className="rounded-2xl h-96 animate-pulse"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          />
        ) : !invoice ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <FileText size={40} style={{ color: 'var(--fg)', opacity: 0.2 }} />
            <div>
              <p className="font-semibold text-lg mb-1" style={{ color: 'var(--fg)' }}>
                Invoice not found
              </p>
              <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                This invoice link only works on the device where it was created.
                Ask the sender to share it again.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              Back to Arc Pay
            </Link>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <InvoiceView invoice={invoice} />
          </div>
        )}
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs" style={{ color: 'var(--fg)', opacity: 0.3 }}>
          Powered by Arc Pay · USDC payments on Arc Testnet
        </p>
      </footer>
    </div>
  );
}
