import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function FeedbackDetailLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-28 sm:pt-32" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-3xl">
          <div className="h-4 w-28 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div className="space-y-4">
              <HubCard className="p-4 sm:p-5">
                <div className="h-12 w-12 rounded-2xl bg-white/10 animate-pulse" />
                <div className="mt-3 h-3 w-10 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-2 h-5 w-8 rounded-full bg-white/10 animate-pulse" />
              </HubCard>
            </div>
            <div className="space-y-4">
              <HubCard className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="h-4 w-20 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-10 w-full rounded-full bg-white/10 animate-pulse" />
                  <div className="h-5 w-11/12 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-5 w-10/12 rounded-full bg-white/10 animate-pulse" />
                </div>
              </HubCard>
              <HubSkeletonCard lines={3} />
              <HubSkeletonCard lines={4} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
