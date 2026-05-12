export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-[#2a2a2a]/80 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.18em] text-white">
            <span className="relative grid h-8 w-8 place-items-center border border-[#c9a84c]/60">
              <span className="h-3.5 w-3.5 rotate-45 border border-[#c9a84c]" />
            </span>
            Arc Ecosystem
          </div>
          <div className="hidden h-6 w-52 rounded-full bg-white/10 md:block" aria-hidden="true" />
          <div className="h-10 w-28 rounded-xl border border-[#2a2a2a] bg-white/5" aria-hidden="true" />
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#c9a84c]/10 via-[#c9a84c]/5 to-transparent blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="space-y-6">
              <div className="h-3 w-40 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
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

      <section className="section pt-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <span className="corner corner-tl" />
              <span className="corner corner-tr" />
              <span className="corner corner-bl" />
              <span className="corner corner-br" />
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                <div>
                  <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
                  <div className="mt-2 h-12 w-full rounded-2xl bg-white/10 animate-pulse" />
                </div>
                <div>
                  <div className="mb-2 h-3 w-20 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-12 min-w-[190px] rounded-2xl bg-white/10 animate-pulse" />
                </div>
                <div>
                  <div className="mb-2 h-3 w-20 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-12 min-w-[190px] rounded-2xl bg-white/10 animate-pulse" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>

            <div className="bracket-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <span className="corner corner-tl" />
              <span className="corner corner-tr" />
              <span className="corner corner-bl" />
              <span className="corner corner-br" />
              <div className="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-4 h-8 w-44 rounded-full bg-white/10 animate-pulse" />
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="h-12 w-20 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-12 w-20 rounded-xl bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#777]">
            <div className="h-3 w-44 rounded-full bg-white/10 animate-pulse" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-16 rounded-full bg-white/10 animate-pulse" />
              <div className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
              <div className="h-7 w-16 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bracket-card relative overflow-hidden rounded-3xl p-6">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-3 h-8 w-40 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-5 h-4 w-full rounded-full bg-white/10 animate-pulse" />
                <div className="mt-3 h-4 w-11/12 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-3 h-4 w-10/12 rounded-full bg-white/10 animate-pulse" />
                <div className="mt-6 border-t border-[#2a2a2a] pt-4">
                  <div className="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
