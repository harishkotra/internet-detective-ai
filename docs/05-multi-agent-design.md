# Multi-Agent Design in Internet Detective AI

## Multi-Agent Architecture

Internet Detective AI uses a **sequential pipeline architecture** with 7 specialized agents. Each agent handles one stage of the investigation, transforming and enriching the data as it flows through the pipeline.

The architecture follows the "routing supervisor" pattern — a central orchestrator delegates to specialized agents and assembles their outputs. This is distinct from:
- **Round-robin**: Agents take turns chatting (no, too unstructured)
- **Debate**: Agents argue positions (no, not fact-oriented)
- **Tool-use**: Single agent with tool access (no, agents are the tools)
- **Hierarchical**: Manager agents with sub-agents (no, flat delegation)

## The 7 Specialized Agents

### 1. Profile Analyst
- **Purpose**: Extract structured facts from normalized profile data
- **Input**: `ContextPack` (normalized profile, summary, key signals)
- **Output**: `Fact[]` + `digitalProfileSummary`
- **Temperature**: 0.3 (low — factual extraction)
- **System Prompt Source**: `prompts/system/analysis.md`

The foundation agent. Every downstream agent depends on the quality of facts extracted here. If this agent misses key facts, the entire report suffers.

### 2. Signal Detector
- **Purpose**: Detect behavioral patterns and hidden obsessions from facts
- **Input**: `ContextPack` + `Fact[]` (from Profile Analyst)
- **Output**: `StrongSignal[]` + `HiddenObsession[]`
- **Temperature**: 0.4 (low-medium — pattern recognition)
- **System Prompt Source**: `prompts/system/signal-detection.md`

Transforms raw observations into evidence-backed patterns. Requires ≥2 evidence points per signal. Hidden obsessions are the "secret sauce" — they make reports feel personal and insightful.

### 3. Career Predictor
- **Purpose**: Predict next career move based on signals
- **Input**: `ContextPack` + `StrongSignal[]` (from Signal Detector)
- **Output**: `CareerPrediction`
- **Temperature**: 0.5 (medium — creative prediction within constraints)
- **System Prompt Source**: `prompts/system/career.md`

Requires specific, falsifiable predictions ("Staff Engineer at a Series B startup" not "senior role").

### 4. Startup Generator
- **Purpose**: Create humorous evidence-based startup parody
- **Input**: `ContextPack` + `StrongSignal[]` (from Signal Detector)
- **Output**: `StartupParody`
- **Temperature**: 0.8 (high — creative humor)
- **System Prompt Source**: `prompts/system/startup.md`

The most creative agent. High temperature enables unexpected connections. Every parody element must tie back to actual profile data.

### 5. Roast Agent
- **Purpose**: Generate playful roasts and coworker quotes
- **Input**: `ContextPack` + `StrongSignal[]` (from Signal Detector)
- **Output**: `Roast[]` + `CoworkerQuote[]` + `finalVerdict`
- **Temperature**: 0.9 (very high — maximum creative variability)
- **System Prompt Source**: `prompts/system/roast.md`

Highest temperature in the pipeline. Comedy requires randomness. Safety is enforced post-generation by the governance agent.

### 6. Governance Agent
- **Purpose**: Validate content against ethical guidelines
- **Input**: All upstream outputs (facts, signals, roasts, predictions, parody)
- **Output**: `GovernanceCheck` (passed + violations[])
- **Temperature**: 0.2 (very low — consistent evaluation)
- **System Prompt Source**: `prompts/system/governance.md`

The gatekeeper. Runs AFTER content generation to separate generation from censorship. Validates against 7 prohibited inference categories.

### 7. Final Synthesis
- **Purpose**: Combine all outputs into the final report
- **Input**: Complete `FinalSynthesisInput` (all upstream + governance + metadata)
- **Output**: `InvestigationReport` (personality scores, cooked level, wild guesses, final verdict)
- **Temperature**: 0.5 (medium — synthesis needs creativity constrained by evidence)
- **System Prompt Source**: `prompts/system/synthesis.md`

The master assembler. Generates the meta-content (scores, jokes, verdict) that makes the report engaging.

## Agent Coordination (Orchestrator Pattern)

The `InvestigationOrchestrator` coordinates all agents. It is defined in `src/lib/agents/orchestrator.ts`:

```typescript
export class InvestigationOrchestrator {
  private profileAnalyst: ProfileAnalystAgent;
  private signalDetector: SignalDetectorAgent;
  private careerPredictor: CareerPredictorAgent;
  private startupGenerator: StartupGeneratorAgent;
  private roastAgent: RoastAgent;
  private governanceAgent: GovernanceAgent;
  private finalSynthesis: FinalSynthesisAgent;

  async investigate(context: ContextPack): Promise<{
    report: InvestigationReport;
    traces: AgentTrace[];
    governanceCheck: GovernanceCheck;
  }> {
    // Sequential execution with error handling at each step
  }
}
```

Key coordination principles:
1. **Sequential execution**: Agents run in order; each depends on the previous
2. **Error isolation**: Each agent call is try-caught with fallback defaults
3. **Trace collection**: Every agent execution produces a trace
4. **Governance retry loop**: Governance violations trigger content sanitization and retry

## Sequential Pipeline

The pipeline has two phases:

