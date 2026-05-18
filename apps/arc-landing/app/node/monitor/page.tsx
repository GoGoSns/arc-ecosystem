'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';
import { buildDemoRpcStatus } from '@/lib/demoMetrics';
import { useNodeStore } from '@/lib/nodeStore';
import SiteHeader from '@/components/SiteHeader';

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

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function mockBlocks(topBlock: number, seedSource: string) {
  const seed = hashString(seedSource);
  return Array.from({ length: 10 }, (_, i) => ({
    height: topBlock - i,
    txs: (seed + i * 7) % 12,
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
    await new Promise((resolve) => setTimeout(resolve, 120));
    const status = buildDemoRpcStatus(rpcUrl);
    setResult({
      status: status.healthy ? 'healthy' : 'down',
      blockHeight: status.blockHeight,
      chainId: status.chainId,
      latencyMs: status.latencyMs,
      error: status.error,
    });
    setBlocks(status.healthy && status.blockHeight ? mockBlocks(status.blockHeight, rpcUrl) : []);
    setLoading(false);
  }, [rpcUrl]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(checkStatus, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, checkStatus]);

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={20} className="text-[#d4af37]" />
          <h1 className="text-3xl font-black">RPC Monitor</h1>
        </div>
        <p className="text-[#555566] text-sm mb-8">Check demo status of Arc Testnet RPC endpoints.</p>

        {/* URL input + controls */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212, 175, 55,0.15)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              aria-label="RPC endpoint URL"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://rpc.testnet.arc.network"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-[#555] outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
            <button
              type="button"
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ background: '#d4af37', color: '#0a0a0a' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={autoRefresh}
              aria-label="Toggle auto refresh"
              onClick={() => setAuto((value) => !value)}
              className="relative h-5 w-9 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ background: autoRefresh ? '#d4af37' : 'rgba(255,255,255,0.08)' }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                style={{ left: autoRefresh ? '18px' : '2px' }}
              />
            </button>
            <span className="text-xs text-[#555566]">Auto-refresh every 30s</span>
          </div>
        </div>

        {!loading && !result ? (
          <div className="rounded-2xl p-6 mb-6 text-sm text-[#555566]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Run a demo check to populate the RPC monitor.
          </div>
        ) : null}

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
                <p className="text-[10px] text-[#555566] uppercase tracking-wider mb-2">{label}</p>
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
            <h2 className="text-sm font-black uppercase tracking-widest text-[#d4af37] mb-4">Recent Blocks</h2>
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] text-[#555566] uppercase tracking-wider px-2 mb-2">
                <span>Block</span><span>Time</span><span>Txs</span>
              </div>
              {blocks.map((b) => (
                <div key={b.height} className="grid grid-cols-3 text-xs px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <span className="font-mono text-[#d4af37]">#{b.height.toLocaleString()}</span>
                  <span className="text-[#555566]">{b.time}</span>
                  <span className="text-[#8a8a9a]">{b.txs} tx</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RPC provider status dots */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#d4af37] mb-4">Pre-configured Endpoints</h2>
          <div className="space-y-2">
            {rpcProviders.map((rpc) => (
              <div key={rpc.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: '#facc15' }} />
                  <span className="text-sm font-bold">{rpc.name}</span>
                  {rpc.isOfficial && <span className="text-[10px] text-[#d4af37]">★ Official</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#555566] font-mono hidden sm:block">{rpc.url}</span>
                  <button
                    type="button"
                    onClick={() => { setRpcUrl(rpc.url); }}
                    aria-label={`Monitor ${rpc.name}`}
                    className="text-[11px] text-[#d4af37] hover:underline"
                  >
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
