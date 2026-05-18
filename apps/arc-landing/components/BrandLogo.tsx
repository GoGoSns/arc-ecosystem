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
    <div className={`flex items-center ${className}`}>
      <img
        src="/brand/arc-logo.svg"
        alt="Arc Ecosystem"
        className="h-10 w-auto min-w-[180px] object-contain sm:h-12 lg:h-14"
        style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55,0.1))' }}
      />
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
