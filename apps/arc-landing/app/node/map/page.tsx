'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Activity,
  ArrowLeft,
  Clock3,
  Globe,
  MapPinned,
  Search,
  SearchX,
  Server,
  SlidersHorizontal,
  RotateCcw,
  Gauge,
  CircleDot,
} from 'lucide-react';
import {
  HubBadge,
  HubCard,
  HubEmptyState,
  HubMetricCard,
  hubInputClass,
  hubLabelClass,
  hubSelectClass,
} from '@/components/HubPrimitives';
import {
  NODE_MAP_REFRESH_MS,
  NODE_MAP_REGIONS,
  NODE_MAP_STATUSES,
  NODE_MAP_VALIDATOR_TYPES,
  filterNodeMapNodes,
  formatNodeLatency,
  formatNodeLastSeen,
  formatNodePulseTimestamp,
  formatNodeUptime,
  getNodeMapStats,
  getNodePosition,
  getNodeRegionLabel,
  getNodeStatusLabel,
  getNodeValidatorTypeLabel,
  sortNodeMapNodes,
  useNodeMapStore,
  type NodeMapRegion,
  type NodeMapStatus,
  type NodeMapValidatorType,
  type OperatorNode,
} from '@/lib/nodeMapStore';

type RegionFilter = 'all' | NodeMapRegion;
type StatusFilter = 'all' | NodeMapStatus;
type ValidatorFilter = 'all' | NodeMapValidatorType;
type SortBy = 'uptime-desc' | 'uptime-asc' | 'latency-asc' | 'latency-desc';

const STATUS_THEME: Record<
  NodeMapStatus,
  { dot: string; halo: string; border: string; text: string; bg: string }
> = {
  online: {
    dot: 'bg-emerald-400',
    halo: 'bg-emerald-400/20',
    border: 'border-emerald-400/25',
    text: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
  },
  degraded: {
    dot: 'bg-amber-400',
    halo: 'bg-amber-400/20',
    border: 'border-amber-400/25',
    text: 'text-amber-300',
    bg: 'bg-amber-400/10',
  },
  offline: {
    dot: 'bg-rose-500',
    halo: 'bg-rose-500/20',
    border: 'border-rose-500/25',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
  },
};

const SORT_LABELS: Record<SortBy, string> = {
  'uptime-desc': 'Uptime high to low',
  'uptime-asc': 'Uptime low to high',
  'latency-asc': 'Latency low to high',
  'latency-desc': 'Latency high to low',
};

function getTooltipStyle(node: OperatorNode): CSSProperties {
  const position = getNodePosition(node);
  const left = Math.min(Math.max(position.x, 14), 86);
  const top = Math.min(Math.max(position.y, 14), 86);
  const isBelow = top < 24;

  return {
    left: `${left}%`,
    top: `${top}%`,
    transform: isBelow ? 'translate(-50%, 12px)' : 'translate(-50%, -112%)',
  };
}

function WorldBackdrop() {
  return (
    <svg
      viewBox="0 0 1000 560"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <pattern id="node-map-grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
        <radialGradient id="node-map-glow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(212, 175, 55,0.15)" />
          <stop offset="55%" stopColor="rgba(212, 175, 55,0.04)" />
          <stop offset="100%" stopColor="rgba(10,10,10,0)" />
        </radialGradient>
      </defs>

      <rect width="1000" height="560" fill="url(#node-map-grid)" />
      <rect width="1000" height="560" fill="url(#node-map-glow)" />

      <g opacity="0.9" fill="#111827" stroke="rgba(255,255,255,0.08)" strokeWidth="2">
        <path d="M74 170 L152 130 L240 142 L300 196 L272 260 L188 252 L126 226 L88 198 Z" />
        <path d="M250 292 L290 306 L314 362 L292 448 L250 428 L236 350 Z" />
        <path d="M432 136 L506 122 L568 148 L548 214 L490 214 L446 176 Z" />
        <path d="M450 226 L520 242 L554 328 L534 430 L482 404 L452 320 Z" />
        <path d="M618 126 L746 120 L862 176 L848 246 L774 260 L724 228 L664 218 Z" />
        <path d="M812 360 L886 370 L918 424 L872 460 L824 436 Z" />
      </g>

      <g opacity="0.22" fill="none" stroke="rgba(212, 175, 55,0.16)" strokeDasharray="10 16">
        <path d="M0 112 H1000" />
        <path d="M0 224 H1000" />
        <path d="M0 336 H1000" />
        <path d="M0 448 H1000" />
        <path d="M120 0 V560" />
        <path d="M280 0 V560" />
        <path d="M440 0 V560" />
        <path d="M600 0 V560" />
        <path d="M760 0 V560" />
        <path d="M920 0 V560" />
      </g>

      <g opacity="0.35">
        <circle cx="132" cy="150" r="4" fill="rgba(255,255,255,0.14)" />
        <circle cx="370" cy="198" r="4" fill="rgba(255,255,255,0.14)" />
        <circle cx="590" cy="154" r="4" fill="rgba(255,255,255,0.14)" />
        <circle cx="836" cy="234" r="4" fill="rgba(255,255,255,0.14)" />
        <circle cx="706" cy="382" r="4" fill="rgba(255,255,255,0.14)" />
      </g>
    </svg>
  );
}