### Phase 1: Generation (Steps 1-5)
Linear execution where each step depends on previous:

```
ContextPack → Profile Analyst → Signal Detector → [Career, Startup, Roast]
```

Steps 3-5 run sequentially but could be parallelized (they all depend only on steps 1-2).

### Phase 2: Verification + Assembly (Steps 6-8)
```
[All outputs] → Governance Agent (+ retry loop) → Final Synthesis → Report
```

## Error Handling and Fallbacks

Every agent has a fallback output defined at multiple levels:

### Agent-Level safeProcess
The `BaseAgent` provides `safeProcess`, which catches errors and returns fallback defaults:

```typescript
protected async safeProcess<T>(processFn: () => Promise<{ output: T; trace: AgentTrace }>, fallbackOutput: T) {
  try {
    return await processFn();
  } catch (error) {
    return {
      output: fallbackOutput,
      trace: { success: false, error: error.message, /* zeroed metrics */ },
    };
  }
}
```

### Orchestrator-Level runAgent
The orchestrator wraps every agent call:

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

### Emergency Fallback
If the entire pipeline crashes, the orchestrator produces an emergency report:

```typescript
private buildEmergencyReport(context, errorMessage, traces, elapsed): InvestigationReport {
  return {
    personalityScores: { chaosScore: 100, ... }, // Emergency mode
    cookedLevel: "Absolutely Cooked",
    startupParody: { name: "Crashed.exe", ... },
    // All fields have safe defaults
  };
}
```

### Governance Retry Loop

```typescript
for (let attempt = 0; attempt <= MAX_GOVERNANCE_RETRIES; attempt++) {
  const { output: govOutput, trace: govTrace } = await this.runAgent(
    this.governanceAgent, governanceInput, fallback
  );

  if (governanceOutput.passed) break;

  // Sanitize and retry
  governanceInput.facts = this.sanitizeForGovernance(
    profileOutput.facts, governanceOutput.violations
  );
  await this.delay(500);
}
```

## Agent-Specific Prompts and Schemas

Each agent has a dedicated prompt file and TypeScript schema:

| Agent | Prompt File | Schema |
|-------|------------|--------|
| ProfileAnalyst | `analysis.md` | `Fact[]`, `digitalProfileSummary` |
| SignalDetector | `signal-detection.md` | `StrongSignal[]`, `HiddenObsession[]` |
| CareerPredictor | `career.md` | `CareerPrediction` |
| StartupGenerator | `startup.md` | `StartupParody` |
| RoastAgent | `roast.md` | `Roast[]`, `CoworkerQuote[]`, `finalVerdict` |
| GovernanceAgent | `governance.md` | `GovernanceCheck` |
| FinalSynthesis | `synthesis.md` | `personalityScores`, `cookedLevel`, `wildGuesses[]`, `finalVerdict` |

## Scaling to More Agents

The architecture supports adding new agents:

### Adding a "Writing Style Analyzer" Agent
1. Create `prompts/system/writing-analysis.md`
2. Create `src/lib/agents/writing-analyzer.ts` extending `BaseAgent`
3. Add the agent to the orchestrator pipeline
4. Add its input/output types to `types.ts`
5. Pass its output to the Final Synthesis agent

### Parallel Execution
The current sequential pipeline could be optimized for parallel execution. Steps 3-5 (Career, Startup, Roast) are independent and could run concurrently:

```typescript
// Future optimization
const [careerResult, startupResult, roastResult] = await Promise.all([
  this.runAgent(this.careerPredictor, { context, strongSignals }),
  this.runAgent(this.startupGenerator, { context, strongSignals }),
  this.runAgent(this.roastAgent, { context, strongSignals }),
]);
```

### Dynamic Agent Routing
Future versions could use LangGraph to dynamically route based on profile characteristics. For example, a sparse profile might skip the Signal Detector, while a very rich profile might spawn additional agents.

## Production Lessons Learned

1. **Fallback defaults should be "degraded but functional."** A startup parody named "Failed Startup" is acceptable; a null pointer exception is not.

2. **Temperature should vary by agent type.** Using the same temperature for all agents is a mistake — match temperature to task type (low for extraction, high for generation).

3. **Agent isolation is critical.** One agent's failure should not cascade to others. Each agent gets its own LLM call, its own error handling, and its own fallback.

4. **Traces make debugging possible.** Without per-agent traces, debugging a multi-agent system is guesswork. Every agent output, latency, token count, and error must be recorded.

5. **Governance should be a separate agent, not a system prompt on generation agents.** Separating generation from verification allows each to optimize independently. The Roast Agent can be maximally funny because it doesn't have to be the ethics police.

6. **Retry loops need bounded iteration.** The governance retry loop has a max of 2 attempts, then proceeds with violations flagged. Unbounded retries can loop forever if the agent keeps failing the same check.

7. **Token tracking should be aggregated across agents.** Individual agent costs are interesting; total investigation cost is what matters for billing.

8. **The orchestrator should never crash.** No matter what agents do, the orchestrator should always return a report, even if degraded.

9. **Agent parallelism is a latency optimization, not a correctness one.** Run agents sequentially first, then optimize for parallel execution once the pipeline is correct.

10. **Document the pipeline.** Without a diagram like the one in `orchestrator.md`, new engineers cannot understand the system. Keep the architecture diagram in the prompt file.
