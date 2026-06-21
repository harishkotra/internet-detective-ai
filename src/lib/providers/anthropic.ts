import OpenAI from "openai";
import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class AnthropicProvider extends BaseProvider {
  name: ProviderType = "anthropic";
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 0,
      defaultHeaders: {
        "anthropic-version": "2023-06-01",
      },
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.config.defaultModel;

    return this.measureLatency(async () => {
      try {
        const systemMessages = request.messages.filter(
          (m) => m.role === "system",
        );
        const nonSystemMessages = request.messages.filter(
          (m) => m.role !== "system",
        );

        const response = await this.client.chat.completions.create({
          model,
          messages: nonSystemMessages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
          response_format:
            request.responseFormat?.type === "json_object"
              ? { type: "json_object" }
              : undefined,
          ...(systemMessages.length > 0 && {
            extra_body: {
              system: systemMessages.map((m) => m.content).join("\n"),
            },
          }),
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
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ];
  }
}
