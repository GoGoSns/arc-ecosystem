'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { QRCodeSVG } from 'qrcode.react';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sendUSDC } from '@/lib/payments';
import {
  QrCode,
  Camera,
  Copy,
  Share2,
  Check,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';

// Scanner uses camera APIs — must be client-only (no SSR)
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((m) => ({ default: m.Scanner })),
  { ssr: false }
);

// ─── QR payload ────────────────────────────────────────────────────────────────

function buildPaymentQR(
  recipientAddress: string,
  amountUsdc: string,
  memo?: string
): string {
  if (!amountUsdc || parseFloat(amountUsdc) <= 0) return '';
  const obj: Record<string, string> = {
    to: recipientAddress,
    amount: amountUsdc,
    token: 'USDC',
    chain: 'Arc_Testnet',
  };
  if (memo?.trim()) obj.memo = memo.trim();
  return JSON.stringify(obj);
}

interface ParsedPayment {
  recipient: string;
  amount: string;
  memo?: string;
}

function parsePaymentQR(raw: string): ParsedPayment | null {
  try {
    const obj = JSON.parse(raw.trim());
    if (!obj.to || !obj.amount || obj.token !== 'USDC') return null;
    return {
      recipient: obj.to,
      amount: String(obj.amount),
      memo: obj.memo,
    };
  } catch {
    return null;
  }
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Receive Tab ───────────────────────────────────────────────────────────────

function ReceiveTab({ address }: { address: string }) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState(false);

  const qrValue = buildPaymentQR(address, amount, memo);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const shareData = {
      title: 'Pay me in USDC',
      text: amount
        ? `Send ${amount} USDC to ${address} on Arc Testnet`
        : `Pay ${shortenAddress(address)} in USDC on Arc Testnet`,
      url: qrValue || address,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(qrValue || address);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Inputs */}
      <div className="w-full max-w-xs flex flex-col gap-3">
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-14 pr-4 py-3 rounded-xl text-xl font-mono text-right border outline-none transition-colors"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <input
          type="text"
          placeholder="Memo / note (optional)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={80}
          className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* QR Code — always white background for scannability */}
      <div
        className="p-4 rounded-2xl flex items-center justify-center"
        style={{ background: '#ffffff', boxShadow: '0 0 0 1px rgba(0,0,0,0.07)' }}
      >
        {qrValue ? (
          <QRCodeSVG
            value={qrValue}
            size={220}
            level="M"
            marginSize={1}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        ) : (
          <div
            className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-3"
            style={{ color: '#bbb' }}
          >
            <QrCode size={52} strokeWidth={1.2} />
            <p className="text-xs text-center px-6 leading-relaxed">
              Enter an amount above to generate your payment QR
            </p>
          </div>
        )}
      </div>

      {qrValue && (
        <p className="text-xs animate-pulse" style={{ color: 'var(--accent)' }}>
          Waiting for payment...
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={copyAddress}
          className="sweep flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
          }}
        >
          {copied ? (
            <Check size={14} style={{ color: 'var(--accent)' }} />
          ) : (
            <Copy size={14} />
          )}
          {copied ? 'Copied!' : 'Copy address'}
        </button>
        <button
          onClick={share}
          className="sweep flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
          }}
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <p
        className="text-xs font-mono text-center break-all max-w-xs"
        style={{ color: 'var(--fg)', opacity: 0.3 }}
      >
        {address}
      </p>
    </div>
  );
}

// ─── Send Tab ──────────────────────────────────────────────────────────────────

