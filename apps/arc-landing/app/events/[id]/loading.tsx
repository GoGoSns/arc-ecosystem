import { HubSkeletonCard } from '@/components/HubPrimitives';

export default function Loading() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        <HubSkeletonCard lines={4} className="min-h-[320px]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <HubSkeletonCard lines={5} className="min-h-[420px]" />
          <HubSkeletonCard lines={4} className="min-h-[420px]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <HubSkeletonCard lines={4} className="min-h-[280px]" />
          <HubSkeletonCard lines={4} className="min-h-[280px]" />
        </div>
      </div>
    </section>
  );
}
