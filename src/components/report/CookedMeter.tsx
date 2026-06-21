"use client";

import { CookedLevel } from "@/lib/types";

const cookedConfig: Record<
  CookedLevel,
  { emojis: string[]; label: string; gradient: string; glow: string }
> = {
  "Not Cooked": {
    emojis: ["🥩"],
    label: "Not Cooked",
    gradient: "from-green-500/20 via-green-500/5 to-transparent",
    glow: "shadow-green-500/5",
  },
  "Mildly Cooked": {
    emojis: ["🍳", "🔥"],
    label: "Mildly Cooked",
    gradient: "from-yellow-500/20 via-yellow-500/5 to-transparent",
    glow: "shadow-yellow-500/10",
  },
  Cooked: {
    emojis: ["🍖", "🔥", "🔥"],
    label: "Cooked",
    gradient: "from-orange-500/20 via-orange-500/5 to-transparent",
    glow: "shadow-orange-500/15",
  },
  "Deep Fried": {
    emojis: ["🍟", "🔥", "🔥", "🔥"],
    label: "Deep Fried",
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    glow: "shadow-red-500/20",
  },
  "Absolutely Cooked": {
    emojis: ["🔥", "🔥", "🔥", "🔥", "💀"],
    label: "Absolutely Cooked",
    gradient: "from-purple-500/20 via-red-500/10 to-transparent",
    glow: "shadow-purple-500/25",
  },
};

export function CookedMeter({ level }: { level: CookedLevel }) {
  const config = cookedConfig[level] || cookedConfig["Not Cooked"];

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
              d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Cooked Meter</h2>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${config.gradient} p-8 transition-all hover:border-white/10 ${config.glow}`}
      >
        <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-3xl" />

        <div className="relative flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-4xl">
            {config.emojis.map((emoji, i) => (
              <span
                key={i}
                className="inline-block animate-float"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          <div className="text-center">
            <h3 className="relative">
              <span className="inline-block px-4 py-1.5 text-lg font-bold text-white/80">
                {config.label}
              </span>
            </h3>
            <p className="mt-1 text-xs text-white/30">
              {level === "Not Cooked" && "Raw data. Minimal analysis applied."}
              {level === "Mildly Cooked" &&
                "Some patterns detected. Getting warmer."}
              {level === "Cooked" &&
                "Your internet presence has been thoroughly examined."}
              {level === "Deep Fried" && "We went deep. Very deep."}
              {level === "Absolutely Cooked" &&
                "There is no coming back from this."}
            </p>
          </div>

          <div className="flex w-full max-w-xs gap-1">
            {Object.keys(cookedConfig).map((lvl, i) => (
              <div
                key={lvl}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= Object.keys(cookedConfig).indexOf(level)
                    ? "bg-gradient-to-r from-yellow-500/60 via-orange-500/60 to-red-500/60"
                    : "bg-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
