import { NextResponse } from "next/server";
import { PromptRegistry } from "@/lib/prompts";
import { AgentType } from "@/lib/types";

const registry = new PromptRegistry("1.0.0");
let loaded = false;

const AGENT_LABELS: Record<AgentType, string> = {
  profile_analyst: "Profile Analyst",
  signal_detector: "Signal Detector",
  career_predictor: "Career Predictor",
  startup_generator: "Startup Generator",
  roast_agent: "Roast Agent",
  governance_agent: "Governance Agent",
  final_synthesis: "Final Synthesis",
};

export async function GET() {
  try {
    if (!loaded) {
      await registry.load();
      loaded = true;
    }

    const all = registry.getAllPrompts();
    const prompts = Array.from(all.entries()).map(([type, content]) => ({
      agentType: type,
      agentLabel: AGENT_LABELS[type] || type,
      content,
      version: registry.getVersion(),
      loadedAt: registry.getLoadedAt(),
    }));

    return NextResponse.json({
      count: prompts.length,
      prompts,
    });
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts", message: (error as Error).message },
      { status: 500 },
    );
  }
}
