'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function QuizPotDetailError({ error: _error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(_error);
  }, [_error]);

  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={AlertTriangle}
          title="Quiz pot page failed to load"
          description="An unexpected error occurred while loading this quiz pot detail view."
          tone="error"
        >
          <button type="button" onClick={reset} className="primary-button">
            TRY AGAIN
          </button>
          <Link href="/game/quiz-pot" className="secondary-button">
            BACK TO HUB
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
