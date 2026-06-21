# Structured Outputs in Internet Detective AI

## Why Structured Outputs Matter

LLMs produce unstructured text. But production systems need structured data — JSON objects with typed fields, validable schemas, and predictable shapes. Without structured outputs, you cannot:
- Parse results reliably
- Validate content
- Type-check in TypeScript
- Cache or serialize results
- Build UIs that consume model output

Internet Detective AI uses a three-layer approach to structured outputs:
1. **TypeScript types** (compile-time safety)
2. **JSON mode** (LLM-level structure enforcement)
3. **Runtime validation** (defensive parsing with safe defaults)

## Pydantic-Style Schemas in TypeScript

In Python, Pydantic is the standard for data validation. In TypeScript, we define schemas as TypeScript types (Pydantic-equivalent):

```typescript
export interface InvestigationReport {
  id: string;
  profileHash: string;
  digitalProfileSummary: string;
  facts: Fact[];
  strongSignals: StrongSignal[];
  hiddenObsessions: HiddenObsession[];
  coworkerQuotes: CoworkerQuote[];
  startupParody: StartupParody;
  careerPrediction: CareerPrediction;
  brutalRoast: Roast[];
  wildGuesses: WildGuess[];
  finalVerdict: string;
  personalityScores: InternetPersonalityScores;
  cookedLevel: CookedLevel;
  metadata: ReportMetadata;
}
```

This type defines the *contract* between the LLM and the application. Every downstream consumer (UI components, database, API routes) relies on this shape.

## JSON Mode with LLMs

The `AIService` class provides two modes:

```typescript
async chat(options: AIRequestOptions): Promise<AIResponse> {
  const request: ChatCompletionRequest = {
    model: model || this.getDefaultModel(),
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
    responseFormat: options.responseFormat
      ? { type: options.responseFormat }  // "json_object" or "text"
      : undefined,
  };
  const response = await this.provider.chat(request);
  return { content: response.content, trace };
}
```

When `responseFormat: "json_object"` is set, the model is constrained to output valid JSON. This is supported by all major providers (OpenAI, Anthropic, Gemini, OpenRouter).

The JSON response is parsed with cleanup:

```typescript
async chatJSON<T>(options: AIRequestOptions): Promise<{ parsed: T; trace: AgentTrace }> {
  const jsonOptions: AIRequestOptions = {
    ...options,
    responseFormat: "json_object",
  };
  const response = await this.chat(jsonOptions);

  const cleaned = response.content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();

  let parsed: T;
  try {
    parsed = JSON.parse(cleaned) as T;
  } catch (parseError) {
    throw new Error(`Failed to parse JSON response: ${parseError}`);
  }

  return { parsed, trace: response.trace };
}
```

The cleanup handles a common failure mode — models sometimes wrap JSON in markdown code blocks even in JSON mode.

## Zod Schemas for Runtime Validation

The project includes Zod (v4) as a dependency. While the current implementation uses manual validation (type guards and default values), Zod provides a more structured approach:

```typescript
import { z } from "zod";

const FactSchema = z.object({
  observation: z.string(),
  source: z.string(),
  category: z.enum([
    "job_title", "company", "education", "skill", "location",
    "experience", "open_source", "writing", "speaking",
    "certification", "language"
  ]),
});

const StrongSignalSchema = z.object({
  title: z.string(),
  category: z.enum([
    "career_trajectory", "strengths", "weaknesses",
    "daily_activities", "working_style"
  ]),
  evidence: z.array(z.object({
    source: z.string(),
    detail: z.string(),
    direct: z.boolean(),
  })).min(2),
  reasoning: z.string(),
  confidenceScore: z.number().int().min(0).max(100),
});

const ReportSchema = z.object({
  id: z.string().uuid(),
  profileHash: z.string(),
  digitalProfileSummary: z.string(),
  facts: z.array(FactSchema),
  strongSignals: z.array(StrongSignalSchema),
  // ... other fields
});
```

Using Zod would provide:
- Automatic type inference (`z.infer<typeof ReportSchema>`)
- Detailed error messages on parse failures
- Transform/coerce capabilities
- `.parse()` vs `.safeParse()` for error handling strategies

The project chose manual validation for simplicity and bundle size, but Zod is available for future migration.

## Retry Logic for Invalid Outputs

Invalid outputs are handled at multiple levels:

### Agent-Level Validation
Each agent validates its parsed output before returning:

```typescript
private validateOutput(output: CareerPrediction): CareerPrediction {
  return {
    nextRole: output.nextRole || "Unknown role",
    industryDirection: output.industryDirection || "Unknown direction",
    leadershipPotential: Math.min(100, Math.max(0, output.leadershipPotential || 0)),
    futureOpportunities: Array.isArray(output.futureOpportunities)
      ? output.futureOpportunities : [],
    confidence: Math.min(100, Math.max(0, output.confidence || 0)),
  };
}
```

### Orchestrator-Level Fallbacks
The orchestrator provides fallback outputs for every agent:

```typescript
const { output: careerOutput, trace: careerTrace } = await this.runAgent(
  this.careerPredictor,
  { context, strongSignals: signalOutput.strongSignals },
  {  // fallback
    nextRole: "Unknown",
    industryDirection: "Unknown",
    leadershipPotential: 0,
    futureOpportunities: [],
    confidence: 0,
  },
);
```

