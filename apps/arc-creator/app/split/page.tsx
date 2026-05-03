'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { QRCodeSVG } from 'qrcode.react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { formatUSDC, parseUSDC } from '@/lib/usdc';
import { Users, Plus, X, Copy, QrCode, Check, ArrowLeft } from 'lucide-react';

const LS_KEY = 'arc-pay-split-bill';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  nickname: string;
  address: string;
  share: string; // human-readable USDC e.g. "10.50"
  paid: boolean;
}

interface Bill {
  id: string;
  title: string;
  total: string; // human-readable USDC
  recipient: string;
  splitMode: 'equal' | 'custom';
  participants: Participant[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildPaymentQR(recipient: string, amountUsdc: string, memo?: string): string {
  try {
    parseUSDC(amountUsdc); // validate
    const obj: Record<string, string> = {
      to: recipient,
      amount: amountUsdc,
      token: 'USDC',
      chain: 'Arc_Testnet',
    };
    if (memo?.trim()) obj.memo = memo.trim();
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function calcEqualShares(totalStr: string, count: number): string[] {
  if (!totalStr || count === 0) return [];
  try {
    const totalRaw = parseUSDC(totalStr);
    const share = totalRaw / BigInt(count);
    const remainder = totalRaw % BigInt(count);
    return Array.from({ length: count }, (_, i) =>
      i === count - 1 ? formatUSDC(share + remainder) : formatUSDC(share)
    );
  } catch {
    return Array(count).fill('0.00');
  }
}

function safeParseUSDC(s: string): bigint {
  try { return parseUSDC(s || '0'); } catch { return BigInt(0); }
}

// ─── QR Modal ──────────────────────────────────────────────────────────────────

function QRModal({
  participant,
  recipient,
  billTitle,
  onClose,
}: {
  participant: Participant;
  recipient: string;
  billTitle: string;
  onClose: () => void;
}) {
  const uri = buildPaymentQR(recipient, participant.share, billTitle);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl p-6 w-full max-w-xs"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between w-full">
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
              {participant.nickname || shortenAddress(participant.address)}
            </p>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              ${participant.share} USDC
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3 rounded-xl" style={{ background: '#ffffff' }}>
          <QRCodeSVG
            value={uri || 'invalid'}
            size={200}
            level="M"
            marginSize={1}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--fg)', opacity: 0.45 }}>
          Scan to pay ${participant.share} USDC
        </p>
      </div>
    </div>
  );
}

// ─── Setup Step ────────────────────────────────────────────────────────────────

function SetupStep({
  onGenerate,
  defaultRecipient,
}: {
  onGenerate: (bill: Bill) => void;
  defaultRecipient: string;
}) {
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Add-participant form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addNick, setAddNick] = useState('');
  const [addAddr, setAddAddr] = useState('');
  const [addShare, setAddShare] = useState('');
  const [addError, setAddError] = useState('');

  // Auto-fill recipient only if still empty (wallet connects after render)
  const recipientEditedRef = useRef(false);
  useEffect(() => {
    if (defaultRecipient && !recipientEditedRef.current) {
      setRecipient(defaultRecipient);
    }
  }, [defaultRecipient]);

  const equalShares = splitMode === 'equal' ? calcEqualShares(total, participants.length) : [];

  // Custom-mode running sum
  const customSum = participants.reduce((a, p) => a + safeParseUSDC(p.share), BigInt(0));
  const totalRaw = safeParseUSDC(total);
  const customDiff = customSum - totalRaw; // positive = over, negative = under

  function addParticipant() {
    const trimmed = addAddr.trim();
    if (!isAddress(trimmed)) { setAddError('Invalid wallet address'); return; }
    if (participants.some((p) => p.address.toLowerCase() === trimmed.toLowerCase())) {
      setAddError('Address already in list');
      return;
    }
    setParticipants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nickname: addNick.trim(),
        address: trimmed,
        share: splitMode === 'custom' ? (addShare || '0') : '0',
        paid: false,
      },
    ]);
    setAddNick('');
    setAddAddr('');
    setAddShare('');
    setAddError('');
    setShowAddForm(false);
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function updateCustomShare(id: string, share: string) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, share } : p)));
  }

  function validate(): string | null {
    if (!total || parseFloat(total) <= 0) return 'Enter a total amount';
    if (!isAddress(recipient)) return 'Enter a valid recipient address';
    if (participants.length === 0) return 'Add at least one participant';
    if (splitMode === 'custom') {
      if (customDiff !== BigInt(0)) {
        const abs = customDiff < BigInt(0) ? -customDiff : customDiff;
        return `Shares ${customDiff > BigInt(0) ? 'exceed' : 'are under'} total by $${formatUSDC(abs)} USDC`;
      }
    }
    return null;
  }

  const validationError = validate();
  const showValidationError = !!validationError && participants.length > 0;

  function generate() {
    if (validationError) return;
    const finalParticipants: Participant[] = participants.map((p, i) => ({
      ...p,
      share: splitMode === 'equal' ? (equalShares[i] ?? '0.00') : p.share,
    }));
    onGenerate({
      id: crypto.randomUUID(),
      title: title.trim() || 'Split Bill',
      total,
      recipient,
      splitMode,
      participants: finalParticipants,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bill title */}
      <input
        type="text"
        placeholder="What's this for? (e.g. Dinner at Sushi Bar)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />

      {/* Total */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold tracking-wider"
          style={{ color: 'var(--accent)' }}
        >
          USDC
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="w-full pl-14 pr-4 py-3 rounded-xl text-xl font-mono text-right border outline-none transition-colors"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Recipient */}
      <div>
        <label className="text-xs block mb-1.5" style={{ color: 'var(--fg)', opacity: 0.55 }}>
          Payments go to
        </label>
        <input
          type="text"
          placeholder="0x… recipient address"
          value={recipient}
          onChange={(e) => {
            recipientEditedRef.current = true;
            setRecipient(e.target.value);
          }}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-mono border outline-none transition-colors"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        {recipient && !isAddress(recipient) && (
          <p className="text-xs text-red-400 mt-1">Invalid address</p>
        )}
      </div>

      {/* Split mode toggle */}
      <div>
        <label className="text-xs block mb-1.5" style={{ color: 'var(--fg)', opacity: 0.55 }}>
          Split mode
        </label>
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          {(['equal', 'custom'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSplitMode(m)}
              className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
              style={{
                background: splitMode === m ? 'var(--accent)' : 'transparent',
                color: splitMode === m ? '#0a0a0a' : 'var(--fg)',
                opacity: splitMode === m ? 1 : 0.55,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>
            Participants ({participants.length})
          </label>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              <Plus size={13} />
              Add
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Participant rows */}
          {participants.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>
                  {p.nickname || shortenAddress(p.address)}
                </p>
                {p.nickname && (
                  <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                    {shortenAddress(p.address)}
                  </p>
                )}
              </div>

              {splitMode === 'custom' ? (
                <div className="relative w-24 shrink-0">
                  <span
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: 'var(--accent)' }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={p.share}
                    onChange={(e) => updateCustomShare(p.id, e.target.value)}
                    className="w-full pl-5 pr-2 py-1 rounded-lg text-sm font-mono text-right border outline-none"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--fg)',
                    }}
                  />
                </div>
              ) : (
                <span className="text-sm font-mono shrink-0" style={{ color: 'var(--accent)' }}>
                  {equalShares[i] ? `$${equalShares[i]}` : '—'}
                </span>
              )}

              <button
                onClick={() => removeParticipant(p.id)}
                className="p-1 rounded-lg shrink-0 transition-opacity hover:opacity-80"
                style={{ color: 'var(--fg)', opacity: 0.35 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Custom mode sum indicator */}
          {splitMode === 'custom' && participants.length > 0 && total && (
            <p
              className="text-xs"
              style={{ color: customDiff === BigInt(0) ? '#4ade80' : '#f87171' }}
            >
              {customDiff === BigInt(0)
                ? `✓ Shares add up to $${total} USDC`
                : customDiff > BigInt(0)
                ? `Over by $${formatUSDC(customDiff)} USDC`
                : `Under by $${formatUSDC(-customDiff)} USDC`}
            </p>
          )}

          {/* Add participant form */}
          {showAddForm && (
            <div
              className="flex flex-col gap-2 p-3 rounded-xl"
              style={{ background: 'var(--bg)', border: '1px solid var(--accent)' }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={addNick}
                  onChange={(e) => setAddNick(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--fg)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                {splitMode === 'custom' && (
                  <div className="relative w-24 shrink-0">
                    <span
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'var(--accent)' }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={addShare}
                      onChange={(e) => setAddShare(e.target.value)}
                      className="w-full pl-5 pr-2 py-2 rounded-lg text-sm font-mono border outline-none"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        color: 'var(--fg)',
                      }}
                    />
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="0x… wallet address (required)"
                value={addAddr}
                onChange={(e) => {
                  setAddAddr(e.target.value);
                  setAddError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono border outline-none transition-colors"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={addParticipant}
                  className="sweep flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent)', color: '#0a0a0a' }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setAddNick('');
                    setAddAddr('');
                    setAddShare('');
                    setAddError('');
                  }}
                  className="px-4 py-2 rounded-lg text-sm border"
                  style={{ border: '1px solid var(--border)', color: 'var(--fg)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {participants.length === 0 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)', opacity: 0.45 }}
            >
              <Users size={16} />
              <span className="text-sm">Add participants</span>
            </button>
          )}
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={generate}
        disabled={!!validationError}
        className="sweep w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
        style={{ background: 'var(--accent)', color: '#0a0a0a' }}
      >
        Generate Bill
      </button>

      {showValidationError && (
        <p className="text-xs text-center text-red-400 -mt-3">{validationError}</p>
      )}
    </div>
  );
}

