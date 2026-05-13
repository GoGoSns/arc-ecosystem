import { HubSkeletonCard } from '@/components/HubPrimitives';

export default function Loading() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        <HubSkeletonCard lines={4} className="min-h-[320px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
        </div>
        <HubSkeletonCard lines={3} className="min-h-[220px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <HubSkeletonCard lines={4} className="min-h-[300px]" />
          <HubSkeletonCard lines={4} className="min-h-[300px]" />
        </div>
      </div>
    </section>
  );
}
