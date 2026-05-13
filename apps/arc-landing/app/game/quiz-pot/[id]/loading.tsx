import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function QuizPotDetailLoadingPage() {
  return (
    <section className="section pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl space-y-8">
        <HubSkeletonCard lines={4} className="min-h-[280px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <HubSkeletonCard lines={5} className="min-h-[320px]" />
            <HubSkeletonCard lines={8} className="min-h-[520px]" />
          </div>
          <div className="space-y-6">
            <HubSkeletonCard lines={5} className="min-h-[280px]" />
            <HubCard className="space-y-4 p-6 sm:p-8">
              <HubSkeletonCard lines={3} />
              <HubSkeletonCard lines={4} />
            </HubCard>
            <HubSkeletonCard lines={6} className="min-h-[360px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
