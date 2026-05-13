'use client';

import type { SVGProps } from 'react';

export default function ForumBrandMark({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#0a0a0a" />
      <path
        d="M16 4.5L27.5 16L16 27.5L4.5 16L16 4.5Z"
        stroke="#c9a84c"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5L22.5 20.5H18.9L16 15.5L13.1 20.5H9.5L16 9.5Z"
        fill="#c9a84c"
      />
      <path
        d="M16 12.2L18.8 16.9H13.2L16 12.2Z"
        fill="#0a0a0a"
        opacity="0.9"
      />
    </svg>
  );
}
