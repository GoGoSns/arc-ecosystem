import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function ForumThreadLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-28 sm:pt-32" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-4xl">
          <div className="h-4 w-28 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <HubCard className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-10 w-full rounded-full bg-white/10 animate-pulse" />
                  <div className="h-5 w-10/12 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-5 w-9/12 rounded-full bg-white/10 animate-pulse" />
                </div>
              </HubCard>
              <HubSkeletonCard lines={4} />
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
