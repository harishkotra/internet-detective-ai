# Observability in Internet Detective AI

## Why Observability Matters

Observability is the ability to understand what a system is doing by examining its outputs. In AI applications, observability is especially important because LLMs are non-deterministic — the same input can produce different outputs each time.

Without observability, you cannot:
- Debug why a particular report had errors
- Compare performance across model providers
- Track cost and latency trends
- Identify failing agents or slow steps
- Audit system behavior for compliance

Internet Detective AI's observability system lives in `src/lib/observability/index.ts`.

## LangSmith Integration

LangSmith is LangChain's observability platform. The project supports optional LangSmith integration:

```typescript
interface LangSmithConfig {
  apiKey?: string;
  projectName?: string;
  endpoint?: string;
}
```

When configured, every agent trace is sent to LangSmith:

```typescript
private async recordToLangSmith(trace: AgentTrace): Promise<void> {
  if (!this.langSmithConfig) return;

  const payload = {
    project_name: this.langSmithConfig.projectName || "internet-detective",
    run_id: trace.agentId,
    name: trace.agentName,
    run_type: "llm",
    inputs: trace.input,
    outputs: trace.output,
    extra: {
      latency: trace.latency,
      token_usage: trace.tokenUsage,
      cost: trace.cost,
      model: trace.model,
      provider: trace.provider,
      success: trace.success,
      error: trace.error,
    },
    start_time: trace.startTime,
    end_time: trace.endTime,
  };

  const response = await fetch(
    `${this.langSmithConfig.endpoint || "https://api.smith.langchain.com"}/runs`,
    { method: "POST", headers, body: JSON.stringify(payload) },
  );
}
```

This allows visualizing the investigation pipeline in LangSmith's trace viewer, including:
- Input/output at each agent step
- Latency breakdown per agent
- Token usage per call
- Success/failure status
- Full error messages for failed calls

## Agent Tracing

Every agent execution produces an `AgentTrace`:

```typescript
export interface AgentTrace {
  agentId: string;          // Unique UUID for this execution
  agentName: string;        // "Profile Analyst", "Roast Agent", etc.
  input: unknown;           // What was passed to the agent
  output: unknown;          // What the agent produced
  latency: number;          // Execution time in milliseconds
  tokenUsage: TokenUsage;   // Prompt/completion/total token counts
  cost: number;             // Estimated dollar cost
  model: string;            // Model used (e.g., "gpt-4o")
  provider: string;         // Provider used (e.g., "openai")
  startTime: string;        // ISO timestamp
  endTime: string;          // ISO timestamp
  success: boolean;         // Whether the call succeeded
  error?: string;           // Error message if failed
}
```

Traces are recorded by the `ObservabilityTracker`:

```typescript
async recordTrace(trace: AgentTrace): Promise<void> {
  this.traces.push(trace);
  if (this.traces.length > MAX_STORED_TRACES) {
    this.traces = this.traces.slice(-MAX_STORED_TRACES);
  }

  if (this.langSmithConfig) {
    await this.recordToLangSmith(trace).catch(() => {});
  }
}
```

Failed trace recording to LangSmith is silently caught — observability should never block the main application flow.

## Latency Tracking

Latency is tracked at multiple granularities:

### Per-Agent Latency
Each agent measures its own execution time:

```typescript
const start = performance.now();
const { parsed, trace } = await this.callAIJSON<ProfileAnalystOutput>(userPrompt);
const latency = performance.now() - start;
```

### Total Investigation Latency
The orchestrator tracks end-to-end time:

```typescript
const orchestratorStart = performance.now();
// ... all agent calls ...
const totalLatency = performance.now() - orchestratorStart;
```

### Storage and Retrieval
```typescript
async getTraceStats(): Promise<{
  total: number;
  successful: number;
  failed: number;
  avgLatency: number;
  totalCost: number;
}> {
  const total = this.traces.length;
  const successful = this.traces.filter((t) => t.success).length;
  const totalLatency = this.traces.reduce((sum, t) => sum + t.latency, 0);
  const avgLatency = total > 0 ? totalLatency / total : 0;
  const totalCost = this.traces.reduce((sum, t) => sum + t.cost, 0);
  return { total, successful, failed, avgLatency, totalCost };
}
```

## Token Usage Tracking

Token usage is tracked per-agent and aggregated across the investigation:

```typescript
export interface TokenUsage {
  promptTokens: number;       // Tokens in the prompt
  completionTokens: number;   // Tokens in the response
  totalTokens: number;        // Sum
}
```

