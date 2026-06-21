"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { InvestigationReport } from "@/lib/types";
import { DigitalProfileSummary } from "@/components/report/DigitalProfileSummary";
import { FactsSection } from "@/components/report/FactsSection";
import { StrongSignalsSection } from "@/components/report/StrongSignalsSection";
import { HiddenObsessionsSection } from "@/components/report/HiddenObsessionsSection";
import { CoworkerQuotesSection } from "@/components/report/CoworkerQuotesSection";
import { StartupParodySection } from "@/components/report/StartupParodySection";
import { CareerPredictionSection } from "@/components/report/CareerPredictionSection";
import { BrutalRoastSection } from "@/components/report/BrutalRoastSection";
import { WildGuessesSection } from "@/components/report/WildGuessesSection";
import { FinalVerdictSection } from "@/components/report/FinalVerdictSection";
import { PersonalityScoresSection } from "@/components/report/PersonalityScoresSection";
import { CookedMeter } from "@/components/report/CookedMeter";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ReportHeader } from "@/components/report/ReportHeader";
import { LoadingInvestigation } from "@/components/report/LoadingInvestigation";

export default function InvestigationPage() {
  const params = useParams();
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;

    const stored = localStorage.getItem(`investigation_${id}`);
    if (stored) {
      setReport(JSON.parse(stored));
      setLoading(false);
      return;
    }

    const fromRedirect = localStorage.getItem(`investigation_redirect_${id}`);
    if (fromRedirect) {
      localStorage.removeItem(`investigation_redirect_${id}`);
      setReport(JSON.parse(fromRedirect));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [params.id]);

  if (loading) return <LoadingInvestigation />;
  if (!report)
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="mb-4 text-white/40">Investigation not found.</p>
          <a
            href="/"
            className="text-blue-400 transition-colors hover:text-blue-300"
          >
            Start a new one
          </a>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-12">
        <ReportHeader report={report} />
        <DigitalProfileSummary summary={report.digitalProfileSummary} />
        <FactsSection facts={report.facts} />
        <StrongSignalsSection signals={report.strongSignals} />
        <HiddenObsessionsSection obsessions={report.hiddenObsessions} />
        <CoworkerQuotesSection quotes={report.coworkerQuotes} />
        <StartupParodySection parody={report.startupParody} />
        <CareerPredictionSection prediction={report.careerPrediction} />
        <BrutalRoastSection roasts={report.brutalRoast} />
        <WildGuessesSection guesses={report.wildGuesses} />
        <FinalVerdictSection verdict={report.finalVerdict} />
        <PersonalityScoresSection scores={report.personalityScores} />
        <CookedMeter level={report.cookedLevel} />
        <ShareButtons report={report} />
        <footer className="border-t border-white/5 px-4 py-8 text-center text-xs text-white/25">
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
        </footer>
      </div>
    </div>
  );
}
