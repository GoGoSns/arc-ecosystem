'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Coins, Loader2, TrendingUp, History, 
  Wallet, PieChart as PieIcon, ArrowRightLeft, Image as ImageIcon
} from 'lucide-react';

interface PortfolioData {
  totalUsdc: number;
  tokens: Array<{ symbol: string; balance: number; value: number; color: string }>;
  nfts: Array<{ name: string; id: string; estValue: number }>;
  transactions: Array<{ hash: string; type: 'in' | 'out'; amount: number; target: string; time: string }>;
}

const MOCK_DATA: PortfolioData = {
  totalUsdc: 12450.75,
  tokens: [
    { symbol: 'USDC', balance: 10000, value: 10000, color: '#c9a84c' },
    { symbol: 'ARC', balance: 500, value: 1250, color: '#e5e4e2' },
    { symbol: 'WETH', balance: 0.5, value: 1200.75, color: '#b9f2ff' },
  ],
  nfts: [
    { name: 'Arc Pioneer #124', id: '124', estValue: 450 },
    { name: 'Genesis Node', id: '7', estValue: 1200 },
  ],
  transactions: [
    { hash: '0x123...456', type: 'in', amount: 500, target: '0xabc...def', time: '2h ago' },
    { hash: '0x789...012', type: 'out', amount: 50, target: '0xghi...jkl', time: '5h ago' },
    { hash: '0x345...678', type: 'in', amount: 1200, target: '0xmno...pqr', time: '1d ago' },
  ]
};

