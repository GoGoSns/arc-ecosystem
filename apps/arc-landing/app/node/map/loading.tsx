import { HubSkeletonCard } from '@/components/HubPrimitives';

export default function Loading() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <HubSkeletonCard lines={3} className="min-h-[180px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
          <HubSkeletonCard lines={1} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
          <HubSkeletonCard lines={5} className="min-h-[620px]" />
          <div className="space-y-6">
            <HubSkeletonCard lines={4} className="min-h-[320px]" />
            <HubSkeletonCard lines={6} className="min-h-[420px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
