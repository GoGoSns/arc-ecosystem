'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isAddress } from 'viem';
import {
  FileText,
  Plus,
  X,
  Copy,
  Share2,
  Download,
  Check,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import {
  useInvoiceStore,
  calcTotals,
  calcRowTotal,
  fmtMoney,
  type Invoice,
  type LineItem,
} from '@/lib/invoiceStore';
import { downloadInvoicePDF } from '@/lib/invoicePdf';

// ─── Date helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function genInvoiceNumber(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${ym}-${rand}`;
}
function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' };
}

// ─── Shared input style helper ─────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
};

function inputProps(error?: boolean) {
  return {
    className: `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors`,
    style: { ...inputBase, borderColor: error ? '#f87171' : 'var(--border)' } as React.CSSProperties,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = 'var(--accent)'),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = error ? '#f87171' : 'var(--border)'),
  };
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs block mb-1" style={{ color: 'var(--fg)', opacity: 0.55 }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ─── Line items section ────────────────────────────────────────────────────────

function LineItemsSection({
  items,
  taxPercent,
  errors,
  onItemsChange,
  onTaxChange,
}: {
  items: LineItem[];
  taxPercent: string;
  errors: Record<string, string>;
  onItemsChange: (items: LineItem[]) => void;
  onTaxChange: (v: string) => void;
}) {
  function update(id: string, field: keyof Omit<LineItem, 'id'>, value: string) {
    onItemsChange(items.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  const { subtotal, tax, total } = calcTotals(items, taxPercent);

  return (
    <Section title="Line items">
      {errors.items && <p className="text-xs text-red-400">{errors.items}</p>}

      <div className="flex flex-col gap-2">
        {items.length > 0 && (
          <div
            className="hidden sm:grid text-xs gap-2"
            style={{
              gridTemplateColumns: '1fr 56px 90px 70px 20px',
              color: 'var(--fg)',
              opacity: 0.4,
            }}
          >
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Total</span>
            <span />
          </div>
        )}

        {items.map((it, idx) => (
          <div key={it.id} className="flex flex-col sm:grid gap-2 items-center"
            style={{ gridTemplateColumns: '1fr 56px 90px 70px 20px' }}
          >
            {/* Description */}
            <input
              type="text"
              value={it.description}
              onChange={(e) => update(it.id, 'description', e.target.value)}
              placeholder={`Item ${idx + 1}`}
              className="w-full px-2.5 py-2 rounded-lg text-sm border outline-none transition-colors"
              style={{
                ...inputBase,
                borderColor: errors[`item_${it.id}`] ? '#f87171' : 'var(--border)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) =>
                (e.target.style.borderColor = errors[`item_${it.id}`] ? '#f87171' : 'var(--border)')
              }
            />
            {/* Qty */}
            <input
              type="number"
              min="0"
              step="1"
              value={it.quantity}
              onChange={(e) => update(it.id, 'quantity', e.target.value)}
              className="w-full sm:w-auto px-2 py-2 rounded-lg text-sm font-mono text-right border outline-none transition-colors"
              style={inputBase}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            {/* Unit price */}
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--accent)' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={it.unitPrice}
                onChange={(e) => update(it.id, 'unitPrice', e.target.value)}
                placeholder="0.00"
                className="w-full pl-5 pr-2 py-2 rounded-lg text-sm font-mono text-right border outline-none transition-colors"
                style={{
                  ...inputBase,
                  borderColor: errors[`item_price_${it.id}`] ? '#f87171' : 'var(--border)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    errors[`item_price_${it.id}`] ? '#f87171' : 'var(--border)')
                }
              />
            </div>
            {/* Row total */}
            <span
              className="hidden sm:block text-sm font-mono text-right"
              style={{ color: 'var(--fg)', opacity: 0.7 }}
            >
              ${fmtMoney(calcRowTotal(it.quantity, it.unitPrice))}
            </span>
            {/* Remove */}
            <button
              onClick={() => onItemsChange(items.filter((x) => x.id !== it.id))}
              className="self-end sm:self-center p-1 rounded-lg transition-opacity hover:opacity-80"
              style={{ color: 'var(--fg)', opacity: 0.3 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={() => onItemsChange([...items, newItem()])}
          className="flex items-center gap-1.5 text-xs font-medium mt-1 transition-opacity hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={13} />
          Add line item
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Tax row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                Tax
              </span>
              <div className="relative w-20">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => onTaxChange(e.target.value)}
                  placeholder="0"
                  className="w-full pl-2 pr-5 py-1 rounded-lg text-xs font-mono text-right border outline-none"
                  style={inputBase}
                />
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--fg)', opacity: 0.4 }}
                >
                  %
                </span>
              </div>
              {errors.taxPercent && (
                <span className="text-xs text-red-400">{errors.taxPercent}</span>
              )}
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              ${fmtMoney(tax)}
            </span>
          </div>
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              Subtotal
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--fg)' }}>
              ${fmtMoney(subtotal)}
            </span>
          </div>
          {/* Total */}
          <div
            className="flex justify-between items-center pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
              Total
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
              ${fmtMoney(total)}{' '}
              <span className="text-xs font-medium">USDC</span>
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({
  invoice,
  onCreateAnother,
}: {
  invoice: Invoice;
  onCreateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { total } = calcTotals(invoice.items, invoice.taxPercent);
  const link =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pay/${invoice.id}`
      : `https://arcpay.app/pay/${invoice.id}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const data = {
      title: invoice.invoiceNumber,
      text: `Invoice from ${invoice.from.name} — $${fmtMoney(total)} USDC`,
      url: link,
    };
    if (navigator.share && navigator.canShare?.(data)) {
      await navigator.share(data).catch(() => {});
    } else {
      await navigator.clipboard.writeText(link);
    }
  }

  async function pdf() {
    setDownloading(true);
    try {
      await downloadInvoicePDF(invoice);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(201,168,76,0.12)' }}
      >
        <FileText size={32} style={{ color: 'var(--accent)' }} />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--fg)' }}>
          Invoice created!
        </h2>
        <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
          {invoice.invoiceNumber} &nbsp;·&nbsp; ${fmtMoney(total)} USDC
        </p>
      </div>

      {/* Link box */}
      <div
        className="w-full rounded-xl p-3 flex items-center gap-2"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <span
          className="flex-1 text-xs font-mono truncate"
          style={{ color: 'var(--fg)', opacity: 0.65 }}
        >
          {link}
        </span>
        <button
          onClick={copy}
          className="shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: copied ? 'var(--accent)' : 'var(--fg)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={share}
          className="sweep w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          <Share2 size={15} />
          Share invoice
        </button>
        <div className="flex gap-2">
          <button
            onClick={pdf}
            disabled={downloading}
            className="sweep flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)' }}
          >
            <Download size={14} />
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
          <a
            href={`/pay/${invoice.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sweep flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)' }}
          >
            <ExternalLink size={14} />
            Preview
          </a>
        </div>
        <button
          onClick={onCreateAnother}
          className="w-full py-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--fg)', opacity: 0.4 }}
        >
          Create another
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function InvoicePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const addInvoice = useInvoiceStore((s) => s.addInvoice);

  // From
  const [fromName, setFromName] = useState('');
  const [fromWallet, setFromWallet] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromWebsite, setFromWebsite] = useState('');
  // To
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toWallet, setToWallet] = useState('');
  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState(genInvoiceNumber);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(() => plusDays(30));
  // Line items
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [taxPercent, setTaxPercent] = useState('');
  // Notes
  const [notes, setNotes] = useState('');
  // UI
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<Invoice | null>(null);
  const walletEditedRef = useRef(false);

  // Auto-fill from wallet (only if user hasn't manually typed)
  useEffect(() => {
    if (address && !walletEditedRef.current) {
      setFromWallet(address);
    }
  }, [address]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!fromName.trim()) errs.fromName = 'Required';
    if (!fromWallet.trim()) errs.fromWallet = 'Required';
    else if (!isAddress(fromWallet)) errs.fromWallet = 'Invalid wallet address';
    if (toWallet && !isAddress(toWallet)) errs.toWallet = 'Invalid wallet address';

    const validItems = items.filter((it) => it.description.trim() || it.unitPrice);
    if (validItems.length === 0) {
      errs.items = 'Add at least one line item with a description and price';
    } else {
      validItems.forEach((it) => {
        if (!it.description.trim()) errs[`item_${it.id}`] = 'Description required';
        if (!it.unitPrice || parseFloat(it.unitPrice) <= 0)
          errs[`item_price_${it.id}`] = 'Price required';
      });
    }

    const taxNum = parseFloat(taxPercent);
    if (taxPercent && (isNaN(taxNum) || taxNum < 0 || taxNum > 100)) {
      errs.taxPercent = '0–100';
    }
    return errs;
  }

  function generate() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      issueDate,
      dueDate,
      from: { name: fromName.trim(), wallet: fromWallet.trim(), email: fromEmail.trim(), website: fromWebsite.trim() },
      to: { name: toName.trim(), email: toEmail.trim(), wallet: toWallet.trim() },
      items: items.filter((it) => it.description.trim()),
      taxPercent,
      notes: notes.trim(),
      status: 'unpaid',
      createdAt: Date.now(),
    };

    addInvoice(invoice);
    setGenerated(invoice);
  }

  function reset() {
    setGenerated(null);
    setFromName('');
    setFromWallet('');
    setFromEmail('');
    setFromWebsite('');
    setToName('');
    setToEmail('');
    setToWallet('');
    setInvoiceNumber(genInvoiceNumber());
    setIssueDate(todayStr());
    setDueDate(plusDays(30));
    setItems([newItem()]);
    setTaxPercent('');
    setNotes('');
    setErrors({});
    walletEditedRef.current = false;
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
              Create Invoice
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Generate a USDC invoice &amp; share a payment link
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {generated ? (
              <SuccessScreen invoice={generated} onCreateAnother={reset} />
            ) : (
              <div className="flex flex-col gap-5">
                {/* Wallet hint when disconnected */}
                {!isConnected && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    <Wallet size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <p className="text-xs flex-1" style={{ color: 'var(--fg)', opacity: 0.75 }}>
                      Connect your wallet to auto-fill your address
                    </p>
                    <button
                      onClick={() => connect({ connector: injected() })}
                      className="text-xs font-medium shrink-0"
                      style={{ color: 'var(--accent)' }}
                    >
                      Connect
                    </button>
                  </div>
                )}

                {/* From */}
                <Section title="From — your info">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Name / Business *" error={errors.fromName}>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="Acme Studio"
                        {...inputProps(!!errors.fromName)}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="hello@acme.com"
                        {...inputProps()}
                      />
                    </Field>
                  </div>
                  <Field label="Wallet address (receives payments) *" error={errors.fromWallet}>
                    <input
                      type="text"
                      value={fromWallet}
                      onChange={(e) => {
                        walletEditedRef.current = true;
                        setFromWallet(e.target.value);
                      }}
                      placeholder="0x…"
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none transition-colors"
                      style={{
                        ...inputBase,
                        borderColor: errors.fromWallet ? '#f87171' : 'var(--border)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={(e) =>
                        (e.target.style.borderColor = errors.fromWallet ? '#f87171' : 'var(--border)')
                      }
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      type="text"
                      value={fromWebsite}
                      onChange={(e) => setFromWebsite(e.target.value)}
                      placeholder="https://acme.com"
                      {...inputProps()}
                    />
                  </Field>
                </Section>

                {/* To */}
                <Section title="To — client info">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Client name">
                      <input
                        type="text"
                        value={toName}
                        onChange={(e) => setToName(e.target.value)}
                        placeholder="Client Co."
                        {...inputProps()}
                      />
                    </Field>
                    <Field label="Client email">
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="client@example.com"
                        {...inputProps()}
                      />
                    </Field>
                  </div>
                  <Field label="Client wallet address (optional)" error={errors.toWallet}>
                    <input
                      type="text"
                      value={toWallet}
                      onChange={(e) => setToWallet(e.target.value)}
                      placeholder="0x… (leave blank if unknown)"
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none transition-colors"
                      style={{
                        ...inputBase,
                        borderColor: errors.toWallet ? '#f87171' : 'var(--border)',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={(e) =>
                        (e.target.style.borderColor = errors.toWallet ? '#f87171' : 'var(--border)')
                      }
                    />
                  </Field>
                </Section>

                {/* Invoice details */}
                <Section title="Invoice details">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Invoice number">
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        {...inputProps()}
                      />
                    </Field>
                    <Field label="Issue date">
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        {...inputProps()}
                      />
                    </Field>
                    <Field label="Due date">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        {...inputProps()}
                      />
                    </Field>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', opacity: 0.6 }}
                  >
                    Currency: USDC on Arc Testnet
                  </div>
                </Section>

                {/* Line items */}
                <LineItemsSection
                  items={items}
                  taxPercent={taxPercent}
                  errors={errors}
                  onItemsChange={setItems}
                  onTaxChange={setTaxPercent}
                />

                {/* Notes */}
                <Section title="Notes (optional)">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment terms, thank-you note, bank details…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none transition-colors"
                    style={inputBase}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </Section>

                {/* Generate */}
                <button
                  onClick={generate}
                  className="sweep w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                >
                  Generate Invoice
                </button>

                {Object.keys(errors).some((k) => k === 'fromName' || k === 'fromWallet' || k === 'items') && (
                  <p className="text-xs text-red-400 text-center -mt-3">
                    Please fix the errors above
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
