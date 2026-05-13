'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function LuckyDetailError({ error: _error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(_error);
  }, [_error]);

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={AlertTriangle}
          title="Lucky detail failed to load"
          description="An unexpected error occurred while loading this lucky pack."
          tone="error"
        >
          <button type="button" onClick={reset} className="primary-button">
            TRY AGAIN
          </button>
          <Link href="/game/lucky" className="secondary-button">
            BACK TO LUCKY
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
