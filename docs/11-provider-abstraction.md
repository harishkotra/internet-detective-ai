# Provider Abstraction in Internet Detective AI

## Why Provider Abstraction Matters

LLM providers are not interchangeable. They differ in:
- **API format**: OpenAI-compatible vs. native SDKs
- **Pricing**: From $0.05/M tokens (Featherless) to $75/M tokens (Claude Opus)
- **Model availability**: Not all models are available on all providers
- **Capabilities**: JSON mode, streaming, function calling support
- **Reliability**: Different uptime, rate limits, and error patterns
- **Latency**: From <500ms (Gemini Flash) to >10s (Claude Opus)

Locking your application to a single provider creates vendor lock-in, single point of failure, and no ability to optimize for cost or performance.

Internet Detective AI's provider abstraction in `src/lib/providers/` enables:
- **Switching providers via environment variable**
- **Adding new providers without changing agent code**
- **Fallback strategies when a provider fails**
- **Consistent interface regardless of backend**

## The ProviderAdapter Interface

The core abstraction is the `ProviderAdapter` interface in `src/lib/providers/types.ts`:

```typescript
export interface ProviderAdapter {
  name: ProviderType;  // "zen" | "openai" | "anthropic" | "gemini" | "openrouter" | "featherless" | "ollama"
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  getModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
```

### ChatCompletionRequest
```typescript
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}
```

### ChatCompletionResponse
```typescript
export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latency: number;
  provider: ProviderType;
}
```

The interface is designed to mirror the OpenAI chat completions API — the de facto standard for LLM APIs. Every provider wraps their native format into this common interface.

## The BaseProvider Abstract Class

All providers extend `BaseProvider`, which provides shared infrastructure:

```typescript
export abstract class BaseProvider implements ProviderAdapter {
  abstract name: ProviderType;
  protected config: ProviderConfig;

  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract getModels(): Promise<string[]>;

  async isAvailable(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch { return false; }
  }

  protected async executeWithRetry(request: ChatCompletionRequest) {
    return retryWithBackoff(() => this.chat(request), 3);
  }

  protected handleError(error: unknown, context: string): never {
    // Maps error to AIProviderError with typed status codes
    // Status codes: BAD_REQUEST, UNAUTHORIZED, RATE_LIMITED, SERVER_ERROR, etc.
  }

  protected measureLatency<T>(fn: () => Promise<T>) {
    const start = performance.now();
    return fn().then((result) => ({ result, latency: performance.now() - start }));
  }
}
```

## The Factory Pattern

The `ProviderFactory` creates provider instances based on configuration:

```typescript
export class ProviderFactory {
  private static registry = loadConfig();

  static getDefaultProvider(): ProviderAdapter {
    const providerType = (process.env.AI_PROVIDER || "zen") as ProviderType;
    return ProviderFactory.createProvider(providerType);
  }

  static createProvider(type: ProviderType): ProviderAdapter {
    const registration = ProviderFactory.registry[type];
    if (!registration) throw new Error(`Unknown provider type: ${type}`);
    if (!registration.config) throw new Error(
      `Provider "${type}" is not configured. Set the required environment variable.`
    );
    return new registration.constructor(registration.config);
  }

  static getAllAvailableProviders(): ProviderAdapter[] {
    // Returns instances of all configured providers
  }

  static getAvailableProviderTypes(): ProviderType[] {
    // Returns ["zen", "openai"] (only those with API keys configured)
  }

  static hasProvider(type: ProviderType): boolean {
    // Check if a provider is configured
  }
}
```

The factory reads configuration lazily from environment variables:

```typescript
function loadConfig(): Record<ProviderType, ProviderRegistration> {
  return {
    zen: {
      constructor: ZenProvider,
      config: {
        apiKey: process.env.ZEN_API_KEY!,
        baseUrl: process.env.ZEN_BASE_URL || "https://api.opencode.ai/v1",
        defaultModel: process.env.ZEN_MODEL || "deepseek-v3",
        maxTokens: 8192,
      },
    },
    openai: {
      constructor: OpenAIProvider,
      config: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: "https://api.openai.com/v1",
        defaultModel: process.env.OPENAI_MODEL || "gpt-4o",
      } : null, // Provider not registered if no API key
    },
    // ... anthropic, gemini, openrouter, featherless, ollama
  };
}
```

## Adding a New Provider (Step by Step)

Adding a new provider (e.g., "Groq") requires 4 steps:

### Step 1: Add the Provider Type
In `src/lib/types.ts`:
```typescript
export type ProviderType =
  | "zen" | "openai" | "anthropic" | "gemini"
  | "openrouter" | "featherless" | "ollama" | "groq"; // ← Add here
```

### Step 2: Create the Provider Class
```typescript
// src/lib/providers/groq.ts
import OpenAI from "openai";
import { BaseProvider } from "./base";
import { ProviderConfig, ChatCompletionRequest, ChatCompletionResponse } from "./types";
import { ProviderType } from "../types";

export class GroqProvider extends BaseProvider {
  name: ProviderType = "groq";
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
      const response = await this.client.chat.completions.create({
        model: request.model || this.config.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        response_format: request.responseFormat?.type === "json_object"
          ? { type: "json_object" } : undefined,
      });

      const choice = response.choices[0];
      return {
        content: choice?.message?.content ?? "",
        model: response.model || request.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        provider: this.name,
        latency: 0,  // Will be filled by measureLatency
      };
    }).then(({ result, latency }) => ({ ...result, latency }));
  }

  async getModels(): Promise<string[]> {
    const list = await this.client.models.list();
    return list.data.map((m) => m.id);
  }
}
```

