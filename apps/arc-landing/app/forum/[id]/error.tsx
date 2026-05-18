'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function ForumThreadError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#050508] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={AlertTriangle}
            title="Forum thread failed to load"
            description="An unexpected error occurred while loading this forum thread."
            tone="error"
          >
            <button type="button" onClick={reset} className="primary-button">
              TRY AGAIN
            </button>
            <Link href="/forum" className="secondary-button">
              BACK TO FORUM
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
