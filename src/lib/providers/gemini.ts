import OpenAI from "openai";
import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class GeminiProvider extends BaseProvider {
  name: ProviderType = "gemini";
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 0,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.config.defaultModel;

    return this.measureLatency(async () => {
      try {
        const response = await this.client.chat.completions.create({
          model,
          messages: request.messages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 8192,
          response_format:
            request.responseFormat?.type === "json_object"
              ? { type: "json_object" }
              : undefined,
        });

        const choice = response.choices[0];
        const content = choice?.message?.content ?? "";

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
        this.handleError(error, "chat completion failed");
      }
    }).then(({ result, latency }) => ({
      ...result,
      latency,
    }));
  }

  async getModels(): Promise<string[]> {
    return [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ];
  }
}
