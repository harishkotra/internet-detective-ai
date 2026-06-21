import { ProviderType } from "../types";

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: {
    type: "json_object" | "text";
  };
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
  provider: ProviderType;
}

export interface ProviderAdapter {
  name: ProviderType;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  getModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
