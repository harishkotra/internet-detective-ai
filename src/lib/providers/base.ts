import { ProviderConfig } from "./types";
import {
  ProviderAdapter,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { ProviderType } from "../types";
import { retryWithBackoff } from "../utils";
import { AIProviderError } from "../errors";

export abstract class BaseProvider implements ProviderAdapter {
  abstract name: ProviderType;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chat(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;
  abstract getModels(): Promise<string[]>;

  async isAvailable(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch {
      return false;
    }
  }

  protected async executeWithRetry(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    return retryWithBackoff(() => this.chat(request), 3);
  }

  protected handleError(error: unknown, context: string): never {
    if (error instanceof AIProviderError) {
      throw error;
    }

    if (error instanceof Error) {
      const statusCode = this.extractStatusCode(error);
      const retryable = statusCode >= 500 || statusCode === 429;
      throw new AIProviderError(`${this.name}: ${context} - ${error.message}`, {
        code: this.errorCodeFromStatus(statusCode),
        statusCode,
        provider: this.name,
        retryable,
        cause: error,
      });
    }

    throw new AIProviderError(`${this.name}: ${context} - Unknown error`, {
      code: "UNKNOWN_ERROR",
      provider: this.name,
      retryable: false,
      cause: error,
    });
  }

  protected measureLatency<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; latency: number }> {
    const start = performance.now();
    return fn().then((result) => ({
      result,
      latency: performance.now() - start,
    }));
  }

  protected calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const { calculateCost } = require("../utils");
    return calculateCost(model, promptTokens, completionTokens);
  }

  private extractStatusCode(error: Error): number {
    if ("status" in error && typeof error.status === "number")
      return error.status;
    if ("statusCode" in error && typeof error.statusCode === "number")
      return error.statusCode;
    return 500;
  }

  private errorCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 429:
        return "RATE_LIMITED";
      case 500:
        return "SERVER_ERROR";
      case 502:
        return "BAD_GATEWAY";
      case 503:
        return "SERVICE_UNAVAILABLE";
      default:
        return "AI_PROVIDER_ERROR";
    }
  }
}
