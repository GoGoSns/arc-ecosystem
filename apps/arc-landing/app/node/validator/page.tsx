'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNodeStore, isNodeAdmin, shortenAddr, REGION_LABELS, type Region, type ValidatorStatus } from '@/lib/nodeStore';
import { useWallet } from '@/contexts/WalletContext';
import SiteHeader from '@/components/SiteHeader';

const STATUS_COLOR: Record<ValidatorStatus, string> = {
  waitlist: '#9ca3af',
  approved: '#4ade80',
  active:   '#c9a84c',
  rejected: '#ef4444',
};

export default function ValidatorPage() {
  const { address, isConnected, connect } = useWallet();
  const { validators, applyValidator, updateValidator } = useNodeStore();
  const admin = isNodeAdmin(address);

  const myApp = address ? validators.find((v) => v.address === address) : undefined;

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [experience, setExp]    = useState('');
  const [region, setRegion]     = useState<Region>('NA');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (experience.trim().length < 50) e.experience = 'Please describe at least 50 characters of experience.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApply = () => {
    if (!address || !validate()) return;
    applyValidator({
      address,
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      experience: experience.trim(),
      region,
      appliedAt: Date.now(),
      status: 'waitlist',
    });
    setSubmitted(true);
  };

  const approved = validators.filter((v) => v.status === 'approved' || v.status === 'active');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={20} className="text-[#c9a84c]" />
          <h1 className="text-3xl font-black">Mainnet Validator Waitlist</h1>
        </div>
        <p className="text-[#777] text-sm mb-8">Apply now to validate when Arc mainnet launches.</p>

        {/* Info box */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <ul className="space-y-2 text-sm text-[#aaa]">
            <li className="flex gap-2"><span className="text-[#c9a84c]">›</span> Arc is currently on testnet with 10 active validators.</li>
            <li className="flex gap-2"><span className="text-[#c9a84c]">›</span> Mainnet launch will gradually expand the validator set.</li>
            <li className="flex gap-2"><span className="text-[#c9a84c]">›</span> Early applicants receive priority consideration.</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Applications',     value: validators.length },
            { label: 'Approved',         value: approved.length },
            { label: 'Active Validators', value: 10 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <div className="text-2xl font-black">{value}</div>
              <div className="text-[10px] text-[#555] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Application form / status */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-5">Your Application</h2>

          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-sm text-[#777] mb-4">Connect your wallet to apply for the validator waitlist.</p>
              <button onClick={connect} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Connect Wallet
              </button>
            </div>
          ) : myApp && !submitted ? (
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">{myApp.name || shortenAddr(myApp.address)}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold capitalize"
                  style={{ background: `${STATUS_COLOR[myApp.status]}18`, color: STATUS_COLOR[myApp.status] }}>
                  {myApp.status}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#777]">
                <div><span className="text-[#555]">Region:</span> {REGION_LABELS[myApp.region]}</div>
                <div><span className="text-[#555]">Applied:</span> {new Date(myApp.appliedAt).toLocaleDateString()}</div>
              </div>
              <p className="text-xs text-[#666] mt-3 leading-relaxed">{myApp.experience.slice(0, 200)}{myApp.experience.length > 200 ? '...' : ''}</p>
            </div>
          ) : submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-bold text-[#4ade80]">Application submitted!</p>
              <p className="text-xs text-[#555] mt-1">We'll review your application and contact you.</p>
            </div>
          ) : (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Display Name (optional)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name or handle"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">Email (optional)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                {errors.email && <p className="text-xs text-[#ef4444] mt-1">{errors.email}</p>}
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#aaa] mb-1.5">
                  Node Operator Experience <span className="text-[#ef4444]">*</span>
                </label>
                <textarea value={experience} onChange={(e) => setExp(e.target.value)} rows={5}
                  placeholder="Tell us about your node operator experience — previous validators, infrastructure managed, uptime SLAs... (min 50 chars)"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.experience ? '#ef4444' : 'rgba(255,255,255,0.09)'}` }} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-[#ef4444]">{errors.experience ?? ''}</span>
                  <span className="text-xs text-[#555]">{experience.length} chars</span>
                </div>
              </div>
              <button onClick={handleApply}
                className="px-6 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#c9a84c', color: '#0a0a0a' }}>
                Submit Application
              </button>
            </div>
          )}
        </div>

        {/* Waitlist preview */}
        {approved.length > 0 && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Approved Validators</h2>
            <div className="space-y-2">
              {approved.slice(0, 10).map((v) => (
                <div key={v.address} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-sm font-mono text-[#aaa]">{v.name || shortenAddr(v.address)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#555]">{v.region}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                      style={{ background: `${STATUS_COLOR[v.status]}18`, color: STATUS_COLOR[v.status] }}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin panel */}
        {admin && validators.length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)' }}>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#c9a84c] mb-4">Admin — Review Applications</h2>
            <div className="space-y-3">
              {validators.map((v) => (
                <div key={v.address} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="font-bold text-sm">{v.name || shortenAddr(v.address)}</p>
                    <p className="text-xs text-[#555]">{REGION_LABELS[v.region]} · {new Date(v.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize"
                      style={{ background: `${STATUS_COLOR[v.status]}18`, color: STATUS_COLOR[v.status] }}>
                      {v.status}
                    </span>
                    {v.status === 'waitlist' && (
                      <>
                        <button onClick={() => updateValidator(v.address, { status: 'approved' })}
                          className="px-3 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                          Approve
                        </button>
                        <button onClick={() => updateValidator(v.address, { status: 'rejected' })}
                          className="px-3 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