### Orchestrator Retry
The orchestrator wraps agent calls with `runAgent`, which catches errors and returns fallbacks:

```typescript
private async runAgent<T>(agent: BaseAgent, input: any, fallback: T) {
  try {
    const result = await agent.process(input);
    return { output: (result.output ?? fallback) as T, trace: result.trace };
  } catch (error) {
    return { output: fallback, trace: /* error trace */ };
  }
}
```

## The InvestigationReport Schema

The central schema of the project is `InvestigationReport`. Every agent contributes to specific fields:

```
ProfileAnalyst      → facts[], digitalProfileSummary
SignalDetector      → strongSignals[], hiddenObsessions[]
CareerPredictor     → careerPrediction
StartupGenerator    → startupParody
RoastAgent          → brutalRoast[], coworkerQuotes[], finalVerdict (provisional)
FinalSynthesis      → personalityScores, cookedLevel, wildGuesses[], finalVerdict (final)
```

## All Sub-Schemas

### Fact

```typescript
export interface Fact {
  observation: string;    // The factual observation
  source: string;         // Where it came from (linkedin, github, twitter, website, resume)
  category: string;       // job_title, company, education, skill, location, etc.
}
```

### StrongSignal

```typescript
export interface StrongSignal {
  title: string;                  // Short label (e.g., "Deep IC-to-Architect Trajectory")
  category: string;               // career_trajectory, strengths, weaknesses, etc.
  evidence: Evidence[];           // >= 2 pieces of evidence
  reasoning: string;              // How evidence leads to conclusion
  confidenceScore: number;        // 0-100
}

export interface Evidence {
  source: string;   // Where this evidence came from
  detail: string;   // Specific supporting detail
  direct: boolean;  // Direct observation or indirect inference
}
```

### HiddenObsession

```typescript
export interface HiddenObsession {
  theme: string;          // The recurring theme or obsession
  evidence: Evidence[];   // Supporting evidence
  intensity: number;      // 0-100
}
```

### CareerPrediction

```typescript
export interface CareerPrediction {
  nextRole: string;             // Specific predicted next role
  industryDirection: string;    // Industry trajectory
  leadershipPotential: number;  // 0-100
  futureOpportunities: string[]; // 3-5 opportunities
  confidence: number;           // 0-100
}
```

### StartupParody

```typescript
export interface StartupParody {
  name: string;
  tagline: string;
  fundingStage: string;
  investorPitch: string;
  businessModel: string;
  biggestRisk: string;
  mostLikelyCauseOfFailure: string;
}
```

### Roast

```typescript
export interface Roast {
  line: string;       // The joke
  category: string;   // coding_skills, career_choices, personality, etc.
  intensity: number;  // 1-10
}
```

### WildGuess

```typescript
export interface WildGuess {
  prediction: string;   // The speculative claim
  reasoning: string;    // Why it's plausible
  confidence: number;   // 0-100 (usually 15-45)
}
```

### GovernanceCheck

```typescript
export interface GovernanceCheck {
  passed: boolean;
  violations: GovernanceViolation[];
  checkedAt: string;
}
```

### SafetyCheck

```typescript
export interface SafetyCheck {
  passed: boolean;
  threats: SafetyThreat[];
}
```

## Tradeoffs

### TypeScript Types vs. Zod Schemas

| Approach | Pros | Cons |
|----------|------|------|
| TypeScript types | Zero runtime overhead, simple | No runtime validation |
| Zod schemas | Runtime validation, detailed errors | Bundle size, learning curve |

Current approach uses both — types for compile-time, manual validation at runtime. Zod is available for when the validation logic becomes too complex to maintain manually.

### Validation vs. Transformation

The current validators normalize values (clamp scores 0-100, provide defaults for missing fields) but don't throw. This "be liberal in what you accept" approach trades data quality for robustness. An alternative would be to throw on validation failure and retry the LLM call — but retries are expensive and non-deterministic.

## Production Lessons Learned

1. **Every LLM output needs a fallback.** Models fail, return invalid JSON, or produce null fields. Every output type needs a sensible default.

2. **JSON mode is not enough.** Models in JSON mode can still produce structurally valid JSON with semantically wrong content. Always validate content.

3. **Clean markdown fences from JSON output.** Many models wrap JSON in ` ```json ` blocks even in JSON mode. Always strip these before parsing.

4. **Type narrow aggressively.** After parsing JSON as `unknown` or `any`, cast through type guards, not direct assertions.

5. **Score clamping is essential.** Models produce scores like 150 or -10 for 0-100 fields. Always clamp.

6. **Array fields can be null even when required.** A `facts: undefined` will crash your UI. Provide default empty arrays.

7. **Nested validation is expensive but necessary.** Validating top-level fields is easy. Validating nested evidence arrays requires iteration.

8. **UUID generation should happen server-side.** Don't trust the model to generate valid UUIDs for report IDs.

9. **Report schemas evolve.** Version the schema and store the version in metadata so old reports remain readable.

10. **Lazy validation pattern is useful.** Validate output when it's consumed, not when it's produced. This lets you display partial results while retrying failed sections.
