'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type CardTag = 'div' | 'article' | 'section' | 'aside';

const surfaceClass =
  'bracket-card group relative overflow-hidden rounded-[var(--radius-card)] border border-[#1a1a2e]/95 bg-[linear-gradient(135deg,rgba(212, 175, 55,0.06),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1.5 hover:border-[#d4af37]/30 hover:shadow-[0_28px_88px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212, 175, 55,0.12),0_20px_60px_rgba(212, 175, 55,0.12)] focus-within:border-[#d4af37]/30 focus-within:shadow-[0_28px_88px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212, 175, 55,0.12),0_20px_60px_rgba(212, 175, 55,0.12)]';

export const hubInputClass =
  'rounded-2xl border border-[#1a1a2e] bg-black/35 px-4 py-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#4e4e4e] focus:border-[#d4af37]/70 focus:bg-black/45 focus:ring-2 focus:ring-[#d4af37]/20';

export const hubSelectClass = `${hubInputClass} uppercase tracking-[0.14em]`;

export const hubTextareaClass = `${hubInputClass} min-h-[120px] resize-y`;

export const hubLabelClass = 'font-mono text-[10px] uppercase tracking-[0.3em] text-[#8a8a9a]';

export const hubBadgeClass =
  'inline-flex items-center gap-1 rounded-full border border-[#1a1a2e]/95 bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#cfcfcf] backdrop-blur-sm';

export function HubBadge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`${hubBadgeClass} ${className}`.trim()}>{children}</span>;
}

export function HubBrackets() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  );
}

export function HubCard({
  as: Component = 'div',
  className = '',
  children,
}: {
  as?: CardTag;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component className={`${surfaceClass} ${className}`.trim()}>
      <HubBrackets />
      {children}
    </Component>
  );
}

export function HubMetricCard({
  label,
  value,
  icon: Icon,
  className = '',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <HubCard className={`p-5 ${className}`.trim()}>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-[#8a8a9a]">
        <Icon size={14} className="text-[#d4af37]" />
        {label}
      </div>
      <div className="mt-3 text-[clamp(1.95rem,3vw,2.8rem)] font-black leading-none tracking-tight text-white">{value}</div>
    </HubCard>
  );
}

export function HubEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = '',
  tone = 'default',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  tone?: 'default' | 'error';
}) {
  const isError = tone === 'error';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-dashed ${
        isError ? 'border-red-500/25 bg-red-500/10 text-red-200' : 'border-[#1a1a2e] bg-white/[0.015] text-[#555566]'
      } p-10 text-center ${className}`.trim()}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <HubBrackets />
      <Icon size={42} className={`mx-auto ${isError ? 'text-red-300' : 'text-[#1a1a2e]'}`} aria-hidden="true" />
      <h3 className={`mt-5 text-2xl font-black ${isError ? 'text-red-50' : 'text-white'}`}>{title}</h3>
      <p className={`mx-auto mt-2 max-w-xl text-sm leading-7 ${isError ? 'text-red-100/80' : 'text-[#8a8a9a]'}`}>{description}</p>
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

export function HubSkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <HubCard className={`p-6 ${className}`.trim()}>
      <div className="space-y-4 animate-pulse" aria-hidden="true">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-8 w-40 rounded-full bg-white/10" />
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 rounded-full bg-white/10" style={{ width: `${100 - index * 14}%` }} />
        ))}
      </div>
    </HubCard>
  );
}
