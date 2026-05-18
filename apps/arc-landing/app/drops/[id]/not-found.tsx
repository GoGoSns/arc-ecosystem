import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function DropDetailNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#050508] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Drop not found"
            description="The drop you requested does not exist in the local archive or the id is invalid."
            tone="error"
          >
            <Link href="/drops" className="primary-button">
              BACK TO DROPS
            </Link>
            <Link href="/drops/archive" className="secondary-button">
              VIEW ARCHIVE
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
