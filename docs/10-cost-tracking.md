# Cost Tracking in Internet Detective AI

## Cost Tracking Architecture

LLM API costs can vary dramatically by provider and model — from $0.05/M tokens (Llama 3.1 8B on Featherless) to $75/M output tokens (Claude Opus 4). Without tracking, cost overruns go unnoticed until the bill arrives.

The cost tracking system in `src/lib/cost/index.ts` provides:
- **Per-investigation cost calculation**
- **Per-agent cost breakdown**
- **Provider and model-level aggregation**
- **Date-range querying**
- **CSV export**
- **Average cost analytics**

## Provider Pricing Models

The `MODEL_RATES` map contains pricing for 17 models across 5 providers:

```typescript
const MODEL_RATES: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o":              { input: 2.5, output: 10 },
  "gpt-4o-mini":         { input: 0.15, output: 0.6 },
  "gpt-4-turbo":         { input: 10, output: 30 },
  "gpt-3.5-turbo":       { input: 0.5, output: 1.5 },

  // Anthropic
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022":  { input: 0.8, output: 4 },
  "claude-opus-4-20250514":     { input: 15, output: 75 },
  "claude-sonnet-4-20250514":   { input: 4, output: 20 },

  // Google
  "gemini-1.5-pro":      { input: 1.25, output: 5 },
  "gemini-1.5-flash":    { input: 0.075, output: 0.3 },
  "gemini-2.0-flash":    { input: 0.1, output: 0.4 },

  // DeepSeek (via Zen API)
  "deepseek-v3":         { input: 0.27, output: 1.1 },
  "deepseek-r1":         { input: 0.55, output: 2.19 },

  // Open models (via Featherless/Ollama)
  "llama-3.1-8b":        { input: 0.05, output: 0.05 },
  "llama-3.1-70b":       { input: 0.59, output: 0.79 },
  "llama-3.1-405b":      { input: 2.0, output: 2.0 },
};
```

Prices are in **dollars per million tokens** (standard industry pricing unit).

## Per-Investigation Cost Calculation

Cost is calculated in the `calculateCost` utility:

```typescript
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = PRICING[model];
  if (!rates) return 0;
  const inputCost = (promptTokens / 1_000_000) * rates.input;
  const outputCost = (completionTokens / 1_000_000) * rates.output;
  return Number((inputCost + outputCost).toFixed(6));
}
```

This is called per-agent in the AIService:

```typescript
const trace: AgentTrace = {
  // ...
  cost: calculateCost(
    response.model,
    response.usage.promptTokens,
    response.usage.completionTokens,
  ),
};
```

### Example: Single Investigation Cost

For a typical investigation using GPT-4o:
- Profile Analyst: 4K input + 1.5K output = ~$0.025
- Signal Detector: 5K input + 2K output = ~$0.032
- Career Predictor: 3K input + 0.5K output = ~$0.013
- Startup Generator: 3K input + 1K output = ~$0.018
- Roast Agent: 3K input + 1K output = ~$0.018
- Governance Agent: 6K input + 0.5K output = ~$0.020
- Final Synthesis: 8K input + 1K output = ~$0.030
- **Total: ~$0.16 per investigation**

With cheaper models (deepseek-v3 via Zen): ~$0.02 per investigation.

## Cost Analytics Dashboard

The `CostTracker` class provides multiple aggregation methods:

```typescript
export class CostTracker {
  // Total cost across all investigations
  async getTotalCost(): Promise<number>

  // Cost broken down by provider
  async getCostByProvider(): Promise<Record<string, number>>

  // Cost broken down by model
  async getCostByModel(): Promise<Record<string, number>>

  // Cost broken down by agent
  async getCostByAgent(): Promise<Record<string, number>>

  // Cost for a specific user
  async getCostByUser(userId: string): Promise<number>

  // Cost for a specific investigation
  async getCostByInvestigation(investigationId: string): Promise<number>

  // Cost within a date range
  async getCostByDateRange(start: string, end: string): Promise<number>

  // Average cost per investigation
  async getAverageCostPerInvestigation(): Promise<number>

  // Token summary
  async getTokenSummary(): Promise<{ totalPromptTokens, totalCompletionTokens, totalTokens }>
}
```

These are exposed via API routes:

```
GET /api/costs/total
GET /api/costs/by-provider
GET /api/costs/by-model
GET /api/costs/by-agent
GET /api/costs/by-date?start=2025-01-01&end=2025-06-01
```

And displayed on the dashboard at `/dashboard/costs`.

## Optimizing Costs

### Model Selection Strategy

