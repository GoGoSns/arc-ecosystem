'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { 
  Trophy, ArrowLeft, Plus, X, Calendar, 
  DollarSign, Clock, Briefcase, Wallet 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useBountyStore, Bounty } from '@/lib/bountyStore';

const CATEGORIES = ['design', 'development', 'content', 'marketing', 'research', 'other'] as const;

export default function CreateBountyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { addBounty } = useBountyStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'development' as typeof CATEGORIES[number],
    budget: '',
    budgetType: 'fixed' as 'fixed' | 'flexible',
    deadline: '',
    estimatedHours: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set default deadline to 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setMinutes(nextWeek.getMinutes() - nextWeek.getTimezoneOffset());
    setForm(f => ({ ...f, deadline: nextWeek.toISOString().slice(0, 16) }));
  }, []);

  if (!mounted) return null;

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter(skill => skill !== s));
  };

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.title.length > 100) errs.title = 'Title too long (max 100)';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (form.description.length < 50) errs.description = 'Description too short (min 50)';
    
    const budget = parseFloat(form.budget);
    if (!form.budget || isNaN(budget) || budget <= 0) errs.budget = 'Valid budget is required';
    
    if (!form.deadline) {
      errs.deadline = 'Deadline is required';
    } else {
      const d = new Date(form.deadline);
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 24);
      if (d < minDate) errs.deadline = 'Deadline must be at least 24h in the future';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (!validate()) return;

    const newBounty: Bounty = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      budget: parseFloat(form.budget),
      budgetType: form.budgetType,
      deadline: new Date(form.deadline).getTime(),
      estimatedHours: form.estimatedHours ? parseInt(form.estimatedHours) : undefined,
      requiredSkills: skills,
      ownerAddress: address,
      status: 'open',
      createdAt: Date.now(),
      proposals: [],
    };

    addBounty(newBounty);
    router.push(`/bounty/${newBounty.id}`);
  };

  const inputStyle = { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' };

  return (
    <div className="flex flex-col flex-1" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-6 opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--fg)' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--fg)' }}>Post a Bounty</h1>
          <p className="text-sm opacity-60" style={{ color: 'var(--fg)' }}>
            Describe the task and set your budget to find the right talent.
          </p>
        </div>

        {!isConnected ? (
          <div 
            className="rounded-3xl p-10 flex flex-col items-center text-center gap-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
              <Wallet size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Connect your wallet</h2>
              <p className="text-sm opacity-60 max-w-xs">You need to connect your wallet to post a bounty and manage payments.</p>
            </div>
            <button
              onClick={() => connect({ connector: injected() })}
              className="sweep px-8 py-3 rounded-xl font-bold"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-70">Bounty Title</label>
              <input 
                type="text" 
                placeholder="e.g. Design a logo for my new project"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={100}
                className="px-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)]"
                style={inputStyle}
              />
              {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-70">Description</label>
              <textarea 
                placeholder="Explain the task in detail. What are the deliverables? What is the expected outcome?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={6}
                className="px-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)] resize-none"
                style={inputStyle}
              />
              <div className="flex justify-between">
                {errors.description ? <p className="text-xs text-red-400">{errors.description}</p> : <div />}
                <p className="text-[10px] opacity-40">{form.description.length} chars (min 50)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-70">Category</label>
                <select 
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                  className="px-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)] appearance-none cursor-pointer"
                  style={inputStyle}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Budget Type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-70">Budget Type</label>
                <div className="flex p-1 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, budgetType: 'fixed' }))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ 
                      background: form.budgetType === 'fixed' ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: form.budgetType === 'fixed' ? 'var(--accent)' : 'var(--fg)'
                    }}
                  >
                    Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, budgetType: 'flexible' }))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ 
                      background: form.budgetType === 'flexible' ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: form.budgetType === 'flexible' ? 'var(--accent)' : 'var(--fg)'
                    }}
                  >
                    Flexible
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-70">Budget (USDC)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)]"
                    style={inputStyle}
                  />
                </div>
                {errors.budget && <p className="text-xs text-red-400">{errors.budget}</p>}
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-70">Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="datetime-local" 
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)]"
                    style={inputStyle}
                  />
                </div>
                {errors.deadline && <p className="text-xs text-red-400">{errors.deadline}</p>}
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-70">Required Skills</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {skills.map(s => (
                  <span 
                    key={s} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:opacity-70">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                <input 
                  type="text" 
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all focus:border-[var(--accent)]"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              className="sweep w-full py-4 rounded-2xl font-bold text-lg mt-4 shadow-xl"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              Post Bounty
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
