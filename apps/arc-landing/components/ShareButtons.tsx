'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  title?: string;
  url?: string;
}

export function ShareButtons({ title = 'Arc Gaming', url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const tweetText = encodeURIComponent(`${title} — check it out on Arc!\n${shareUrl}`);
  const twitterUrl = `https://x.com/intent/tweet?text=${tweetText}`;

  function handleCopy() {
    const target = url ?? (typeof window !== 'undefined' ? window.location.href : '');
    navigator.clipboard.writeText(target).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 11H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 1200 1227" fill="currentColor" className="shrink-0">
          <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
        </svg>
        Share on X
      </a>
    </div>
  );
}
