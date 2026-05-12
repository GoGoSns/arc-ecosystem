'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function JobDetailError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={AlertTriangle}
            title="Job page failed to load"
            description="An unexpected error occurred while loading this job detail view."
            tone="error"
          >
            <button type="button" onClick={reset} className="primary-button">
              TRY AGAIN
            </button>
            <Link href="/jobs" className="secondary-button">
              BACK TO JOB BOARD
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