### Step 3: Register in the Factory
In `src/lib/providers/factory.ts`:
```typescript
import { GroqProvider } from "./groq";

function loadConfig() {
  return {
    // ... existing providers
    groq: {
      constructor: GroqProvider,
      config: process.env.GROQ_API_KEY ? {
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
        defaultModel: process.env.GROQ_MODEL || "llama3-70b-8192",
        maxTokens: 8192,
        temperature: 0.7,
      } : null,
    },
  };
}
```

### Step 4: Use the Provider
```typescript
// Switch to Groq at runtime
const ai = new AIService();
ai.switchProvider("groq");

// Or use environment variable
// AI_PROVIDER=groq node app.js
```

## The 7 Supported Providers

| Provider | Class | Default Model | API Base | Cost |
|----------|-------|---------------|----------|------|
| Zen | `ZenProvider` | deepseek-v3 | api.opencode.ai/v1 | ~$0.02/investigation |
| OpenAI | `OpenAIProvider` | gpt-4o | api.openai.com/v1 | ~$0.15/investigation |
| Anthropic | `AnthropicProvider` | claude-3-5-sonnet | api.anthropic.com/v1 | ~$0.20/investigation |
| Gemini | `GeminiProvider` | gemini-2.0-flash | generativelanguage.googleapis.com | ~$0.01/investigation |
| OpenRouter | `OpenRouterProvider` | openai/gpt-4o | openrouter.ai/api/v1 | Varies |
| Featherless | `FeatherlessProvider` | llama-3.1-70b | api.featherless.ai/v1 | ~$0.02/investigation |
| Ollama | `OllamaProvider` | llama3.2 | localhost:11434/v1 | $0 (local) |

### Provider Peculiarities

**Anthropic**: Requires `anthropic-version` header. System messages are sent as a separate `extra_body.system` parameter:
```typescript
this.client = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
  defaultHeaders: { "anthropic-version": "2023-06-01" },
});
// ...
response_format: request.responseFormat?.type === "json_object"
  ? { type: "json_object" }
  : undefined,
...(systemMessages.length > 0 && {
  extra_body: {
    system: systemMessages.map((m) => m.content).join("\n"),
  },
}),
```

**OpenRouter**: Requires `HTTP-Referer` and `X-Title` headers for their directory listing:
```typescript
defaultHeaders: {
  "HTTP-Referer": "https://internet-detective-ai.vercel.app",
  "X-Title": "Internet Detective AI",
},
```

**Ollama**: Uses the OpenAI-compatible endpoint at `/v1` (requires Ollama 0.3.0+). Model listing uses a separate API endpoint:
```typescript
async getModels(): Promise<string[]> {
  const response = await fetch(
    `${this.config.baseUrl.replace("/v1", "")}/api/tags`
  );
  const data = await response.json();
  return data.models.map((m) => m.name);
}
```

## Fallback Strategies

### Provider-Level Retry
The `BaseProvider.executeWithRetry` uses exponential backoff:

```typescript
protected async executeWithRetry(request: ChatCompletionRequest) {
  return retryWithBackoff(() => this.chat(request), 3);
}

// retryWithBackoff: 1s → 2s → 4s → 8s → max 30s
```

### Application-Level Fallback
The `AIService` can switch providers at runtime:

```typescript
// Try primary provider, fallback to secondary
async chatWithFallback(options: AIRequestOptions): Promise<AIResponse> {
  try {
    return await this.chat(options);
  } catch (error) {
    if (error instanceof AIProviderError && error.retryable) {
      this.switchProvider("openai"); // Fallback to OpenAI
      return await this.chat(options);
    }
    throw error;
  }
}
```

### Factory-Level Availability Check
```typescript
static getAllAvailableProviders(): ProviderAdapter[] {
  const providers: ProviderAdapter[] = [];
  for (const [type, registration] of Object.entries(this.registry)) {
    if (registration.config) {
      providers.push(new registration.constructor(registration.config));
    }
  }
  return providers;
}
```

This enables a "use what's available" strategy — if the default provider is down, try the next configured provider.

## Production Lessons Learned

1. **The OpenAI client library is the universal adapter.** Almost every LLM provider now offers an OpenAI-compatible API. Using the `openai` npm package with custom `baseURL` covers 90% of providers. Only Anthropic needed special handling.

2. **Every provider has subtle differences.** Gemini has generous context windows (1M tokens) but charges for them. Anthropic doesn't support JSON mode natively in all versions. Test each provider individually.

3. **Provider configuration should be lazy.** Don't crash at startup because one provider's API key is missing. The factory skips providers without API keys and only initializes them when requested.

4. **Fallbacks should be configurable, not hardcoded.** Different use cases have different fallback preferences. Some prefer cost savings (try Ollama → Featherless), others prefer reliability (try OpenAI → Anthropic).

5. **Model availability varies by provider.** A model name that works on one provider may not exist on another. The factory's defaultModel setting should be per-provider.

6. **Token usage reporting is inconsistent across providers.** Some providers return accurate usage statistics; others approximate or omit them. The `ChatCompletionResponse.usage` field accepts zeros as valid data.

7. **Latency tracking should be on the provider side, not the AIService side.** The provider knows when the network call starts and ends. The AIService should trust the provider's reported latency.

8. **Retry logic should respect the provider's rate limits.** Different providers have different rate limits. A retry that works for OpenAI (10,000 RPM) might overwhelm Featherless (100 RPM). Make retry configuration per-provider.

9. **Add provider testing to the evaluation suite.** When adding a new provider, run the evaluation suite to compare quality, latency, and cost against existing providers.

10. **Document which features each provider supports.** JSON mode, streaming, function calling, vision — not every provider supports every feature. A features matrix in the provider docs helps users choose.
