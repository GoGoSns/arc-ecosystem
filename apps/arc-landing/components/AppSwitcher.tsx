'use client';

import { useState, useEffect } from 'react';
import { Wallet, Sparkles, Gamepad2, Home } from 'lucide-react';

const APPS = [
  { name: 'Pay', icon: Wallet, url: 'http://localhost:3000', port: 3000, color: '#60a5fa' },
  { name: 'Creator', icon: Sparkles, url: 'http://localhost:3001', port: 3001, color: '#f472b6' },
  { name: 'Play', icon: Gamepad2, url: 'http://localhost:3002', port: 3002, color: '#34d399' },
  { name: 'Hub', icon: Home, url: 'http://localhost:3003', port: 3003, color: '#c9a84c' },
];

export default function AppSwitcher() {
  const [currentPort, setCurrentPort] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPort(parseInt(window.location.port) || 3003);
    }
  }, []);

  return (
    <div
      className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border p-1"
      aria-label="Switch between Arc apps"
      role="navigation"
      aria-roledescription="app switcher"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(201,168,76,0.15)' }}>
      {APPS.map((app) => {
        const Icon = app.icon;
        const isActive = currentPort === app.port;
        return (
          <a
            key={app.name}
            href={app.url}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Open Arc ${app.name}`}
            className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-105 focus-visible:bg-white/5"
            style={{
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--fg)',
              opacity: isActive ? 1 : 0.5,
            }}
            title={`Arc ${app.name}`}
          >
            <Icon size={14} style={{ color: isActive ? 'var(--accent)' : app.color }} />
            <span className="hidden sm:inline">{app.name}</span>
          </a>
        );
      })}
    </div>
  );
}
