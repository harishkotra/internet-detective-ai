import { v4 as uuidv4 } from "uuid";
import { ProviderFactory } from "./providers/factory";
import {
  ProviderAdapter,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./providers/types";
import { ProviderType, AgentTrace, TokenUsage } from "./types";
import { calculateCost } from "./utils";

export interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  responseFormat?: "json_object" | "text";
  provider?: ProviderType;
  agentName?: string;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  trace: AgentTrace;
}

export class AIService {
  private provider: ProviderAdapter;

  constructor(provider?: ProviderAdapter) {
    this.provider = provider || ProviderFactory.getDefaultProvider();
  }

  async chat(options: AIRequestOptions): Promise<AIResponse> {
    const startTime = new Date().toISOString();
    const agentName = options.agentName || "default";
    const agentId = uuidv4();
    const providerName = this.provider.name;
    const model = options.model;
    const start = performance.now();

    const messages: ChatCompletionRequest["messages"] = [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ];

    const request: ChatCompletionRequest = {
      model: model || this.getDefaultModel(),
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      responseFormat: options.responseFormat
        ? { type: options.responseFormat }
        : undefined,
    };

    try {
      const response = await this.provider.chat(request);
      const endTime = new Date().toISOString();
      const latency = response.latency;

      const trace: AgentTrace = {
        agentId,
        agentName,
        input: {
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
        },
        output: response.content,
        latency,
        tokenUsage: response.usage,
        cost: calculateCost(
          response.model,
          response.usage.promptTokens,
          response.usage.completionTokens,
        ),
        model: response.model,
        provider: providerName,
        startTime,
        endTime,
        success: true,
      };

      return { content: response.content, trace };
    } catch (error) {
      const endTime = new Date().toISOString();
      const latency = performance.now() - start;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const trace: AgentTrace = {
        agentId,
        agentName,
        input: {
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
        },
        output: null,
        latency,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        model: model || this.getDefaultModel(),
        provider: providerName,
        startTime,
        endTime,
        success: false,
        error: errorMessage,
      };

      return { content: "", trace };
    }
  }

  async chatJSON<T>(
    options: AIRequestOptions,
  ): Promise<{ parsed: T; trace: AgentTrace }> {
    const jsonOptions: AIRequestOptions = {
      ...options,
      responseFormat: "json_object",
    };

    const response = await this.chat(jsonOptions);

    if (!response.trace.success) {
      throw new Error(`AI chat failed: ${response.trace.error}`);
    }

    const cleaned = response.content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();

    let parsed: T;
    try {
      parsed = JSON.parse(cleaned) as T;
    } catch (parseError) {
      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}\nRaw content: ${response.content}`,
      );
    }

    return { parsed, trace: response.trace };
  }

  setProvider(provider: ProviderAdapter): void {
    this.provider = provider;
  }

  getProvider(): ProviderAdapter {
    return this.provider;
  }

  switchProvider(type: ProviderType): void {
    this.provider = ProviderFactory.createProvider(type);
  }

  private getDefaultModel(): string {
    return ProviderFactory.createProvider(this.provider.name).name ===
      this.provider.name
      ? "gpt-4o"
      : "gpt-4o";
  }
}

export function createAIService(provider?: ProviderAdapter): AIService {
  return new AIService(provider);
}
