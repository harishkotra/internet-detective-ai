# OpenAI-Compatible APIs in Internet Detective AI

## OpenAI API Standard

The OpenAI Chat Completions API has become the de facto standard for LLM APIs. Almost every provider — from Google Gemini to local models via Ollama — implements an OpenAI-compatible `/v1/chat/completions` endpoint.

The standard request format:

```json
POST /v1/chat/completions
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 4096,
  "response_format": {"type": "json_object"}
}
```

The standard response format:

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  },
  "model": "gpt-4o"
}
```

## How All Providers Implement /v1/chat/completions

The `openai` npm package provides the OpenAI client SDK. Every provider in this project uses it with a different `baseURL`:

```typescript
// All 7 providers share this pattern:
import OpenAI from "openai";

class AnyProvider {
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,  // ← Only this changes per provider
      maxRetries: 0,            // Custom retry logic in BaseProvider
    });
  }

  async chat(request: ChatCompletionRequest) {
    const response = await this.client.chat.completions.create({
      model: request.model || this.config.defaultModel,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat?.type === "json_object"
        ? { type: "json_object" } : undefined,
    });
    // ... map response to ChatCompletionResponse
  }
}
```

| Provider | baseURL |
|----------|---------|
| Zen | `https://api.opencode.ai/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Anthropic | `https://api.anthropic.com/v1` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| Featherless | `https://api.featherless.ai/v1` |
| Ollama | `http://localhost:11434/v1` |

## The openai npm Package

The project uses `openai` v6.44.0. Key features used:

### Client Initialization
```typescript
const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.BASE_URL,  // Default: https://api.openai.com/v1
  maxRetries: 0,                  // We handle retries ourselves
  defaultHeaders: {},             // Provider-specific headers
});
```

### Chat Completion
```typescript
const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  temperature: 0.7,
  max_tokens: 4096,
  response_format: { type: "json_object" },
});
```

### Response Mapping
The OpenAI SDK returns snake_case properties. The project maps these to camelCase for consistency:

```typescript
return {
  content: choice?.message?.content ?? "",
  model: response.model || request.model,
  usage: {
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  },
  provider: this.name,
  latency: 0, // Filled by measureLatency wrapper
};
```

## Provider-Specific Differences

### Anthropic (messages API via OpenAI SDK)

Anthropic's native API is different from OpenAI's, but Anthropic now offers an OpenAI-compatible endpoint. Key differences:

1. **System messages** are sent differently:
```typescript
// Anthropic handles system messages through extra_body
const systemMessages = request.messages.filter(m => m.role === "system");
const nonSystemMessages = request.messages.filter(m => m.role !== "system");

const response = await this.client.chat.completions.create({
  model,
  messages: nonSystemMessages,
  ...(systemMessages.length > 0 && {
    extra_body: {
      system: systemMessages.map(m => m.content).join("\n"),
    },
  }),
});
```

2. **JSON mode** support varies by model version. Older Claude models don't support JSON mode properly.

3. **Version header** required:
```typescript
defaultHeaders: { "anthropic-version": "2023-06-01" }
```

### Gemini (via OpenAI-compatible endpoint)

Google's Gemini API is accessible through an OpenAI-compatible proxy:

```typescript
baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
```