// ─── Active Bill Step ──────────────────────────────────────────────────────────

function ActiveBillStep({
  bill,
  onUpdate,
  onReset,
}: {
  bill: Bill;
  onUpdate: (bill: Bill) => void;
  onReset: () => void;
}) {
  const [qrTarget, setQrTarget] = useState<Participant | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const paidCount = bill.participants.filter((p) => p.paid).length;
  const total = bill.participants.length;
  const progress = total > 0 ? (paidCount / total) * 100 : 0;
  const allPaid = paidCount === total && total > 0;

  function togglePaid(id: string) {
    onUpdate({
      ...bill,
      participants: bill.participants.map((p) =>
        p.id === id ? { ...p, paid: !p.paid } : p
      ),
    });
  }

  async function copyPaymentLink(p: Participant) {
    const params = new URLSearchParams({
      to: bill.recipient,
      amount: p.share,
      memo: bill.title,
      billId: bill.id,
    });
    await navigator.clipboard.writeText(
      `${window.location.origin}/pay?${params.toString()}`
    );
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bill header */}
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--fg)' }}>
          {bill.title}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            ${bill.total}{' '}
            <span className="text-sm font-medium">USDC</span>
          </span>
          <span className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.4 }}>
            → {shortenAddress(bill.recipient)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div
          className="flex justify-between text-xs mb-1.5"
          style={{ color: 'var(--fg)', opacity: 0.55 }}
        >
          <span>
            {paidCount} of {total} paid
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: allPaid ? '#4ade80' : 'var(--accent)',
            }}
          />
        </div>
        {allPaid && (
          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#4ade80' }}>
            <Check size={11} /> All paid!
          </p>
        )}
      </div>

      {/* Participant rows */}
      <div className="flex flex-col gap-2">
        {bill.participants.map((p) => (
          <div
            key={p.id}
            className="rounded-xl p-3 flex flex-col gap-2.5 transition-colors"
            style={{
              border: `1px solid ${p.paid ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
              background: p.paid ? 'rgba(74,222,128,0.04)' : 'var(--bg)',
            }}
          >
            {/* Top row: name + amount + paid badge */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>
                  {p.nickname || shortenAddress(p.address)}
                </p>
                {p.nickname && (
                  <p className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.38 }}>
                    {shortenAddress(p.address)}
                  </p>
                )}
              </div>
              <span className="text-base font-bold shrink-0" style={{ color: 'var(--accent)' }}>
                ${p.share}
              </span>
              <button
                onClick={() => togglePaid(p.id)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                style={
                  p.paid
                    ? {
                        background: 'rgba(74,222,128,0.15)',
                        color: '#4ade80',
                        border: '1px solid rgba(74,222,128,0.3)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--fg)',
                        border: '1px solid var(--border)',
                        opacity: 0.5,
                      }
                }
              >
                {p.paid && <Check size={11} />}
                {p.paid ? 'Paid' : 'Unpaid'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => copyPaymentLink(p)}
                className="sweep flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                }}
              >
                {copiedId === p.id ? (
                  <>
                    <Check size={11} style={{ color: 'var(--accent)' }} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    Copy link
                  </>
                )}
              </button>
              <button
                onClick={() => setQrTarget(p)}
                className="sweep flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--fg)',
                }}
              >
                <QrCode size={11} />
                Show QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Bill */}
      <button
        onClick={onReset}
        className="sweep w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)' }}
      >
        <ArrowLeft size={14} />
        New Bill
      </button>

      {/* QR Modal */}
      {qrTarget && (
        <QRModal
          participant={qrTarget}
          recipient={bill.recipient}
          billTitle={bill.title}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SplitPage() {
  const { address } = useAccount();
  const [bill, setBill] = useState<Bill | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted bill on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setBill(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist bill whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    if (bill) {
      localStorage.setItem(LS_KEY, JSON.stringify(bill));
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, [bill, hydrated]);

  // Avoid hydration mismatch from localStorage read
  if (!hydrated) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
              Split the Bill
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Divide expenses &amp; collect USDC on Arc Testnet
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {bill ? (
              <ActiveBillStep
                bill={bill}
                onUpdate={setBill}
                onReset={() => setBill(null)}
              />
            ) : (
              <SetupStep
                onGenerate={setBill}
                defaultRecipient={address ?? ''}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
