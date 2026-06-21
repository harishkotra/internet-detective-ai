import { NextRequest, NextResponse } from "next/server";
import {
  ProfileAnalystAgent,
  SignalDetectorAgent,
  CareerPredictorAgent,
  StartupGeneratorAgent,
  RoastAgent,
  GovernanceAgent,
  FinalSynthesisAgent,
} from "@/lib/agents";
import { SafetyChecker } from "@/lib/safety";
import type { AgentType } from "@/lib/types";

const AGENT_MAP: Record<
  AgentType,
  { name: string; description: string; new: () => any }
> = {
  profile_analyst: {
    name: "Profile Analyst",
    description: "Extracts structured facts from normalized profile data",
    new: () => new ProfileAnalystAgent(),
  },
  signal_detector: {
    name: "Signal Detector",
    description:
      "Detects patterns and evidence-based inferences from profile data",
    new: () => new SignalDetectorAgent(),
  },
  career_predictor: {
    name: "Career Predictor",
    description: "Predicts future career trajectory based on detected signals",
    new: () => new CareerPredictorAgent(),
  },
  startup_generator: {
    name: "Startup Generator",
    description: "Creates a humorous but evidence-based startup parody",
    new: () => new StartupGeneratorAgent(),
  },
  roast_agent: {
    name: "Roast Agent",
    description: "Creates playful, humorous roasts and coworker quotes",
    new: () => new RoastAgent(),
  },
  governance_agent: {
    name: "Governance Agent",
    description: "Validates outputs against ethical guidelines",
    new: () => new GovernanceAgent(),
  },
  final_synthesis: {
    name: "Final Synthesis",
    description:
      "Combines all agent outputs into the final InvestigationReport",
    new: () => new FinalSynthesisAgent(),
  },
};

const VALID_TYPES = Object.keys(AGENT_MAP);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Unknown agent type. Valid types: ${VALID_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const agent = AGENT_MAP[type as AgentType];
  return NextResponse.json({
    type,
    name: agent.name,
    description: agent.description,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Unknown agent type. Valid types: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const body = await request.json();

    const safetyChecker = new SafetyChecker();
    const safetyCheck = safetyChecker.checkPrompt(JSON.stringify(body));
    if (!safetyCheck.passed) {
      return NextResponse.json(
        { error: "Input failed safety check", threats: safetyCheck.threats },
        { status: 400 },
      );
    }

    const agent = AGENT_MAP[type as AgentType].new();
    const result = await agent.process(body);

    return NextResponse.json({
      agentType: type,
      agentName: AGENT_MAP[type as AgentType].name,
      output: result.output,
      trace: result.trace,
    });
  } catch (error) {
    console.error("Agent execution failed:", error);
    return NextResponse.json(
      { error: "Agent execution failed", message: (error as Error).message },
      { status: 500 },
    );
  }
}
