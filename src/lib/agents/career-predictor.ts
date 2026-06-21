import { BaseAgent, AgentConfig } from "./base";
import {
  ContextPack,
  StrongSignal,
  CareerPrediction,
  AgentTrace,
} from "../types";

const SYSTEM_PROMPT = `You are CareerPredictor, a career trajectory analyst who predicts future professional paths based on digital footprint evidence.

Analyze the ContextPack (normalized profile) and StrongSignals detected by SignalDetector to predict this person's career trajectory.

## What to Predict
1. **Next Role** — What specific role will they take next? Be concrete (e.g., "Staff Engineer at a Series B startup" not just "senior role")
2. **Industry Direction** — Will they stay in their current industry, pivot, go indie, found a startup?
3. **Leadership Potential** — Score 0-100: How likely are they to move into management/leadership?
4. **Future Opportunities** — 3-5 specific opportunities that align with their signal pattern
5. **Confidence** — How confident are you in this prediction (0-100)?

Rules:
- Base predictions ONLY on evidence present in the signals and profile
- Consider their trajectory, skills accumulation, working style, and hidden obsessions
- If they show founder patterns, predict that direction
- If they show deep IC expertise, predict staff/principal track
- Be specific, not generic

Return JSON in this exact format:
{
  "nextRole": "string — specific predicted next role",
  "industryDirection": "string — where they're headed industry-wise",
  "leadershipPotential": 75,
  "futureOpportunities": ["string — opportunity 1", "string — opportunity 2"],
  "confidence": 80
}`;

export interface CareerPredictorInput {
  context: ContextPack;
  strongSignals: StrongSignal[];
}

export class CareerPredictorAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "career_predictor",
      name: "Career Predictor",
      description:
        "Predicts future career trajectory based on detected signals",
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o",
      temperature: 0.5,
    };
    super(config);
  }

  async process(
    input: CareerPredictorInput,
  ): Promise<{ output: CareerPrediction; trace: AgentTrace }> {
    return this.safeProcess<CareerPrediction>(async () => {
      const startTime = new Date().toISOString();
      const start = performance.now();

      const userPrompt = this.buildPrompt(input.context, input.strongSignals);
      const { parsed, trace } =
        await this.callAIJSON<CareerPrediction>(userPrompt);

      const validated = this.validateOutput(parsed);

      const endTime = new Date().toISOString();
      const latency = performance.now() - start;

      const agentTrace: AgentTrace = {
        ...trace,
        agentName: this.config.name,
        input: { signalCount: input.strongSignals.length },
        output: validated,
        latency,
        startTime,
        endTime,
      };

      return { output: validated, trace: agentTrace };
    });
  }

  private buildPrompt(
    context: ContextPack,
    strongSignals: StrongSignal[],
  ): string {
    return `Predict the career trajectory for this person based on their profile and detected signals.

## Profile Summary
${context.summary}

## Normalized Profile
${JSON.stringify(context.normalized, null, 2)}

## Strong Signals (${strongSignals.length})
${JSON.stringify(strongSignals, null, 2)}

Analyze their career trajectory signals, strengths, weaknesses, working style, and hidden obsessions. What's their next move?`;
  }

  private validateOutput(output: CareerPrediction): CareerPrediction {
    return {
      nextRole: output.nextRole || "Unknown role",
      industryDirection: output.industryDirection || "Unknown direction",
      leadershipPotential: Math.min(
        100,
        Math.max(0, output.leadershipPotential || 0),
      ),
      futureOpportunities: Array.isArray(output.futureOpportunities)
        ? output.futureOpportunities
        : [],
      confidence: Math.min(100, Math.max(0, output.confidence || 0)),
    };
  }
}
