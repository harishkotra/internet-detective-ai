"use client";

import { Badge } from "@/components/ui/badge";
import { CoworkerQuote } from "@/lib/types";

const toneConfig: Record<string, { color: string; label: string }> = {
  playful: {
    color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
    label: "Playful",
  },
  admiring: {
    color: "border-green-500/20 bg-green-500/10 text-green-400",
    label: "Admiring",
  },
  frustrated: {
    color: "border-red-500/20 bg-red-500/10 text-red-400",
    label: "Frustrated",
  },
  impressed: {
    color: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    label: "Impressed",
  },
};

export function CoworkerQuotesSection({ quotes }: { quotes: CoworkerQuote[] }) {
  if (!quotes.length) return null;

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
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">
          What Coworkers Say
        </h2>
        <span className="text-xs text-white/20">({quotes.length})</span>
      </div>

      <div className="grid gap-4">
        {quotes.map((quote, i) => {
          const tone = toneConfig[quote.tone] || toneConfig.playful;

          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 transition-all hover:border-white/10"
            >
              <div className="pointer-events-none absolute -top-4 -left-2 text-6xl text-white/[0.03] select-none leading-none font-serif">
                &ldquo;
              </div>

              <div className="relative space-y-3">
                <p className="text-sm leading-relaxed text-white/60 italic transition-colors group-hover:text-white/70">
                  &ldquo;{quote.quote}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className={`${tone.color} text-[10px]`}
                  >
                    {tone.label}
                  </Badge>
                  <span className="text-white/20">
                    &mdash; Anonymous Coworker
                  </span>
                  {quote.context && (
                    <>
                      <span className="size-1 rounded-full bg-white/10" />
                      <span className="text-white/20">{quote.context}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
