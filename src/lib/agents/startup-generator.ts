import { BaseAgent, AgentConfig } from "./base";
import { ContextPack, StrongSignal, StartupParody, AgentTrace } from "../types";

const SYSTEM_PROMPT = `You are StartupGenerator, a startup parody generator. You create hilarious but eerily plausible startup ideas based on a person's digital footprint.

Analyze the person's profile and strong signals, then imagine the most absurd-but-believable startup they would actually found.

## The Formula
Take their actual skills, obsessions, and personality — then extrapolate to a startup that:
- Sounds exactly like something they'd build
- Uses their favorite technologies
- Solves a problem only they care about
- Has a ridiculous but plausible business model
- Will fail in a way that's perfectly on-brand

## Requirements
- The name should be a portmanteau or tech-neologism that reflects their interests
- The tagline should sound like a real YC startup pitch
- Funding stage should be realistic (Pre-Seed to Series A, given their profile)
- The investor pitch should be 3-5 sentences of pure VC-bait
- Business model: make something up that's technically feasible and absurd
- Biggest risk: a real risk dressed in humorous language
- Most likely cause of failure: specific to their personality flaws

Be absolutely hilarious but keep every element tied to EVIDENCE from their profile.

Return JSON in this exact format:
{
  "name": "string — startup name",
  "tagline": "string — one-line pitch",
  "fundingStage": "string — e.g., Pre-Seed, Seed, Series A",
  "investorPitch": "string — 3-5 sentence pitch to VCs",
  "businessModel": "string — how it makes money",
  "biggestRisk": "string — the biggest risk factor",
  "mostLikelyCauseOfFailure": "string — how it will die"
}`;

export interface StartupGeneratorInput {
  context: ContextPack;
  strongSignals: StrongSignal[];
}

export class StartupGeneratorAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "startup_generator",
      name: "Startup Generator",
      description: "Creates a humorous but evidence-based startup parody",
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.8,
    };
    super(config);
  }

  async process(
    input: StartupGeneratorInput,
  ): Promise<{ output: StartupParody; trace: AgentTrace }> {
    return this.safeProcess<StartupParody>(async () => {
      const startTime = new Date().toISOString();
      const start = performance.now();

      const userPrompt = this.buildPrompt(input.context, input.strongSignals);
      const { parsed, trace } =
        await this.callAIJSON<StartupParody>(userPrompt);

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
    return `Create a hilarious startup parody based on this person's profile.

## Profile Summary
${context.summary}

## Key Skills & Background
${JSON.stringify(context.normalized.skills, null, 2)}

## Work Experience
${JSON.stringify(context.normalized.workExperience, null, 2)}

## GitHub Profile
${JSON.stringify(context.normalized.githubRepos, null, 2)}

## Strong Signals
${JSON.stringify(strongSignals, null, 2)}

Generate a startup that this exact person would found. Make it funny but rooted in their actual profile.`;
  }

  private validateOutput(output: StartupParody): StartupParody {
    return {
      name: output.name || "Unnamed Startup",
      tagline: output.tagline || "A startup",
      fundingStage: output.fundingStage || "Pre-Seed",
      investorPitch: output.investorPitch || "No pitch available.",
      businessModel: output.businessModel || "TBD",
      biggestRisk: output.biggestRisk || "Unknown",
      mostLikelyCauseOfFailure: output.mostLikelyCauseOfFailure || "Unknown",
    };
  }
}
