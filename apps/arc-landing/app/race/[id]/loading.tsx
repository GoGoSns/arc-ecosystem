import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function RaceDetailLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <HubCard className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="h-4 w-28 rounded-full bg-white/10" />
                  <div className="h-12 w-full max-w-3xl rounded-full bg-white/10" />
                  <div className="h-6 w-full max-w-2xl rounded-full bg-white/10" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="h-20 rounded-2xl bg-white/10" />
                    <div className="h-20 rounded-2xl bg-white/10" />
                    <div className="h-20 rounded-2xl bg-white/10" />
                    <div className="h-20 rounded-2xl bg-white/10" />
                  </div>
                </div>
              </HubCard>

              <HubCard className="p-0 overflow-hidden">
                <div className="p-6">
                  <div className="h-5 w-32 rounded-full bg-white/10" />
                </div>
                <div className="space-y-2 border-t border-[#2a2a2a] p-4">
                  <HubSkeletonCard lines={2} />
                  <HubSkeletonCard lines={2} />
                  <HubSkeletonCard lines={2} />
                </div>
              </HubCard>
            </div>

            <div className="space-y-6">
              <HubSkeletonCard lines={3} />
              <HubSkeletonCard lines={4} />
              <HubSkeletonCard lines={3} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
