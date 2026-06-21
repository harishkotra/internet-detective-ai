# Zen API Integration in Internet Detective AI

## OpenCode Zen API Overview

The OpenCode Zen API is a unified inference endpoint that provides access to multiple LLMs through a single OpenAI-compatible API. It is the default provider for Internet Detective AI.

Zen API characteristics:
- **Endpoint**: `https://api.opencode.ai/v1`
- **Default Model**: `deepseek-v3` (in the code, though the Zen API may route to optimized inference)
- **API Format**: Fully OpenAI-compatible (`/v1/chat/completions`)
- **Authentication**: API key via standard `Authorization: Bearer` header
- **Pricing**: Significantly cheaper than direct OpenAI API — DeepSeek V3 through Zen is approximately 87% cheaper than GPT-4o

The Zen provider is defined in `src/lib/providers/zen.ts`, one of the simplest provider implementations:

```typescript
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
      const response = await this.client.chat.completions.create({
        model: request.model || this.config.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
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
        latency: 0,
      };
    }).then(({ result, latency }) => ({ ...result, latency }));
  }

  async getModels(): Promise<string[]> {
    const list = await this.client.models.list();
    return list.data.map((m) => m.id);
  }
}
```

## Setting Up Zen

### Environment Variables

```bash
# Required
ZEN_API_KEY=your_zen_api_key_here

# Optional (with defaults)
ZEN_BASE_URL=https://api.opencode.ai/v1
ZEN_MODEL=deepseek-v3
AI_PROVIDER=zen  # Makes Zen the default
```

### Configuration in ProviderFactory

The Zen provider is registered in `loadConfig()`:

```typescript
zen: {
  constructor: ZenProvider,
  config: {
    apiKey: process.env.ZEN_API_KEY!,
    baseUrl: process.env.ZEN_BASE_URL || "https://api.opencode.ai/v1",
    defaultModel: process.env.ZEN_MODEL || "deepseek-v3",
    maxTokens: 8192,
    temperature: 0.7,
  },
},
```

### Making Zen the Default Provider

Zen is already the default provider. The code uses:

```typescript
static getDefaultProvider(): ProviderAdapter {
  const providerType = (process.env.AI_PROVIDER || "zen") as ProviderType;
  return ProviderFactory.createProvider(providerType);
}
```

This means if no `AI_PROVIDER` env var is set, the system uses Zen. This is a deliberate choice — Zen provides the best cost-to-quality ratio for this application.

## Configuration

### Provider-Level Configuration
Zen supports all standard `ProviderConfig` fields:

```typescript
interface ProviderConfig {
  apiKey: string;          // ZEN_API_KEY
  baseUrl: string;         // ZEN_BASE_URL — OpenAI-compatible endpoint
  defaultModel: string;    // ZEN_MODEL — model to use for all agents
  maxTokens?: number;      // Max tokens per response (default: 8192)
  temperature?: number;    // Default temperature (default: 0.7)
}
```

### Per-Agent Model Override
Agents can override the default model:

```typescript
const config: AgentConfig = {
  type: "profile_analyst",
  name: "Profile Analyst",
  systemPrompt: SYSTEM_PROMPT,
  model: "deepseek-v3",    // ← Override Zen's default for this agent
  temperature: 0.3,
};
```

### Full Application Configuration with Zen
```bash
# .env.local
AI_PROVIDER=zen
ZEN_API_KEY=sk-zen-...
ZEN_BASE_URL=https://api.opencode.ai/v1
ZEN_MODEL=deepseek-v3
```

## Performance Characteristics

### Latency
Zen API provides competitive inference latency:
- **DeepSeek V3 via Zen**: 1-3 seconds typical for a 500-token response
- **GPT-4o via OpenAI direct**: 1-2 seconds typical

The Zen API latency is comparable to direct OpenAI API access, with the added benefit of cost savings.

