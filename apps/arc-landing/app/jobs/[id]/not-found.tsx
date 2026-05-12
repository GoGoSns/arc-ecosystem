import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function JobDetailNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Job not found"
            description="The job post you requested does not exist in the local board or the id is invalid."
            tone="error"
          >
            <Link href="/jobs" className="primary-button">
              BACK TO JOB BOARD
            </Link>
            <Link href="/jobs/post" className="secondary-button">
              POST A JOB
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
