import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function LuckyLoadingPage() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-8">
        <HubSkeletonCard lines={4} className="min-h-[240px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <HubCard className="space-y-6 p-6 sm:p-8">
            <HubSkeletonCard lines={4} />
            <HubSkeletonCard lines={5} />
          </HubCard>
          <div className="space-y-6">
            <HubSkeletonCard lines={4} className="min-h-[280px]" />
            <HubSkeletonCard lines={6} className="min-h-[360px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
