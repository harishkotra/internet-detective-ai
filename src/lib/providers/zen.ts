import OpenAI from "openai";
import { BaseProvider } from "./base";
import {
  ProviderConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";

export class ZenProvider extends BaseProvider {
  name: ProviderType = "zen";
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
    return this.measureLatency(async () => {
      try {
        const response = await this.client.chat.completions.create({
          model: request.model || this.config.defaultModel,
          messages: request.messages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens ?? 8192,
        });

        if (!response.choices || !response.choices[0]) {
          const errMsg = `API returned no choices. Response: ${JSON.stringify(response).slice(0, 500)}`;
          throw new Error(errMsg);
        }

        const choice = response.choices[0];
        const content = choice.message?.content ?? "";

        return {
          content,
          model: response.model || request.model,
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
    try {
      const list = await this.client.models.list();
      return list.data.map((m) => m.id);
    } catch (error) {
      this.handleError(error, "fetching model list failed");
    }
  }
}
