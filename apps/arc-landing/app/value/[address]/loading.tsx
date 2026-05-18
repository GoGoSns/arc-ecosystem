import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function ValueProfileLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#050508] text-white">
      <section className="section pt-32 sm:pt-36" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-5xl">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <HubCard className="p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-3xl bg-white/10 animate-pulse" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4 w-40 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-10 w-full max-w-3xl rounded-full bg-white/10 animate-pulse" />
                    <div className="h-6 w-48 rounded-full bg-white/10 animate-pulse" />
                  </div>
                </div>
              </HubCard>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <HubSkeletonCard lines={1} />
                <HubSkeletonCard lines={1} />
                <HubSkeletonCard lines={1} />
                <HubSkeletonCard lines={1} />
              </div>

              <HubCard className="p-6 sm:p-8">
                <div className="h-5 w-32 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <HubSkeletonCard lines={2} />
                  <HubSkeletonCard lines={2} />
                  <HubSkeletonCard lines={2} />
                </div>
              </HubCard>
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
