'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Server, Activity, Shield, Bug, Globe, Award, Copy, Check, ExternalLink } from 'lucide-react';
import { useNodeStore, isNodeAdmin, shortenAddr, REGION_LABELS, type Region } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';

function NavBar() {
  const { address, isConnected, connect, disconnect } = useWallet();
  return (
    <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
          <ArrowLeft size={14} /> Arc Ecosystem
        </Link>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Arc Node Hub</span>
        {isConnected && address ? (
          <button onClick={disconnect} className="px-3 py-1.5 rounded-lg text-xs font-mono border" style={{ borderColor: '#c9a84c', color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }}>
            {shortenAddr(address)}
          </button>
        ) : (
          <button onClick={connect} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa' }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function NodeHub() {
  const { address, isConnected, connect } = useWallet();
  const { operators, validators, bugs, rpcProviders, registerOperator } = useNodeStore();
  const admin = isNodeAdmin(address);

  const activeOps = operators.filter((o) => o.status === 'verified').length;
  const openBugs  = bugs.filter((b) => b.status === 'reported' || b.status === 'triaged').length;
  const topOps    = [...operators].sort((a, b) => (b.uptimePercent ?? 0) - (a.uptimePercent ?? 0)).slice(0, 3);
  const myOp      = address ? operators.find((o) => o.address === address) : undefined;

  const [regName, setRegName]     = useState('');
  const [regRegion, setRegRegion] = useState<Region>('NA');
  const [regRpc, setRegRpc]       = useState('');
  const [regDone, setRegDone]     = useState(false);

  const handleRegister = () => {
    if (!address) return;
    registerOperator({
      address,
      name: regName.trim() || undefined,
      region: regRegion,
      rpcEndpoint: regRpc.trim() || undefined,
      registeredAt: Date.now(),
      status: 'pending',
    });
    setRegDone(true);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NavBar />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono text-[#c9a84c] mb-4"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <Server size={11} /> ARC NODE OPERATOR HUB
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3">Arc Node Operator Hub</h1>
          <p className="text-[#777] text-lg">Run a node. Secure the network. Earn rewards.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Active Operators', value: activeOps, icon: Server },
            { label: 'Validator Waitlist', value: validators.length, icon: Shield },
            { label: 'Open Bug Bounties', value: openBugs, icon: Bug },
            { label: 'Network Status', value: 'LIVE', icon: Activity, green: true },
          ].map(({ label, value, icon: Icon, green }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className="text-[#c9a84c]" />
                <span className="text-[10px] text-[#555] uppercase tracking-wider">{label}</span>
              </div>
              <div className={`text-2xl font-black ${green ? 'text-[#4ade80]' : 'text-white'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Primary action cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Quick Setup */}
          <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div>
              <div className="text-2xl mb-1">🚀</div>
              <h2 className="text-lg font-black mb-1">Quick Setup</h2>
              <p className="text-sm text-[#777]">Get your node running in 15 minutes</p>
            </div>
            <div className="space-y-2">
              <Link href="/node/setup" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                View Setup Guide
              </Link>
              <CopyButton text="curl -sSL https://rpc.testnet.arc.network/install.sh | bash" />
              <button
                onClick={() => alert('docker-compose.yml template is a placeholder — official config coming soon.')}
                className="w-full text-xs text-[#555] hover:text-[#aaa] transition-colors py-1"
              >
                Download docker-compose.yml
              </button>
            </div>
          </div>

          {/* Live Monitor */}
          <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="text-2xl mb-1">📊</div>
              <h2 className="text-lg font-black mb-1">Live Monitor</h2>
              <p className="text-sm text-[#777]">Check RPC status, block height, network health</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <span className="h-2 w-2 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-xs font-bold text-[#4ade80]">Healthy</span>
              <span className="text-[10px] text-[#555] ml-auto">rpc.testnet.arc.network</span>
            </div>
            <Link href="/node/monitor" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
              Open Monitor
            </Link>
          </div>

          {/* Validator Waitlist */}
          <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="text-2xl mb-1">🏆</div>
              <h2 className="text-lg font-black mb-1">Validator Waitlist</h2>
              <p className="text-sm text-[#777]">Apply now to become a mainnet validator</p>
            </div>
            <div className="text-sm text-[#aaa]">
              <span className="font-black text-white text-xl">{validators.length}</span> applicants in queue
            </div>
            <Link href="/node/validator" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
              Apply Now
            </Link>
          </div>
        </div>

        {/* Secondary cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {/* Bug Bounty */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">🔍</div>
            <h3 className="font-black mb-1">Bug Bounty</h3>
            <p className="text-xs text-[#666] mb-3">Find bugs, earn USDC rewards. HackerOne integrated.</p>
            <p className="text-xs text-[#555] mb-3">{openBugs} open {openBugs === 1 ? 'bounty' : 'bounties'}</p>
            <Link href="/node/bounty" className="text-xs font-bold text-[#c9a84c] hover:underline">Browse Bounties →</Link>
          </div>

          {/* RPC Providers */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">🌐</div>
            <h3 className="font-black mb-1">RPC Providers</h3>
            <p className="text-xs text-[#666] mb-3">Multiple RPC endpoints to choose from</p>
            <p className="text-xs text-[#555] mb-3">{rpcProviders.length} {rpcProviders.length === 1 ? 'provider' : 'providers'} available</p>
            <Link href="/node/rpc" className="text-xs font-bold text-[#c9a84c] hover:underline">View All →</Link>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">👥</div>
            <h3 className="font-black mb-1">Operator Leaderboard</h3>
            <p className="text-xs text-[#666] mb-3">Top operators by uptime</p>
            <div className="space-y-1 mb-3">
              {topOps.length === 0
                ? <p className="text-[10px] text-[#555]">No operators yet</p>
                : topOps.map((op, i) => (
                    <div key={op.address} className="flex items-center gap-2 text-xs">
                      <span>{medals[i]}</span>
                      <span className="text-[#aaa]">{op.name || shortenAddr(op.address)}</span>
                      <span className="ml-auto text-[#4ade80]">{op.uptimePercent ?? '—'}%</span>
                    </div>
                  ))}
            </div>
            <Link href="/node/leaderboard" className="text-xs font-bold text-[#c9a84c] hover:underline">View Leaderboard →</Link>
          </div>
        </div>

        {/* System requirements */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">System Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: 'Minimum', specs: ['4 CPU cores', '8 GB RAM', '250 GB SSD', 'Ubuntu 22.04+'] },
              { label: 'Recommended', specs: ['8 CPU cores', '16 GB RAM', '500 GB SSD', 'Ubuntu 22.04+'] },
            ].map(({ label, specs }) => (
              <div key={label}>
                <p className="text-xs font-bold text-[#aaa] uppercase tracking-wider mb-2">{label}</p>
                <ul className="space-y-1">
                  {specs.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-[#ccc]">
                      <span className="text-[#c9a84c]">›</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Arc GitHub', href: 'https://github.com/circle-fin' },
              { label: 'HackerOne', href: 'https://hackerone.com' },
              { label: 'Arc Docs', href: 'https://docs.arc.network' },
              { label: 'Node Forum', href: '/forum/c/node' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#aaa' }}>
                <ExternalLink size={11} /> {label}
              </a>
            ))}
          </div>
        </div>

        {/* Register / My record */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Register as Operator</h2>

          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#777] mb-4">Connect your wallet to register as a node operator.</p>
              <button onClick={connect} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Connect Wallet
              </button>
            </div>
          ) : myOp && !regDone ? (
            <div className="rounded-xl p-4" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <p className="text-xs font-bold text-[#4ade80] mb-2">✓ You are a registered operator</p>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div><span className="text-[#555] text-xs">Address</span><div className="text-[#aaa] font-mono text-xs mt-0.5">{shortenAddr(myOp.address)}</div></div>
                <div><span className="text-[#555] text-xs">Region</span><div className="text-[#aaa] mt-0.5">{REGION_LABELS[myOp.region]}</div></div>
                <div><span className="text-[#555] text-xs">Status</span><div className="mt-0.5 capitalize" style={{ color: myOp.status === 'verified' ? '#4ade80' : myOp.status === 'inactive' ? '#ef4444' : '#facc15' }}>{myOp.status}</div></div>
              </div>
            </div>
          ) : regDone ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-bold text-[#4ade80]">Registered successfully!</p>
              <p className="text-xs text-[#555] mt-1">Your application is pending review.</p>
              <div className="flex gap-3 justify-center mt-4">
                <Link href="/forum/c/node" className="text-xs text-[#c9a84c] hover:underline">Join Forum</Link>
                <Link href="/node/validator" className="text-xs text-[#c9a84c] hover:underline">Apply for Validator</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Display Name (optional)</label>
                <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your operator name"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Region</label>
                <select value={regRegion} onChange={(e) => setRegRegion(e.target.value as Region)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                    <option key={r} value={r} className="bg-[#0a0a0a]">{REGION_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">RPC Endpoint (optional)</label>
                <input value={regRpc} onChange={(e) => setRegRpc(e.target.value)} placeholder="https://your-node:26657"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>
              <button onClick={handleRegister} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
