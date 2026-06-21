import { ProviderType } from "../types";
import { ProviderAdapter, ProviderConfig } from "./types";
import { ZenProvider } from "./zen";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";
import { FeatherlessProvider } from "./featherless";
import { OllamaProvider } from "./ollama";

type ProviderConstructor = new (config: ProviderConfig) => ProviderAdapter;

interface ProviderRegistration {
  constructor: ProviderConstructor;
  config: ProviderConfig | null;
}

function loadConfig(): Record<ProviderType, ProviderRegistration> {
  return {
    zen: {
      constructor: ZenProvider,
      config: {
        apiKey: process.env.ZEN_API_KEY!,
        baseUrl: process.env.ZEN_BASE_URL || "https://opencode.ai/zen/v1",
        defaultModel: process.env.ZEN_MODEL || "deepseek-v4-flash",
        maxTokens: 8192,
        temperature: 0.7,
      },
    },
    openai: {
      constructor: OpenAIProvider,
      config: process.env.OPENAI_API_KEY
        ? {
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: "https://api.openai.com/v1",
            defaultModel: process.env.OPENAI_MODEL || "gpt-4o",
            maxTokens: 8192,
            temperature: 0.7,
          }
        : null,
    },
    anthropic: {
      constructor: AnthropicProvider,
      config: process.env.ANTHROPIC_API_KEY
        ? {
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseUrl: "https://api.anthropic.com/v1",
            defaultModel:
              process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
            maxTokens: 8192,
            temperature: 0.7,
          }
        : null,
    },
    gemini: {
      constructor: GeminiProvider,
      config: process.env.GOOGLE_API_KEY
        ? {
            apiKey: process.env.GOOGLE_API_KEY,
            baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
            defaultModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
            maxTokens: 8192,
            temperature: 0.7,
          }
        : null,
    },
    openrouter: {
      constructor: OpenRouterProvider,
      config: process.env.OPENROUTER_API_KEY
        ? {
            apiKey: process.env.OPENROUTER_API_KEY,
            baseUrl: "https://openrouter.ai/api/v1",
            defaultModel:
              process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free",
            maxTokens: 8192,
            temperature: 0.7,
          }
        : null,
    },
    featherless: {
      constructor: FeatherlessProvider,
      config: process.env.FEATHERLESS_API_KEY
        ? {
            apiKey: process.env.FEATHERLESS_API_KEY,
            baseUrl: "https://api.featherless.ai/v1",
            defaultModel:
              process.env.FEATHERLESS_MODEL ||
              "meta-llama/Meta-Llama-3.1-70B-Instruct",
            maxTokens: 8192,
            temperature: 0.7,
          }
        : null,
    },
    ollama: {
      constructor: OllamaProvider,
      config: {
        apiKey: process.env.OLLAMA_API_KEY || "",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
        defaultModel: process.env.OLLAMA_MODEL || "llama3.2",
        maxTokens: 4096,
        temperature: 0.7,
      },
    },
  };
}

export class ProviderFactory {
  private static registry = loadConfig();

  static getDefaultProvider(): ProviderAdapter {
    const providerType = (process.env.AI_PROVIDER || "zen") as ProviderType;
    return ProviderFactory.createProvider(providerType);
  }

  static createProvider(type: ProviderType): ProviderAdapter {
    const registration = ProviderFactory.registry[type];
    if (!registration) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    if (!registration.config) {
      throw new Error(
        `Provider "${type}" is not configured. Set the required environment variable.`,
      );
    }
    return new registration.constructor(registration.config);
  }

  static getAllAvailableProviders(): ProviderAdapter[] {
    const providers: ProviderAdapter[] = [];
    for (const [type, registration] of Object.entries(
      ProviderFactory.registry,
    )) {
      if (registration.config) {
        providers.push(new registration.constructor(registration.config));
      }
    }
    return providers;
  }

  static getAvailableProviderTypes(): ProviderType[] {
    const types: ProviderType[] = [];
    for (const [type, registration] of Object.entries(
      ProviderFactory.registry,
    )) {
      if (registration.config) {
        types.push(type as ProviderType);
      }
    }
    return types;
  }

  static hasProvider(type: ProviderType): boolean {
    const registration = ProviderFactory.registry[type];
    return registration?.config !== null && registration?.config !== undefined;
  }

  static resetRegistry(): void {
    ProviderFactory.registry = loadConfig();
  }
}
