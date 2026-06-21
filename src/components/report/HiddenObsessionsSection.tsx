"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { HiddenObsession } from "@/lib/types";

function ObsessionCard({
  obsession,
  index,
}: {
  obsession: HiddenObsession;
  index: number;
}) {
  const hue = (index * 137.5) % 360;

  return (
    <Card className="group border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:border-white/10 hover:from-white/[0.05]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{
              backgroundColor: `oklch(0.3 0.1 ${hue} / 0.3)`,
              color: `oklch(0.7 0.15 ${hue})`,
            }}
          >
            {index + 1}
          </div>
          <CardTitle className="text-sm font-medium text-white/70">
            {obsession.theme}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/20">Intensity</span>
            <span className="text-[10px] text-white/20 tabular-nums">
              {obsession.intensity}%
            </span>
          </div>
          <Progress value={obsession.intensity}>
            <ProgressIndicator
              className="h-1 rounded-full"
              style={{
                background: `linear-gradient(to right, oklch(0.5 0.2 ${hue}), oklch(0.7 0.25 ${hue + 30}))`,
              }}
            />
          </Progress>
        </div>

        {obsession.evidence.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/20">
              Evidence
            </h4>
            <ul className="space-y-1.5">
              {obsession.evidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/20" />
                  <div className="text-xs text-white/40">
                    <span>{ev.detail}</span>
                    <span className="ml-1 text-white/20">({ev.source})</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HiddenObsessionsSection({
  obsessions,
}: {
  obsessions: HiddenObsession[];
}) {
  if (!obsessions.length) return null;

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
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Hidden Obsessions</h2>
        <span className="text-xs text-white/20">({obsessions.length})</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {obsessions.map((obsession, i) => (
          <ObsessionCard key={i} obsession={obsession} index={i} />
        ))}
      </div>
    </section>
  );
}
