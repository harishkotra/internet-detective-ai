"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fact } from "@/lib/types";

const categoryColors: Record<string, string> = {
  career: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  education: "border-green-500/20 bg-green-500/10 text-green-400",
  skills: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  social: "border-pink-500/20 bg-pink-500/10 text-pink-400",
  github: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  work: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  default: "border-white/10 bg-white/5 text-white/40",
};

const sourceColors: Record<string, string> = {
  linkedin: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  github: "border-gray-500/20 bg-gray-500/10 text-gray-400",
  twitter: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  website: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  resume: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  default: "border-white/10 bg-white/5 text-white/40",
};

export function FactsSection({ facts }: { facts: Fact[] }) {
  if (!facts.length) return null;

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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Key Facts</h2>
        <span className="text-xs text-white/20">({facts.length})</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {facts.map((fact, i) => (
          <Card
            key={i}
            className="group border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:border-white/10 hover:from-white/[0.05]"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    categoryColors[fact.category?.toLowerCase()] ||
                    categoryColors.default
                  }
                >
                  {fact.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    sourceColors[fact.source?.toLowerCase()] ||
                    sourceColors.default
                  }
                >
                  {fact.source}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-xs font-normal leading-relaxed text-white/50 transition-colors group-hover:text-white/60">
                {fact.observation}
              </CardTitle>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
