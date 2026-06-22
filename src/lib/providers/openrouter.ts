import OpenAI from "openai";
import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class OpenRouterProvider extends BaseProvider {
  name: ProviderType = "openrouter";
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 0,
      defaultHeaders: {
        "HTTP-Referer": "https://internet-detective-ai.vercel.app",
        "X-Title": "Internet Detective AI",
      },
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.config.defaultModel;

    return this.measureLatency(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await this.client.chat.completions.create({
            model,
            messages: request.messages,
            temperature: request.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
            response_format:
              request.responseFormat?.type === "json_object"
                ? { type: "json_object" }
                : undefined,
          });

          if (
            !response.choices ||
            !Array.isArray(response.choices) ||
            !response.choices[0]?.message?.content
          ) {
            const errDetail = JSON.stringify(response).slice(0, 300);
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 10_000 * (attempt + 1)));
              continue;
            }
            throw new Error(
              `API returned no valid choices after 3 retries. Response: ${errDetail}`,
            );
          }

          const content = response.choices[0].message.content;

          return {
            content,
            model: response.model || model,
            usage: {
              promptTokens: response.usage?.prompt_tokens ?? 0,
              completionTokens: response.usage?.completion_tokens ?? 0,
              totalTokens: response.usage?.total_tokens ?? 0,
            },
            provider: this.name,
            latency: 0,
          };
        } catch (error) {
          if (attempt < 2) {
            const isTransient =
              error instanceof Error &&
              (error.message.includes("502") ||
                error.message.includes("503") ||
                error.message.includes("429") ||
                error.message.includes("timeout") ||
                error.message.includes("Cannot read properties"));
            if (isTransient) {
              await new Promise((r) => setTimeout(r, 10_000 * (attempt + 1)));
              continue;
            }
          }
          this.handleError(error, "chat completion failed");
        }
      }
      throw new Error("Unreachable");
    }).then(({ result, latency }) => ({
      ...result,
      latency,
    }));
  }

  async getModels(): Promise<string[]> {
    try {
      const list = await this.client.models.list();
      return list.data.map((m) => m.id);
    } catch (error) {
      this.handleError(error, "fetching model list failed");
    }
  }
}
