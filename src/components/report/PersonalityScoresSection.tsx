"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { InternetPersonalityScores } from "@/lib/types";

interface ScoreConfig {
  label: string;
  key: keyof InternetPersonalityScores;
  color: string;
  gradient: string;
  icon: string;
}

const scores: ScoreConfig[] = [
  {
    label: "Builder",
    key: "builderScore",
    color: "text-blue-400",
    gradient: "from-blue-500/60 to-blue-400/60",
    icon: "🏗️",
  },
  {
    label: "Operator",
    key: "operatorScore",
    color: "text-emerald-400",
    gradient: "from-emerald-500/60 to-emerald-400/60",
    icon: "⚙️",
  },
  {
    label: "Creator",
    key: "creatorScore",
    color: "text-purple-400",
    gradient: "from-purple-500/60 to-purple-400/60",
    icon: "🎨",
  },
  {
    label: "Founder",
    key: "founderScore",
    color: "text-amber-400",
    gradient: "from-amber-500/60 to-amber-400/60",
    icon: "🚀",
  },
  {
    label: "Chaos",
    key: "chaosScore",
    color: "text-red-400",
    gradient: "from-red-500/60 to-red-400/60",
    icon: "🔥",
  },
];

export function PersonalityScoresSection({
  scores: scoreValues,
}: {
  scores: InternetPersonalityScores;
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
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">
          Internet Personality Scores
        </h2>
      </div>

      <Card className="border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:border-white/10">
        <CardHeader>
          <CardTitle className="text-xs font-normal text-white/30">
            Five dimensions of your internet archetype
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {scores.map((score) => {
            const value = scoreValues[score.key];
            return (
              <div key={score.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{score.icon}</span>
                    <span className={`text-sm ${score.color}`}>
                      {score.label}
                    </span>
                  </div>
                  <span
                    className={`text-sm tabular-nums font-medium ${score.color}`}
                  >
                    {value}%
                  </span>
                </div>
                <Progress value={value}>
                  <ProgressIndicator
                    className={`h-2 rounded-full bg-gradient-to-r ${score.gradient}`}
                  />
                </Progress>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
