import { BaseAgent, AgentConfig } from "./base";
import {
  ContextPack,
  Fact,
  StrongSignal,
  HiddenObsession,
  Evidence,
  AgentTrace,
} from "../types";

const SYSTEM_PROMPT = `You are SignalDetector, a behavioral pattern recognition AI. Your job is to analyze a person's digital footprint and detect strong signals that reveal who they really are.

Analyze the ContextPack (normalized profile) AND the extracted facts from ProfileAnalyst. Look for patterns, recurring themes, and evidence-based inferences.

## Strong Signal Categories
1. **career_trajectory** — How their career has evolved, promotions, pivots, growth
2. **strengths** — What they're exceptionally good at (supported by evidence)
3. **weaknesses** — Areas of inexperience, gaps, or patterns of struggle
4. **daily_activities** — What they actually spend time on (coding, writing, managing, designing)
5. **working_style** — Solo vs collaborative, structured vs chaotic, deep work vs context switching

## Hidden Obsessions
Detect recurring themes that reveal deep interests:
- A technology they keep coming back to
- A problem domain they seem obsessed with
- A methodology or philosophy they champion
- Topics they can't stop talking/writing about

Rules:
- EVERY signal must have at least 2 pieces of evidence
- Confidence scores must be 0-100 integers
- Only infer what the data supports — no guessing
- Reasoning should explain HOW the evidence leads to the conclusion

Return JSON in this exact format:
{
  "strongSignals": [
    {
      "title": "string — short label for this signal",
      "category": "string — one of the category names above",
      "evidence": [
        {
          "source": "string — where this evidence came from",
          "detail": "string — specific detail supporting the signal",
          "direct": true
        }
      ],
      "reasoning": "string — how the evidence leads to this conclusion",
      "confidenceScore": 85
    }
  ],
  "hiddenObsessions": [
    {
      "theme": "string — the recurring theme or obsession",
      "evidence": [
        {
          "source": "string",
          "detail": "string",
          "direct": true
        }
      ],
      "intensity": 70
    }
  ]
}`;

export interface SignalDetectorInput {
  context: ContextPack;
  facts: Fact[];
}

export interface SignalDetectorOutput {
  strongSignals: StrongSignal[];
  hiddenObsessions: HiddenObsession[];
}

export class SignalDetectorAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "signal_detector",
      name: "Signal Detector",
      description:
        "Detects patterns and evidence-based inferences from profile data",
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o",
      temperature: 0.4,
    };
    super(config);
  }

  async process(
    input: SignalDetectorInput,
  ): Promise<{ output: SignalDetectorOutput; trace: AgentTrace }> {
    return this.safeProcess<SignalDetectorOutput>(async () => {
      const startTime = new Date().toISOString();
      const start = performance.now();

      const userPrompt = this.buildPrompt(input.context, input.facts);
      const { parsed, trace } =
        await this.callAIJSON<SignalDetectorOutput>(userPrompt);

      const validated = this.validateOutput(parsed);

      const endTime = new Date().toISOString();
      const latency = performance.now() - start;

      const agentTrace: AgentTrace = {
        ...trace,
        agentName: this.config.name,
        input: { factCount: input.facts.length },
        output: validated,
        latency,
        startTime,
        endTime,
      };

      return { output: validated, trace: agentTrace };
    });
  }

  private buildPrompt(context: ContextPack, facts: Fact[]): string {
    return `Analyze this profile and its extracted facts to detect strong signals and hidden obsessions.

## Profile Summary
${context.summary}

## Normalized Profile
${JSON.stringify(context.normalized, null, 2)}

## Extracted Facts (${facts.length})
${JSON.stringify(facts, null, 2)}

## Key Signals
${context.keySignals.join(", ")}

Look for patterns across the career, skills, open source work, writing, and online presence. What are this person's defining traits? What are they obsessed with? What's their working style?`;
  }

  private validateOutput(output: SignalDetectorOutput): SignalDetectorOutput {
    const signals = Array.isArray(output.strongSignals)
      ? output.strongSignals
      : [];
    const obsessions = Array.isArray(output.hiddenObsessions)
      ? output.hiddenObsessions
      : [];

    return {
      strongSignals: signals.map((s) => ({
        title: s.title || "Untitled Signal",
        category: [
          "career_trajectory",
          "strengths",
          "weaknesses",
          "daily_activities",
          "working_style",
        ].includes(s.category)
          ? s.category
          : "strengths",
        evidence: Array.isArray(s.evidence) ? s.evidence : [],
        reasoning: s.reasoning || "",
        confidenceScore: Math.min(100, Math.max(0, s.confidenceScore || 50)),
      })),
      hiddenObsessions: obsessions.map((o) => ({
        theme: o.theme || "Unknown Theme",
        evidence: Array.isArray(o.evidence) ? o.evidence : [],
        intensity: Math.min(100, Math.max(0, o.intensity || 50)),
      })),
    };
  }
}
