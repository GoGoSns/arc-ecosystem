'use client';

import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function ChallengeDetailNotFound() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={PackageSearch}
          title="Challenge not found"
          description="That challenge is not available in the local store. Go back to the challenge hub or create a new mock challenge."
        >
          <Link href="/game/challenge" className="primary-button">
            BACK TO CHALLENGE
          </Link>
          <Link href="/game/challenge" className="secondary-button">
            CREATE CHALLENGE
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
