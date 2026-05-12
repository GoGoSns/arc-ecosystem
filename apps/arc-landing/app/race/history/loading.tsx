import { HubCard, HubSkeletonCard } from '@/components/HubPrimitives';

export default function RaceHistoryLoadingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#0a0a0a] text-white">
      <section className="section pt-32 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="h-14 w-full max-w-4xl rounded-full bg-white/10" />
            <div className="h-6 w-full max-w-2xl rounded-full bg-white/10" />
          </div>

          <HubCard as="section" className="mt-10 p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="h-12 rounded-2xl bg-white/10" />
              <div className="h-12 rounded-2xl bg-white/10" />
            </div>
          </HubCard>

          <div className="mt-6 space-y-3">
            <HubSkeletonCard lines={4} />
            <HubSkeletonCard lines={4} />
            <HubSkeletonCard lines={4} />
          </div>
        </div>
      </section>
    </main>
  );
}
