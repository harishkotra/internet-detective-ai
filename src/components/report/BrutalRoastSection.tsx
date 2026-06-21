"use client";

import { Badge } from "@/components/ui/badge";
import { Roast } from "@/lib/types";

const categoryColors: Record<string, string> = {
  code: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  career: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  social: "border-pink-500/20 bg-pink-500/10 text-pink-400",
  skills: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  personality: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  default: "border-white/10 bg-white/5 text-white/40",
};

function FireIndicator({ intensity }: { intensity: number }) {
  const fires = Math.min(Math.max(Math.round(intensity / 20), 1), 5);
  return (
    <span className="text-sm tabular-nums">
      {Array.from({ length: fires }, (_, i) => (
        <span
          key={i}
          className="animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          🔥
        </span>
      ))}
      <span className="text-white/10">
        {Array.from({ length: 5 - fires }, (_, i) => (
          <span key={i}>🔥</span>
        ))}
      </span>
    </span>
  );
}

export function BrutalRoastSection({ roasts }: { roasts: Roast[] }) {
  if (!roasts.length) return null;

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
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Brutal Roast</h2>
        <span className="text-xs text-white/20">({roasts.length})</span>
      </div>

      <div className="grid gap-3">
        {roasts.map((roast, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-red-500/[0.03] to-orange-500/[0.01] p-5 transition-all hover:border-red-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/20">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      categoryColors[roast.category?.toLowerCase()] ||
                      categoryColors.default
                    }
                  >
                    {roast.category}
                  </Badge>
                  <FireIndicator intensity={roast.intensity} />
                </div>

                <p className="text-sm leading-relaxed text-white/60 transition-colors group-hover:text-white/70">
                  &ldquo;{roast.line}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
