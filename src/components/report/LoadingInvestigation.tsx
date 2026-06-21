"use client";

import { useEffect, useState } from "react";

const loadingMessages = [
  "Scraping your LinkedIn lies...",
  "Judging your GitHub commit messages...",
  "Analyzing your Twitter personality...",
  "Cross-referencing your job hops...",
  "Counting your unfinished side projects...",
  "Evaluating your tech stack choices...",
  "Measuring your industry buzzword density...",
  "Calculating your chaos potential...",
  "Generating your startup parody...",
  "Preparing your brutal roast...",
  "Summoning your coworker quotes...",
  "Writing your career prediction...",
  "Calibrating the Cooked Meter...",
  "Brewing the final verdict...",
];

export function LoadingInvestigation() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 2500);

    const dotInterval = setInterval(() => {
      setDotCount((c) => (c + 1) % 4);
    }, 500);

    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return p + Math.random() * 8;
      });
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(dotInterval);
      clearInterval(progInterval);
    };
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="size-16 animate-pulse rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-10 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-white/60">
                Analyzing your digital footprint
                <span className="tabular-nums">{dots}</span>
              </p>
              <p className="mt-2 text-xs text-white/25 transition-all duration-500">
                {loadingMessages[messageIndex]}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/20">
              <span>Investigation progress</span>
              <span className="tabular-nums">
                {Math.min(Math.round(progress), 99)}%
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500/60 to-purple-500/60 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 99)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-white/[0.03]"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
