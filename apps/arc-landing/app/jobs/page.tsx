'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { 
  useJobsStore, 
  JobCategory, 
  JobType, 
  ExperienceLevel, 
  RemotePolicy,
  Job
} from '@/lib/jobsStore';
import { 
  Search, 
  Briefcase, 
  Globe, 
  Clock, 
  DollarSign, 
  Users, 
  Plus,
  ArrowRight,
  Filter,
  ChevronDown,
  Building2,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import AppSwitcher from '@/components/AppSwitcher';
import SiteHeader from '@/components/SiteHeader';

const CATEGORIES: { id: JobCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'design', label: 'Design' },
  { id: 'product', label: 'Product' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'community', label: 'Community' },
  { id: 'business', label: 'Business' },
];

const TYPES: { id: JobType | 'all', label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'freelance', label: 'Freelance' },
];

export default function JobsPage() {
  const { address, isConnected, connect } = useWallet();
  const { jobs } = useJobsStore();
  
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<JobCategory | 'all'>('all');
  const [activeType, setActiveType] = useState<JobType | 'all'>('all');
  const [activeRemote, setActiveRemote] = useState<RemotePolicy | 'all'>('all');
  const [salaryRange, setSalaryRange] = useState(0);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.company.toLowerCase().includes(search.toLowerCase()) ||
                          job.techStack.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || job.category === activeCategory;
      const matchesType = activeType === 'all' || job.type === activeType;
      const matchesRemote = activeRemote === 'all' || job.remotePolicy === activeRemote;
      const matchesSalary = job.salaryMax >= salaryRange;

      return matchesSearch && matchesCategory && matchesType && matchesRemote && matchesSalary;
    });
  }, [jobs, search, activeCategory, activeType, activeRemote, salaryRange]);

  const stats = useMemo(() => {
    const openJobs = jobs.filter(j => j.status === 'open').length;
    const totalJobs = jobs.length;
    const avgSalary = Math.round(jobs.reduce((acc, j) => acc + (j.salaryMin + j.salaryMax) / 2, 0) / (jobs.length || 1));
    const activeEmployers = new Set(jobs.map(j => j.company)).size;

    return [
      { label: 'Open Jobs', value: openJobs, icon: <Briefcase size={20} /> },
      { label: 'Total Jobs', value: totalJobs, icon: <Globe size={20} /> },
      { label: 'Avg Salary', value: `$${(avgSalary / 1000).toFixed(1)}k`, icon: <DollarSign size={20} /> },
      { label: 'Active Employers', value: activeEmployers, icon: <Users size={20} /> },
    ];
  }, [jobs]);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c]">// opportunities</p>
              <h1 className="mt-6 text-5xl font-black uppercase sm:text-7xl">
                ARC <span className="text-[#c9a84c]">JOB BOARD</span>
              </h1>
              <p className="mt-6 text-lg text-[#9a9a9a]">
                Find your next role in the USDC-native economy. 
                High-impact Web3 jobs with stablecoin pay.
              </p>
            </div>
            <Link href="/jobs/post" className="primary-button group">
              POST A JOB <Plus size={18} className="transition-transform group-hover:rotate-90" />
            </Link>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bracket-card p-6 bg-white/[0.02]">
                <Brackets />
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#777]">{stat.label}</p>
                  <div className="text-[#c9a84c]/50">{stat.icon}</div>
                </div>
                <p className="mt-2 text-3xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 z-40 border-y border-[#2a2a2a] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" size={20} />
              <input 
                type="text" 
                placeholder="Search by title, company, or tech stack..."
                aria-label="Search jobs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-12 bg-[#111] border border-[#2a2a2a] rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
              <select 
                aria-label="Filter jobs by category"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value as any)}
                className="min-h-12 w-full bg-[#111] border border-[#2a2a2a] text-sm text-[#aaa] rounded-lg px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 xl:w-auto"
              >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select 
                aria-label="Filter jobs by type"
                value={activeType}
                onChange={(e) => setActiveType(e.target.value as any)}
                className="min-h-12 w-full bg-[#111] border border-[#2a2a2a] text-sm text-[#aaa] rounded-lg px-4 py-3 focus:outline-none focus:border-[#c9a84c]/50 xl:w-auto"
              >
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div className="flex flex-col gap-3 rounded-lg border border-[#2a2a2a] bg-[#111] px-4 py-3 sm:col-span-2 xl:min-w-[280px]">
                <span className="text-xs font-mono uppercase text-[#555]">Min Salary: ${salaryRange}k</span>
                <input 
                  type="range" 
                  min="0" 
                  max="250" 
                  step="10"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(parseInt(e.target.value))}
                  aria-label="Minimum salary filter in thousands of USDC"
                  className="accent-[#c9a84c] w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job List */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase size={20} className="text-[#c9a84c]" />
              {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Available
            </h2>
          </div>

          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-[#2a2a2a] rounded-2xl">
                <Search size={48} className="mx-auto text-[#222]" />
                <h3 className="mt-4 text-xl font-bold">No jobs matching your criteria</h3>
                <p className="mt-2 text-[#777]">Try adjusting your search or filters.</p>
                <button 
                  type="button"
                  onClick={() => {setSearch(''); setActiveCategory('all'); setActiveType('all'); setSalaryRange(0);}}
                  className="secondary-button mt-6"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function JobCard({ job }: { job: Job }) {
  const daysAgo = Math.floor((Date.now() - job.createdAt) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="bracket-card p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
      <Brackets />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/20 flex items-center justify-center text-2xl font-black text-[#c9a84c]">
            {job.company[0]}
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black group-hover:text-[#c9a84c] transition-colors">{job.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#777]">
                <span className="flex items-center gap-1.5 font-bold text-[#aaa]">
                  <Building2 size={14} /> {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {job.location || (job.remotePolicy === 'remote' ? 'Remote' : 'Hybrid')}
                </span>
                <span className="flex items-center gap-1.5 uppercase font-mono text-[10px] tracking-wider bg-[#222] px-2 py-0.5 rounded border border-white/5">
                  {job.type}
                </span>
                <span className="flex items-center gap-1.5 uppercase font-mono text-[10px] tracking-wider bg-[#c9a84c]/10 text-[#c9a84c] px-2 py-0.5 rounded border border-[#c9a84c]/20">
                  {job.experienceLevel}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-black text-white">${job.salaryMin / 1000}k - ${job.salaryMax / 1000}k <span className="text-[#c9a84c] text-sm">USDC</span></p>
              <p className="mt-1 text-xs font-mono text-[#555] uppercase">{daysAgo === 0 ? 'Posted today' : `Posted ${daysAgo} days ago`} &middot; {job.applicationCount} applications</p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            {job.techStack.map(tech => (
              <span key={tech} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-[#aaa]">
                {tech}
              </span>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <Globe size={14} />
              <span className="uppercase tracking-widest">{job.remotePolicy}</span>
            </div>
            <Link href={`/jobs/${job.id}`} className="bracket-button">
              VIEW DETAILS <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
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
