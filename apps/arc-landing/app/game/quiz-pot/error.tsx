'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function QuizPotError({ error: _error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(_error);
  }, [_error]);

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={AlertTriangle}
          title="Quiz pot hub failed to load"
          description="An unexpected error occurred while loading the quiz pot hub."
          tone="error"
        >
          <button type="button" onClick={reset} className="primary-button">
            TRY AGAIN
          </button>
          <Link href="/game" className="secondary-button">
            BACK TO GAME
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
