"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StartupParody } from "@/lib/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-medium uppercase tracking-wider text-white/20">
        {label}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-white/50">
        {value}
      </span>
    </div>
  );
}

export function StartupParodySection({ parody }: { parody: StartupParody }) {
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
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">
          Your Startup Parody
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent p-6 transition-all hover:border-amber-500/20">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-bold tracking-tight text-white/80">
                {parody.name}
              </h3>
              <Badge
                variant="outline"
                className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400"
              >
                {parody.fundingStage}
              </Badge>
            </div>
            <p className="text-sm text-white/40 italic">{parody.tagline}</p>
          </div>

          <Separator className="bg-white/5" />

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Investor Pitch" value={parody.investorPitch} />
            <DetailRow label="Business Model" value={parody.businessModel} />
            <DetailRow label="Biggest Risk" value={parody.biggestRisk} />
            <DetailRow
              label="Cause of Failure"
              value={parody.mostLikelyCauseOfFailure}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