function SendTab() {
  const [mode, setMode] = useState<'camera' | 'paste'>('camera');
  const [pasteValue, setPasteValue] = useState('');
  const [parsed, setParsed] = useState<ParsedPayment | null>(null);
  const [scanError, setScanError] = useState('');

  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  function handleScan(results: IDetectedBarcode[]) {
    const raw = results[0]?.rawValue;
    if (!raw) return;
    const p = parsePaymentQR(raw);
    if (p) {
      setParsed(p);
      setScanError('');
    } else {
      setScanError('Not a valid Arc Pay QR — try pasting the JSON manually');
    }
  }

  function handlePaste() {
    const p = parsePaymentQR(pasteValue);
    if (p) {
      setParsed(p);
      setScanError('');
    } else {
      setScanError('Could not parse. Expected JSON: {"to":"0x…","amount":"10","token":"USDC","chain":"Arc_Testnet"}');
    }
  }

  async function pay() {
    if (!parsed) return;
    setIsPending(true);
    setSendError('');
    try {
      const result = await sendUSDC(parsed.recipient, parsed.amount);
      setTxHash(result.txHash);
      setExplorerUrl(result.explorerUrl);
      setIsSuccess(true);
    } catch (err: unknown) {
      setSendError(
        err instanceof Error ? err.message.split('\n')[0] : 'Transaction failed'
      );
    } finally {
      setIsPending(false);
    }
  }

  function reset() {
    setParsed(null);
    setPasteValue('');
    setScanError('');
    setSendError('');
    setTxHash('');
    setExplorerUrl('');
    setIsSuccess(false);
    setMode('camera');
  }

  // ── Payment confirmed ─────────────────────────────────────────────────────
  if (parsed && isSuccess && txHash) {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-xs mx-auto">
        <div className="flex flex-col items-center gap-2" style={{ color: '#4ade80' }}>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.12)' }}
          >
            <Check size={28} />
          </div>
          <span className="font-semibold text-lg">Payment sent!</span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm"
          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
        >
          View on ArcScan <ExternalLink size={13} />
        </a>
        <button
          onClick={reset}
          className="sweep w-full py-2.5 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
        >
          New scan
        </button>
      </div>
    );
  }

  // ── Payment details + pay button ──────────────────────────────────────────
  if (parsed) {
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-xs mx-auto">
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--fg)', opacity: 0.4 }}
          >
            Payment details
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              To
            </span>
            <span className="text-sm font-mono" style={{ color: 'var(--fg)' }}>
              {shortenAddress(parsed.recipient)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              Amount
            </span>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              ${parsed.amount}{' '}
              <span className="text-sm font-medium">USDC</span>
            </span>
          </div>
          {parsed.memo && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-sm shrink-0" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                Memo
              </span>
              <span className="text-sm text-right" style={{ color: 'var(--fg)' }}>
                {parsed.memo}
              </span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-2">
          <button
            onClick={pay}
            disabled={isPending}
            className="sweep w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            {isPending ? 'Sending…' : `Pay $${parsed.amount} USDC`}
          </button>
          {sendError && (
            <p className="text-xs text-red-400 text-center leading-relaxed">{sendError}</p>
          )}
          <button
            onClick={reset}
            className="w-full py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--fg)', opacity: 0.4 }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Scanner / Paste ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 w-full max-w-xs mx-auto">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {(['camera', 'paste'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setScanError('');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: mode === m ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
              color: mode === m ? 'var(--accent)' : 'var(--fg)',
              opacity: mode === m ? 1 : 0.55,
            }}
          >
            {m === 'camera' ? (
              <>
                <Camera size={12} />
                Camera
              </>
            ) : (
              'Paste JSON'
            )}
          </button>
        ))}
      </div>

      {mode === 'camera' ? (
        <div
          className="w-full overflow-hidden rounded-2xl"
          style={{ border: '1px solid var(--border)' }}
        >
          <Scanner
            onScan={handleScan}
            onError={(err) => setScanError(String(err))}
            constraints={{ facingMode: 'environment' }}
            formats={['qr_code']}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            placeholder={`{"to":"0x…","amount":"10","token":"USDC","chain":"Arc_Testnet"}`}
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl text-xs font-mono border outline-none resize-none transition-colors"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={handlePaste}
            disabled={!pasteValue.trim()}
            className="sweep w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            Parse &amp; Continue
          </button>
        </div>
      )}

      {scanError && (
        <p className="text-xs text-red-400 text-center leading-relaxed">{scanError}</p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function QRPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [tab, setTab] = useState<'receive' | 'send'>('receive');

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
              QR Payment
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Send &amp; receive USDC on Arc Testnet
            </p>
          </div>

          {!isConnected ? (
            /* ── Not connected ── */
            <div
              className="flex flex-col items-center gap-5 rounded-2xl p-10"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.12)' }}
              >
                <Wallet size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                  Connect wallet first
                </p>
                <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
                  Required to send or receive USDC payments
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
            /* ── Connected ── */
            <div
              className="rounded-2xl p-6 flex flex-col gap-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {/* Tab switcher */}
              <div
                className="flex rounded-xl p-1 gap-1"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setTab('receive')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: tab === 'receive' ? 'var(--accent)' : 'transparent',
                    color: tab === 'receive' ? '#0a0a0a' : 'var(--fg)',
                    opacity: tab === 'receive' ? 1 : 0.5,
                  }}
                >
                  <QrCode size={13} />
                  Receive
                </button>
                <button
                  onClick={() => setTab('send')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: tab === 'send' ? 'var(--accent)' : 'transparent',
                    color: tab === 'send' ? '#0a0a0a' : 'var(--fg)',
                    opacity: tab === 'send' ? 1 : 0.5,
                  }}
                >
                  <Camera size={13} />
                  Send
                </button>
              </div>

              {tab === 'receive' ? (
                <ReceiveTab address={address!} />
              ) : (
                <SendTab />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
