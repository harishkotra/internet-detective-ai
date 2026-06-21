import { HeroSection } from "@/components/landing/HeroSection";
import { InvestigationForm } from "@/components/landing/InvestigationForm";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ExampleReport } from "@/components/landing/ExampleReport";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <InvestigationForm />
        <FeaturesSection />
        <ExampleReport />
      </main>

      <footer className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-white/25 sm:flex-row sm:text-left">
          <p>
            Built by{" "}
            <a
              href="https://harishkotra.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-colors hover:text-white/60"
            >
              Harish Kotra
            </a>
            {" · "}
            <a
              href="https://dailybuild.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-colors hover:text-white/60"
            >
              Check out my other builds
            </a>
          </p>
          <p>
            Not affiliated with LinkedIn, GitHub, or X/Twitter. Roasts may
            sting.
          </p>
        </div>
      </footer>
    </div>
  );
}
