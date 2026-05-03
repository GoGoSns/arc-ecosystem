'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { isAddress } from 'viem';
import { Check, ExternalLink, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { sendUSDC } from '@/lib/payments';

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

function profileKey(address: string) {
  return `arccreator:profile:${address.toLowerCase()}`;
}

function tipsKey(address: string) {
  return `arccreator:tips:${address.toLowerCase()}`;
}

function loadProfile(address: string): CreatorProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(address));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadTips(address: string): TipRecord[] {
  try {
    const raw = localStorage.getItem(tipsKey(address));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTip(creatorAddress: string, tip: TipRecord) {
  const tips = loadTips(creatorAddress);
  tips.push(tip);
  localStorage.setItem(tipsKey(creatorAddress), JSON.stringify(tips));
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function initials(name: string, address: string) {
  if (name.trim()) return name.trim().slice(0, 2).toUpperCase();
  return address.slice(2, 4).toUpperCase();
}

// ─── Confetti ──────────────────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#c9a84c', '#f0d080', '#ffffff', '#a8893a', '#ffd700'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    let frame: number;
    let tick = 0;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      tick++;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (tick > 80) p.opacity -= 0.012;
        ctx!.save();
        ctx!.globalAlpha = Math.max(0, p.opacity);
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.angle);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      if (particles.some((p) => p.opacity > 0)) {
        frame = requestAnimationFrame(draw);
      }
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// ─── Recent supporters ──────────────────────────────────────────────────────────

function RecentSupporters({ tips }: { tips: TipRecord[] }) {
  const recent = tips.slice().reverse().slice(0, 10);
  if (recent.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)', opacity: 0.4 }}>
          Recent supporters
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
              <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--fg)', opacity: 0.4 }}>
                "{tip.message}"
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--fg)', opacity: 0.3 }}>
              {fmtTime(tip.timestamp)}
            </span>
          </div>
          <span className="font-semibold text-sm shrink-0" style={{ color: 'var(--accent)' }}>
            ${parseFloat(tip.amount).toFixed(2)} USDC
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tip form ───────────────────────────────────────────────────────────────────

function TipForm({
  creatorAddress,
  profile,
  onSuccess,
}: {
  creatorAddress: string;
  profile: CreatorProfile;
  onSuccess: (txHash: string, amount: string) => void;
}) {
  const { address: senderAddress, isConnected } = useAccount();
  const { connect } = useConnect();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  async function handleTip() {
    if (effectiveAmount <= 0) return;
    setIsPending(true);
    setError('');
    try {
      const { txHash } = await sendUSDC(creatorAddress, effectiveAmount.toString());
      saveTip(creatorAddress, {
        fromAddress: senderAddress ?? '',
        amount: effectiveAmount.toString(),
        message: message.trim(),
        timestamp: Date.now(),
        txHash,
      });
      onSuccess(txHash, effectiveAmount.toString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.split('\n')[0] : 'Transaction failed');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--fg)', opacity: 0.6 }}>
        Send a tip
      </p>

      {/* Suggested amounts */}
      <div className="flex flex-wrap gap-2">
        {profile.amounts.map((amt) => (
          <button
            key={amt}
            onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
            className="sweep px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selectedAmount === amt ? 'var(--accent)' : 'rgba(201,168,76,0.1)',
              color: selectedAmount === amt ? '#0a0a0a' : 'var(--accent)',
              border: `1px solid ${selectedAmount === amt ? 'var(--accent)' : 'transparent'}`,
            }}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      {profile.allowCustom && (
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
            style={{ color: 'var(--accent)' }}
          >
            USDC
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            className="w-full pl-14 pr-4 py-3 rounded-xl text-sm border outline-none transition-colors"
            style={{
              background: 'var(--bg)',
              border: `1px solid ${customAmount ? 'var(--accent)' : 'var(--border)'}`,
              color: 'var(--fg)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = customAmount ? 'var(--accent)' : 'var(--border)')}
          />
        </div>
      )}

      {/* Message */}
      <textarea
        placeholder="Leave a message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={200}
        rows={2}
        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-colors"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />

      {/* Action */}
      {isConnected ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleTip}
            disabled={isPending || effectiveAmount <= 0}
            className="sweep w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            {isPending ? 'Sending…' : effectiveAmount > 0 ? `Tip $${effectiveAmount} USDC` : 'Select an amount'}
          </button>
          {error && (
            <p className="text-xs text-red-400 text-center leading-relaxed">{error}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => connect({ connector: injected() })}
          className="sweep w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
          style={{ background: 'var(--accent)', color: '#0a0a0a' }}
        >
          <Wallet size={15} />
          Connect wallet to tip
        </button>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicTipPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const isValid = isAddress(handle);

  useEffect(() => {
    if (!isValid) { setLoaded(true); return; }
    setProfile(loadProfile(handle));
    setTips(loadTips(handle));
    setLoaded(true);
  }, [handle, isValid]);

  function handleSuccess(hash: string, amount: string) {
    setTxHash(hash);
    setTipAmount(amount);
    setShowConfetti(true);
    setTips(loadTips(handle));
    setTimeout(() => setShowConfetti(false), 4000);
  }

  const displayName = profile?.name || shortenAddress(handle);
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
  if (txHash) {
    return (
      <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
        {showConfetti && <Confetti />}
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-20 flex flex-col items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--accent)' }}
          >
            <Check size={36} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
              Thank you for the tip!
            </p>
            <p className="text-sm" style={{ color: 'var(--fg)', opacity: 0.55 }}>
              You sent ${tipAmount} USDC to {displayName}
            </p>
          </div>
          {txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
            >
              View on ArcScan <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={() => { setTxHash(''); setTipAmount(''); }}
            className="sweep px-5 py-2.5 rounded-xl text-sm font-medium border"
            style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)' }}
          >
            Send another tip
          </button>
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
                style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--accent)', border: '2px solid var(--accent)' }}
              >
                {avatarInitials}
              </div>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {displayName}
              </h1>
              {profile?.bio && (
                <p className="text-sm mt-2 max-w-xs leading-relaxed" style={{ color: 'var(--fg)', opacity: 0.55 }}>
                  {profile.bio}
                </p>
              )}
              {!profile && (
                <p className="text-xs mt-2 font-mono" style={{ color: 'var(--fg)', opacity: 0.3 }}>
                  {handle}
                </p>
              )}
            </div>
          </div>

          {/* Tip form */}
          <TipForm
            creatorAddress={handle}
            profile={profile ?? { name: '', bio: '', avatarUrl: '', amounts: [1, 5, 10, 25, 50], allowCustom: true }}
            onSuccess={handleSuccess}
          />

          {/* Recent supporters */}
          <RecentSupporters tips={tips} />
        </div>
      </main>
    </div>
  );
}
