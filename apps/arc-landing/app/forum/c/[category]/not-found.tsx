import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function ForumCategoryNotFound() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#050508] text-white">
      <section className="section pt-32">
        <div className="mx-auto max-w-3xl">
          <HubEmptyState
            icon={ShieldAlert}
            title="Category not found"
            description="The forum category you requested does not exist in the local index or the slug is invalid."
            tone="error"
          >
            <Link href="/forum" className="primary-button">
              BACK TO FORUM
            </Link>
          </HubEmptyState>
        </div>
      </section>
    </main>
  );
}
