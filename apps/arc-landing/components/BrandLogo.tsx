'use client';

import Image from 'next/image';
import Link from 'next/link';

type Props = {
  href?: string;
  className?: string;
};

export default function BrandLogo({ href = '/', className = '' }: Props) {
  return (
    <Link href={href} className={`flex min-w-0 items-center gap-3 ${className}`} aria-label="Arc Ecosystem">
      <Image
        src="/brand/arc-logo-mark.svg"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 sm:hidden"
        priority
      />
      <Image
        src="/brand/arc-logo.svg"
        alt=""
        aria-hidden="true"
        width={180}
        height={36}
        className="hidden h-9 w-auto shrink-0 sm:block"
        priority
      />
      <span className="sr-only">Arc Ecosystem</span>
    </Link>
  );
}
