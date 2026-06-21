"use client";

import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { CareerPrediction } from "@/lib/types";

export function CareerPredictionSection({
  prediction,
}: {
  prediction: CareerPrediction;
}) {
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
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Career Prediction</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/[0.04] to-cyan-500/[0.02] p-6 transition-all hover:border-white/10">
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/20">
              Next Role
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold text-white/80">
                {prediction.nextRole}
              </h3>
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400"
              >
                {prediction.industryDirection}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">
                Leadership Potential
              </span>
              <span className="text-xs text-white/30 tabular-nums">
                {prediction.leadershipPotential}%
              </span>
            </div>
            <Progress value={prediction.leadershipPotential}>
              <ProgressIndicator className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500/60 to-cyan-500/60" />
            </Progress>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">
                Prediction Confidence
              </span>
              <span className="text-xs text-white/30 tabular-nums">
                {prediction.confidence}%
              </span>
            </div>
            <Progress value={prediction.confidence}>
              <ProgressIndicator className="h-1.5 rounded-full bg-gradient-to-r from-blue-500/60 to-purple-500/60" />
            </Progress>
          </div>

          {prediction.futureOpportunities.length > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/20">
                Future Opportunities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prediction.futureOpportunities.map((opp, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-white/5 bg-white/[0.03] text-[10px] text-white/40 hover:bg-white/[0.06]"
                  >
                    {opp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
