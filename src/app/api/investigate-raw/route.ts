import { NextRequest, NextResponse } from "next/server";
import { ContextBuilder } from "@/lib/context/builder";
import { InvestigationOrchestrator } from "@/lib/agents/orchestrator";
import { SafetyChecker } from "@/lib/safety";
import { hashProfile } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      !body.text ||
      typeof body.text !== "string" ||
      body.text.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "raw text is required" },
        { status: 400 },
      );
    }

    const safetyChecker = new SafetyChecker();
    const safetyCheck = safetyChecker.checkPrompt(body.text);
    if (!safetyCheck.passed) {
      return NextResponse.json(
        { error: "Input failed safety check", threats: safetyCheck.threats },
        { status: 400 },
      );
    }

    const input = { rawProfileText: body.text };
    const profileHash = hashProfile(input);

    const contextBuilder = new ContextBuilder();
    const context = await contextBuilder.build(input);

    const orchestrator = new InvestigationOrchestrator();
    const result = await orchestrator.investigate(context);

    return NextResponse.json({ ...result, profileHash });
  } catch (error) {
    console.error("Raw investigation failed:", error);
    return NextResponse.json(
      { error: "Raw investigation failed", message: (error as Error).message },
      { status: 500 },
    );
  }
}
