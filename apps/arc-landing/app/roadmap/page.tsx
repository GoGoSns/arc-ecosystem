'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Circle, 
  XCircle, 
  ThumbsUp, 
  Plus, 
  ChevronDown,
  Filter,
  SortAsc,
  Layers,
  Calendar,
  Zap,
  Layout,
  Globe,
  Link as LinkIcon
} from 'lucide-react';
import { useRoadmapStore, RoadmapItem, RoadmapStatus, RoadmapQuarter, RoadmapCategory, ADMIN_ADDRESS } from '@/lib/roadmapStore';
import { useWallet } from '@/contexts/WalletContext';
import { HubEmptyState } from '@/components/HubPrimitives';
import SiteHeader from '@/components/SiteHeader';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RoadmapStatus, { icon: any, color: string, label: string }> = {
  'completed': { icon: CheckCircle, color: '#4ade80', label: 'Completed' },
  'in-progress': { icon: Clock, color: '#facc15', label: 'In Progress' },
  'planned': { icon: Circle, color: '#9ca3af', label: 'Planned' },
  'cancelled': { icon: XCircle, color: '#f87171', label: 'Cancelled' },
};

const CATEGORY_CONFIG: Record<RoadmapCategory, { color: string, icon: any }> = {
  'feature': { color: '#60a5fa', icon: Zap },
  'infrastructure': { color: '#a78bfa', icon: Layout },
  'community': { color: '#4ade80', icon: Globe },
  'integration': { color: '#fb923c', icon: LinkIcon },
};