Key differences:
1. Gemini has a **1M token context window** — much larger than OpenAI's 128K
2. Gemini 1.5 Flash is **significantly cheaper** ($0.075/$0.3 per M tokens vs GPT-4o's $2.50/$10)
3. JSON mode may have different behavior on Gemini 2.0 models vs 1.5 models

### OpenRouter

OpenRouter provides access to many models through a single API:

```typescript
baseURL: "https://openrouter.ai/api/v1"
```

Key differences:
1. **Model names** include provider prefix: `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`
2. **Usage reporting** is inconsistent — some models report accurate token counts, others don't
3. **Required headers** for their directory:
```typescript
defaultHeaders: {
  "HTTP-Referer": "https://internet-detective-ai.vercel.app",
  "X-Title": "Internet Detective AI",
}
```

### Featherless

Featherless provides open-source models as a managed API:

```typescript
baseURL: "https://api.featherless.ai/v1"
```

Key differences:
1. **Open-source models only** — Llama, Mistral, DeepSeek variants
2. **Significantly cheaper** than proprietary APIs
3. **Lower rate limits** — respect these and implement appropriate throttling
4. **JSON mode** may not work consistently with all open-source models

### Ollama (Local)

Ollama runs models locally:

```typescript
baseURL: "http://localhost:11434/v1"
```

Key differences:
1. **No API key required** — set empty string or "ollama"
2. **No rate limits** — completely local, but limited by hardware
3. **Model listing** uses a different endpoint:
```typescript
async getModels(): Promise<string[]> {
  const response = await fetch(
    `${this.config.baseUrl.replace("/v1", "")}/api/tags`
  );
  const data = await response.json();
  return data.models.map((m) => m.name);
}
```
4. **JSON mode** is not supported — `response_format` parameter is omitted
5. **Default model**: `llama3.2` (must be pulled before use)

## Handling Non-Standard Features

### JSON Mode Support Matrix

| Provider | JSON Mode | Notes |
|----------|-----------|-------|
| OpenAI | ✅ Full | Gold standard |
| Anthropic | ✅ Via extra_body | Some models only |
| Gemini | ✅ Via proxy | Works with most models |
| OpenRouter | ⚠️ Depends on model | Varies by upstream provider |
| Featherless | ⚠️ Partial | Works with Llama 3.1+, inconsistent |
| Ollama | ❌ Not supported | Must use text mode |
| Zen | ✅ Full | OpenAI-compatible |

### Factoring Out JSON Mode

The code handles providers that don't support JSON mode:

```typescript
// In AIService.chat
const request: ChatCompletionRequest = {
  model: model || this.getDefaultModel(),
  messages,
  temperature: options.temperature,
  maxTokens: options.maxTokens,
  responseFormat: options.responseFormat
    ? { type: options.responseFormat }
    : undefined,
};

// The provider decides whether to send response_format
// For Ollama, response_format is simply omitted
```

For providers without JSON mode, the `chatJSON` cleanup still works because it strips markdown fences and parses the text output:

```typescript
const cleaned = response.content
  .replace(/```json\s*/gi, "")
  .replace(/```\s*$/g, "")
  .trim();

const parsed = JSON.parse(cleaned) as T;
```

### Response Model Names

Different providers return different model names in responses:
- OpenAI: Returns exact model name (e.g., "gpt-4o-2024-08-06")
- Anthropic: Returns model name (e.g., "claude-3-5-sonnet-20241022")
- OpenRouter: Returns upstream model name (e.g., "openai/gpt-4o")
- Ollama: Returns local model tag (e.g., "llama3.2:latest")

The cost tracking system must normalize these or maintain mappings from any returned name to a known pricing key.

## Production Lessons Learned

1. **The OpenAI SDK handles most providers, but not all.** Anthropic needs special system message handling. Ollama doesn't support JSON mode. Always test each provider end-to-end.

2. **Response format field naming matters.** The OpenAI SDK uses camelCase (`response_format` becomes `responseFormat` in the typed interface). The actual API wire format uses snake_case.

3. **Token usage fields are camelCase in the SDK but snake_case in responses.** The SDK automatically remaps, but if you access raw response properties, you need the snake_case names.

4. **Always provide default values for optional response fields.** `response.usage?.prompt_tokens ?? 0` — providers may omit usage, models may not support it, or errors may truncate the response.

5. **Model names in responses don't always match request model names.** A request for "gpt-4o" might return "gpt-4o-2024-08-06". Keep a model alias mapping for cost calculation.

6. **Rate limits are per-provider and per-model.** OpenAI's tier 1 allows 5,000 RPM on GPT-4o but only 500 RPM on o1-preview. Know your limits.

7. **Local models (Ollama) are great for testing but slow for production.** Inference speed depends on GPU availability. A 70B model on CPU will take minutes per response.

8. **HTTP-Referer and X-Title headers matter for OpenRouter's ranking.** OpenRouter uses these to build their public directory. If you want good standing, include them.

9. **Ollama's /v1 endpoint requires Ollama 0.3.0+.** Earlier versions don't support the OpenAI-compatible endpoint. Document version requirements.

10. **When adding a new provider, check if they have rate limits or authentication differences.** Some providers use API keys as headers, others as query parameters, others require OAuth.
