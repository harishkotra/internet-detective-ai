import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
} from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const scoreData = [
  { label: "Builder", value: 72, color: "bg-blue-400" },
  { label: "Operator", value: 58, color: "bg-emerald-400" },
  { label: "Creator", value: 85, color: "bg-purple-400" },
  { label: "Founder", value: 44, color: "bg-amber-400" },
  { label: "Chaos", value: 91, color: "bg-red-400" },
];

const sampleRoast = [
  {
    line: "Your GitHub is 70% forked repos and one unfinished 'project' from 2023.",
    category: "Code",
  },
  {
    line: "You've changed jobs 4 times in 3 years and each title is somehow more vague than the last.",
    category: "Career",
  },
  {
    line: "Your Twitter bio says 'thought leader' but your last 10 retweets are all memes.",
    category: "Social",
  },
];

export function ExampleReport() {
  return (
    <section className="relative w-full px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-white/10 text-xs text-white/50"
          >
            Example Report
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What you&apos;ll get
          </h2>
          <p className="mt-3 text-white/40">
            A real investigation of a fictional victim. Results may vary.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-white/5 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <span className="flex size-5 items-center justify-center rounded bg-white/10 text-[10px]">
                  📊
                </span>
                Internet Personality Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {scoreData.map((score) => (
                <Progress
                  key={score.label}
                  value={score.value}
                  className="flex-wrap"
                >
                  <ProgressLabel className="text-xs text-white/50">
                    {score.label}
                  </ProgressLabel>
                  <span className="ml-auto text-xs text-white/30 tabular-nums">
                    {score.value}%
                  </span>
                  <ProgressIndicator
                    className={`${score.color} h-1.5 rounded-full`}
                  />
                </Progress>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <span className="flex size-5 items-center justify-center rounded bg-white/10 text-[10px]">
                  🔥
                </span>
                Sample Roast
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {sampleRoast.map((roast, i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="secondary"
                      className="mt-0.5 shrink-0 bg-white/5 text-[10px] text-white/40"
                    >
                      {roast.category}
                    </Badge>
                    <p className="text-xs leading-relaxed text-white/50">
                      &ldquo;{roast.line}&rdquo;
                    </p>
                  </div>
                  {i < sampleRoast.length - 1 && (
                    <Separator className="mt-3 bg-white/5" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-white/[0.03] md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <span className="flex size-5 items-center justify-center rounded bg-white/10 text-[10px]">
                  🚀
                </span>
                Startup Parody Generated For You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white/80">
                    CommitStrip
                  </span>
                  <Badge
                    variant="outline"
                    className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400"
                  >
                    Pre-Seed
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  AI-powered merch that auto-generates dopamine-wrapped t-shirts
                  from your Git commit messages.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-white/30">Business Model</span>
                    <span className="text-white/50">
                      Freemium + emotional damage DLC
                    </span>
                  </div>
                  <div>
                    <span className="block text-white/30">Biggest Risk</span>
                    <span className="text-white/50">
                      CEO spends all runway on domain names
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
