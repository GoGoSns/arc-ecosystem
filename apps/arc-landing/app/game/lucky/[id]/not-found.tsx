'use client';

import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function LuckyDetailNotFound() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={PackageSearch}
          title="Lucky pack not found"
          description="That lucky card is not available in the local store. Go back to the lucky hub or create a new mock pack."
        >
          <Link href="/game/lucky" className="primary-button">
            BACK TO LUCKY
          </Link>
          <Link href="/game/lucky" className="secondary-button">
            CREATE PACK
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
