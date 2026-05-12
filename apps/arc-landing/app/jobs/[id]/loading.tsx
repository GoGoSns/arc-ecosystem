import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function JobDetailLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32 sm:pt-36" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-6xl">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="space-y-6">
              <HubCard className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-12 w-full max-w-3xl rounded-full bg-white/10 animate-pulse" />
                  <div className="h-6 w-full max-w-2xl rounded-full bg-white/10 animate-pulse" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                    <div className="h-20 rounded-2xl bg-white/10 animate-pulse" />
                  </div>
                </div>
              </HubCard>
              <HubSkeletonCard lines={4} />
              <HubSkeletonCard lines={3} />
            </div>
            <div className="space-y-6">
              <HubSkeletonCard lines={3} />
              <HubSkeletonCard lines={4} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
