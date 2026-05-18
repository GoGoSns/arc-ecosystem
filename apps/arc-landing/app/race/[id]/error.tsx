'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function RaceDetailError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#050508] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={AlertTriangle}
            title="Race page failed to load"
            description="An unexpected error occurred while loading this race detail view."
            tone="error"
          >
            <button type="button" onClick={reset} className="primary-button">
              TRY AGAIN
            </button>
            <Link href="/race" className="secondary-button">
              BACK TO HUB
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
