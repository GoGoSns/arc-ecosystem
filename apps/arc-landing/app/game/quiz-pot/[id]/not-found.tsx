import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { HubEmptyState } from '@/components/HubPrimitives';

export default function QuizPotDetailNotFound() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <HubEmptyState
          icon={ShieldAlert}
          title="Quiz pot not found"
          description="The requested quiz pot does not exist in the local store or the id is invalid."
          tone="error"
        >
          <Link href="/game/quiz-pot" className="primary-button">
            BACK TO HUB
          </Link>
          <Link href="/game" className="secondary-button">
            BACK TO GAME
          </Link>
        </HubEmptyState>
      </div>
    </section>
  );
}
