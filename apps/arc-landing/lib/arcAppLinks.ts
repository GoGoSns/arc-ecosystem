export type ArcAppKey = 'pay' | 'creator' | 'play';

const ARC_APP_ENV_KEYS: Record<ArcAppKey, string> = {
  pay: 'NEXT_PUBLIC_ARC_PAY_URL',
  creator: 'NEXT_PUBLIC_ARC_CREATOR_URL',
  play: 'NEXT_PUBLIC_ARC_PLAY_URL',
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
  return normalizeConfiguredUrl(process.env[ARC_APP_ENV_KEYS[app]]);
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
