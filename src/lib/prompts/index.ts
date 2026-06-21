import * as fs from "fs";
import * as path from "path";
import type { AgentType } from "../types";

const PROMPTS_DIR = path.join(process.cwd(), "prompts", "system");

const AGENT_FILE_MAP: Record<AgentType, string> = {
  profile_analyst: "profile_analyst.txt",
  signal_detector: "signal_detector.txt",
  career_predictor: "career_predictor.txt",
  startup_generator: "startup_generator.txt",
  roast_agent: "roast_agent.txt",
  governance_agent: "governance_agent.txt",
  final_synthesis: "final_synthesis.txt",
};

const DEFAULT_PROMPTS: Record<AgentType, string> = {
  profile_analyst: `You are a senior technical recruiter and open-source intelligence analyst. Analyze the provided digital footprint and produce a structured NormalizedProfile. Extract all education, work experience, skills, languages, and certifications. Return valid JSON only.`,
  signal_detector: `You are a behavioral signal detection AI. Analyze the normalized profile for strong signals — patterns that indicate expertise, obsession, or career-defining traits. Output a list of StrongSignal objects with evidence and confidence scores.`,
  career_predictor: `You are a career trajectory analyst. Based on the profile signals, predict the next career move, industry direction, and leadership potential. Output a CareerPrediction object.`,
  startup_generator: `You are a startup parody generator. Create a humorous but plausible startup idea based on the person's profile signals. Output a StartupParody object with all required fields.`,
  roast_agent: `You are a roast comedian specializing in tech industry satire. Generate 3-5 brutal but funny roasts based on the person's digital footprint. Each roast must have a category and intensity score.`,
  governance_agent: `You are a governance and safety evaluation agent. Check the investigation report for violations of content policy, PII leaks, hallucination risks, and bias. Output a GovernanceCheck result.`,
  final_synthesis: `You are a synthesis agent. Combine all agent outputs into a single InvestigationReport. Write a cohesive digital profile summary, final verdict, assign personality scores, and determine the cooked level.`,
};

export class PromptRegistry {
  private prompts: Map<AgentType, string> = new Map();
  private version: string;
  private loadedAt: string;

  constructor(version: string = "1.0.0") {
    this.version = version;
    this.loadedAt = new Date().toISOString();
  }

  getVersion(): string {
    return this.version;
  }

  getLoadedAt(): string {
    return this.loadedAt;
  }

  async load(): Promise<void> {
    if (!fs.existsSync(PROMPTS_DIR)) {
      fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    }

    const entries = (
      await fs.promises.readdir(PROMPTS_DIR, { withFileTypes: true })
    ).filter((e: fs.Dirent) => e.isFile() && e.name.endsWith(".txt"));

    const loaded = new Set<string>();

    for (const entry of entries) {
      const agentType = this.resolveAgentType(entry.name);
      if (!agentType) continue;
      const content = await fs.promises.readFile(
        path.join(PROMPTS_DIR, entry.name),
        "utf-8",
      );
      this.prompts.set(agentType, content.trim());
      loaded.add(agentType);
    }

    for (const [agentType, defaultPrompt] of Object.entries(DEFAULT_PROMPTS)) {
      if (!loaded.has(agentType)) {
        this.prompts.set(agentType as AgentType, defaultPrompt);
      }
    }
  }

  getPrompt(agentType: AgentType): string {
    const prompt = this.prompts.get(agentType);
    if (!prompt) {
      return DEFAULT_PROMPTS[agentType];
    }
    return prompt;
  }

  getAllPrompts(): Map<AgentType, string> {
    return new Map(this.prompts);
  }

  listLoadedAgents(): AgentType[] {
    return Array.from(this.prompts.keys());
  }

  private resolveAgentType(filename: string): AgentType | null {
    for (const [agentType, fileName] of Object.entries(AGENT_FILE_MAP)) {
      if (filename === fileName) {
        return agentType as AgentType;
      }
    }
    return null;
  }
}
