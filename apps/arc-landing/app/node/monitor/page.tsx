'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';
import { useNodeStore } from '@/lib/nodeStore';

interface RpcResult {
  status: 'healthy' | 'down';
  blockHeight: number | null;
  chainId: string | null;
  latencyMs: number | null;
  error?: string;
}

function dot(healthy: boolean) {
  return (
    <span className="inline-block h-2 w-2 rounded-full mr-2"
      style={{ background: healthy ? '#4ade80' : '#ef4444', boxShadow: healthy ? '0 0 6px #4ade80' : 'none' }} />
  );
}

function mockBlocks(topBlock: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    height: topBlock - i,
    txs: Math.floor(Math.random() * 12),
    time: new Date(Date.now() - i * 6000).toLocaleTimeString(),
  }));
}

export default function MonitorPage() {
  const { rpcProviders } = useNodeStore();
  const [rpcUrl, setRpcUrl]       = useState('https://rpc.testnet.arc.network');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<RpcResult | null>(null);
  const [autoRefresh, setAuto]    = useState(false);
  const [blocks, setBlocks]       = useState<{ height: number; txs: number; time: string }[]>([]);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(8000),
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const blockHeight = data.result ? parseInt(data.result as string, 16) : null;
      setResult({ status: 'healthy', blockHeight, chainId: '5042002', latencyMs });
      if (blockHeight) setBlocks(mockBlocks(blockHeight));
    } catch (err) {
      const latencyMs = Math.round(performance.now() - t0);
      setResult({ status: 'down', blockHeight: null, chainId: null, latencyMs, error: String(err) });
      setBlocks([]);
    }
    setLoading(false);
  }, [rpcUrl]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(checkStatus, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, checkStatus]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/node" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
            <ArrowLeft size={14} /> Node Hub
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// RPC Monitor</span>
          <div />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={20} className="text-[#c9a84c]" />
          <h1 className="text-3xl font-black">RPC Monitor</h1>
        </div>
        <p className="text-[#777] text-sm mb-8">Check live status of Arc Testnet RPC endpoints.</p>

        {/* URL input + controls */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://rpc.testnet.arc.network"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-[#555] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
            <button onClick={checkStatus} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 disabled:opacity-60"
              style={{ background: '#c9a84c', color: '#0a0a0a' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <div onClick={() => setAuto(!autoRefresh)}
              className="h-5 w-9 rounded-full transition-all relative"
              style={{ background: autoRefresh ? '#c9a84c' : 'rgba(255,255,255,0.08)' }}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                style={{ left: autoRefresh ? '18px' : '2px' }} />
            </div>
            <span className="text-xs text-[#777]">Auto-refresh every 30s</span>
          </label>
        </div>

        {/* Result cards */}
        {result && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: 'Status',
                value: result.status === 'healthy' ? 'Healthy' : 'Down',
                extra: dot(result.status === 'healthy'),
                color: result.status === 'healthy' ? '#4ade80' : '#ef4444',
              },
              {
                label: 'Block Height',
                value: result.blockHeight?.toLocaleString() ?? '—',
                color: '#fff',
              },
              {
                label: 'Chain ID',
                value: result.chainId ?? '—',
                color: '#fff',
              },
              {
                label: 'Latency',
                value: result.latencyMs !== null ? `${result.latencyMs}ms` : '—',
                color: result.latencyMs !== null && result.latencyMs < 200 ? '#4ade80' : '#facc15',
              },
            ].map(({ label, value, extra, color }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">{label}</p>
                <p className="text-xl font-black flex items-center" style={{ color }}>{extra}{value}</p>
              </div>
            ))}
          </div>
        )}

        {result?.error && (
          <div className="rounded-xl p-4 mb-6 text-sm text-[#ef4444]" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Error: {result.error}
          </div>
        )}

        {/* Recent blocks */}
        {blocks.length > 0 && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Recent Blocks</h2>
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] text-[#555] uppercase tracking-wider px-2 mb-2">
                <span>Block</span><span>Time</span><span>Txs</span>
              </div>
              {blocks.map((b) => (
                <div key={b.height} className="grid grid-cols-3 text-xs px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <span className="font-mono text-[#c9a84c]">#{b.height.toLocaleString()}</span>
                  <span className="text-[#777]">{b.time}</span>
                  <span className="text-[#aaa]">{b.txs} tx</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RPC provider status dots */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Pre-configured Endpoints</h2>
          <div className="space-y-2">
            {rpcProviders.map((rpc) => (
              <div key={rpc.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: '#facc15' }} />
                  <span className="text-sm font-bold">{rpc.name}</span>
                  {rpc.isOfficial && <span className="text-[10px] text-[#c9a84c]">★ Official</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#555] font-mono hidden sm:block">{rpc.url}</span>
                  <button onClick={() => { setRpcUrl(rpc.url); }}
                    className="text-[11px] text-[#c9a84c] hover:underline">
                    Monitor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
