'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Copy, Check, ExternalLink, Wallet, Coffee } from 'lucide-react';
import Navbar from '@/components/Navbar';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreatorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  amounts: number[];
  allowCustom: boolean;
}

interface TipRecord {
  fromAddress: string;
  amount: string;
  message: string;
  timestamp: number;
  txHash: string;
}

const DEFAULT_AMOUNTS = [1, 5, 10, 25, 50];

function profileKey(address: string) {
  return `arccreator:profile:${address.toLowerCase()}`;
}

function tipsKey(address: string) {
  return `arccreator:tips:${address.toLowerCase()}`;
}

function loadProfile(address: string): CreatorProfile {
  try {
    const raw = localStorage.getItem(profileKey(address));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: '', bio: '', avatarUrl: '', amounts: DEFAULT_AMOUNTS, allowCustom: true };
}

function saveProfile(address: string, profile: CreatorProfile) {
  localStorage.setItem(profileKey(address), JSON.stringify(profile));
}

function loadTips(address: string): TipRecord[] {
  try {
    const raw = localStorage.getItem(tipsKey(address));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

function StatsSection({ address }: { address: string }) {
  const [tips, setTips] = useState<TipRecord[]>([]);

  useEffect(() => {
    setTips(loadTips(address));
  }, [address]);

  const total = tips.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const recent = tips.slice().reverse().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
        Stats
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>Total tips</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{tips.length}</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--fg)', opacity: 0.45 }}>Total received</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            ${total.toFixed(2)}
          </p>
        </div>
      </div>

      {recent.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--fg)', opacity: 0.4 }}>
              Recent tips
            </p>
          </div>
          {recent.map((tip, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-mono" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                  {tip.fromAddress ? shortenAddress(tip.fromAddress) : 'Anonymous'}
                </span>
                {tip.message && (
                  <span className="text-xs truncate max-w-[180px]" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                    "{tip.message}"
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.3 }}>
                  {fmtTime(tip.timestamp)}
                </span>
              </div>
              <span className="font-semibold text-sm shrink-0" style={{ color: 'var(--accent)' }}>
                +${parseFloat(tip.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tips.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--fg)', opacity: 0.35 }}>
          No tips yet — share your link to get started
        </p>
      )}
    </div>
  );
}

// ─── Creator dashboard (connected) ─────────────────────────────────────────────

function CreatorDashboard({ address }: { address: string }) {
  const [profile, setProfile] = useState<CreatorProfile>(() => loadProfile(address));
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const tipUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tip/${address}`;

  function updateAmount(index: number, value: string) {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) return;
    const next = [...profile.amounts];
    next[index] = n;
    setProfile((p) => ({ ...p, amounts: next }));
  }

  function handleSave() {
    saveProfile(address, profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(tipUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Tip jar URL */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
          Your tip jar link
        </p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 text-xs font-mono truncate px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          >
            {tipUrl}
          </code>
          <button
            onClick={copyLink}
            className="sweep shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
          >
            {copied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <a
          href={`/tip/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs self-start"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          Preview your tip page <ExternalLink size={11} />
        </a>
      </div>

      {/* Profile settings */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
          Profile
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>Display name</label>
          <input
            type="text"
            placeholder="Your name or alias"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            maxLength={50}
            className="px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>Bio <span style={{ opacity: 0.4 }}>(optional)</span></label>
          <textarea
            placeholder="A short description of your work..."
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            maxLength={160}
            rows={3}
            className="px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-colors"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>Avatar URL <span style={{ opacity: 0.4 }}>(optional)</span></label>
          <input
            type="url"
            placeholder="https://..."
            value={profile.avatarUrl}
            onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
            className="px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Suggested amounts */}
        <div className="flex flex-col gap-2">
          <label className="text-xs" style={{ color: 'var(--fg)', opacity: 0.55 }}>Suggested tip amounts (USDC)</label>
          <div className="grid grid-cols-5 gap-2">
            {profile.amounts.map((amt, i) => (
              <div key={i} className="relative">
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  $
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="1"
                  value={amt}
                  onChange={(e) => updateAmount(i, e.target.value)}
                  className="w-full pl-5 pr-1 py-2 rounded-lg text-sm text-center border outline-none transition-colors"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom amount toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className="relative w-10 h-6 rounded-full transition-colors"
            style={{ background: profile.allowCustom ? 'var(--accent)' : 'var(--border)' }}
            onClick={() => setProfile((p) => ({ ...p, allowCustom: !p.allowCustom }))}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: profile.allowCustom ? 'translateX(18px)' : 'translateX(4px)' }}
            />
          </div>
          <span className="text-sm" style={{ color: 'var(--fg)', opacity: 0.7 }}>Allow custom amount</span>
        </label>

        <button
          onClick={handleSave}
          className="sweep w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          {saved ? '✓ Saved!' : 'Save settings'}
        </button>
      </div>

      {/* Stats */}
      <StatsSection address={address} />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TipPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <Link
              href="/"
              className="text-xs mb-4 inline-block transition-opacity hover:opacity-100"
              style={{ color: 'var(--fg)', opacity: 0.4 }}
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
              Tip Jar
            </h1>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.5 }}>
              Set up your page and share it with supporters
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
                <Coffee size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: 'var(--fg)' }}>
                  Connect wallet to set up your tip jar
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
