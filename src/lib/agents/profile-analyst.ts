import { BaseAgent, AgentConfig } from "./base";
import { ContextPack, Fact, AgentTrace, TokenUsage } from "../types";

const SYSTEM_PROMPT = `You are ProfileAnalyst, a senior technical recruiter and open-source intelligence analyst. Your job is to extract every meaningful fact from a person's normalized digital profile.

Analyze the provided ContextPack (which contains a NormalizedProfile) and extract structured facts. Look for:
1. **Job Titles & Roles** — current and past positions, title patterns
2. **Companies & Organizations** — where they've worked, size, reputation
3. **Education** — degrees, institutions, fields of study, graduation years
4. **Skills & Technologies** — programming languages, frameworks, tools, domains
5. **Location & Geography** — where they're based, relocation patterns
6. **Years of Experience** — total YOE, seniority level
7. **Open Source Contributions** — repos, stars, forks, languages, activity patterns
8. **Writing Samples** — blog posts, documentation, tweet topics, website content
9. **Speaking Engagements** — conferences, meetups, presentations
10. **Certifications & Languages** — formal credentials

Rules:
- Only include facts that are DIRECTLY supported by the profile data
- Every fact must cite its source (e.g., "linkedin", "github", "twitter", "website", "resume")
- Categories: job_title, company, education, skill, location, experience, open_source, writing, speaking, certification, language
- Be thorough — extract 10-30 facts depending on profile richness
- The digitalProfileSummary should be 2-3 paragraphs synthesizing who this person is professionally

Return JSON in this exact format:
{
  "facts": [
    {
      "observation": "string — the factual observation",
      "source": "string — where this came from",
      "category": "string — one of the categories above"
    }
  ],
  "digitalProfileSummary": "string — 2-3 paragraph professional summary"
}`;

export interface ProfileAnalystInput {
  context: ContextPack;
}

export interface ProfileAnalystOutput {
  facts: Fact[];
  digitalProfileSummary: string;
}

export class ProfileAnalystAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "profile_analyst",
      name: "Profile Analyst",
      description: "Extracts structured facts from normalized profile data",
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o",
      temperature: 0.3,
    };
    super(config);
  }

  async process(
    input: ProfileAnalystInput,
  ): Promise<{ output: ProfileAnalystOutput; trace: AgentTrace }> {
    return this.safeProcess<ProfileAnalystOutput>(async () => {
      const startTime = new Date().toISOString();
      const start = performance.now();

      const userPrompt = this.buildPrompt(input.context);
      const { parsed, trace } =
        await this.callAIJSON<ProfileAnalystOutput>(userPrompt);

      const validated = this.validateOutput(parsed);

      const endTime = new Date().toISOString();
      const latency = performance.now() - start;

      const agentTrace: AgentTrace = {
        ...trace,
        agentId: trace.agentId,
        agentName: this.config.name,
        input: { contextHash: this.hashContext(input.context) },
        output: validated,
        latency,
        startTime,
        endTime,
      };

      return { output: validated, trace: agentTrace };
    });
  }

  private buildPrompt(context: ContextPack): string {
    return `Analyze this digital profile and extract all meaningful facts.

Profile Summary: ${context.summary}

Normalized Profile (JSON):
${JSON.stringify(context.normalized, null, 2)}

Key Signals: ${context.keySignals.join(", ")}

Extract all structured facts from this profile data. Be thorough and only include evidence-backed facts.`;
  }

  private validateOutput(output: ProfileAnalystOutput): ProfileAnalystOutput {
    return {
      facts: Array.isArray(output.facts) ? output.facts : [],
      digitalProfileSummary:
        typeof output.digitalProfileSummary === "string"
          ? output.digitalProfileSummary
          : "Profile summary not available.",
    };
  }

  private hashContext(context: ContextPack): string {
    return `${context.normalized.displayName || "unknown"}_${context.timestamp}`;
  }
}
