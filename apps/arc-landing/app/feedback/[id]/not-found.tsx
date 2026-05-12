import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function FeedbackDetailNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Feedback not found"
            description="The feedback item you requested does not exist in the local board or the id is invalid."
            tone="error"
          >
            <Link href="/feedback" className="primary-button">
              BACK TO FEEDBACK
            </Link>
            <Link href="/feedback/new" className="secondary-button">
              SUBMIT FEEDBACK
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
