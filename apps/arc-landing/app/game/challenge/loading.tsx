import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function ChallengeLoadingPage() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        <HubSkeletonCard lines={4} className="min-h-[260px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <HubCard className="space-y-6 p-6 sm:p-8">
            <HubSkeletonCard lines={3} />
            <HubSkeletonCard lines={6} />
          </HubCard>
          <div className="space-y-6">
            <HubSkeletonCard lines={4} className="min-h-[260px]" />
            <HubSkeletonCard lines={5} className="min-h-[300px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
