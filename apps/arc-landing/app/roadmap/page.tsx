'use client';

import { useState, useMemo } from 'react';
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
        <Icon size={14} className="text-[#c9a84c]" />
        <span className="text-[10px] text-[#555] uppercase tracking-widest font-mono">{label}</span>
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
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#777] hover:text-[#c9a84c] transition-colors">
            <ArrowLeft size={14} /> Arc Ecosystem
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a84c]">// Public Roadmap</span>
          <div className="w-24 flex justify-end">
            {!isConnected ? (
              <button onClick={connect} className="text-[10px] font-bold text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1 rounded-full hover:bg-[#c9a84c]/10">CONNECT</button>
            ) : (
              <span className="text-[10px] text-[#555] font-mono">{address?.slice(0,6)}...{address?.slice(-4)}</span>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a84c] mb-4">The Future of Arc</p>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 uppercase">Arc Roadmap</h1>
          <p className="text-[#9a9a9a] text-lg max-w-2xl mx-auto">
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
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-start lg:items-center justify-between bg-white/[0.01] border border-white/[0.05] p-6 rounded-2xl">
          <div className="flex flex-wrap gap-4">
            {/* Quarter Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold flex items-center gap-1">
                <Calendar size={10} /> Quarter
              </label>
              <select 
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value as any)}
                className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 appearance-none min-w-[120px]"
              >
                <option value="All">All Quarters</option>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold flex items-center gap-1">
                <Filter size={10} /> Status
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 appearance-none min-w-[120px]"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold flex items-center gap-1">
                <Layers size={10} /> Category
              </label>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-[#aaa] focus:outline-none focus:border-[#c9a84c]/50 appearance-none min-w-[120px]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold flex items-center gap-1">
              <SortAsc size={10} /> Sort By
            </label>
            <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden">
              {(['quarter', 'votes', 'newest'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${sortBy === sort ? 'bg-[#c9a84c] text-black' : 'bg-[#111] text-[#777] hover:text-white'}`}
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
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#c9a84c] text-black font-black px-6 py-3 rounded-xl hover:scale-105 transition-transform"
            >
              <Plus size={18} /> ADD NEW ITEM
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#c9a84c]/50 via-[#2a2a2a] to-transparent hidden md:block" />

          <div className="space-y-24">
            {QUARTERS.map((quarter) => {
              const itemsInQuarter = groupedItems[quarter];
              if (itemsInQuarter.length === 0 && quarterFilter !== 'All') return null;
              if (itemsInQuarter.length === 0 && quarterFilter === 'All') return null; // Skip empty quarters in timeline

              return (
                <div key={quarter} className="relative pl-0 md:pl-16">
                  {/* Quarter Marker */}
                  <div className="absolute left-0 top-[2px] hidden md:flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-[#0a0a0a] border-2 border-[#c9a84c] flex items-center justify-center z-10">
                      <div className="h-2 w-2 rounded-full bg-[#c9a84c]" />
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-4">
                      {quarter.replace('-', ' ')}
                      <span className="h-[2px] flex-1 bg-[#2a2a2a]" />
                      <span className="text-[#555] text-xs font-mono font-normal normal-case">
                        {quarter === 'Q1-2026' ? 'Foundation' : quarter === 'Q2-2026' ? 'Expansion' : quarter === 'Q3-2026' ? 'Governance' : 'Maturity'}
                      </span>
                    </h2>
                  </div>

                  <div className="grid gap-6">
                    {itemsInQuarter.map((item) => (
                      <div key={item.id} className="group relative bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:bg-white/[0.04] transition-all hover:border-[#c9a84c]/20">
                        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge status={item.status} />
                              <CategoryBadge category={item.category} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-2 group-hover:text-[#c9a84c] transition-colors">{item.title}</h3>
                              <p className="text-[#777] text-sm leading-relaxed max-w-2xl line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center gap-3">
                            <button 
                              onClick={() => isConnected ? toggleVote(item.id, address!) : connect()}
                              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${item.votes.includes(address || '') ? 'bg-[#c9a84c] text-black' : 'bg-[#1a1a1a] text-[#aaa] hover:bg-[#2a2a2a]'}`}
                            >
                              <ThumbsUp size={14} />
                              {item.votes.length}
                            </button>
                            {isAdmin && (
                              <div className="relative group/admin">
                                <select 
                                  value={item.status}
                                  onChange={(e) => updateStatus(item.id, e.target.value as RoadmapStatus)}
                                  className="appearance-none bg-[#111] border border-[#2a2a2a] text-[10px] font-bold uppercase px-4 py-2 rounded-xl text-[#777] cursor-pointer hover:border-[#c9a84c]/50 focus:outline-none"
                                >
                                  {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-3xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-black mb-6">ADD ROADMAP ITEM</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#555] mb-1 block">Title</label>
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                  placeholder="Feature Name"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#555] mb-1 block">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50 min-h-[100px]"
                  placeholder="Detailed description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#555] mb-1 block">Quarter</label>
                  <select 
                    value={newQuarter}
                    onChange={e => setNewQuarter(e.target.value as any)}
                    className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                  >
                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#555] mb-1 block">Category</label>
                  <select 
                    value={newCat}
                    onChange={e => setNewCat(e.target.value as any)}
                    className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-[#c9a84c] text-black font-black py-3 rounded-xl">ADD ITEM</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 font-black py-3 rounded-xl hover:bg-white/10 transition-colors">CANCEL</button>
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
          onClick={() => isConnected ? setExpanded(true) : onConnect()}
          className="w-full p-8 flex items-center justify-between group hover:bg-white/[0.01] transition-colors"
        >
          <div className="text-left">
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Suggest a feature</h3>
            <p className="text-[#555] text-sm italic">Share your ideas to help us grow the ecosystem.</p>
          </div>
          <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#c9a84c]/50 group-hover:text-[#c9a84c] transition-all">
            <Plus size={20} />
          </div>
        </button>
      ) : (
        <div className="p-8">
          <h3 className="text-xl font-bold mb-6 uppercase tracking-tight">New Suggestion</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50"
              placeholder="What should we build?"
            />
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]/50 min-h-[100px]"
              placeholder="Describe the benefit to the community..."
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${cat === c ? 'bg-[#c9a84c] border-[#c9a84c] text-black' : 'border-white/10 text-[#555] hover:border-white/20'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-[#c9a84c] text-black font-black py-3 rounded-xl">SUBMIT IDEA</button>
              <button type="button" onClick={() => setExpanded(false)} className="flex-1 bg-white/5 font-black py-3 rounded-xl hover:bg-white/10 transition-colors">CANCEL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
