'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useJobsStore } from '@/lib/jobsStore';
import { 
  Briefcase, 
  ArrowLeft, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  Search,
  Building2,
  Calendar,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';

export default function MyApplicationsPage() {
  const { address, isConnected, connect } = useWallet();
  const { getApplicationsByAddress } = useJobsStore();
  
  const applications = address ? getApplicationsByAddress(address) : [];

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <SiteHeader />
        <div className="bracket-card p-12 max-w-md w-full text-center">
          <Brackets />
          <div className="h-20 w-20 bg-[#c9a84c]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#c9a84c]/20">
            <Wallet className="text-[#c9a84c]" size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase">Wallet Required</h2>
          <p className="mt-4 text-[#777] leading-relaxed">
            Please connect your wallet to view your job applications.
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
      <SiteHeader />

      <section className="pt-32 pb-24 px-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/jobs" className="flex items-center gap-2 text-[#777] hover:text-[#c9a84c] transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Browse
          </Link>

          <h1 className="text-4xl font-black uppercase sm:text-5xl">
            MY <span className="text-[#c9a84c]">APPLICATIONS</span>
          </h1>
          <p className="mt-4 text-[#777]">
            Track the status of your job applications within the Arc Ecosystem.
          </p>

          <div className="mt-12 space-y-4">
            {applications.length > 0 ? (
              applications.map((app) => (
                <div key={app.id} className="bracket-card p-6 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <Brackets />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-black text-xl">
                        {app.company[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{app.jobTitle}</h3>
                        <p className="text-[#777] flex items-center gap-1.5 mt-1">
                          <Building2 size={14} /> {app.company}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-mono uppercase text-[#555] tracking-widest mb-1">Applied On</p>
                        <p className="text-sm font-bold flex items-center gap-2 justify-end">
                          <Calendar size={14} className="text-[#c9a84c]" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs font-mono uppercase text-[#555] tracking-widest mb-1">Status</p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase border border-blue-500/20">
                          <Clock size={12} /> Under Review
                        </span>
                      </div>
                      
                      <Link href={`/jobs/${app.jobId}`} className="p-2 border border-[#2a2a2a] rounded-lg text-[#777] hover:text-[#c9a84c] hover:border-[#c9a84c]/50 transition-all">
                        <ExternalLink size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 border border-dashed border-[#2a2a2a] rounded-2xl">
                <div className="grid h-20 w-20 place-items-center bg-[#111] rounded-full mx-auto border border-[#2a2a2a]">
                  <Search className="text-[#333]" size={32} />
                </div>
                <h3 className="mt-6 text-xl font-bold">No applications yet</h3>
                <p className="mt-2 text-[#777]">Explore the job board and find your next opportunity.</p>
                <Link href="/jobs" className="primary-button mt-8 mx-auto">
                  BROWSE JOBS
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
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