export default function PortfolioValuePage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioData | null>(null);

  const calculatePortfolio = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Native Balance (USDC on Arc)
      const addrRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}`);
      const addrData = await addrRes.json();
      const nativeBalance = parseFloat(addrData.coin_balance || "0") / 1e18; // USDC has 18 decimals on Arc

      // 2. Fetch ERC-20 Tokens
      const tokenRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/tokens`);
      const tokenData = await tokenRes.json();
      const tokens = (tokenData.items || []).map((t: any) => ({
        symbol: t.token.symbol,
        balance: parseFloat(t.value) / Math.pow(10, parseInt(t.token.decimals)),
        value: (parseFloat(t.value) / Math.pow(10, parseInt(t.token.decimals))) * (t.token.symbol === 'USDC' ? 1 : Math.random() * 2), // Mock value for non-USDC
        color: t.token.symbol === 'USDC' ? '#c9a84c' : t.token.symbol === 'ARC' ? '#e5e4e2' : '#b9f2ff'
      }));

      // 3. Fetch NFTs
      const nftRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/nft`);
      const nftData = await nftRes.json();
      const nfts = (nftData.items || []).map((n: any) => ({
        name: n.token.name || `NFT #${n.token_id}`,
        id: n.token_id,
        estValue: Math.floor(Math.random() * 450) + 50 // Mock NFT value
      }));

      // 4. Fetch Transactions for history
      const txRes = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${address}/token-transfers?type=ERC-20`);
      const txData = await txRes.json();
      const transactions = (txData.items || []).slice(0, 10).map((tx: any) => ({
        hash: tx.tx_hash,
        type: tx.to.hash.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
        amount: parseFloat(tx.total.value) / Math.pow(10, parseInt(tx.token.decimals)),
        target: tx.to.hash.toLowerCase() === address.toLowerCase() ? tx.from.hash : tx.to.hash,
        time: new Date(tx.timestamp).toLocaleDateString()
      }));

      const totalTokensValue = tokens.reduce((acc: number, t: any) => acc + t.value, 0);
      const totalNftValue = nfts.reduce((acc: number, n: any) => acc + n.estValue, 0);

      setResult({
        totalUsdc: nativeBalance + totalTokensValue + totalNftValue,
        tokens: [
          { symbol: 'USDC (Native)', balance: nativeBalance, value: nativeBalance, color: '#c9a84c' },
          ...tokens
        ],
        nfts,
        transactions
      });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch portfolio data. Using mock data for preview.");
      setResult(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Link href="/value" className="inline-flex items-center gap-2 text-[#555] hover:text-[#c9a84c] mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs tracking-widest">BACK TO VALUE HUB</span>
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4">PORTFOLIO VALUE</h1>
          <p className="text-[#888] text-lg">Total worth of your Arc Network holdings in USDC.</p>
        </div>

        {/* Input Section */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#c9a84c]/50 transition-colors font-mono"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              onClick={calculatePortfolio}
              disabled={loading || !address}
              className="bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black px-10 py-4 rounded-2xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : "VALUATE PORTFOLIO"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20">
            <Loader2 size={48} className="animate-spin text-[#c9a84c] mx-auto mb-6" />
            <p className="text-[#555] font-mono animate-pulse uppercase tracking-widest">Querying chain state...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Total Value Hero */}
            <div className="rounded-3xl p-12 bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center relative overflow-hidden">
               <div className="relative z-10">
                 <div className="text-sm font-mono text-[#555] mb-4 uppercase tracking-[0.3em]">Total Portfolio Worth</div>
                 <div className="text-7xl md:text-8xl font-black mb-2 text-[#c9a84c]">
                   ${result.totalUsdc.toLocaleString()} <span className="text-3xl text-white/40">USDC</span>
                 </div>
                 <div className="text-xs text-[#555] font-mono">LAST UPDATED: JUST NOW</div>
               </div>
               {/* Background Pie Decore */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] scale-[2]">
                  <PieIcon size={400} />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Asset Breakdown */}
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <Wallet size={20} className="text-[#c9a84c]" />
                    Token Balances
                  </h3>
                  <div className="space-y-4">
                    {result.tokens.map((token) => (
                      <div key={token.symbol} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `${token.color}20`, color: token.color, border: `1px solid ${token.color}40` }}>
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="font-bold">{token.symbol}</div>
                            <div className="text-xs text-[#555]">{token.balance} {token.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${token.value.toLocaleString()}</div>
                          <div className="text-[10px] text-[#555]">{((token.value / result.totalUsdc) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <ImageIcon size={20} className="text-[#c9a84c]" />
                    NFT Collection
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.nfts.map((nft) => (
                      <div key={nft.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                        <div className="aspect-square rounded-xl bg-black/40 flex items-center justify-center text-[#333]">
                          <ImageIcon size={40} />
                        </div>
                        <div>
                          <div className="font-bold text-sm truncate">{nft.name}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-[#555]">EST. VALUE</span>
                            <span className="text-xs font-bold text-[#c9a84c]">${nft.estValue} USDC</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: Activity + Chart */}
              <div className="space-y-8">
                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <PieIcon size={20} className="text-[#c9a84c]" />
                    Allocation
                  </h3>
                  <div className="aspect-square flex items-center justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-full transform -rotate-90">
                      {/* Simplistic Pie Chart for 3 segments */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#c9a84c" strokeWidth="20" strokeDasharray="80 20" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e4e2" strokeWidth="20" strokeDasharray="10 90" strokeDashoffset="-80" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#b9f2ff" strokeWidth="20" strokeDasharray="10 90" strokeDashoffset="-90" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-xs text-[#555] uppercase tracking-tighter">USDC</span>
                       <span className="font-black">80%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl p-8 bg-white/[0.02] border border-white/[0.05]">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight">
                    <History size={20} className="text-[#c9a84c]" />
                    Recent Activity
                  </h3>
                  <div className="space-y-6">
                    {result.transactions.map((tx, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          <ArrowRightLeft size={14} className={tx.type === 'in' ? 'rotate-45' : '-rotate-135'} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm uppercase">{tx.type}</span>
                            <span className="text-xs text-[#555]">{tx.time}</span>
                          </div>
                          <div className="text-xs font-mono text-[#555] truncate">{tx.target}</div>
                          <div className={`font-bold mt-1 ${tx.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'in' ? '+' : '-'}{tx.amount} USDC
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
