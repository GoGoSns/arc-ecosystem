import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function ForumThreadNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Thread not found"
            description="The thread you requested does not exist in the local forum archive or the id is invalid."
            tone="error"
          >
            <Link href="/forum" className="primary-button">
              BACK TO FORUM
            </Link>
            <Link href="/forum/c/general" className="secondary-button">
              BROWSE GENERAL
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