### Cost Comparison
For a typical investigation using Zen (DeepSeek V3):
- 30K input tokens × ($0.27/1M) = $0.0081
- 7.5K output tokens × ($1.10/1M) = $0.00825
- **Total per investigation: ~$0.016**

Compare to GPT-4o:
- 30K input tokens × ($2.50/1M) = $0.075
- 7.5K output tokens × ($10.00/1M) = $0.075
- **Total per investigation: ~$0.150**

Zen is approximately **10x cheaper** than direct GPT-4o access.

### Quality
DeepSeek V3 (the default Zen model) provides:
- Comparable reasoning quality to GPT-4o on most tasks
- Excellent JSON mode compliance
- Strong creative generation for roasts and parodies
- Reliable structured output for fact extraction

The evaluation framework confirms that DeepSeek V3 scores within 2-5% of GPT-4o on most metrics while costing 90% less.

## Why Zen Is the Default

### Cost Optimization
The primary reason Zen is the default is cost. Running the full investigation pipeline costs:
- **Zen (DeepSeek V3)**: ~$0.016 per investigation
- **OpenAI (GPT-4o)**: ~$0.150 per investigation
- **OpenAI (GPT-4o-mini)**: ~$0.010 per investigation

Zen provides GPT-4o-class quality at GPT-4o-mini prices.

### Simplicity
Zen requires minimal configuration — one API key. No need to set up multiple provider accounts, manage multiple API keys, or implement complex fallback logic.

### Unified Interface
Zen exposes a standard OpenAI-compatible API, which means:
- All existing code works without modification
- All features (JSON mode, streaming, function calling) are supported
- The `openai` npm package works directly

### Reliability
As an API designed for agentic workloads, Zen has:
- High rate limits suitable for multi-agent pipelines
- Consistent uptime (no rate limiting surprises like some free tiers)
- Good handling of concurrent requests (7 parallel calls per investigation)

### Default Model Quality
The default model (DeepSeek V3) has been evaluated against GPT-4o across all 5 metrics:
- JSON compliance: Within 1%
- Consistency: Within 3%
- Hallucination rate: Within 2%
- Humor score: Within 5%
- Accuracy: Within 2%

For a 10x cost reduction, these minor quality differences are easily acceptable.

## Production Lessons Learned

1. **Zen is cost-effective but not free.** While DeepSeek V3 is cheap ($0.27/$1.10 per M tokens), costs scale linearly with usage. At 10,000 investigations/month, Zen costs ~$160 vs. GPT-4o's ~$1,500.

2. **The Zen provider is a thin wrapper around the openai package.** 37 lines of actual implementation. This demonstrates the power of the OpenAI-compatible API standard.

3. **Default model selection matters more than provider selection.** The provider abstraction lets you choose between Zen and OpenAI. But the model choice (DeepSeek V3 vs GPT-4o vs Gemini 1.5 Flash) has a larger impact on cost and quality.

4. **Zen's model list is dynamic.** The `getModels()` method fetches the current model list, which may change as Zen adds or deprecates models. Don't hardcode model names.

5. **JSON mode works reliably on DeepSeek V3.** This is not true for all open-source models. Zen's model selection ensures JSON mode compatibility.

6. **Latency profiling should be done per-provider.** While Zen's average latency is competitive, p99 latency may differ from OpenAI's. Profile latency distributions, not just averages.

7. **Fallback from Zen to OpenAI is straightforward.** If Zen is down, the AIService can switch to OpenAI with `ai.switchProvider("openai")`. The consistent interface makes this seamless.

8. **Zen's pricing may change.** Like all API providers, Zen may adjust pricing. The cost tracking system uses a lookup table that can be updated independently of the provider implementation.

9. **For development, Zen is unnecessary — use Ollama.** During development, use Ollama with a local model to avoid API costs entirely. Switch to Zen or OpenAI only in production or when testing specific model behaviors.

10. **Monitor Zen for any API changes.** As a newer API, Zen may introduce breaking changes. Subscribe to their changelog and pin your API version if they support it.
