'use client';

import React, { useState, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useJobsStore, Job } from '@/lib/jobsStore';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Briefcase, 
  Clock, 
  Globe, 
  CheckCircle2,
  Mail,
  Link as LinkIcon,
  FileText,
  Send,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { address, isConnected, connect } = useWallet();
  const { getJobById, applyForJob, applications } = useJobsStore();
  
  const job = useMemo(() => getJobById(id), [getJobById, id]);
  
  const hasApplied = useMemo(() => {
    if (!address) return false;
    return applications.some(app => 
      app.jobId === id && app.applicantAddress.toLowerCase() === address.toLowerCase()
    );
  }, [applications, id, address]);

  const [formData, setFormData] = useState({
    email: '',
    coverLetter: '',
    portfolioUrl: '',
    applicantName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !job) return;
    if (formData.coverLetter.length < 100) return;

    setIsSubmitting(true);
    
    applyForJob({
      jobId: job.id,
      applicantAddress: address,
      applicantName: formData.applicantName || undefined,
      email: formData.email,
      coverLetter: formData.coverLetter,
      portfolioUrl: formData.portfolioUrl || undefined,
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (!job) {
    notFound();
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Job Not Found</h2>
          <Link href="/jobs" className="mt-4 text-[#c9a84c] hover:underline block">Return to Job Board</Link>
        </div>
      </main>
    );
  }

  const daysAgo = Math.floor((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-6xl">
          <Link href="/jobs" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Browse
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
            {/* Job Details */}
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black uppercase sm:text-5xl lg:text-6xl">{job.title}</h1>
                  <div className="mt-6 flex flex-wrap items-center gap-6 text-[#777]">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <div className="h-8 w-8 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-black">
                        {job.company[0]}
                      </div>
                      {job.company}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} /> {job.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-2 capitalize">
                      <Briefcase size={18} /> {job.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} /> {daysAgo === 0 ? 'Posted today' : `${daysAgo}d ago`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#c9a84c]">${job.salaryMin / 1000}k - ${job.salaryMax / 1000}k</p>
                  <p className="mt-1 font-mono text-xs uppercase text-[#555]">Paid in USDC</p>
                </div>
              </div>

              <div className="bracket-card p-8 bg-white/[0.01]">
                <Brackets />
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-[#c9a84c]" /> Job Description
                </h3>
                <div className="prose prose-invert max-w-none text-[#9a9a9a] leading-relaxed">
                  {job.description.split('\n').map((para, i) => (
                    <p key={i} className="mb-4">{para}</p>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bracket-card p-8 bg-white/[0.01]">
                  <Brackets />
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#c9a84c]">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.techStack.map(tech => (
                      <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-[#aaa]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bracket-card p-8 bg-white/[0.01]">
                  <Brackets />
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#c9a84c]">
                    Benefits
                  </h3>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#9a9a9a]">
                        <CheckCircle2 size={14} className="text-green-500/50" /> {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar / Apply Form */}
            <div className="space-y-6">
              <div className="bracket-card p-8 bg-[#c9a84c]/5 border-[#c9a84c]/20">
                <Brackets />
                <h3 className="text-2xl font-black uppercase mb-2">Apply Now</h3>
                <p className="text-sm text-[#777] mb-8">
                  Submit your application. Your wallet address will be used as your unique identifier.
                </p>

                {isSuccess ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                      <CheckCircle2 className="text-green-500" size={32} />
                    </div>
                    <h4 className="text-xl font-bold">Application Sent!</h4>
                    <p className="mt-2 text-sm text-[#777]">
                      The employer will review your application and contact you via email.
                    </p>
                    <Link href="/jobs" className="primary-button mt-8 w-full justify-center">
                      BACK TO JOBS
                    </Link>
                  </div>
                ) : hasApplied ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#c9a84c]/20">
                      <CheckCircle2 className="text-[#c9a84c]" size={32} />
                    </div>
                    <h4 className="text-xl font-bold">Already Applied</h4>
                    <p className="mt-2 text-sm text-[#777]">
                      You have already submitted an application for this position.
                    </p>
                    <Link href="/jobs/applications" className="secondary-button mt-8 w-full justify-center">
                      MY APPLICATIONS
                    </Link>
                  </div>
                ) : !isConnected ? (
                  <div className="text-center py-8">
                    <button onClick={connect} className="primary-button w-full justify-center mb-4">
                      CONNECT WALLET TO APPLY
                    </button>
                    <p className="text-xs text-[#555] font-mono uppercase tracking-widest">
                      Wallet connection required
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[#c9a84c] tracking-[0.2em]">Full Name</label>
                      <input 
                        type="text"
                        placeholder="Your Name"
                        className="form-input"
                        value={formData.applicantName}
                        onChange={e => setFormData({...formData, applicantName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[#c9a84c] tracking-[0.2em]">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
                        <input 
                          required
                          type="email"
                          placeholder="your@email.com"
                          className="form-input pl-10"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[#c9a84c] tracking-[0.2em]">Portfolio URL</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
                        <input 
                          type="url"
                          placeholder="https://yourportfolio.com"
                          className="form-input pl-10"
                          value={formData.portfolioUrl}
                          onChange={e => setFormData({...formData, portfolioUrl: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-mono uppercase text-[#c9a84c] tracking-[0.2em]">Cover Letter *</label>
                        <span className={`text-[10px] font-mono ${formData.coverLetter.length < 100 ? 'text-red-500' : 'text-green-500'}`}>
                          {formData.coverLetter.length}/100 min
                        </span>
                      </div>
                      <textarea 
                        required
                        rows={8}
                        placeholder="Tell us why you are a great fit for this role..."
                        className="form-input resize-none"
                        value={formData.coverLetter}
                        onChange={e => setFormData({...formData, coverLetter: e.target.value})}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting || formData.coverLetter.length < 100}
                      className="primary-button w-full justify-center py-4 text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'} <Send size={16} />
                    </button>
                  </form>
                )}
              </div>

              <div className="bracket-card p-6 bg-white/[0.02] border-white/5">
                <Brackets />
                <div className="flex items-center justify-between text-[#777]">
                  <span className="text-xs font-mono uppercase tracking-widest">Active Applications</span>
                  <span className="text-xl font-black text-white">{job.applicationCount}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />
                <p className="text-[10px] leading-relaxed text-[#777]">
                  Applications on Arc Job Board are directly sent to the employer. Make sure your contact info is correct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .form-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 10px 14px;
          color: white;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #c9a84c;
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
