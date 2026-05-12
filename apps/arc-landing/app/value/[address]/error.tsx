'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function ValueProfileError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={AlertTriangle}
            title="Profile failed to load"
            description="An unexpected error occurred while loading this value profile."
            tone="error"
          >
            <button type="button" onClick={reset} className="primary-button">
              TRY AGAIN
            </button>
            <Link href="/value" className="secondary-button">
              BACK TO VALUE HUB
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
