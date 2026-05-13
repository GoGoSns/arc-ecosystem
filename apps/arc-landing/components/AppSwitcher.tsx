'use client';

import { usePathname } from 'next/navigation';
import { Gamepad2, Home, ShoppingBag, Sparkles, Wallet } from 'lucide-react';
import { getArcAppBaseUrl, isExternalUrl } from '@/lib/arcAppLinks';

type AppItem = {
  key: 'pay' | 'creator' | 'play' | 'market' | 'hub';
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
  href: string | null;
  color: string;
};

type Props = {
  compact?: boolean;
};

const APPS: AppItem[] = [
  { key: 'pay', name: 'Pay', icon: Wallet, href: getArcAppBaseUrl('pay'), color: '#60a5fa' },
  { key: 'creator', name: 'Creator', icon: Sparkles, href: getArcAppBaseUrl('creator'), color: '#f472b6' },
  { key: 'play', name: 'Play', icon: Gamepad2, href: getArcAppBaseUrl('play'), color: '#34d399' },
  { key: 'market', name: 'Market', icon: ShoppingBag, href: '/market', color: '#c9a84c' },
  { key: 'hub', name: 'Hub', icon: Home, href: '/', color: '#c9a84c' },
];

export default function AppSwitcher({ compact = false }: Props) {
  const pathname = usePathname();
  const isHubActive = pathname === '/';
  const isMarketActive = pathname === '/market' || pathname.startsWith('/market/');
  const nameClass = compact ? 'hidden xl:inline' : 'hidden sm:inline';
  const sizeClass = compact ? 'px-2.5 py-2 text-[10px] tracking-[0.18em]' : 'px-3 py-2 text-xs';

  return (
    <nav
      className="flex max-w-full items-center gap-1 overflow-hidden rounded-2xl border p-1"
      aria-label="Switch between Arc apps"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(201,168,76,0.15)' }}
    >
      {APPS.map((app) => {
        const Icon = app.icon;
        const isActive = (app.key === 'hub' && isHubActive) || (app.key === 'market' && isMarketActive);
        const sharedClasses = [
          `flex shrink-0 items-center gap-2 rounded-xl font-bold transition-all ${sizeClass}`,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        ].join(' ');

        if (!app.href) {
          return (
            <span
              key={app.name}
              aria-disabled="true"
              aria-label={`Arc ${app.name} unavailable`}
              className={`${sharedClasses} cursor-not-allowed opacity-45`}
              style={{ background: 'transparent', color: 'var(--fg)' }}
              title={`Arc ${app.name} unavailable`}
            >
              <Icon size={14} style={{ color: app.color }} />
              <span className={nameClass}>{app.name}</span>
            </span>
          );
        }

        return (
          <a
            key={app.name}
            href={app.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Open Arc ${app.name}`}
            className={sharedClasses}
            style={{
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--fg)',
              opacity: isActive ? 1 : 0.78,
            }}
            target={isExternalUrl(app.href) ? '_blank' : undefined}
            rel={isExternalUrl(app.href) ? 'noopener noreferrer' : undefined}
            title={`Arc ${app.name}`}
          >
            <Icon size={14} style={{ color: isActive ? 'var(--accent)' : app.color }} />
            <span className={nameClass}>{app.name}</span>
          </a>
        );
      })}
    </nav>
  );
}
