import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function RaceDetailNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Race not found"
            description="The requested race does not exist in the local archive or the id is invalid."
            tone="error"
          >
            <Link href="/race" className="primary-button">
              BACK TO HUB
            </Link>
            <Link href="/race/history" className="secondary-button">
              VIEW HISTORY
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
