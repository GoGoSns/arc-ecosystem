import { create } from 'zustand';

export type NodeMapRegion = 'Europe' | 'Turkey' | 'US' | 'LATAM' | 'MENA' | 'APAC';
export type NodeMapStatus = 'online' | 'degraded' | 'offline';
export type NodeMapValidatorType = 'community' | 'partner' | 'core';

export const NODE_MAP_REGIONS = ['Europe', 'Turkey', 'US', 'LATAM', 'MENA', 'APAC'] as const;
export const NODE_MAP_STATUSES = ['online', 'degraded', 'offline'] as const;
export const NODE_MAP_VALIDATOR_TYPES = ['community', 'partner', 'core'] as const;

export interface OperatorNode {
  id: string;
  operatorName: string;
  region: NodeMapRegion;
  country: string;
  city: string;
  lat: number;
  lng: number;
  uptime: number;
  status: NodeMapStatus;
  validatorType: NodeMapValidatorType;
  lastSeenAt: number;
  blocksProduced: number;
  avgLatencyMs: number;
}

export const NODE_MAP_REFERENCE_NOW = Date.parse('2026-05-13T12:00:00Z');
export const NODE_MAP_REFRESH_MS = 15_000;

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

function seedNode(
  node: Omit<OperatorNode, 'lastSeenAt'> & { lastSeenOffsetMs: number },
): OperatorNode {
  return {
    ...node,
    uptime: Math.max(0, Math.min(100, Math.round(node.uptime * 100) / 100)),
    lastSeenAt: NODE_MAP_REFERENCE_NOW - node.lastSeenOffsetMs,
  };
}

export const NODE_REGION_LABELS: Record<NodeMapRegion, string> = {
  Europe: 'Europe',
  Turkey: 'Turkey',
  US: 'United States',
  LATAM: 'LATAM',
  MENA: 'MENA',
  APAC: 'APAC',
};

export const NODE_STATUS_LABELS: Record<NodeMapStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
};

export const NODE_VALIDATOR_TYPE_LABELS: Record<NodeMapValidatorType, string> = {
  community: 'Community',
  partner: 'Partner',
  core: 'Core',
};

