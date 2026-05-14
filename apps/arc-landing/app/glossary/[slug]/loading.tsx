import SiteHeader from '@/components/SiteHeader';

export default function GlossaryTermLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-6">
              <div className="h-3 w-44 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
              <div className="h-24 w-full max-w-4xl rounded-3xl bg-white/10 animate-pulse" aria-hidden="true" />
              <div className="h-5 w-full max-w-2xl rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
              <div className="h-5 w-11/12 max-w-3xl rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
              <div className="flex flex-wrap gap-4 pt-4" aria-hidden="true">
                <div className="h-[3.25rem] w-44 rounded-none border border-[#c9a84c]/20 bg-white/5 animate-pulse" />
                <div className="h-[3.25rem] w-36 rounded-none border border-[#2a2a2a] bg-white/5 animate-pulse" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bracket-card relative overflow-hidden rounded-3xl p-5">
                  <span className="corner corner-tl" />
                  <span className="corner corner-tr" />
                  <span className="corner corner-bl" />
                  <span className="corner corner-br" />
                  <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
                  <div className="mt-3 h-9 w-32 rounded-full bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-16" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <div className="h-3 w-36 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-4 h-8 w-52 rounded-full bg-white/10 animate-pulse" />
            <div className="mt-6 space-y-3">
              <div className="h-5 w-full rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-11/12 rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-10/12 rounded-full bg-white/10 animate-pulse" />
              <div className="h-5 w-9/12 rounded-full bg-white/10 animate-pulse" />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
              <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
              <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
            </div>
          </article>

          <aside className="space-y-6">
            <section className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <span className="corner corner-tl" />
              <span className="corner corner-tr" />
              <span className="corner corner-bl" />
              <span className="corner corner-br" />
              <div className="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-4 h-8 w-44 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-[#2a2a2a] bg-black/25 p-4">
                    <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
                    <div className="mt-3 h-5 w-40 rounded-full bg-white/10 animate-pulse" />
                    <div className="mt-3 h-4 w-full rounded-full bg-white/10 animate-pulse" />
                    <div className="mt-2 h-4 w-11/12 rounded-full bg-white/10 animate-pulse" />
                  </div>
                ))}
              </div>
            </section>

            <section className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <span className="corner corner-tl" />
              <span className="corner corner-tr" />
              <span className="corner corner-bl" />
              <span className="corner corner-br" />
              <div className="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-4 h-8 w-52 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-6 space-y-3">
                <div className="h-5 w-full rounded-full bg-white/10 animate-pulse" />
                <div className="h-5 w-11/12 rounded-full bg-white/10 animate-pulse" />
                <div className="h-5 w-10/12 rounded-full bg-white/10 animate-pulse" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
