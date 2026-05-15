'use client';

import Image from 'next/image';
import Link from 'next/link';

type Props = {
  href?: string | null;
  className?: string;
  variant?: 'responsive' | 'full' | 'mark';
  priority?: boolean;
  decorative?: boolean;
};

function BrandLogoContent({
  variant,
  priority,
}: {
  variant: NonNullable<Props['variant']>;
  priority: boolean;
}) {
  if (variant === 'mark') {
    return (
      <Image
        src="/brand/arc-logo-mark.svg"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0"
        priority={priority}
      />
    );
  }

  if (variant === 'full') {
    return (
      <Image
        src="/brand/arc-logo.svg"
        alt=""
        aria-hidden="true"
        width={180}
        height={36}
        className="h-9 w-auto shrink-0"
        priority={priority}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/arc-logo-mark.svg"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 sm:hidden"
        priority={priority}
      />
      <Image
        src="/brand/arc-logo.svg"
        alt=""
        aria-hidden="true"
        width={180}
        height={36}
        className="hidden h-9 w-auto shrink-0 sm:block"
        priority={priority}
      />
    </>
  );
}

export default function BrandLogo({
  href = '/',
  className = '',
  variant = 'responsive',
  priority = true,
  decorative = false,
}: Props) {
  const content = (
    <BrandLogoContent variant={variant} priority={priority} />
  );
  const rootClassName = `flex min-w-0 items-center ${variant === 'responsive' ? 'gap-3' : ''} ${className}`;

  if (href === null) {
    return (
      <span className={rootClassName} aria-hidden={decorative ? 'true' : undefined}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={rootClassName} aria-label="Arc Ecosystem">
      {content}
    </Link>
  );
}
