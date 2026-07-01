export type ArcAppKey = 'pay' | 'creator' | 'play' | 'market' | 'hub';

const PRODUCTION_DOMAINS: Record<ArcAppKey, string> = {
  pay: 'https://arcpaymain.vercel.app',
  creator: 'https://arccreatorhub.vercel.app',
  play: 'https://arcarcade.vercel.app',
  market: 'https://arcarcade.vercel.app/market',
  hub: 'https://arcecosystemmain.vercel.app',
};

export function getArcAppUrl(app: ArcAppKey, path: string = ''): string {
  return `${PRODUCTION_DOMAINS[app]}${path}`;
}

export function isExternalUrl(url: string): boolean {
  return true;
}
