"use client";

export function DigitalProfileSummary({ summary }: { summary: string }) {
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">
          Digital Profile Summary
        </h2>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/[0.04] to-purple-500/[0.02] p-6 transition-all hover:border-white/10">
        <div className="pointer-events-none absolute top-4 left-4 text-4xl text-white/5 select-none leading-none">
          &ldquo;
        </div>

        <p className="relative pl-4 text-sm leading-relaxed text-white/60 italic transition-colors group-hover:text-white/70">
          {summary}
        </p>

        <div className="pointer-events-none absolute bottom-2 right-4 text-4xl text-white/5 select-none leading-none">
          &rdquo;
        </div>
      </div>
    </section>
  );
}
