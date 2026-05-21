export type ArcAppKey = 'pay' | 'creator' | 'play' | 'market' | 'hub';

const ARC_APP_ENV_KEYS: Record<ArcAppKey, string> = {
  pay: 'NEXT_PUBLIC_ARC_PAY_URL',
  creator: 'NEXT_PUBLIC_ARC_CREATOR_URL',
  play: 'NEXT_PUBLIC_ARC_PLAY_URL',
  market: 'NEXT_PUBLIC_ARC_MARKET_URL',
  hub: 'NEXT_PUBLIC_ARC_HUB_URL',
};

const LOCAL_FALLBACKS: Record<ArcAppKey, string> = {
  pay: 'https://arc-payouts.vercel.app',
  creator: 'http://localhost:3001',
  play: 'http://localhost:3002',
  market: 'http://localhost:3003/market',
  hub: 'http://localhost:3003',
};

function normalizeConfiguredUrl(rawUrl: string | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    const path = trimmed.replace(/\/+$/, '');
    return path || '/';
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getArcAppBaseUrl(app: ArcAppKey): string | null {
  const configured = normalizeConfiguredUrl(process.env[ARC_APP_ENV_KEYS[app]]);
  return configured || normalizeConfiguredUrl(LOCAL_FALLBACKS[app]);
}

export function getArcAppUrl(app: ArcAppKey, path = ''): string | null {
  const base = getArcAppBaseUrl(app);
  if (!base) {
    return null;
  }

  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${base}${suffix}`;
}

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
