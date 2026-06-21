import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class AnthropicProvider extends BaseProvider {
  name: ProviderType = "anthropic";
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

      const systemMessages = request.messages.filter(
        (m) => m.role === "system",
      );
      const nonSystemMessages = request.messages.filter(
        (m) => m.role !== "system",
      );

      const body: Record<string, unknown> = {
        model: request.model || this.config.defaultModel,
        messages: nonSystemMessages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
      };

      if (request.responseFormat?.type === "json_object") {
        body.response_format = { type: "json_object" };
      }

      if (systemMessages.length > 0) {
        body.extra_body = {
          system: systemMessages.map((m) => m.content).join("\n"),
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "anthropic-version": "2023-06-01",
        },
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
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ];
  }
}
