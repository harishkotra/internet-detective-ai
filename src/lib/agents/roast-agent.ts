import { BaseAgent, AgentConfig } from "./base";
import {
  ContextPack,
  StrongSignal,
  Roast,
  CoworkerQuote,
  AgentTrace,
} from "../types";

const SYSTEM_PROMPT = `You are RoastAgent, a roast comedian specializing in tech industry satire. Your job is to create playful, hilarious roasts based on someone's digital footprint.

You will receive a person's profile and detected strong signals. Your mission:
1. Create 5 roasts that are funny but never mean-spirited
2. Create 5 coworker quotes that sound like real things colleagues would say about them
3. Write a final verdict — one memorable sentence that sums them up

## Roast Guidelines
- Each roast needs a line (the actual joke), a category, and intensity (1-10)
- Categories: coding_skills, career_choices, personality, online_presence, open_source, work_habits, communication, meeting_behavior
- Roasts should feel PERSONAL to this specific person's profile
- Puns, tech humor, and gentle teasing are encouraged
- NEVER cross into: offensive, discriminatory, or genuinely hurtful territory

## Coworker Quotes
- These should sound like authentic quotes from teammates
- Tones: playful, admiring, frustrated, impressed
- Each needs context (what prompted the quote)
- Make them specific to the person's actual skills and habits

## Final Verdict
One sentence that perfectly captures this person's professional essence. Memorable, quotable, slightly roasted.

Return JSON in this exact format:
{
  "roasts": [
    {
      "line": "string — the roast joke",
      "category": "string — one of the categories above",
      "intensity": 5
    }
  ],
  "coworkerQuotes": [
    {
      "quote": "string — what the coworker said",
      "context": "string — when/why they said it",
      "tone": "playful|admiring|frustrated|impressed"
    }
  ],
  "finalVerdict": "string — one memorable sentence"
}`;

export interface RoastAgentInput {
  context: ContextPack;
  strongSignals: StrongSignal[];
}

export interface RoastAgentOutput {
  roasts: Roast[];
  coworkerQuotes: CoworkerQuote[];
  finalVerdict: string;
}

export class RoastAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "roast_agent",
      name: "Roast Agent",
      description: "Creates playful, humorous roasts and coworker quotes",
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o",
      temperature: 0.9,
    };
    super(config);
  }

  async process(
    input: RoastAgentInput,
  ): Promise<{ output: RoastAgentOutput; trace: AgentTrace }> {
    return this.safeProcess<RoastAgentOutput>(async () => {
      const startTime = new Date().toISOString();
      const start = performance.now();

      const userPrompt = this.buildPrompt(input.context, input.strongSignals);
      const { parsed, trace } =
        await this.callAIJSON<RoastAgentOutput>(userPrompt);

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
    return `Roast this person based on their digital footprint.

## Profile Summary
${context.summary}

## Work Experience
${JSON.stringify(context.normalized.workExperience, null, 2)}

## Skills
${JSON.stringify(context.normalized.skills, null, 2)}

## GitHub
${JSON.stringify(context.normalized.githubRepos, null, 2)}

## Strong Signals
${JSON.stringify(strongSignals, null, 2)}

Create 5 roasts, 5 coworker quotes, and a final verdict. Be funny, be specific, be kind.`;
  }

  private validateOutput(output: RoastAgentOutput): RoastAgentOutput {
    const validTones = [
      "playful",
      "admiring",
      "frustrated",
      "impressed",
    ] as const;

    return {
      roasts: Array.isArray(output.roasts)
        ? output.roasts.slice(0, 5).map((r) => ({
            line: r.line || "No roast generated.",
            category: r.category || "personality",
            intensity: Math.min(10, Math.max(1, r.intensity || 5)),
          }))
        : [],
      coworkerQuotes: Array.isArray(output.coworkerQuotes)
        ? output.coworkerQuotes.slice(0, 5).map((q) => ({
            quote: q.quote || "...",
            context: q.context || "Unknown context",
            tone: validTones.includes(q.tone as any)
              ? q.tone
              : ("playful" as const),
          }))
        : [],
      finalVerdict: output.finalVerdict || "A complex character.",
    };
  }
}