const INITIAL_NODES: OperatorNode[] = [
  seedNode({
    id: 'node-berlin-aurora-relay',
    operatorName: 'Aurora Relay',
    region: 'Europe',
    country: 'Germany',
    city: 'Berlin',
    lat: 52.52,
    lng: 13.405,
    uptime: 99.96,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 4 * MINUTE_MS,
    blocksProduced: 124_532,
    avgLatencyMs: 28,
  }),
  seedNode({
    id: 'node-amsterdam-canal-node',
    operatorName: 'Canal Node',
    region: 'Europe',
    country: 'Netherlands',
    city: 'Amsterdam',
    lat: 52.3676,
    lng: 4.9041,
    uptime: 99.91,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 6 * MINUTE_MS,
    blocksProduced: 112_345,
    avgLatencyMs: 31,
  }),
  seedNode({
    id: 'node-paris-lumiere-stack',
    operatorName: 'Lumiere Stack',
    region: 'Europe',
    country: 'France',
    city: 'Paris',
    lat: 48.8566,
    lng: 2.3522,
    uptime: 98.74,
    status: 'degraded',
    validatorType: 'community',
    lastSeenOffsetMs: 18 * MINUTE_MS,
    blocksProduced: 108_765,
    avgLatencyMs: 44,
  }),
  seedNode({
    id: 'node-madrid-iberia-core',
    operatorName: 'Iberia Core',
    region: 'Europe',
    country: 'Spain',
    city: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    uptime: 99.88,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 2 * MINUTE_MS,
    blocksProduced: 134_210,
    avgLatencyMs: 39,
  }),
  seedNode({
    id: 'node-warsaw-vistula-validator',
    operatorName: 'Vistula Validator',
    region: 'Europe',
    country: 'Poland',
    city: 'Warsaw',
    lat: 52.2297,
    lng: 21.0122,
    uptime: 97.6,
    status: 'offline',
    validatorType: 'partner',
    lastSeenOffsetMs: 4 * HOUR_MS,
    blocksProduced: 91_234,
    avgLatencyMs: 49,
  }),
  seedNode({
    id: 'node-istanbul-bosphorus-one',
    operatorName: 'Bosphorus One',
    region: 'Turkey',
    country: 'Turkey',
    city: 'Istanbul',
    lat: 41.0082,
    lng: 28.9784,
    uptime: 99.94,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 1 * MINUTE_MS,
    blocksProduced: 152_890,
    avgLatencyMs: 24,
  }),
  seedNode({
    id: 'node-ankara-anatolia-relay',
    operatorName: 'Anatolia Relay',
    region: 'Turkey',
    country: 'Turkey',
    city: 'Ankara',
    lat: 39.9334,
    lng: 32.8597,
    uptime: 98.12,
    status: 'degraded',
    validatorType: 'partner',
    lastSeenOffsetMs: 32 * MINUTE_MS,
    blocksProduced: 131_004,
    avgLatencyMs: 27,
  }),
  seedNode({
    id: 'node-izmir-aegean-stack',
    operatorName: 'Aegean Stack',
    region: 'Turkey',
    country: 'Turkey',
    city: 'Izmir',
    lat: 38.4237,
    lng: 27.1428,
    uptime: 99.67,
    status: 'online',
    validatorType: 'community',
    lastSeenOffsetMs: 5 * MINUTE_MS,
    blocksProduced: 87_450,
    avgLatencyMs: 22,
  }),
  seedNode({
    id: 'node-antalya-taurus-node',
    operatorName: 'Taurus Node',
    region: 'Turkey',
    country: 'Turkey',
    city: 'Antalya',
    lat: 36.8969,
    lng: 30.7133,
    uptime: 96.4,
    status: 'offline',
    validatorType: 'community',
    lastSeenOffsetMs: 4 * HOUR_MS,
    blocksProduced: 76_450,
    avgLatencyMs: 35,
  }),
  seedNode({
    id: 'node-bursa-marmara-edge',
    operatorName: 'Marmara Edge',
    region: 'Turkey',
    country: 'Turkey',
    city: 'Bursa',
    lat: 40.195,
    lng: 29.060,
    uptime: 99.8,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 3 * MINUTE_MS,
    blocksProduced: 102_300,
    avgLatencyMs: 26,
  }),
  seedNode({
    id: 'node-virginia-east-coast-prime',
    operatorName: 'East Coast Prime',
    region: 'US',
    country: 'United States',
    city: 'Ashburn',
    lat: 39.0438,
    lng: -77.4874,
    uptime: 99.97,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 1 * MINUTE_MS,
    blocksProduced: 250_001,
    avgLatencyMs: 18,
  }),
  seedNode({
    id: 'node-oregon-pacific-relay',
    operatorName: 'Pacific Relay',
    region: 'US',
    country: 'United States',
    city: 'Hillsboro',
    lat: 45.52,
    lng: -122.9898,
    uptime: 99.89,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 8 * MINUTE_MS,
    blocksProduced: 211_450,
    avgLatencyMs: 34,
  }),
  seedNode({
    id: 'node-texas-lone-star-node',
    operatorName: 'Lone Star Node',
    region: 'US',
    country: 'United States',
    city: 'Dallas',
    lat: 32.7767,
    lng: -96.797,
    uptime: 98.44,
    status: 'degraded',
    validatorType: 'community',
    lastSeenOffsetMs: 25 * MINUTE_MS,
    blocksProduced: 186_300,
    avgLatencyMs: 40,
  }),
  seedNode({
    id: 'node-illinois-chicago-mesh',
    operatorName: 'Chicago Mesh',
    region: 'US',
    country: 'United States',
    city: 'Chicago',
    lat: 41.8781,
    lng: -87.6298,
    uptime: 99.73,
    status: 'online',
    validatorType: 'community',
    lastSeenOffsetMs: 4 * MINUTE_MS,
    blocksProduced: 167_890,
    avgLatencyMs: 29,
  }),
  seedNode({
    id: 'node-california-golden-gate-validator',
    operatorName: 'Golden Gate Validator',
    region: 'US',
    country: 'United States',
    city: 'San Francisco',
    lat: 37.7749,
    lng: -122.4194,
    uptime: 95.85,
    status: 'offline',
    validatorType: 'core',
    lastSeenOffsetMs: 6 * HOUR_MS,
    blocksProduced: 145_500,
    avgLatencyMs: 36,
  }),
  seedNode({
    id: 'node-sao-paulo-samba-relay',
    operatorName: 'Samba Relay',
    region: 'LATAM',
    country: 'Brazil',
    city: 'Sao Paulo',
    lat: -23.5505,
    lng: -46.6333,
    uptime: 99.7,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 7 * MINUTE_MS,
    blocksProduced: 138_430,
    avgLatencyMs: 57,
  }),
  seedNode({
    id: 'node-buenos-aires-rio-node',
    operatorName: 'Rio Node',
    region: 'LATAM',
    country: 'Argentina',
    city: 'Buenos Aires',
    lat: -34.6037,
    lng: -58.3816,
    uptime: 97.88,
    status: 'degraded',
    validatorType: 'community',
    lastSeenOffsetMs: 41 * MINUTE_MS,
    blocksProduced: 92_340,
    avgLatencyMs: 61,
  }),
  seedNode({
    id: 'node-santiago-andes-core',
    operatorName: 'Andes Core',
    region: 'LATAM',
    country: 'Chile',
    city: 'Santiago',
    lat: -33.4489,
    lng: -70.6693,
    uptime: 99.82,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 2 * MINUTE_MS,
    blocksProduced: 110_220,
    avgLatencyMs: 54,
  }),
  seedNode({
    id: 'node-bogota-caribe-stack',
    operatorName: 'Caribe Stack',
    region: 'LATAM',
    country: 'Colombia',
    city: 'Bogota',
    lat: 4.711,
    lng: -74.0721,
    uptime: 99.21,
    status: 'online',
    validatorType: 'community',
    lastSeenOffsetMs: 9 * MINUTE_MS,
    blocksProduced: 100_500,
    avgLatencyMs: 66,
  }),
  seedNode({
    id: 'node-mexico-city-aztec-validator',
    operatorName: 'Aztec Validator',
    region: 'LATAM',
    country: 'Mexico',
    city: 'Mexico City',
    lat: 19.4326,
    lng: -99.1332,
    uptime: 94.75,
    status: 'offline',
    validatorType: 'partner',
    lastSeenOffsetMs: 8 * HOUR_MS,
    blocksProduced: 121_340,
    avgLatencyMs: 52,
  }),
  seedNode({
    id: 'node-dubai-desert-prime',
    operatorName: 'Desert Prime',
    region: 'MENA',
    country: 'United Arab Emirates',
    city: 'Dubai',
    lat: 25.2048,
    lng: 55.2708,
    uptime: 99.95,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 1 * MINUTE_MS,
    blocksProduced: 220_450,
    avgLatencyMs: 21,
  }),
  seedNode({
    id: 'node-abu-dhabi-pearl-relay',
    operatorName: 'Pearl Relay',
    region: 'MENA',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    lat: 24.4539,
    lng: 54.3773,
    uptime: 99.9,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 4 * MINUTE_MS,
    blocksProduced: 204_120,
    avgLatencyMs: 23,
  }),
  seedNode({
    id: 'node-riyadh-najd-node',
    operatorName: 'Najd Node',
    region: 'MENA',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    lat: 24.7136,
    lng: 46.6753,
    uptime: 98.3,
    status: 'degraded',
    validatorType: 'community',
    lastSeenOffsetMs: 16 * MINUTE_MS,
    blocksProduced: 174_560,
    avgLatencyMs: 28,
  }),
  seedNode({
    id: 'node-doha-gulf-mesh',
    operatorName: 'Gulf Mesh',
    region: 'MENA',
    country: 'Qatar',
    city: 'Doha',
    lat: 25.2854,
    lng: 51.531,
    uptime: 99.58,
    status: 'online',
    validatorType: 'community',
    lastSeenOffsetMs: 3 * MINUTE_MS,
    blocksProduced: 132_880,
    avgLatencyMs: 25,
  }),
  seedNode({
    id: 'node-cairo-nile-validator',
    operatorName: 'Nile Validator',
    region: 'MENA',
    country: 'Egypt',
    city: 'Cairo',
    lat: 30.0444,
    lng: 31.2357,
    uptime: 96.2,
    status: 'offline',
    validatorType: 'partner',
    lastSeenOffsetMs: 10 * HOUR_MS,
    blocksProduced: 118_700,
    avgLatencyMs: 32,
  }),
  seedNode({
    id: 'node-singapore-marina-core',
    operatorName: 'Marina Core',
    region: 'APAC',
    country: 'Singapore',
    city: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    uptime: 99.98,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 1 * MINUTE_MS,
    blocksProduced: 260_010,
    avgLatencyMs: 44,
  }),
  seedNode({
    id: 'node-tokyo-shibuya-relay',
    operatorName: 'Shibuya Relay',
    region: 'APAC',
    country: 'Japan',
    city: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    uptime: 99.93,
    status: 'online',
    validatorType: 'partner',
    lastSeenOffsetMs: 2 * MINUTE_MS,
    blocksProduced: 230_220,
    avgLatencyMs: 63,
  }),
  seedNode({
    id: 'node-seoul-han-river-node',
    operatorName: 'Han River Node',
    region: 'APAC',
    country: 'South Korea',
    city: 'Seoul',
    lat: 37.5665,
    lng: 126.978,
    uptime: 98.69,
    status: 'degraded',
    validatorType: 'community',
    lastSeenOffsetMs: 23 * MINUTE_MS,
    blocksProduced: 198_330,
    avgLatencyMs: 58,
  }),
  seedNode({
    id: 'node-sydney-harbour-validator',
    operatorName: 'Harbour Validator',
    region: 'APAC',
    country: 'Australia',
    city: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    uptime: 99.84,
    status: 'online',
    validatorType: 'core',
    lastSeenOffsetMs: 4 * MINUTE_MS,
    blocksProduced: 164_920,
    avgLatencyMs: 78,
  }),
  seedNode({
    id: 'node-mumbai-monsoon-mesh',
    operatorName: 'Monsoon Mesh',
    region: 'APAC',
    country: 'India',
    city: 'Mumbai',
    lat: 19.076,
    lng: 72.8777,
    uptime: 95.1,
    status: 'offline',
    validatorType: 'community',
    lastSeenOffsetMs: 7 * HOUR_MS,
    blocksProduced: 147_700,
    avgLatencyMs: 73,
  }),
];

