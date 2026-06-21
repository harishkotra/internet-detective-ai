"use client";

import { ArrowDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const scrollToForm = () => {
    document
      .getElementById("investigation-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <div className="animate-float mb-2 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60">
          <Search className="size-3.5" />
          AI-Powered Digital Profiling
        </div>

        <h1 className="text-gradient-viral text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          We Analyzed Your Entire
          <br />
          <span className="text-white">Internet Personality.</span>
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-white/50 sm:text-xl">
          Paste your LinkedIn, GitHub, Twitter — and get a brutally honest AI
          investigation. Uncover hidden signals, roast your own profile, and see
          what the internet really says about you.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="glow h-12 cursor-pointer rounded-full bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 hover:glow-intense"
            onClick={scrollToForm}
          >
            Start Investigation
            <ArrowDown className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 cursor-pointer rounded-full border-white/20 px-8 text-base font-medium text-white/70 hover:bg-white/5 hover:text-white"
            onClick={scrollToForm}
          >
            See Examples
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/30">
          <span>🔍 LinkedIn Analysis</span>
          <span>💻 GitHub Deep Dive</span>
          <span>🐦 Twitter/X Roast</span>
          <span>🧠 AI Career Prediction</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="size-5 text-white/20" />
      </div>
    </section>
  );
}
