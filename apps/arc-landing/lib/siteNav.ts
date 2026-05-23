import { translations, type Lang } from './translations';

export type SiteNavKey = keyof typeof translations.en.nav;

export type SiteNavLink = {
  href: string;
  key: SiteNavKey;
};

export const PRIMARY_SITE_NAV = [
  { key: 'home', href: '/' },
  { key: 'game', href: '/game' },
  { key: 'market', href: '/market' },
  { key: 'events', href: '/events' },
  { key: 'chat', href: '/chat' },
  { key: 'docs', href: '/#resources' },
] as const satisfies readonly SiteNavLink[];

export const MORE_SITE_NAV = [
  { key: 'roadmap', href: '/roadmap' },
  { key: 'showcase', href: '/showcase' },
  { key: 'jobs', href: '/jobs' },
  { key: 'forum', href: '/forum' },
  { key: 'node', href: '/node' },
  { key: 'race', href: '/race' },
  { key: 'drops', href: '/drops' },
  { key: 'vault', href: '/vault' },
  { key: 'signals', href: '/signals' },
  { key: 'learn', href: '/learn' },
  { key: 'glossary', href: '/glossary' },
  { key: 'faq', href: '/#faq' },
] as const satisfies readonly SiteNavLink[];

export function getSiteNavLabel(lang: Lang, key: SiteNavKey) {
  return translations[lang].nav[key];
}

function normalizeHashHref(href: string) {
  if (href.startsWith('/#')) {
    return href.slice(1);
  }

  return href.startsWith('#') ? href : '';
}

function matchesAnchor(pathname: string, hash: string, href: string) {
  if (pathname !== '/') {
    return false;
  }

  const targetHash = normalizeHashHref(href);
  if (!targetHash) {
    return false;
  }

  return hash === targetHash;
}

function matchesPath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  if (href === pathname) {
    return true;
  }

  return pathname.startsWith(`${href}/`);
}

export function isSiteNavLinkActive(pathname: string, hash: string, href: string) {
  return matchesAnchor(pathname, hash, href) || matchesPath(pathname, href);
}
