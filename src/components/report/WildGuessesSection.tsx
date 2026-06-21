"use client";

import { Progress, ProgressIndicator } from "@/components/ui/progress";
import { WildGuess } from "@/lib/types";

function GuessCard({ guess, index }: { guess: WildGuess; index: number }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-5 transition-all hover:border-white/10">
      <div className="flex items-start gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-xs font-bold text-purple-400">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-sm leading-relaxed text-white/60 transition-colors group-hover:text-white/70">
              {guess.prediction}
            </p>
            <p className="text-xs text-white/25 italic">{guess.reasoning}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/20">Confidence</span>
              <span className="text-[10px] text-white/20 tabular-nums">
                {guess.confidence}%
              </span>
            </div>
            <Progress value={guess.confidence}>
              <ProgressIndicator
                className="h-1 rounded-full"
                style={{
                  background:
                    guess.confidence >= 60
                      ? "linear-gradient(to right, oklch(0.5 0.2 280), oklch(0.6 0.2 320))"
                      : "linear-gradient(to right, oklch(0.4 0.1 60), oklch(0.5 0.15 30))",
                }}
              />
            </Progress>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WildGuessesSection({ guesses }: { guesses: WildGuess[] }) {
  if (!guesses.length) return null;

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
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Wild Guesses</h2>
        <span className="text-xs text-white/20">({guesses.length})</span>
      </div>

      <div className="relative mb-2">
        <span className="inline-block rounded-full border border-yellow-500/15 bg-yellow-500/5 px-2.5 py-0.5 text-[10px] text-yellow-400/60">
          Purely speculative &mdash; we have no evidence for these
        </span>
      </div>

      <div className="grid gap-3">
        {guesses.map((guess, i) => (
          <GuessCard key={i} guess={guess} index={i} />
        ))}
      </div>
    </section>
  );
}
