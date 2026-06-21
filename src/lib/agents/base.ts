import { AIService, AIRequestOptions, AIResponse } from "../ai";
import { AgentType, AgentTrace, TokenUsage } from "../types";
import { PromptRegistry } from "../prompts";
import { generateId, calculateCost } from "../utils";

export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  promptRegistry?: PromptRegistry;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected ai: AIService;

  constructor(config: AgentConfig, ai?: AIService) {
    this.config = config;
    this.ai = ai || new AIService();
    this.resolvePrompt();
  }

  private resolvePrompt(): void {
    if (this.config.promptRegistry) {
      const registryPrompt = this.config.promptRegistry.getPrompt(
        this.config.type,
      );
      if (registryPrompt) {
        this.config.systemPrompt = registryPrompt;
      }
    }
  }

  abstract process(input: any): Promise<{ output: any; trace: AgentTrace }>;

  protected buildTrace(
    input: unknown,
    output: unknown,
    startTime: string,
    endTime: string,
    latency: number,
    tokenUsage: TokenUsage,
    model: string,
    provider: string,
    success: boolean,
    error?: string,
  ): AgentTrace {
    return {
      agentId: generateId(),
      agentName: this.config.name,
      input,
      output,
      latency,
      tokenUsage,
      cost: calculateCost(
        model,
        tokenUsage.promptTokens,
        tokenUsage.completionTokens,
      ),
      model,
      provider,
      startTime,
      endTime,
      success,
      error,
    };
  }

  protected async callAI(
    userPrompt: string,
    responseFormat?: "json_object" | "text",
  ): Promise<AIResponse> {
    return this.ai.chat({
      systemPrompt: this.config.systemPrompt,
      userPrompt,
      model: this.config.model,
      temperature: this.config.temperature,
      responseFormat,
      agentName: this.config.name,
    });
  }

  protected async callAIJSON<T>(
    userPrompt: string,
  ): Promise<{ parsed: T; trace: AgentTrace }> {
    return this.ai.chatJSON<T>({
      systemPrompt: this.config.systemPrompt,
      userPrompt,
      model: this.config.model,
      temperature: this.config.temperature,
      responseFormat: "json_object",
      agentName: this.config.name,
    });
  }

  protected async safeProcess<T>(
    processFn: () => Promise<{ output: T; trace: AgentTrace }>,
  ): Promise<{ output: T; trace: AgentTrace }> {
    return await processFn();
  }
}
