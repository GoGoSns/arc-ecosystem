'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { 
  useJobsStore, 
  JobCategory, 
  JobType, 
  ExperienceLevel, 
  RemotePolicy 
} from '@/lib/jobsStore';
import { 
  Briefcase, 
  ArrowLeft, 
  Send,
  Plus,
  X,
  Wallet,
  Building2,
  Globe,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppSwitcher from '@/components/AppSwitcher';

export default function PostJobPage() {
  const { address, isConnected, connect } = useWallet();
  const { addJob } = useJobsStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    category: 'engineering' as JobCategory,
    type: 'full-time' as JobType,
    experienceLevel: 'mid' as ExperienceLevel,
    remotePolicy: 'remote' as RemotePolicy,
    location: '',
    salaryMin: 50000,
    salaryMax: 100000,
    techStack: '',
    benefits: '',
    posterName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;

    setIsSubmitting(true);
    
    addJob({
      title: formData.title,
      company: formData.company,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      experienceLevel: formData.experienceLevel,
      remotePolicy: formData.remotePolicy,
      location: formData.remotePolicy !== 'remote' ? formData.location : undefined,
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
      benefits: formData.benefits.split('\n').map(s => s.trim()).filter(Boolean),
      posterAddress: address,
      posterName: formData.posterName || undefined,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/jobs');
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <div className="bracket-card p-12 max-w-md w-full text-center">
          <Brackets />
          <div className="h-20 w-20 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#c9a84c]/20">
            <Wallet className="text-[#c9a84c]" size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase">Wallet Required</h2>
          <p className="mt-4 text-[#777] leading-relaxed">
            You must connect your wallet to post a new job listing on the Arc Job Board.
          </p>
          <button onClick={connect} className="primary-button w-full mt-10 justify-center">
            CONNECT WALLET
          </button>
          <Link href="/jobs" className="block mt-6 text-sm text-[#555] hover:text-[#c9a84c] transition-colors">
            Back to Job Board
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </Link>
          <div className="hidden items-center gap-8 font-mono text-xs uppercase text-[#777] md:flex">
            <Link href="/jobs" className="nav-link">BROWSE JOBS</Link>
            <Link href="/jobs/post" className="text-white">POST A JOB</Link>
          </div>
          <div className="flex items-center gap-3">
            <AppSwitcher />
            <div className="bracket-button">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/jobs" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Browse
          </Link>

          <h1 className="text-4xl font-black uppercase sm:text-5xl">
            POST A <span className="text-[#c9a84c]">NEW JOB</span>
          </h1>
          <p className="mt-4 text-[#777]">
            Hire the best talent in Web3. Listings are paid and settled in USDC.
          </p>

          <form onSubmit={handleSubmit} className="mt-12 space-y-10">
            {/* Basic Info */}
            <div className="bracket-card p-8 bg-white/[0.01]">
              <Brackets />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-[#c9a84c]" /> Basic Information
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Job Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Senior Solidity Engineer"
                    className="form-input"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Company Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Arc Labs"
                    className="form-input"
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Job Description</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    className="form-input resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="bracket-card p-8 bg-white/[0.01]">
              <Brackets />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Globe size={20} className="text-[#c9a84c]" /> Classification & Logistics
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Category</label>
                  <select 
                    className="form-input"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as JobCategory})}
                  >
                    <option value="engineering">Engineering</option>
                    <option value="design">Design</option>
                    <option value="product">Product</option>
                    <option value="marketing">Marketing</option>
                    <option value="community">Community</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Job Type</label>
                  <select 
                    className="form-input"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as JobType})}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Experience Level</label>
                  <select 
                    className="form-input"
                    value={formData.experienceLevel}
                    onChange={e => setFormData({...formData, experienceLevel: e.target.value as ExperienceLevel})}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead / Head</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Remote Policy</label>
                  <select 
                    className="form-input"
                    value={formData.remotePolicy}
                    onChange={e => setFormData({...formData, remotePolicy: e.target.value as RemotePolicy})}
                  >
                    <option value="remote">Fully Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
                {formData.remotePolicy !== 'remote' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Location</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. San Francisco, CA"
                      className="form-input"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Compensation & Details */}
            <div className="bracket-card p-8 bg-white/[0.01]">
              <Brackets />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <DollarSign size={20} className="text-[#c9a84c]" /> Compensation & Details
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Min Salary (USDC)</label>
                  <input 
                    required
                    type="number" 
                    className="form-input"
                    value={formData.salaryMin}
                    onChange={e => setFormData({...formData, salaryMin: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Max Salary (USDC)</label>
                  <input 
                    required
                    type="number" 
                    className="form-input"
                    value={formData.salaryMax}
                    onChange={e => setFormData({...formData, salaryMax: parseInt(e.target.value)})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Tech Stack (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Solidity, Rust, React, Next.js"
                    className="form-input"
                    value={formData.techStack}
                    onChange={e => setFormData({...formData, techStack: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Benefits (one per line)</label>
                  <textarea 
                    rows={4}
                    placeholder="e.g. Unlimited PTO&#10;Health Insurance&#10;Remote stipend"
                    className="form-input resize-none"
                    value={formData.benefits}
                    onChange={e => setFormData({...formData, benefits: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-mono uppercase text-[#555] tracking-wider">Poster Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Your name or handle"
                    className="form-input"
                    value={formData.posterName}
                    onChange={e => setFormData({...formData, posterName: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="primary-button h-16 px-12 text-lg disabled:opacity-50"
              >
                {isSubmitting ? 'POSTING...' : 'PUBLISH JOB LISTING'} <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <style jsx global>{`
        .form-input {
          width: 100%;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #c9a84c;
        }
        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23777777'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem;
          padding-right: 2.5rem;
        }
      `}</style>
    </main>
  );
}

function Brackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}
