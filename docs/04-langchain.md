# LangChain in Internet Detective AI

## LangChain Core Concepts

LangChain is a framework for building applications with LLMs. It provides abstractions for common patterns: prompt construction, model interaction, output parsing, and chain composition.

Internet Detective AI uses **@langchain/core** (v1.2.0) and **langchain** (v1.5.0). The project also includes **@langchain/langgraph** (v1.4.4) for potential multi-agent orchestration.

### Key Abstractions Used

- **PromptTemplate**: Parameterized prompt construction
- **RunnableSequence**: Composable processing pipelines
- **RunnableLambda**: Function wrapping for custom logic
- **OutputParser**: Structured output extraction

## PromptTemplates

`PromptTemplate` provides a structured way to build prompts with dynamic inputs:

```typescript
import { PromptTemplate } from "@langchain/core/prompts";

const analysisPrompt = PromptTemplate.fromTemplate(`
You are a profile analyst. Analyze the following profile:

Profile Summary: {summary}

Normalized Data: {normalizedData}

Key Signals: {keySignals}

Extract all structured facts and provide a professional summary.
`);

const formatted = await analysisPrompt.format({
  summary: context.summary,
  normalizedData: JSON.stringify(context.normalized, null, 2),
  keySignals: context.keySignals.join(", "),
});
```

The project's prompts are stored as files in `prompts/system/`, loaded by the `PromptRegistry` class, and passed directly to the `AIService`. While `PromptTemplate` is available, the project uses a simpler approach — template strings with interpolation — for most agent prompts:

```typescript
private buildPrompt(context: ContextPack, facts: Fact[]): string {
  return `Analyze this profile and its extracted facts to detect strong signals.

## Profile Summary
${context.summary}

## Extracted Facts (${facts.length})
${JSON.stringify(facts, null, 2)}

## Key Signals
${context.keySignals.join(", ")}

Look for patterns across the career, skills, open source work, and online presence.`;
}
```

The file-based prompt approach was chosen over LangChain's `PromptTemplate` because:
1. Prompts are authored in Markdown files by non-engineers
2. Prompts need versioning and diff tracking
3. `PromptTemplate` adds complexity for simple string interpolation

## RunnableSequence

`RunnableSequence` composes multiple operations into a pipeline. The agent pipeline in Internet Detective AI is conceptually a `RunnableSequence`, though implemented directly through the orchestrator:

```typescript
// Conceptual LangChain equivalent of the orchestrator pipeline
import { RunnableSequence } from "@langchain/core/runnables";

const investigationPipeline = RunnableSequence.from([
  profileAnalystChain,    // ContextPack → { facts, summary }
  signalDetectorChain,    // { context, facts } → { signals, obsessions }
  careerPredictorChain,   // { context, signals } → CareerPrediction
  startupGeneratorChain,  // { context, signals } → StartupParody
  roastAgentChain,        // { context, signals } → { roasts, quotes, verdict }
  governanceChain,        // All outputs → GovernanceCheck
  finalSynthesisChain,    // Everything → InvestigationReport
]);
```

The actual implementation uses a custom orchestrator (`InvestigationOrchestrator`) instead of `RunnableSequence` because:
1. The governance step requires retry logic (not a simple pipeline)
2. Error handling is per-agent (not per-pipeline)
3. Traces need to be collected at each step

## RunnableLambda

`RunnableLambda` wraps arbitrary functions into LangChain's runnable interface:

```typescript
import { RunnableLambda } from "@langchain/core/runnables";

const validateOutput = new RunnableLambda({
  func: (output: CareerPrediction) => ({
    nextRole: output.nextRole || "Unknown role",
    leadershipPotential: Math.min(100, Math.max(0, output.leadershipPotential || 0)),
    confidence: Math.min(100, Math.max(0, output.confidence || 0)),
  }),
});
```

In the actual codebase, validation methods are plain class methods rather than `RunnableLambda` instances. This is simpler but less composable with LangChain's native streaming and batching.

## OutputParsers

LangChain's `OutputParser` classes extract structured data from LLM responses:

```typescript
import { StructuredOutputParser } from "langchain/output_parsers";

const careerParser = StructuredOutputParser.fromNamesAndDescriptions({
  nextRole: "The specific predicted next role",
  industryDirection: "Industry trajectory",
  leadershipPotential: "Score 0-100",
  futureOpportunities: "Array of 3-5 opportunities",
  confidence: "Confidence score 0-100",
});
```

