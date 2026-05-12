'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useNodeStore, type Region, REGION_LABELS } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';

type OS = 'ubuntu' | 'macos' | 'docker';

const STEPS = [
  'Choose OS',
  'System Check',
  'Install Dependencies',
  'Download Arc Node',
  'Configure',
  'Start Node',
  'Register & Done',
];

const REQUIREMENTS = [
  '4+ CPU cores',
  '8 GB+ RAM',
  '250 GB+ SSD storage',
  'Ubuntu 22.04+ / macOS / Docker',
  'Stable internet connection (10 Mbps+)',
];

const DEPS: Record<OS, string> = {
  ubuntu: 'sudo apt update\nsudo apt install -y curl wget git build-essential',
  macos:  'brew install curl wget git',
  docker: 'docker pull circle-fin/arc-node:latest',
};

const CONFIG = `[chain]
chain_id = "5042002"
data_dir  = "~/.arc"

[rpc]
port = 26657
cors = ["*"]

[p2p]
port  = 26656
seeds = "seed1.testnet.arc.network:26656,seed2.testnet.arc.network:26656"`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={copy} className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all"
        style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#777' }}>
        {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="p-4 text-xs text-[#c9a84c] font-mono overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

export default function SetupGuide() {
  const { address, isConnected, connect } = useWallet();
  const { registerOperator } = useNodeStore();

  const [step, setStep]     = useState(0);
  const [os, setOs]         = useState<OS | null>(null);
  const [checks, setChecks] = useState<boolean[]>(REQUIREMENTS.map(() => false));
  const [name, setName]     = useState('');
  const [region, setRegion] = useState<Region>('NA');
  const [done, setDone]     = useState(false);

  const allChecked = checks.every(Boolean);
  const next = () => setStep((s) => Math.min(s + 1, 6));

  const handleRegister = () => {
    if (!address) return;
    registerOperator({
      address,
      name: name.trim() || undefined,
      region,
      registeredAt: Date.now(),
      status: 'pending',
    });
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/node" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
            <ArrowLeft size={14} /> Node Hub
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Setup Guide</span>
          <span className="text-xs text-[#555]">Step {step + 1} / {STEPS.length}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ width: `${100 / STEPS.length}%` }}>
                <div className="h-1.5 w-full rounded-full" style={{ background: i <= step ? '#c9a84c' : 'rgba(255,255,255,0.07)' }} />
                <span className="hidden sm:block text-[9px] text-center leading-tight" style={{ color: i === step ? '#c9a84c' : '#444' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#555] sm:hidden">Step {step + 1}: {STEPS[step]}</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.12)' }}>

          {/* STEP 1 — Choose OS */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-black mb-2">Choose Your OS</h2>
              <p className="text-[#777] text-sm mb-6">Select the environment where you'll run your Arc node.</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {([
                  { key: 'ubuntu', label: 'Ubuntu 22.04', icon: '🐧' },
                  { key: 'macos',  label: 'macOS',        icon: '🍎' },
                  { key: 'docker', label: 'Docker',       icon: '🐳' },
                ] as { key: OS; label: string; icon: string }[]).map(({ key, label, icon }) => (
                  <button key={key} onClick={() => setOs(key)}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl transition-all"
                    style={{
                      background: os === key ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${os === key ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      color: os === key ? '#c9a84c' : '#888',
                    }}>
                    <span className="text-3xl">{icon}</span>
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>
              <button onClick={next} disabled={!os}
                className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2 — System Check */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black mb-2">System Check</h2>
              <p className="text-[#777] text-sm mb-6">Confirm your system meets the minimum requirements.</p>
              <div className="space-y-3 mb-8">
                {REQUIREMENTS.map((req, i) => (
                  <label key={req} className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => setChecks((c) => { const n = [...c]; n[i] = !n[i]; return n; })}
                      className="h-5 w-5 rounded flex items-center justify-center transition-all shrink-0"
                      style={{ background: checks[i] ? '#c9a84c' : 'rgba(255,255,255,0.05)', border: `1px solid ${checks[i] ? '#c9a84c' : 'rgba(255,255,255,0.15)'}` }}>
                      {checks[i] && <Check size={12} className="text-[#0a0a0a]" />}
                    </div>
                    <span className="text-sm" style={{ color: checks[i] ? '#e8e8e8' : '#777' }}>{req}</span>
                  </label>
                ))}
              </div>
              <button onClick={next} disabled={!allChecked}
                className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 3 — Install Dependencies */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black mb-2">Install Dependencies</h2>
              <p className="text-[#777] text-sm mb-6">Run the following command in your terminal.</p>
              <CodeBlock code={DEPS[os ?? 'ubuntu']} />
              <p className="text-xs text-[#555] mt-4 mb-8">Wait for the installation to complete before proceeding.</p>
              <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Done, Continue →
              </button>
            </div>
          )}

          {/* STEP 4 — Download */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-black mb-2">Download Arc Node</h2>
              <p className="text-[#777] text-sm mb-6">Clone the repository and run the installer.</p>
              <CodeBlock code={`git clone https://github.com/circle-fin/arc-node\ncd arc-node\n./install.sh`} />
              <p className="text-xs text-[#555] mt-4 mb-8">The installer will compile the node binary and place it in your PATH.</p>
              <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 5 — Configure */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-black mb-2">Configure Your Node</h2>
              <p className="text-[#777] text-sm mb-6">Create <code className="text-[#c9a84c] text-xs">~/.arc/config.toml</code> with the following content.</p>
              <CodeBlock code={CONFIG} />
              <div className="mt-4 mb-8 space-y-2 text-xs text-[#666]">
                <p><span className="text-[#aaa] font-mono">chain_id</span> — Arc Testnet identifier, do not change</p>
                <p><span className="text-[#aaa] font-mono">rpc.port</span> — default port for JSON-RPC connections</p>
                <p><span className="text-[#aaa] font-mono">p2p.seeds</span> — bootstrap peers for initial network discovery</p>
              </div>
              <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 6 — Start Node */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-black mb-2">Start Your Node</h2>
              <p className="text-[#777] text-sm mb-6">Launch the Arc daemon and wait for sync.</p>
              <CodeBlock code="./arcd start" />
              <div className="rounded-xl p-4 my-4 text-sm text-[#aaa]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-bold text-white mb-1">⏳ Initial sync may take several hours</p>
                <p className="text-xs text-[#666]">Your node is downloading and verifying the entire blockchain history. You can check progress in the logs.</p>
              </div>
              <p className="text-sm text-[#aaa] font-bold mb-2">Verify it's running:</p>
              <CodeBlock code="curl http://localhost:26657/status" />
              <div className="mt-8">
                <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 7 — Register */}
          {step === 6 && (
            <div>
              {done ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-black mb-2">You're Live!</h2>
                  <p className="text-[#777] text-sm mb-8">Your node is registered and pending verification.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/forum/c/node" className="px-5 py-2.5 rounded-xl text-sm font-bold text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                      Join Node Forum
                    </Link>
                    <Link href="/node/validator" className="px-5 py-2.5 rounded-xl text-sm font-bold text-center" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                      Apply for Validator
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-2">Register Your Node</h2>
                  <p className="text-[#777] text-sm mb-6">Add yourself to the operator directory to appear on the leaderboard.</p>
                  {!isConnected ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-[#777] mb-4">Connect your wallet to register.</p>
                      <button onClick={connect} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>Connect Wallet</button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-sm">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Display Name (optional)</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your operator name"
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Region</label>
                        <select value={region} onChange={(e) => setRegion(e.target.value as Region)}
                          className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                          {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                            <option key={r} value={r} className="bg-[#0a0a0a]">{REGION_LABELS[r]}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleRegister} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                        Register Operator
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
