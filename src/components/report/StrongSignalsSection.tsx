"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { StrongSignal } from "@/lib/types";

const categoryColors: Record<string, string> = {
  career: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  skills: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  personality: "border-pink-500/20 bg-pink-500/10 text-pink-400",
  social: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  work: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  default: "border-white/10 bg-white/5 text-white/40",
};

function confidenceColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function confidenceText(score: number): string {
  if (score >= 80) return "High Confidence";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Speculative";
  return "Low Confidence";
}

function SignalCard({
  signal,
  index,
}: {
  signal: StrongSignal;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:border-white/10"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium text-white/20 tabular-nums">
                #{index + 1}
              </span>
              <Badge
                variant="outline"
                className={
                  categoryColors[signal.category?.toLowerCase()] ||
                  categoryColors.default
                }
              >
                {signal.category}
              </Badge>
            </div>
            <h3 className="mt-2 text-sm font-medium text-white/70 transition-colors group-hover:text-white/90">
              {signal.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs font-medium tabular-nums"
              style={{
                color: confidenceColor(signal.confidenceScore).replace(
                  "bg-",
                  "text-",
                ),
              }}
            >
              {signal.confidenceScore}%
            </span>
            <svg
              className={`size-4 text-white/20 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/20">
              {confidenceText(signal.confidenceScore)}
            </span>
            <span className="text-[10px] text-white/20 tabular-nums">
              {signal.confidenceScore}%
            </span>
          </div>
          <Progress value={signal.confidenceScore}>
            <ProgressIndicator
              className={`${confidenceColor(signal.confidenceScore)} h-1 rounded-full`}
            />
          </Progress>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          <div>
            <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/20">
              Evidence
            </h4>
            <ul className="space-y-2">
              {signal.evidence.map((ev, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-white/40"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/20" />
                  <div>
                    <span className="text-white/50">{ev.detail}</span>
                    <span className="ml-1.5 text-white/20">
                      (source: {ev.source}
                      {ev.direct ? ", direct" : ""})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/20">
              Reasoning
            </h4>
            <p className="text-xs leading-relaxed text-white/40">
              {signal.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function StrongSignalsSection({ signals }: { signals: StrongSignal[] }) {
  if (!signals.length) return null;

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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Strong Signals</h2>
        <span className="text-xs text-white/20">({signals.length})</span>
      </div>

      <div className="grid gap-3">
        {signals.map((signal, i) => (
          <SignalCard key={i} signal={signal} index={i} />
        ))}
      </div>
    </section>
  );
}