function StatusLegend({
  status,
  label,
}: {
  status: NodeMapStatus;
  label: string;
}) {
  const theme = STATUS_THEME[status];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${theme.border} ${theme.bg} ${theme.text}`}>
      <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden="true" />
      {label}
    </div>
  );
}

export default function NodeOperatorMapPage() {
  const nodes = useNodeMapStore((state) => state.nodes);
  const pulseTick = useNodeMapStore((state) => state.pulseTick);
  const advancePulse = useNodeMapStore((state) => state.advancePulse);

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [validatorType, setValidatorType] = useState<ValidatorFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('uptime-desc');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      advancePulse();
    }, NODE_MAP_REFRESH_MS);

    return () => window.clearInterval(id);
  }, [advancePulse]);

  const stats = useMemo(() => getNodeMapStats(nodes), [nodes]);

  const visibleNodes = useMemo(() => {
    return sortNodeMapNodes(
      filterNodeMapNodes({
        nodes,
        query,
        region,
        status,
        validatorType,
      }),
      sortBy,
    );
  }, [nodes, query, region, status, validatorType, sortBy]);

  useEffect(() => {
    if (visibleNodes.length === 0) {
      setSelectedNodeId(null);
      setHoveredNodeId(null);
      return;
    }

    setSelectedNodeId((current) => {
      if (current && visibleNodes.some((node) => node.id === current)) {
        return current;
      }

      return visibleNodes[0].id;
    });
  }, [visibleNodes]);

  useEffect(() => {
    if (hoveredNodeId && !visibleNodes.some((node) => node.id === hoveredNodeId)) {
      setHoveredNodeId(null);
    }
  }, [hoveredNodeId, visibleNodes]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId) ?? null,
    [visibleNodes, selectedNodeId],
  );
  const hoveredNode = useMemo(
    () => visibleNodes.find((node) => node.id === hoveredNodeId) ?? null,
    [visibleNodes, hoveredNodeId],
  );
  const activeTooltipNode = hoveredNode ?? null;
  const pulseLabel = formatNodePulseTimestamp(pulseTick);
  const hasActiveFilters =
    query.trim().length > 0 || region !== 'all' || status !== 'all' || validatorType !== 'all' || sortBy !== 'uptime-desc';

  const resetFilters = () => {
    setQuery('');
    setRegion('all');
    setStatus('all');
    setValidatorType('all');
    setSortBy('uptime-desc');
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <section className="border-b border-[#1a1a2e]/80 bg-[#050508]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/node"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[#555566] transition-colors hover:text-[#d4af37]"
          >
            <ArrowLeft size={14} />
            Node Hub
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#d4af37]/12 via-[#d4af37]/6 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-5">
              <HubBadge className="border-[#d4af37]/30 bg-[#d4af37]/10 text-[#e9d39c]">NODE MAP</HubBadge>
              <div className="max-w-4xl">
                <h1 className="text-4xl font-black uppercase leading-none sm:text-6xl">
                  Node Operator Map
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-[#8a8a9a] sm:text-lg">
                  See decentralization coverage at a glance with a live mock view of operator uptime,
                  latency, and regional distribution across the Arc network.
                </p>
              </div>
            </div>

            <HubCard className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Activity size={18} />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Live pulse</p>
                  <p className="mt-1 text-2xl font-black">{pulseLabel} UTC</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-[#8a8a9a]">
                  <span>Deterministic local refresh</span>
                  <span>{Math.floor(NODE_MAP_REFRESH_MS / 1000)}s</span>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, index) => {
                    const active = (pulseTick + index) % 8 < 4;
                    return (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full transition-colors ${active ? 'bg-[#d4af37]' : 'bg-white/10'}`}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
                <p className="text-xs leading-6 text-[#555566]">
                  Pulse changes only through the local interval, so the demo remains deterministic
                  without backend polling.
                </p>
              </div>
            </HubCard>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HubMetricCard
              label="Total Nodes"
              value={stats.totalNodes.toLocaleString('en-US')}
              icon={Server}
              className="min-h-[120px]"
            />
            <HubMetricCard
              label="Online %"
              value={`${stats.onlineRate}%`}
              icon={Activity}
              className="min-h-[120px]"
            />
            <HubMetricCard
              label="Avg Uptime"
              value={`${stats.avgUptime.toFixed(2)}%`}
              icon={Clock3}
              className="min-h-[120px]"
            />
            <HubMetricCard
              label="Regions Covered"
              value={stats.regionsCovered.toLocaleString('en-US')}
              icon={Globe}
              className="min-h-[120px]"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
            <div className="space-y-6">
              <HubCard className="!overflow-visible p-0">
                <div className="flex items-center justify-between gap-4 border-b border-[#1a1a2e] px-6 py-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPinned size={16} className="text-[#d4af37]" />
                      <h2 className="text-lg font-black uppercase tracking-[0.16em]">Global coverage</h2>
                    </div>
                    <p className="mt-1 text-sm text-[#555566]">
                      {visibleNodes.length.toLocaleString('en-US')} visible operator
                      {visibleNodes.length === 1 ? '' : 's'} of {stats.totalNodes.toLocaleString('en-US')} total
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <HubBadge>{pulseLabel} UTC</HubBadge>
                    <HubBadge>{SORT_LABELS[sortBy]}</HubBadge>
                  </div>
                </div>

                <div className="relative min-h-[520px]">
                  <WorldBackdrop />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212, 175, 55,0.12),transparent_45%),linear-gradient(180deg,rgba(10,10,10,0.12),rgba(10,10,10,0.45))]" />

                  {visibleNodes.map((node) => {
                    const position = getNodePosition(node);
                    const theme = STATUS_THEME[node.status];
                    const selected = node.id === selectedNodeId;
                    const hovered = node.id === hoveredNodeId;
                    const sizeClass =
                      node.status === 'online'
                        ? 'h-3.5 w-3.5'
                        : node.status === 'degraded'
                          ? 'h-3 w-3'
                          : 'h-2.5 w-2.5';

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                        onFocus={() => setHoveredNodeId(node.id)}
                        onBlur={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                        aria-label={`${node.operatorName} in ${node.city}, ${node.country}. ${getNodeStatusLabel(node.status)} node.`}
                        aria-pressed={selected}
                        className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        style={{ left: `${position.x}%`, top: `${position.y}%` }}
                      >
                        <span
                          className={`absolute inset-[-12px] rounded-full ${theme.halo} blur-md transition-opacity ${node.status === 'online' || hovered ? 'opacity-100' : 'opacity-50'}`}
                          aria-hidden="true"
                        />
                        <span
                          className={`relative block rounded-full border border-black/40 ${theme.dot} ${sizeClass} ${
                            selected ? 'ring-4 ring-[#d4af37]/30' : ''
                          }`}
                        />
                      </button>
                    );
                  })}

                  {activeTooltipNode ? (
                    <div
                      className="pointer-events-none absolute z-30 w-[min(18rem,calc(100%-1rem))]"
                      style={getTooltipStyle(activeTooltipNode)}
                    >
                      <div className="rounded-3xl border border-[#1a1a2e] bg-[#050508]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-white">{activeTooltipNode.operatorName}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#555566]">
                              {activeTooltipNode.city}, {activeTooltipNode.country}
                            </p>
                          </div>
                          <HubBadge className={`${STATUS_THEME[activeTooltipNode.status].bg} ${STATUS_THEME[activeTooltipNode.status].text} ${STATUS_THEME[activeTooltipNode.status].border}`}>
                            {getNodeStatusLabel(activeTooltipNode.status)}
                          </HubBadge>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#555566]">Uptime</p>
                            <p className="mt-1 font-black text-white">{formatNodeUptime(activeTooltipNode.uptime)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#555566]">Latency</p>
                            <p className="mt-1 font-black text-white">{formatNodeLatency(activeTooltipNode.avgLatencyMs)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#555566]">Region</p>
                            <p className="mt-1 font-black text-white">{getNodeRegionLabel(activeTooltipNode.region)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#555566]">Validator</p>
                            <p className="mt-1 font-black text-white">{getNodeValidatorTypeLabel(activeTooltipNode.validatorType)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[#1a1a2e] px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusLegend status="online" label="Online" />
                    <StatusLegend status="degraded" label="Degraded" />
                    <StatusLegend status="offline" label="Offline" />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#555566]">
                    Hover or focus a node point for quick details. Click to pin the selection in the
                    side panel.
                  </p>
                </div>
              </HubCard>

              <div className="grid gap-6 xl:grid-cols-2">
                <HubCard className="p-6">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-[#d4af37]" />
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
                      Selected operator
                    </h3>
                  </div>

                  {selectedNode ? (
                    <div className="mt-5 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="text-2xl font-black">{selectedNode.operatorName}</h4>
                          <p className="mt-2 text-sm text-[#8a8a9a]">
                            {selectedNode.city}, {selectedNode.country} · {getNodeRegionLabel(selectedNode.region)}
                          </p>
                        </div>
                        <HubBadge
                          className={`${STATUS_THEME[selectedNode.status].bg} ${STATUS_THEME[selectedNode.status].text} ${STATUS_THEME[selectedNode.status].border}`}
                        >
                          {getNodeStatusLabel(selectedNode.status)}
                        </HubBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Validator</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {getNodeValidatorTypeLabel(selectedNode.validatorType)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Last seen</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {formatNodeLastSeen(selectedNode.lastSeenAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Uptime</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {formatNodeUptime(selectedNode.uptime)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Latency</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {formatNodeLatency(selectedNode.avgLatencyMs)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Blocks produced</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {selectedNode.blocksProduced.toLocaleString('en-US')}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] p-4">
                          <p className={hubLabelClass}>Coordinates</p>
                          <p className="mt-2 text-sm font-black text-white">
                            {selectedNode.lat.toFixed(2)}, {selectedNode.lng.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-[#1a1a2e] bg-white/[0.015] p-6 text-sm text-[#555566]">
                      Select an operator on the map or from the list to pin their live details here.
                    </div>
                  )}
                </HubCard>

                <HubCard className="p-6">
                  <div className="flex items-center gap-2">
                    <CircleDot size={16} className="text-[#d4af37]" />
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
                      Map notes
                    </h3>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm leading-7 text-[#8a8a9a]">
                    <li className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      This view is a mock visualization and does not rely on backend map tiles or
                      geospatial services.
                    </li>
                    <li className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      Node markers are color-coded by status and can be navigated with keyboard focus.
                    </li>
                    <li className="rounded-2xl border border-[#1a1a2e] bg-white/[0.02] px-4 py-3">
                      Filters and sorting only affect local mock state, so the interaction stays fast and
                      deterministic.
                    </li>
                  </ul>
                </HubCard>
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <HubCard className="p-6">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-[#d4af37]" />
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
                    Search and filters
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="node-map-search" className={hubLabelClass}>
                      Search nodes
                    </label>
                    <input
                      id="node-map-search"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Operator, city, country, validator"
                      className={`${hubInputClass} mt-2 w-full`}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="node-map-region" className={hubLabelClass}>
                        Region
                      </label>
                      <select
                        id="node-map-region"
                        value={region}
                        onChange={(event) => setRegion(event.target.value as RegionFilter)}
                        className={`${hubSelectClass} mt-2 w-full`}
                      >
                        <option value="all" className="bg-[#050508]">
                          All regions
                        </option>
                        {NODE_MAP_REGIONS.map((item) => (
                          <option key={item} value={item} className="bg-[#050508]">
                            {getNodeRegionLabel(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="node-map-status" className={hubLabelClass}>
                        Status
                      </label>
                      <select
                        id="node-map-status"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as StatusFilter)}
                        className={`${hubSelectClass} mt-2 w-full`}
                      >
                        <option value="all" className="bg-[#050508]">
                          All statuses
                        </option>
                        {NODE_MAP_STATUSES.map((item) => (
                          <option key={item} value={item} className="bg-[#050508]">
                            {getNodeStatusLabel(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="node-map-validator" className={hubLabelClass}>
                        Validator type
                      </label>
                      <select
                        id="node-map-validator"
                        value={validatorType}
                        onChange={(event) => setValidatorType(event.target.value as ValidatorFilter)}
                        className={`${hubSelectClass} mt-2 w-full`}
                      >
                        <option value="all" className="bg-[#050508]">
                          All types
                        </option>
                        {NODE_MAP_VALIDATOR_TYPES.map((item) => (
                          <option key={item} value={item} className="bg-[#050508]">
                            {getNodeValidatorTypeLabel(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="node-map-sort" className={hubLabelClass}>
                        Sort by
                      </label>
                      <select
                        id="node-map-sort"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as SortBy)}
                        className={`${hubSelectClass} mt-2 w-full`}
                      >
                        <option value="uptime-desc" className="bg-[#050508]">
                          Uptime high to low
                        </option>
                        <option value="uptime-asc" className="bg-[#050508]">
                          Uptime low to high
                        </option>
                        <option value="latency-asc" className="bg-[#050508]">
                          Latency low to high
                        </option>
                        <option value="latency-desc" className="bg-[#050508]">
                          Latency high to low
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#1a1a2e] bg-white/[0.03] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/40 hover:bg-[#d4af37]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <RotateCcw size={14} />
                      Reset filters
                    </button>
                    <HubBadge>{hasActiveFilters ? 'Filtered view' : 'Full fleet'}</HubBadge>
                  </div>
                </div>
              </HubCard>

              <HubCard className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-[#d4af37]" />
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#d4af37]">
                      Node list
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">
                    {visibleNodes.length.toLocaleString('en-US')} shown
                  </span>
                </div>

                {visibleNodes.length === 0 ? (
                  <HubEmptyState
                    className="mt-5 p-6"
                    icon={SearchX}
                    title="No nodes match these filters"
                    description="Clear one or more filters to bring operators back into view."
                  >
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#1a1a2e] bg-white/[0.03] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-[#d4af37]/40 hover:bg-[#d4af37]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <RotateCcw size={14} />
                      Clear filters
                    </button>
                  </HubEmptyState>
                ) : (
                  <div className="mt-5 max-h-[560px] space-y-2 overflow-y-auto pr-1">
                    {visibleNodes.map((node, index) => {
                      const selected = node.id === selectedNodeId;
                      const theme = STATUS_THEME[node.status];

                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                          onFocus={() => setHoveredNodeId(node.id)}
                          onBlur={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                          aria-pressed={selected}
                          className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                            selected
                              ? 'border-[#d4af37]/40 bg-[#d4af37]/8'
                              : 'border-[#1a1a2e] bg-white/[0.02] hover:border-[#d4af37]/30 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} aria-hidden="true" />
                                <span className="font-black text-white">{node.operatorName}</span>
                              </div>
                              <p className="mt-2 text-sm text-[#8a8a9a]">
                                {node.city}, {node.country} · {getNodeRegionLabel(node.region)}
                              </p>
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#555566]">
                              #{String(index + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <HubBadge className={`${theme.bg} ${theme.text} ${theme.border}`}>
                              {getNodeStatusLabel(node.status)}
                            </HubBadge>
                            <HubBadge>{getNodeValidatorTypeLabel(node.validatorType)}</HubBadge>
                            <HubBadge>{formatNodeUptime(node.uptime)}</HubBadge>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#8a8a9a]">
                            <div>
                              <p className={hubLabelClass}>Latency</p>
                              <p className="mt-1 font-black text-white">{formatNodeLatency(node.avgLatencyMs)}</p>
                            </div>
                            <div>
                              <p className={hubLabelClass}>Last seen</p>
                              <p className="mt-1 font-black text-white">{formatNodeLastSeen(node.lastSeenAt)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </HubCard>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
