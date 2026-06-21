import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class ZenProvider extends BaseProvider {
  name: ProviderType = "zen";
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.measureLatency(async () => {
      const url = `${this.baseUrl}/chat/completions`;

      const body = JSON.stringify({
        model: request.model || this.config.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 8192,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body,
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

      const choice = data.choices[0];
      const content = choice.message?.content ?? "";

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
    const url = `${this.baseUrl}/models`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      return [];
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return [];
    }

    return (data.data || []).map((m: any) => m.id);
  }
}
