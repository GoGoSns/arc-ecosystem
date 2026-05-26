'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import AppSwitcher from './AppSwitcher';
import BrandLogo from './BrandLogo';
import LanguageToggle from './LanguageToggle';
import {
  getSiteNavLabel,
  isSiteNavLinkActive,
  MORE_SITE_NAV,
  PRIMARY_SITE_NAV,
  type SiteNavLink,
} from '@/lib/siteNav';
import { translations, type Lang } from '@/lib/translations';

type Props = {
  currentLang?: Lang;
  onLangChange?: (lang: Lang) => void;
  launchHref?: string;
  className?: string;
};

function useSiteLanguage(controlledLang?: Lang, onLangChange?: (lang: Lang) => void) {
  const [internalLang, setInternalLang] = useState<Lang>('en');

  useEffect(() => {
    if (controlledLang) {
      return;
    }

    const saved = localStorage.getItem('arc-lang') as Lang | null;
    if (saved === 'en' || saved === 'tr') {
      setInternalLang(saved);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('tr')) {
      setInternalLang('tr');
    }
  }, [controlledLang]);

  const lang = controlledLang ?? internalLang;

  const setLang = (nextLang: Lang) => {
    if (onLangChange) {
      onLangChange(nextLang);
      return;
    }

    setInternalLang(nextLang);
    localStorage.setItem('arc-lang', nextLang);
  };

  return [lang, setLang] as const;
}

export default function SiteHeader({
  currentLang,
  onLangChange,
  launchHref = '/#apps',
  className = '',
}: Props) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lang, setLang] = useSiteLanguage(currentLang, onLangChange);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener('hashchange', syncHash);

    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setHash(window.location.hash);
    setMoreOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen || typeof window === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  const t = translations[lang];
  const desktopSecondaryActive = MORE_SITE_NAV.some((link) => isSiteNavLinkActive(pathname, hash, link.href));

  const renderLink = (link: SiteNavLink, compact = false) => {
    const active = isSiteNavLinkActive(pathname, hash, link.href);
    const label = getSiteNavLabel(lang, link.key);

    return (
      <Link
        key={link.href}
        href={link.href}
        data-active={active ? 'true' : undefined}
        aria-current={active ? 'page' : undefined}
        className={compact ? 'site-nav-drawer-link' : 'site-nav-link'}
        onClick={() => {
          setMoreOpen(false);
          setMenuOpen(false);
        }}
      >
        <span>{label}</span>
        {compact ? <ChevronDown size={14} className="rotate-[-90deg]" aria-hidden="true" /> : null}
      </Link>
    );
  };

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 border-b border-[#1a1a2e]/80 bg-[#050508]/90 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex h-16 max-w-[1920px] items-center px-4 sm:px-6 lg:grid lg:grid-cols-[240px_1fr_auto] lg:items-center lg:px-8 xl:grid-cols-[280px_1fr_auto]">
        <div className="flex items-center justify-start">
          <BrandLogo href="/" decorative className="shrink-0" />
        </div>

        <div className="hidden min-w-0 items-center justify-center gap-1.5 lg:flex xl:gap-2" aria-label="Primary navigation">
          <div className="flex items-center gap-1 xl:gap-2">
            {PRIMARY_SITE_NAV.slice(0, 5).map((link) => renderLink(link))}
          </div>

          <div ref={moreMenuRef} className="relative ml-1">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-controls="site-header-more-menu"
              data-active={moreOpen || desktopSecondaryActive ? 'true' : undefined}
              className="site-nav-link"
              onClick={() => setMoreOpen((value) => !value)}
            >
              <span>{t.nav.more}</span>
              <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {moreOpen ? (
              <div
                id="site-header-more-menu"
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-3 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-[#1a1a2e] bg-[#0d0d12] p-4 shadow-2xl"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {MORE_SITE_NAV.map((link) => (
                    <div key={link.href} role="none">
                      {renderLink(link, true)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            <LanguageToggle currentLang={lang} onChange={setLang} compact />
            <AppSwitcher compact />
            <Link 
              href={launchHref} 
              className="bracket-button shrink-0 px-3 py-2 text-[10px] sm:px-4 sm:py-3 sm:text-xs focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {t.nav.launch}
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageToggle currentLang={lang} onChange={setLang} compact />
            <Link href={launchHref} className="bracket-button shrink-0 px-3 py-2 text-[10px]">
              {t.nav.launch}
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="site-header-mobile-drawer"
              aria-haspopup="dialog"
              className="grid h-10 w-10 place-items-center border border-[#1a1a2e] text-[#d4af37] transition-colors hover:border-[#d4af37]/60"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className="site-nav-drawer lg:hidden" aria-hidden={!menuOpen}>
          <button
            type="button"
            aria-label="Close navigation drawer"
            className="site-nav-drawer-backdrop"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="site-header-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-header-mobile-title"
            className="site-nav-drawer-panel ml-auto flex h-full w-[min(100vw,24rem)] flex-col"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#1a1a2e] px-5 py-4">
              <div className="min-w-0">
                <h2 id="site-header-mobile-title" className="mt-1 text-lg font-bold text-white">
                  Navigation
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close navigation drawer"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#1a1a2e] text-[#d4af37] transition-colors hover:border-[#d4af37]/60"
                onClick={() => setMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Controls</p>
                  <LanguageToggle currentLang={lang} onChange={setLang} compact />
                  <div className="rounded-2xl border border-[#1a1a2e]/90 bg-[#0d0d12] p-1">
                    <AppSwitcher compact />
                  </div>
                  <Link href={launchHref} className="bracket-button w-full justify-center px-4 py-3 text-[10px]">
                    {t.nav.launch}
                  </Link>
                </div>

                <div className="site-nav-drawer-section">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">Primary</p>
                  <div className="mt-3 space-y-2">{PRIMARY_SITE_NAV.map((link) => renderLink(link, true))}</div>
                </div>

                <div className="site-nav-drawer-section">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#555566]">{t.nav.more}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">{MORE_SITE_NAV.map((link) => renderLink(link, true))}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </nav>
  );
}
