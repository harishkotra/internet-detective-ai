import { NextRequest, NextResponse } from "next/server";
import { ContextBuilder } from "@/lib/context/builder";
import { InvestigationOrchestrator } from "@/lib/agents/orchestrator";
import { SafetyChecker } from "@/lib/safety";
import { ObservabilityTracker } from "@/lib/observability";
import { hashProfile } from "@/lib/utils";
import type { ProfileInput } from "@/lib/types";

const observability = new ObservabilityTracker();
const cache = new Map<
  string,
  { report: any; traces: any[]; governanceCheck: any }
>();

export async function POST(request: NextRequest) {
  try {
    const input: ProfileInput = await request.json();

    if (
      !input.linkedinUrl &&
      !input.githubUrl &&
      !input.twitterUrl &&
      !input.websiteUrl &&
      !input.resumeText &&
      !input.rawProfileText
    ) {
      return NextResponse.json(
        { error: "At least one profile input field is required" },
        { status: 400 },
      );
    }

    const safetyChecker = new SafetyChecker();
    const safetyCheck = safetyChecker.checkPrompt(JSON.stringify(input));
    if (!safetyCheck.passed) {
      return NextResponse.json(
        { error: "Input failed safety check", threats: safetyCheck.threats },
        { status: 400 },
      );
    }

    const profileHash = hashProfile(input);
    const cached = cache.get(profileHash);
    if (cached) {
      return NextResponse.json(cached);
    }

    const contextBuilder = new ContextBuilder();
    const context = await contextBuilder.build(input);

    const orchestrator = new InvestigationOrchestrator();
    const result = await orchestrator.investigate(context);

    await observability.recordInvestigation(result.report, result.traces);

    cache.set(profileHash, result);
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Investigation failed:", error);
    return NextResponse.json(
      { error: "Investigation failed", message: (error as Error).message },
      { status: 500 },
    );
  }
}
