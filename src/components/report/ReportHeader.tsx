"use client";

import { Badge } from "@/components/ui/badge";
import { InvestigationReport } from "@/lib/types";

const cookedLevelConfig: Record<
  string,
  { color: string; emoji: string; label: string }
> = {
  "Not Cooked": {
    color: "border-green-500/30 bg-green-500/10 text-green-400",
    emoji: "🥩",
    label: "Not Cooked",
  },
  "Mildly Cooked": {
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    emoji: "🍳",
    label: "Mildly Cooked",
  },
  Cooked: {
    color: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    emoji: "🍖",
    label: "Cooked",
  },
  "Deep Fried": {
    color: "border-red-500/30 bg-red-500/10 text-red-400",
    emoji: "🍟",
    label: "Deep Fried",
  },
  "Absolutely Cooked": {
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    emoji: "🔥",
    label: "Absolutely Cooked",
  },
};

export function ReportHeader({ report }: { report: InvestigationReport }) {
  const config =
    cookedLevelConfig[report.cookedLevel] || cookedLevelConfig["Not Cooked"];
  const date = new Date(report.metadata.generatedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`${config.color} px-3 py-1 text-xs font-medium`}
        >
          <span className="mr-1.5">{config.emoji}</span>
          {config.label}
        </Badge>
        <span className="text-[11px] text-white/20 tabular-nums">
          ID: {report.id.slice(0, 8)}...
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-purple-500/5 blur-3xl" />

        <h1 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-gradient">
            Internet Personality Investigation Report
          </span>
        </h1>

        <div className="relative mt-4 flex flex-wrap items-center gap-3 text-sm text-white/30">
          <span>
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="size-1 rounded-full bg-white/10" />
          <span>Model: {report.metadata.model}</span>
          <span className="size-1 rounded-full bg-white/10" />
          <span>Provider: {report.metadata.provider}</span>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2 text-xs text-white/20">
          <span>Prompt v{report.metadata.promptVersion}</span>
          <span className="size-1 rounded-full bg-white/10" />
          <span>{report.metadata.latency.toFixed(0)}ms</span>
          <span className="size-1 rounded-full bg-white/10" />
          <span>~${report.metadata.cost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
