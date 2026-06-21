import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class OllamaProvider extends BaseProvider {
  name: ProviderType = "ollama";
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.measureLatency(async () => {
      const url = `${this.baseUrl}/chat/completions`;

      const body: Record<string, unknown> = {
        model: request.model || this.config.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        stream: false,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 300)}`);
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `API returned status ${response.status} with non-JSON body: "${rawText.slice(0, 200)}"`,
        );
      }

      if (!data.choices || !Array.isArray(data.choices) || !data.choices[0]) {
        const errMsg = `API returned no choices. Response: ${JSON.stringify(data).slice(0, 500)}`;
        throw new Error(errMsg);
      }

      const content = data.choices[0].message?.content ?? "";

      return {
        content,
        model: data.model || request.model || this.config.defaultModel,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        provider: this.name,
        latency: 0,
      };
    }).then(({ result, latency }) => ({
      ...result,
      latency,
    }));
  }

  async getModels(): Promise<string[]> {
    const base = this.baseUrl.replace(/\/v1\/?$/, "");
    const response = await fetch(`${base}/api/tags`);
    if (!response.ok) return [];

    let data: any;
    try {
      data = await response.json();
    } catch {
      return [];
    }

    return (data.models || []).map((m: any) => m.name);
  }
}
