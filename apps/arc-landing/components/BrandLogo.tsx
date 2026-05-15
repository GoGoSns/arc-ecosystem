'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  href?: string | null;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

export default function BrandLogo({
  href = '/',
  className = '',
  decorative = false,
}: Props) {
  const content = (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* İkon Bölümü */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2L38 20L20 38L2 20L20 2Z" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round"/>
        <path d="M8 22L20 10L32 22" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 28L20 22L26 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 17L23 20L20 23L17 20L20 17Z" fill="#D4AF37"/>
      </svg>
      
      {/* Ayırıcı Çizgi */}
      <div className="w-px h-8 bg-[#2A2A2A]" />
      
      {/* Yazı Bölümü */}
      <div className="flex flex-col justify-center text-left">
        <span className="text-white font-black text-xl leading-none tracking-tight">ARC</span>
        <span className="text-[#D4AF37] font-bold text-[8px] tracking-[0.4em] mt-1 uppercase">Ecosystem</span>
      </div>
    </div>
  );

  if (href === null) {
    return (
      <div className="min-w-0" aria-hidden={decorative ? 'true' : undefined}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="min-w-0 hover:opacity-90 transition-opacity" aria-label="Arc Ecosystem">
      {content}
    </Link>
  );
}