The orchestrator aggregates across all agents:

```typescript
private aggregateTokenUsage(traces: AgentTrace[]): TokenUsage {
  return traces.reduce(
    (acc, t) => ({
      promptTokens: acc.promptTokens + t.tokenUsage.promptTokens,
      completionTokens: acc.completionTokens + t.tokenUsage.completionTokens,
      totalTokens: acc.totalTokens + t.tokenUsage.totalTokens,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  );
}
```

## Trace Visualization

The dashboard provides trace visualization through dedicated routes:

- `/dashboard/traces` — List of all agent traces
- `/dashboard/traces?agent=roast_agent` — Filter by agent
- `/api/traces` — JSON endpoint for programmatic access

Traces can be exported in JSON or CSV format:

```typescript
async exportTraces(format: "json" | "csv" = "json"): Promise<string> {
  if (format === "csv") {
    const headers = ["agentId","agentName","latency","promptTokens","completionTokens",
                     "totalTokens","cost","model","provider","startTime","endTime","success","error"];
    const rows = this.traces.map((t) => [/* fields */].join(","));
    return [headers.join(","), ...rows].join("\n");
  }
  return JSON.stringify(this.traces, null, 2);
}
```

## Agent Performance Analysis

The `getAgentPerformance` method provides per-agent metrics:

```typescript
async getAgentPerformance(): Promise<Record<string, {
  totalCalls: number;
  avgLatency: number;
  totalCost: number;
  successRate: number;
}>> {
  // Aggregates latencies, costs, and success counts per agent name
  // Returns summary statistics for each agent
}
```

This enables the dashboard to answer questions like:
- Which agent is the slowest? (Usually the Roast Agent at high temperature)
- Which agent fails most often? (Governance Agent if prompts frequently violate rules)
- Which agent costs the most? (Profile Analyst if it uses the most prompt tokens)

## Debugging with Traces

When an investigation produces a bad report, traces are the first debugging tool:

### Step 1: Find the Bad Investigation
```typescript
const investigations = await observability.getInvestigations(20);
```

### Step 2: Check Which Agents Failed
```typescript
const traces = await observability.getTracesByInvestigation(badInvestigationId);
const failedTraces = traces.filter(t => !t.success);
```

### Step 3: Examine Error Messages
Each failed trace includes the error:

```typescript
const brokenTrace = failedTraces[0];
console.log(brokenTrace.error); // "Rate limit exceeded for zen provider"
console.log(brokenTrace.latency); // 0 — failed immediately
console.log(brokenTrace.tokenUsage); // All zeros — no tokens consumed
```

### Step 4: Compare Across Providers
```typescript
// Compare latency between providers
const zenTraces = traces.filter(t => t.provider === "zen");
const openaiTraces = traces.filter(t => t.provider === "openai");
```

The full trace list is accessible via API:
```
GET /api/traces?limit=50
```

## Production Lessons Learned

1. **Observability must never block the main flow.** If LangSmith is down, the application should continue working. Always catch and silently handle observability failures.

2. **Store traces with a maximum limit.** In-memory trace storage (current implementation) has a 10,000-trace cap. For production, use a database-backed store that retains traces based on time, not count.

3. **Latency tracking must use monotonic clocks.** `performance.now()` is monotonic (never goes backward) unlike `Date.now()` which can jump if the system clock adjusts.

4. **Trace every agent, including governance.** Governance traces are as important as generation traces — they show what was flagged and how it was handled.

5. **Include input summaries in traces, not full inputs.** Storing the full profile data in every trace would balloon storage. Store hashes or counts (e.g., "factCount: 15" not the full 15 facts).

6. **CSV export is essential for dashboards.** Engineers want to download traces, open them in Excel, and pivot on columns. JSON is good for machines; CSV is good for humans.

7. **Mask sensitive data in traces.** If traces are stored or sent to external services (LangSmith), ensure PII and API keys are excluded from trace data.

8. **Success rates are lagging indicators of prompt quality.** A sudden drop in agent success rate likely indicates a bad prompt change. Monitor success rates per agent per prompt version.

9. **Token tracking enables cost attribution.** Without per-agent token tracking, you can't answer "which agent is driving our costs?" Always track token usage per call, not just totals.

10. **Traces should include the prompt version.** When comparing traces across time, you need to know which prompt version produced each trace. Include `promptVersion` in the agent config and trace metadata.
