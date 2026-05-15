'use client';

import Image from 'next/image';
import Link from 'next/link';

type Props = {
  href?: string | null;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

function BrandLogoContent({
  priority,
}: {
  priority: boolean;
}) {
  return (
    <Image
      src="/brand/arc-logo.svg"
      alt=""
      aria-hidden="true"
      width={200}
      height={40}
      className="h-10 w-auto shrink-0"
      priority={priority}
    />
  );
}

export default function BrandLogo({
  href = '/',
  className = '',
  priority = true,
  decorative = false,
}: Props) {
  const content = (
    <BrandLogoContent priority={priority} />
  );
  const rootClassName = `flex min-w-0 items-center ${className}`;

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