export function formatNodeUptime(uptime: number): string {
  return `${Math.max(0, Math.min(100, uptime)).toFixed(2)}%`;
}

export function formatNodeLatency(ms: number): string {
  return `${Math.max(0, Math.round(ms)).toLocaleString('en-US')} ms`;
}

function formatRelativeDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

export function formatNodeLastSeen(lastSeenAt: number, now = NODE_MAP_REFERENCE_NOW): string {
  const diff = now - lastSeenAt;

  if (diff <= 30_000) {
    return 'just now';
  }

  return `${formatRelativeDuration(diff)} ago`;
}

export function getNodeStatusLabel(status: NodeMapStatus): string {
  return NODE_STATUS_LABELS[status];
}

export function getNodeStatusTone(status: NodeMapStatus): 'emerald' | 'amber' | 'red' {
  switch (status) {
    case 'online':
      return 'emerald';
    case 'degraded':
      return 'amber';
    case 'offline':
    default:
      return 'red';
  }
}

export function getNodeRegionLabel(region: NodeMapRegion): string {
  return NODE_REGION_LABELS[region];
}

export function getNodeValidatorTypeLabel(type: NodeMapValidatorType): string {
  return NODE_VALIDATOR_TYPE_LABELS[type];
}

export function getNodePosition(node: Pick<OperatorNode, 'lat' | 'lng'>): { x: number; y: number } {
  return {
    x: ((node.lng + 180) / 360) * 100,
    y: ((90 - node.lat) / 180) * 100,
  };
}

