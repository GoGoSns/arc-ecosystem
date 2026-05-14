'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Copy, Check, Trash2 } from 'lucide-react';
import { useNodeStore, isNodeAdmin, REGION_LABELS, type Region } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';
import SiteHeader from '@/components/SiteHeader';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#4ade80' : '#777' }}>
      {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function RpcPage() {
  const { address, isConnected, connect } = useWallet();
  const { rpcProviders, addRpc, removeRpc } = useNodeStore();
  const admin = isNodeAdmin(address);
  const router = useRouter();

  const [name, setName]       = useState('');
  const [url, setUrl]         = useState('');
  const [region, setRegion]   = useState<Region>('NA');
  const [desc, setDesc]       = useState('');
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [adding, setAdding]   = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())                    e.name = 'Name is required.';
    if (!url.startsWith('https://'))     e.url  = 'URL must start with https://';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!address || !validate()) return;
    addRpc({
      id: crypto.randomUUID(),
      name: name.trim(),
      url: url.trim(),
      region,
      isOfficial: false,
      addedAt: Date.now(),
      description: desc.trim() || undefined,
    });
    setName(''); setUrl(''); setDesc(''); setRegion('NA'); setAdding(false); setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={20} className="text-[#c9a84c]" />
          <h1 className="text-3xl font-black">RPC Providers</h1>
        </div>
        <p className="text-[#777] text-sm mb-8">Choose from multiple Arc Testnet RPC endpoints.</p>

        {/* Provider cards */}
        <div className="space-y-3 mb-10">
          {rpcProviders.map((rpc) => (
            <div key={rpc.id} className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: rpc.isOfficial ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(255,255,255,0.07)',
              }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-[15px]">{rpc.name}</h3>
                    {rpc.isOfficial && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#c9a84c]"
                        style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                        ★ Official
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#777]"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {rpc.region}
                    </span>
                  </div>
                  {rpc.description && <p className="text-xs text-[#666] mb-2">{rpc.description}</p>}
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-[#aaa] font-mono break-all">{rpc.url}</code>
                    <CopyBtn text={rpc.url} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/node/monitor?rpc=${encodeURIComponent(rpc.url)}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#aaa' }}>
                    Test Connection
                  </button>
                  {admin && !rpc.isOfficial && (
                    <button onClick={() => removeRpc(rpc.id)}
                      className="p-1.5 rounded-lg text-[#ef4444] transition-all hover:scale-110"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add provider */}
        {isConnected ? (
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c]">Add Provider</h2>
              {!adding && (
                <button onClick={() => setAdding(true)} className="text-xs text-[#c9a84c] hover:underline">
                  + Add RPC endpoint
                </button>
              )}
            </div>

            {adding ? (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My RPC Node"
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.name ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                  {errors.name && <p className="text-xs text-[#ef4444] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">URL * (https://)</label>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-rpc.example.com"
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none font-mono"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.url ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                  {errors.url && <p className="text-xs text-[#ef4444] mt-1">{errors.url}</p>}
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
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Description (optional)</label>
                  <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description"
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAdd} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                    Add Provider
                  </button>
                  <button onClick={() => { setAdding(false); setErrors({}); }} className="px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#aaa' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#555]">Click above to submit your RPC endpoint to the community directory.</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm text-[#777] mb-4">Connect your wallet to add an RPC endpoint.</p>
            <button onClick={connect} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
