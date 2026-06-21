"use client";

export function FinalVerdictSection({ verdict }: { verdict: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-white/5">
          <svg
            className="size-3.5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Final Verdict</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-yellow-500/10 bg-gradient-to-br from-yellow-500/[0.06] via-yellow-500/[0.02] to-transparent p-8 transition-all hover:border-yellow-500/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.6_0.2_80/0.08),transparent_70%)]" />
        <div className="pointer-events-none absolute -top-32 -left-32 size-64 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-orange-500/5 blur-3xl" />

        <div className="relative text-center">
          <div className="mb-4 inline-flex rounded-full border border-yellow-500/15 bg-yellow-500/5 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-yellow-400/60">
            The Internet Has Spoken
          </div>

          <p className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            <span className="text-gradient-viral">&ldquo;{verdict}&rdquo;</span>
          </p>
        </div>
      </div>
    </section>
  );
}