| Use Case | Recommended Model | Reason |
|----------|------------------|--------|
| Fact extraction | GPT-4o-mini or Gemini 1.5 Flash | Cheap, fast, good at structured output |
| Pattern detection | GPT-4o or DeepSeek V3 | Needs reasoning capability |
| Creative generation | DeepSeek V3 or GPT-4o | Creative tasks benefit from larger models |
| Governance check | GPT-4o-mini | Simple pattern matching, doesn't need full power |
| The whole pipeline | DeepSeek V3 (via Zen) | 87% cheaper than GPT-4o, ~95% of quality |

### Practical Cost Reduction

1. **Use cheaper models for early pipeline stages.** The Profile Analyst and Governance Agent can use GPT-4o-mini without quality loss, saving ~80% on those steps.

2. **Compress context aggressively.** The Context Builder already deduplicates and compresses. Every token saved in the prompt saves both input and (implicitly) output tokens.

3. **Batch governance violations.** Instead of retrying after each violation, collect all violations and fix them in one pass.

4. **Monitor cost per investigation.** Set an alert if cost per investigation exceeds a threshold (e.g., $0.50). Address the root cause immediately.

5. **Cache investigation results.** If the same profile is investigated twice, return the cached result. Profile hash makes this possible.

### Cost Comparison Across Providers

For a typical investigation (~30K input tokens, ~7.5K output tokens):

| Provider | Model | Input Cost | Output Cost | **Total** |
|----------|-------|-----------|------------|-----------|
| OpenAI | GPT-4o | $0.075 | $0.075 | **$0.150** |
| OpenAI | GPT-4o-mini | $0.005 | $0.005 | **$0.010** |
| Anthropic | Claude 3.5 Sonnet | $0.090 | $0.113 | **$0.203** |
| Anthropic | Claude 3.5 Haiku | $0.024 | $0.030 | **$0.054** |
| Google | Gemini 1.5 Pro | $0.038 | $0.038 | **$0.075** |
| Google | Gemini 1.5 Flash | $0.002 | $0.002 | **$0.005** |
| Zen | DeepSeek V3 | $0.008 | $0.008 | **$0.016** |
| Featherless | Llama 3.1 70B | $0.018 | $0.006 | **$0.024** |
| Local | Llama 3.2 (Ollama) | $0 | $0 | **$0.000** |

## Model Selection for Cost Efficiency

### Tiered Model Strategy
```
Tier 1 (Free/Local): Ollama with Llama 3.2
  → Development, testing, hobby use
  → Cost: $0

Tier 2 (Budget): Gemini 1.5 Flash or GPT-4o-mini
  → Production with large volume
  → Cost: ~$0.005-0.010 per investigation

Tier 3 (Quality): DeepSeek V3 or GPT-4o
  → Production with quality requirements
  → Cost: ~$0.016-0.150 per investigation

Tier 4 (Premium): Claude 3.5 Sonnet or Opus
  → High-stakes investigations where quality is paramount
  → Cost: ~$0.20-1.00 per investigation
```

### Default Provider Selection
```typescript
// In ProviderFactory
static getDefaultProvider(): ProviderAdapter {
  const providerType = (process.env.AI_PROVIDER || "zen") as ProviderType;
  return ProviderFactory.createProvider(providerType);
}
```

The default provider is configurable via the `AI_PROVIDER` environment variable, defaulting to the OpenCode Zen API. This allows cost optimization without code changes.

## Production Lessons Learned

1. **Express all costs in dollars, not tokens.** Tokens are an intermediate unit. Stakeholders understand dollars. Always convert token usage to dollar cost before displaying.

2. **Track cost at the agent level, not just the investigation level.** Knowing the total cost of an investigation is useful. Knowing that the Roast Agent accounts for 40% of the cost enables targeted optimization.

3. **Store pricing as a lookup table, not hardcoded formulas.** When provider prices change (they will), you only need to update one table. The current `MODEL_RATES` map enables this.

4. **Unrecognized models should fall back to a default rate.** Not all models are in the pricing table. Provide a sensible default rather than returning $0 (which hides real costs).

5. **Cost tracking must be async-safe.** Multiple concurrent investigations should not cause race conditions in cost recording. The current implementation uses simple array operations which are safe for Node.js single-threaded execution.

6. **Export cost data for billing integration.** The `exportRecords()` CSV method enables integration with external billing systems. Real production deployments would use this format for Stripe invoice line items.

7. **Monitor cost per investigation as a leading indicator.** Spiking costs might indicate:
   - A model that's outputting much more than expected (token bleed)
   - A prompt that's causing the model to ramble
   - An agent that's retrying too many times

8. **Free tiers (Ollama) are great for dev but don't run them in production.** Local models have hardware costs and maintenance overhead that offset their $0 API cost.

9. **Cache cost calculations.** The `calculateCost` function is called frequently. The current implementation is O(1) (lookup table), but for deployment, consider caching known token-to-cost values.

10. **Use theoretical pricing, not API-reported cost.** Different providers report costs differently (some include, some exclude cached tokens). The current approach calculates from first principles using known rates and reported token counts, which provides a consistent baseline.
