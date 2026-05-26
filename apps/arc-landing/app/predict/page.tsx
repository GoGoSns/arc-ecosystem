'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Info, Trophy, TrendingUp, User, Clock, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import { sendToAddress, explorerUrl } from '@/lib/usdcTransfer';

const AGENT_WALLET = '0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365';
const ADMIN_ADDRESS = '0xB87B6D1a56bB7942bd07b6B0e9540a63b3dA4365'; // Admin for demo purposes

interface Market {
  id: string;
  question: string;
  status: 'open' | 'resolved';
  outcome?: 'YES' | 'NO';
  createdAt: number;
}

interface Bet {
  id: string;
  marketId: string;
  userAddress: string;
  side: 'YES' | 'NO';
  amount: number;
  txHash: string;
  createdAt: number;
}

export default function PredictionPage() {
  const [market, setMarket] = useState<Market | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userAddress, setUserAddress] = useState<string>('');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [betAmount, setBetAmount] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adminQuestion, setAdminQuestion] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  const fetchActiveMarket = useCallback(async () => {
    try {
      const res = await fetch('/api/predict/active');
      const data = await res.json();
      if (data.market) {
        setMarket(data.market);
        setBets(data.bets);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveMarket();
    const interval = setInterval(fetchActiveMarket, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveMarket]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setUserAddress(accounts[0]);
        
        // Switch to Arc Testnet if needed
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x4CE9B2', // 5042002
              chainName: 'Arc Testnet',
              nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
              rpcUrls: ['https://rpc.drpc.testnet.arc.network'],
              blockExplorerUrls: ['https://testnet.arcscan.app'],
            }],
          });
        } catch (e) {
          console.error('Chain add error:', e);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
      }
    } else {
      setMessage({ text: 'Please install MetaMask!', type: 'error' });
    }
  };

  const placeBet = async () => {
    if (!userAddress) {
      setMessage({ text: 'Connect wallet first!', type: 'error' });
      return;
    }
    if (!market || market.status !== 'open') {
      setMessage({ text: 'No active market available.', type: 'error' });
      return;
    }
    
    const amountNum = parseFloat(betAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ text: 'Invalid amount.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'Signing transaction...', type: 'info' });

    try {
      // 1. Real USDC transfer to Agent Wallet
      const txResult = await sendToAddress(AGENT_WALLET, amountNum);
      
      if (!txResult.success || !txResult.txHash) {
        throw new Error(txResult.error || 'Transaction failed');
      }

      setMessage({ text: 'Verifying on-chain...', type: 'info' });

      // 2. Register bet in backend
      const res = await fetch('/api/predict/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          userAddress,
          side: betSide,
          amount: amountNum,
          txHash: txResult.txHash,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Bet placed successfully! Tx: ${txResult.txHash.slice(0, 10)}...`, type: 'success' });
        fetchActiveMarket();
      } else {
        throw new Error(data.error || 'Failed to register bet');
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createNewMarket = async () => {
    if (!adminQuestion || !adminSecret) return;
    try {
      const res = await fetch('/api/predict/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: adminQuestion, adminSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminQuestion('');
        fetchActiveMarket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const settleMarket = async (outcome: 'YES' | 'NO') => {
    if (!market || !adminSecret) return;
    setLoading(true);
    try {
      const res = await fetch('/api/predict/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: market.id, outcome, adminSecret }),
      });
      const data = await res.json();
      if (data.success) {
        fetchActiveMarket();
        setMessage({ text: `Market resolved: ${outcome}. Payouts processed.`, type: 'success' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);
  const yesPool = bets.filter(b => b.side === 'YES').reduce((sum, b) => sum + b.amount, 0);
  const noPool = bets.filter(b => b.side === 'NO').reduce((sum, b) => sum + b.amount, 0);

  const isAdmin = userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f0f5] font-sans selection:bg-[#d4af37]/30">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1a1a2e] blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-[#8a8a9a] hover:text-[#d4af37] transition-colors mb-6 text-sm font-bold uppercase tracking-widest group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2 mb-2 text-[#d4af37]">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-bold tracking-widest uppercase">Arc Ecosystem</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Prediction Market</h1>
          </div>
          
          <button 
            onClick={connectWallet}
            className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8942a] text-[#050508] px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#d4af37]/20 active:scale-95 group"
          >
            <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connect Wallet'}
          </button>
        </header>

        {/* Message Banner */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> :
               <Info className="w-5 h-5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Market Area */}
          <div className="lg:col-span-2 space-y-8">
            {market ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0d0d12] border border-[#1a1a2e] rounded-3xl p-8 shadow-2xl overflow-hidden relative"
              >
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-xs font-bold uppercase tracking-wider ${
                  market.status === 'open' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-green-500/20 text-green-400'
                }`}>
                  {market.status}
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-[#1a1a2e] p-3 rounded-2xl">
                    <Trophy className="w-8 h-8 text-[#d4af37]" />
                  </div>
                  <div>
                    <span className="text-xs text-[#8a8a9a] font-medium uppercase tracking-tighter mb-1 block">Active Prediction</span>
                    <h2 className="text-2xl font-bold leading-tight">{market.question}</h2>
                  </div>
                </div>

                {market.status === 'open' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setBetSide('YES')}
                        className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                          betSide === 'YES' 
                            ? 'bg-[#d4af37] text-[#050508] border-[#d4af37]' 
                            : 'bg-transparent text-[#f0f0f5] border-[#1a1a2e] hover:border-[#d4af37]/50'
                        }`}
                      >
                        YES
                      </button>
                      <button 
                        onClick={() => setBetSide('NO')}
                        className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                          betSide === 'NO' 
                            ? 'bg-[#d4af37] text-[#050508] border-[#d4af37]' 
                            : 'bg-transparent text-[#f0f0f5] border-[#1a1a2e] hover:border-[#d4af37]/50'
                        }`}
                      >
                        NO
                      </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <span className="text-[#8a8a9a] font-bold">USDC</span>
                      </div>
                      <input 
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="w-full bg-[#050508] border border-[#1a1a2e] rounded-2xl py-4 pl-16 pr-4 focus:outline-none focus:border-[#d4af37] transition-colors font-bold text-lg"
                        placeholder="Amount"
                      />
                    </div>

                    <button 
                      onClick={placeBet}
                      disabled={loading}
                      className="w-full bg-[#d4af37] hover:bg-[#b8942a] disabled:opacity-50 disabled:cursor-not-allowed text-[#050508] py-4 rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-[#d4af37]/10"
                    >
                      {loading ? 'Processing...' : 'Place Bet'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-2xl p-6 text-center">
                    <h3 className="text-[#d4af37] text-lg font-bold mb-1">Outcome: {market.outcome}</h3>
                    <p className="text-[#8a8a9a] text-sm italic">This market has been resolved. Payouts have been distributed.</p>
                  </div>
                )}

                {/* Pool Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#1a1a2e]">
                  <div className="text-center">
                    <div className="text-[#8a8a9a] text-[10px] uppercase font-bold tracking-widest mb-1">Total Pool</div>
                    <div className="text-xl font-bold">{totalPool} USDC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#8a8a9a] text-[10px] uppercase font-bold tracking-widest mb-1">YES Odds</div>
                    <div className="text-xl font-bold text-green-400">{totalPool > 0 ? Math.round((yesPool/totalPool)*100) : 0}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#8a8a9a] text-[10px] uppercase font-bold tracking-widest mb-1">NO Odds</div>
                    <div className="text-xl font-bold text-red-400">{totalPool > 0 ? Math.round((noPool/totalPool)*100) : 0}%</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#0d0d12] border border-[#1a1a2e] rounded-3xl p-12 text-center">
                <p className="text-[#8a8a9a] mb-4">No active prediction market at the moment.</p>
                {isAdmin && <p className="text-xs text-[#d4af37]">Admin: Create a new market below.</p>}
              </div>
            )}

            {/* Bets History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#d4af37]" />
                  Recent Bets
                </h3>
                <span className="text-xs text-[#8a8a9a]">{bets.length} Total</span>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {bets.length > 0 ? (
                  bets.slice().reverse().map((bet, i) => (
                    <div key={bet.id} className="bg-[#0d0d12]/50 border border-[#1a1a2e] rounded-xl p-4 flex items-center justify-between group hover:bg-[#0d0d12] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-1.5 h-10 rounded-full ${bet.side === 'YES' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#f0f0f5]">{bet.side}</span>
                            <span className="text-[#8a8a9a] text-xs font-medium">by {bet.userAddress.slice(0, 8)}...</span>
                          </div>
                          <div className="text-xs text-[#8a8a9a] mt-0.5">{new Date(bet.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{bet.amount} USDC</div>
                        <a 
                          href={explorerUrl(bet.txHash)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] text-[#d4af37] hover:underline flex items-center gap-1 justify-end mt-1"
                        >
                          View TX <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#8a8a9a] text-sm border border-dashed border-[#1a1a2e] rounded-xl">
                    No bets placed yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Admin Section */}
          <div className="space-y-8">
            {/* Agent Info Card */}
            <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-[#d4af37]" />
                <h3 className="font-bold text-[#d4af37]">Verified Agent</h3>
              </div>
              <p className="text-sm text-[#8a8a9a] leading-relaxed mb-6">
                All bets are held in the secure Arc Agent Wallet. Payouts are executed automatically on-chain via our Prediction Agent when the market resolves.
              </p>
              <div className="bg-[#050508] rounded-xl p-4 border border-[#1a1a2e]">
                <div className="text-[10px] uppercase font-bold text-[#8a8a9a] mb-1">Agent Address</div>
                <div className="text-[11px] font-mono break-all text-[#d4af37]">{AGENT_WALLET}</div>
              </div>
            </div>

            {/* Admin Panel */}
            {isAdmin && (
              <div className="bg-[#0d0d12] border border-[#d4af37]/30 rounded-3xl p-6 shadow-xl shadow-[#d4af37]/5">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="font-bold">Admin Control</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#8a8a9a] uppercase mb-2 block">Admin Secret</label>
                    <input 
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="w-full bg-[#050508] border border-[#1a1a2e] rounded-xl py-3 px-4 focus:outline-none focus:border-[#d4af37] text-sm"
                      placeholder="Enter secret"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#1a1a2e]">
                    <label className="text-xs font-bold text-[#8a8a9a] uppercase mb-2 block">New Market Question</label>
                    <textarea 
                      value={adminQuestion}
                      onChange={(e) => setAdminQuestion(e.target.value)}
                      className="w-full bg-[#050508] border border-[#1a1a2e] rounded-xl py-3 px-4 focus:outline-none focus:border-[#d4af37] text-sm resize-none h-24"
                      placeholder="e.g. Will ETH reach $5k by June?"
                    />
                    <button 
                      onClick={createNewMarket}
                      className="w-full mt-2 bg-[#d4af37] text-[#050508] py-3 rounded-xl font-bold text-sm"
                    >
                      Create Market
                    </button>
                  </div>

                  {market && market.status === 'open' && (
                    <div className="pt-4 border-t border-[#1a1a2e]">
                      <label className="text-xs font-bold text-[#8a8a9a] uppercase mb-2 block">Resolve Market</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => settleMarket('YES')}
                          className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-xs"
                        >
                          Resolve YES
                        </button>
                        <button 
                          onClick={() => settleMarket('NO')}
                          className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs"
                        >
                          Resolve NO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050508;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a2e;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4af37;
        }
      `}</style>
    </div>
  );
}