The project's equivalent is the `chatJSON<T>` method:

```typescript
async chatJSON<T>(options: AIRequestOptions): Promise<{ parsed: T; trace: AgentTrace }> {
  const response = await this.chat({ ...options, responseFormat: "json_object" });
  const cleaned = response.content.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  const parsed = JSON.parse(cleaned) as T;
  return { parsed, trace: response.trace };
}
```

This approach is simpler than `StructuredOutputParser` because:
1. JSON mode guarantees valid JSON structure
2. The schema is defined by TypeScript types, not parser configs
3. Error handling is centralized in the orchestrator, not per-parser

## How We Use LangChain in This Project

The project uses LangChain selectively — only where it adds clear value:

### LangChain Core (@langchain/core)
- **Used for**: Runnable abstractions, prompt templates (conceptually)
- **Not used for**: Agent orchestration, tool calling, memory

### LangChain (langchain)
- **Used for**: Output parsers (conceptually), document loaders (future)
- **Not used for**: Chains, agents, retrievers, callbacks

### LangGraph (@langchain/langgraph)
- **Available for**: Future multi-agent orchestration with graph-based state management
- **Not currently used**: The custom orchestrator predates LangGraph integration

The decision to use LangChain as a "pick what you need" library (rather than a framework) is intentional. LangChain's strength is in its modular abstractions, not in its opinionated application patterns.

## Integration with Custom Providers

The provider abstraction (`ProviderAdapter`) wraps LangChain's model interface:

```typescript
export interface ProviderAdapter {
  name: ProviderType;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  getModels(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}
```

This could be bridged to LangChain's model interface:

```typescript
import { BaseLLM } from "@langchain/core/language_models/llms";

class ProviderLangChainAdapter extends BaseLLM {
  constructor(private provider: ProviderAdapter) {
    super({});
  }

  async _call(prompt: string, options: this["ParsedCallOptions"]): Promise<string> {
    const response = await this.provider.chat({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    return response.content;
  }
}
```

This bridge pattern would allow using LangChain's full ecosystem (chains, agents, tools) while keeping the custom provider abstraction intact.

## Tradeoffs

### LangChain vs. Custom Implementation

| Aspect | LangChain | Custom (Current) |
|--------|-----------|------------------|
| Flexibility | Constrained by framework | Complete freedom |
| Complexity | High learning curve | Simple, direct |
| Ecosystem | RICH (tools, retrievers, memory) | Limited |
| Bundle size | Large | Minimal |
| Debugging | Abstracted stack traces | Direct code flow |
| Community | Active, breaking changes | Self-contained |

**Decision**: Use LangChain selectively for specific problems (prompt templates, output parsing) where it adds value. Keep custom infrastructure for orchestration, tracing, and provider abstraction.

## Production Lessons Learned

1. **Don't use LangChain as a framework; use it as a library.** Importing the full LangChain suite adds significant bundle size and complexity. Import only what you need.

2. **LangChain's abstractions leak.** `RunnableSequence` error handling is non-trivial. When a step fails, the error message may not clearly indicate which step failed. Custom orchestrators give better error visibility.

3. **PromptTemplate over file-based prompts.** If your prompts are authored by non-engineers, file-based Markdown is better than `PromptTemplate`. If your prompts are code-generated, `PromptTemplate` is cleaner.

4. **Output parsers add a layer of indirection that complicates debugging.** When a parser fails, you need to trace through both the model output and the parser logic. Direct `JSON.parse` with inline validation is easier to debug.

5. **LangGraph is overkill for linear pipelines.** The current orchestrator is a linear pipeline with one conditional retry loop. LangGraph's graph-based state management would add complexity without benefit. It would become useful if agents started executing in parallel or needed dynamic routing.

6. **Version pinning is critical for LangChain.** The library has frequent breaking changes. Pin your LangChain version or use a lockfile. The current project pins `@langchain/core` to `^1.2.0` and `langchain` to `^1.5.0`.

7. **Consider migrating to LangChain's streaming.** The current implementation waits for full responses. Streaming with `RunnableSequence` would allow displaying partial results to users.

8. **Custom provider adapters need LangChain compatibility.** If you build a custom provider (like `ZenProvider`), consider also implementing LangChain's `BaseLLM` interface so it can be used with LangChain chains if needed later.
