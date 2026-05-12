import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function RaceLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="h-14 w-full max-w-4xl rounded-full bg-white/10" />
            <div className="h-6 w-full max-w-3xl rounded-full bg-white/10" />
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <HubSkeletonCard lines={2} />
            <HubSkeletonCard lines={2} />
            <HubSkeletonCard lines={2} />
            <HubSkeletonCard lines={2} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <HubCard className="p-6 sm:p-8">
              <div className="space-y-4">
                <div className="h-4 w-28 rounded-full bg-white/10" />
                <div className="h-10 w-full max-w-2xl rounded-full bg-white/10" />
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="h-24 rounded-2xl bg-white/10" />
                  <div className="h-24 rounded-2xl bg-white/10" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-28 rounded-2xl bg-white/10" />
                  <div className="h-28 rounded-2xl bg-white/10" />
                </div>
              </div>
            </HubCard>
            <div className="space-y-4">
              <HubSkeletonCard lines={4} />
              <HubSkeletonCard lines={4} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