const QUARTERS: RoadmapQuarter[] = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026', 'Q1-2027'];
const STATUSES: RoadmapStatus[] = ['completed', 'in-progress', 'planned', 'cancelled'];
const CATEGORIES: RoadmapCategory[] = ['feature', 'infrastructure', 'community', 'integration'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon }: { label: string, value: number, icon: any }) {
  return (
    <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/[0.05]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[#d4af37]" />
        <span className="text-[10px] text-[#555566] uppercase tracking-widest font-mono">{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${config.color}15`, border: `1px solid ${config.color}30`, color: config.color }}>
      <Icon size={10} />
      {config.label}
    </div>
  );
}

function CategoryBadge({ category }: { category: RoadmapCategory }) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${config.color}15`, border: `1px solid ${config.color}30`, color: config.color }}>
      <Icon size={10} />
      {category}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const { items, toggleVote, addItem, updateStatus } = useRoadmapStore();
  const { address, isConnected, connect } = useWallet();
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Filters & Sorting
  const [quarterFilter, setQuarterFilter] = useState<RoadmapQuarter | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<RoadmapCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'votes' | 'quarter' | 'newest'>('quarter');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<RoadmapCategory>('feature');
  const [newQuarter, setNewQuarter] = useState<RoadmapQuarter>('Q1-2027');

  useEffect(() => {
    if (!showAddModal) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddModal]);

  // Stats
  const stats = useMemo(() => ({
    completed: items.filter(i => i.status === 'completed').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    planned: items.filter(i => i.status === 'planned').length,
    totalVotes: items.reduce((acc, i) => acc + i.votes.length, 0),
  }), [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items
      .filter(i => {
        if (quarterFilter !== 'All' && i.quarter !== quarterFilter) return false;
        if (statusFilter !== 'All' && i.status !== statusFilter) return false;
        if (categoryFilter !== 'All' && i.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes.length - a.votes.length;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        // Default: By Quarter
        return QUARTERS.indexOf(a.quarter) - QUARTERS.indexOf(b.quarter);
      });
  }, [items, quarterFilter, statusFilter, categoryFilter, sortBy]);

  // Group by Quarter for Timeline
  const groupedItems = useMemo(() => {
    const groups: Record<RoadmapQuarter, RoadmapItem[]> = {
      'Q1-2026': [], 'Q2-2026': [], 'Q3-2026': [], 'Q4-2026': [], 'Q1-2027': []
    };
    filteredItems.forEach(item => {
      groups[item.quarter].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    
    addItem({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: newDesc,
      status: 'planned',
      quarter: newQuarter,
      votes: [],
      category: newCat,
      createdAt: Date.now(),
    });

    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleSuggest = (title: string, desc: string, cat: RoadmapCategory) => {
    addItem({
      id: Math.random().toString(36).substr(2, 9),
      title,
      description: desc,
      status: 'planned',
      quarter: 'Q4-2026',
      votes: [address!],
      category: cat,
      createdAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050508] text-white pb-20">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#d4af37] mb-4">The Future of Arc</p>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 uppercase">Arc Roadmap</h1>
          <p className="text-[#8a8a9a] text-lg max-w-2xl mx-auto">
            Where we're heading. Vote on what matters to you and help shape the USDC economy.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle} />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} />
          <StatCard label="Planned" value={stats.planned} icon={Circle} />
          <StatCard label="Total Votes" value={stats.totalVotes} icon={ThumbsUp} />
        </div>

        {/* Filters */}
        <div className="grid gap-4 mb-12 items-start bg-white/[0.01] border border-white/[0.05] p-5 sm:p-6 rounded-2xl xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Quarter Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555566] font-bold flex items-center gap-1">
                <Calendar size={10} /> Quarter
              </label>
              <select 
                aria-label="Filter roadmap by quarter"
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value as any)}
                className="min-h-12 w-full bg-[#0d0d12] border border-[#1a1a2e] rounded-lg px-3 py-3 text-xs text-[#8a8a9a] focus:outline-none focus:border-[#d4af37]/50 appearance-none"
              >
                <option value="All">All Quarters</option>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555566] font-bold flex items-center gap-1">
                <Filter size={10} /> Status
              </label>
              <select 
                aria-label="Filter roadmap by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="min-h-12 w-full bg-[#0d0d12] border border-[#1a1a2e] rounded-lg px-3 py-3 text-xs text-[#8a8a9a] focus:outline-none focus:border-[#d4af37]/50 appearance-none"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555566] font-bold flex items-center gap-1">
                <Layers size={10} /> Category
              </label>
              <select 
                aria-label="Filter roadmap by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="min-h-12 w-full bg-[#0d0d12] border border-[#1a1a2e] rounded-lg px-3 py-3 text-xs text-[#8a8a9a] focus:outline-none focus:border-[#d4af37]/50 appearance-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 xl:items-end">
            <label className="text-[9px] uppercase tracking-widest text-[#555566] font-bold flex items-center gap-1">
              <SortAsc size={10} /> Sort By
            </label>
            <div className="flex w-full max-w-full border border-[#1a1a2e] rounded-lg overflow-hidden">
              {(['quarter', 'votes', 'newest'] as const).map((sort) => (
                <button
                  type="button"
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  aria-pressed={sortBy === sort}
                  className={`min-h-11 px-3 sm:px-4 py-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${sortBy === sort ? 'bg-[#d4af37] text-black' : 'bg-[#0d0d12] text-[#555566] hover:text-white'}`}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mb-8 flex justify-end">
            <button 
              type="button"
              onClick={() => setShowAddModal(true)}
              aria-haspopup="dialog"
              aria-expanded={showAddModal}
              aria-controls="roadmap-add-modal"
              className="flex min-h-12 items-center gap-2 bg-[#d4af37] px-6 py-3 font-black text-black rounded-xl hover:scale-105 transition-transform"
            >
              <Plus size={18} /> ADD NEW ITEM
            </button>
          </div>
        )}

        {/* Timeline */}
        {filteredItems.length === 0 ? (
          <div className="mb-12">
            <HubEmptyState
              icon={Layers}
              title="No roadmap items found"
              description="No roadmap items match your current filters. Clear filters to review the full public roadmap."
            >
              <button
                type="button"
                onClick={() => {
                  setQuarterFilter('All');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                  setSortBy('quarter');
                }}
                className="primary-button"
              >
                CLEAR FILTERS
              </button>
            </HubEmptyState>
          </div>
        ) : null}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#d4af37]/50 via-[#2a2a2a] to-transparent hidden md:block" />

          <div className="space-y-24">
            {QUARTERS.map((quarter) => {
              const itemsInQuarter = groupedItems[quarter];
              if (itemsInQuarter.length === 0 && quarterFilter !== 'All') return null;
              if (itemsInQuarter.length === 0 && quarterFilter === 'All') return null; // Skip empty quarters in timeline

              return (
                <div key={quarter} className="relative pl-0 md:pl-16">
                  {/* Quarter Marker */}
                  <div className="absolute left-0 top-[2px] hidden md:flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-[#050508] border-2 border-[#d4af37] flex items-center justify-center z-10">
                      <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-4">
                      {quarter.replace('-', ' ')}
                      <span className="h-[2px] flex-1 bg-[#2a2a2a]" />
                      <span className="text-[#555566] text-xs font-mono font-normal normal-case">
                        {quarter === 'Q1-2026' ? 'Foundation' : quarter === 'Q2-2026' ? 'Expansion' : quarter === 'Q3-2026' ? 'Governance' : 'Maturity'}
                      </span>
                    </h2>
                  </div>

                  <div className="grid gap-6">
                    {itemsInQuarter.map((item) => (
                      <div key={item.id} className="group relative bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:bg-white/[0.04] transition-all hover:border-[#d4af37]/20">
                        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge status={item.status} />
                              <CategoryBadge category={item.category} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-2 group-hover:text-[#d4af37] transition-colors">{item.title}</h3>
                              <p className="text-[#555566] text-sm leading-relaxed max-w-2xl line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => isConnected ? toggleVote(item.id, address!) : connect()}
                              aria-pressed={item.votes.includes(address || '')}
                              aria-label={
                                isConnected
                                  ? item.votes.includes(address || '')
                                    ? `Remove vote from ${item.title}`
                                    : `Vote for ${item.title}`
                                  : `Connect wallet to vote on ${item.title}`
                              }
                              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${item.votes.includes(address || '') ? 'bg-[#d4af37] text-black' : 'bg-[#0d0d12] text-[#8a8a9a] hover:bg-[#2a2a2a]'}`}
                            >
                              <ThumbsUp size={14} />
                              {item.votes.length}
                            </button>
                            {isAdmin && (
                              <div className="relative group/admin">
                                <select 
                                  aria-label={`Update ${item.title} status`}
                                  value={item.status}
                                  onChange={(e) => updateStatus(item.id, e.target.value as RoadmapStatus)}
                                  className="appearance-none bg-[#0d0d12] border border-[#1a1a2e] text-[10px] font-bold uppercase px-4 py-2 rounded-xl text-[#555566] cursor-pointer hover:border-[#d4af37]/50 focus:outline-none"
                                >
                                  {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555566]" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggestion Section */}
        <div className="mt-32">
          <SuggestionForm isConnected={isConnected} onConnect={connect} onSuggest={handleSuggest} />
        </div>
      </div>

      {/* Add Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 bg-black/80 backdrop-blur-sm sm:items-center">
          <div
            id="roadmap-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="roadmap-add-modal-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#1a1a2e] bg-[#0d0d12] p-8"
          >
            <h3 id="roadmap-add-modal-title" className="text-2xl font-black mb-6">ADD ROADMAP ITEM</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#555566] mb-1 block">Title</label>
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50"
                  placeholder="Feature Name"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#555566] mb-1 block">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50 min-h-[100px]"
                  placeholder="Detailed description..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#555566] mb-1 block">Quarter</label>
                  <select 
                    value={newQuarter}
                    onChange={e => setNewQuarter(e.target.value as any)}
                    className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50"
                  >
                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#555566] mb-1 block">Category</label>
                  <select 
                    value={newCat}
                    onChange={e => setNewCat(e.target.value as any)}
                    className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 min-h-12 rounded-xl bg-[#d4af37] py-3 font-black text-black">ADD ITEM</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 min-h-12 rounded-xl bg-white/5 py-3 font-black hover:bg-white/10 transition-colors">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionForm({ 
  isConnected, 
  onConnect, 
  onSuggest 
}: { 
  isConnected: boolean, 
  onConnect: () => void, 
  onSuggest: (t: string, d: string, c: RoadmapCategory) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState<RoadmapCategory>('feature');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;
    onSuggest(title, desc, cat);
    setTitle('');
    setDesc('');
    setExpanded(false);
    alert('Suggestion submitted! It will appear in Q4-2026 once reviewed.');
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden">
      {!expanded ? (
        <button
          type="button"
          onClick={() => isConnected ? setExpanded(true) : onConnect()}
          aria-expanded={expanded}
          aria-controls="roadmap-suggestion-form"
          className="w-full min-h-16 p-8 flex items-center justify-between group hover:bg-white/[0.01] transition-colors"
        >
          <div className="text-left">
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Suggest a feature</h3>
            <p className="text-[#555566] text-sm italic">Share your ideas to help us grow the ecosystem.</p>
          </div>
          <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#d4af37]/50 group-hover:text-[#d4af37] transition-all">
            <Plus size={20} />
          </div>
        </button>
      ) : (
        <div id="roadmap-suggestion-form" className="p-8">
          <h3 className="text-xl font-bold mb-6 uppercase tracking-tight">New Suggestion</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50"
              placeholder="What should we build?"
            />
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-black border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37]/50 min-h-[100px]"
              placeholder="Describe the benefit to the community..."
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                className={`min-h-11 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${cat === c ? 'bg-[#d4af37] border-[#d4af37] text-black' : 'border-white/10 text-[#555566] hover:border-white/20'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 min-h-12 rounded-xl bg-[#d4af37] py-3 font-black text-black">SUBMIT IDEA</button>
              <button type="button" onClick={() => setExpanded(false)} className="flex-1 min-h-12 rounded-xl bg-white/5 py-3 font-black hover:bg-white/10 transition-colors">CANCEL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