export interface NodeMapStore {
  nodes: OperatorNode[];
  pulseTick: number;
  advancePulse: () => void;
}

export const useNodeMapStore = create<NodeMapStore>()((set) => ({
  nodes: INITIAL_NODES,
  pulseTick: 0,
  advancePulse: () => set((state) => ({ pulseTick: state.pulseTick + 1 })),
}));

export function getNodeMapStats(nodes: OperatorNode[]): {
  totalNodes: number;
  onlineRate: number;
  avgUptime: number;
  regionsCovered: number;
} {
  const totalNodes = nodes.length;
  const onlineRate =
    totalNodes === 0
      ? 0
      : Math.round((nodes.filter((node) => node.status === 'online').length / totalNodes) * 100);
  const avgUptime =
    totalNodes === 0
      ? 0
      : Math.round((nodes.reduce((sum, node) => sum + node.uptime, 0) / totalNodes) * 100) / 100;
  const regionsCovered = new Set(nodes.map((node) => node.region)).size;

  return { totalNodes, onlineRate, avgUptime, regionsCovered };
}

export function filterNodeMapNodes({
  nodes,
  query,
  region,
  status,
  validatorType,
}: {
  nodes: OperatorNode[];
  query: string;
  region: 'all' | NodeMapRegion;
  status: 'all' | NodeMapStatus;
  validatorType: 'all' | NodeMapValidatorType;
}): OperatorNode[] {
  const normalizedQuery = query.trim().toLowerCase();

  return [...nodes]
    .filter((node) => {
      if (region !== 'all' && node.region !== region) {
        return false;
      }

      if (status !== 'all' && node.status !== status) {
        return false;
      }

      if (validatorType !== 'all' && node.validatorType !== validatorType) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        node.operatorName,
        node.region,
        node.country,
        node.city,
        node.status,
        node.validatorType,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
}

export function sortNodeMapNodes(
  nodes: OperatorNode[],
  sortBy: 'uptime-desc' | 'uptime-asc' | 'latency-asc' | 'latency-desc',
): OperatorNode[] {
  return [...nodes].sort((a, b) => {
    switch (sortBy) {
      case 'uptime-asc':
        return a.uptime - b.uptime || a.avgLatencyMs - b.avgLatencyMs;
      case 'latency-asc':
        return a.avgLatencyMs - b.avgLatencyMs || b.uptime - a.uptime;
      case 'latency-desc':
        return b.avgLatencyMs - a.avgLatencyMs || b.uptime - a.uptime;
      case 'uptime-desc':
      default:
        return b.uptime - a.uptime || a.avgLatencyMs - b.avgLatencyMs;
    }
  });
}

export function formatNodePulseTimestamp(pulseTick: number): string {
  const timestamp = NODE_MAP_REFERENCE_NOW + pulseTick * NODE_MAP_REFRESH_MS;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}
