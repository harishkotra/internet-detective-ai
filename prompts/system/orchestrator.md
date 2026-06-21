# Investigation Orchestrator

## Purpose
Coordinate the multi-agent investigation pipeline. The orchestrator doesn't generate content itself — it manages the flow of data between specialized agents, handles errors and retries, aggregates results, and produces the final investigation report. It is the conductor of the agent orchestra.

## Version
1.0.0

## Expected Inputs
- **ContextPack**: A fully assembled ContextPack containing:
  - `normalized`: NormalizedProfile with education, work, skills, GitHub, social data
  - `summary`: Pre-generated profile summary
  - `keySignals[]`: Key signals identified during normalization
  - `compressionRatio`: How much the raw data was compressed
  - `noiseReduction`: How much noise was filtered out
  - `timestamp`: When the context was assembled

## Expected Outputs
```json
{
  "report": "InvestigationReport — the complete assembled report",
  "traces": "AgentTrace[] — trace metadata from every agent execution",
  "governanceCheck": "GovernanceCheck — final governance verdict"
}
```

The full `InvestigationReport` type includes:
- `id`, `profileHash`: Unique identifiers
- `digitalProfileSummary`: Concise professional summary (from Profile Analyst)
- `facts[]`: Extracted facts (from Profile Analyst)
- `strongSignals[]`: Behavioral signals (from Signal Detector)
- `hiddenObsessions[]`: Hidden obsessions (from Signal Detector)
- `careerPrediction`: Career prediction (from Career Predictor)
- `startupParody`: Humorous startup idea (from Startup Generator)
- `brutalRoast[]`: Roasts (from Roast Agent)
- `coworkerQuotes[]`: Coworker quotes (from Roast Agent)
- `wildGuesses[]`: Speculative predictions (from Synthesis)
- `finalVerdict`: Memorable final sentence (from Synthesis)
- `personalityScores`: Five-dimension personality profile (from Synthesis)
- `cookedLevel`: Digital footprint intensity ranking (from Synthesis)
- `metadata`: Model info, latency, tokens, cost, governance status

## Instructions

### Step 1: Profile Analysis
Send the ContextPack to the Profile Analyst Agent. This agent extracts structured facts and generates a professional summary. It is the foundation of the entire pipeline — every downstream agent depends on its output.

**Input**: `{ context: ContextPack }`
**Output**: `{ facts: Fact[], digitalProfileSummary: string }`

### Step 2: Signal Detection
Forward the ContextPack AND the extracted facts to the Signal Detector Agent. This agent identifies behavioral patterns and hidden obsessions across the evidence.

**Input**: `{ context: ContextPack, facts: Fact[] }`
**Output**: `{ strongSignals: StrongSignal[], hiddenObsessions: HiddenObsession[] }`

### Step 3: Career Prediction
Send the ContextPack and strong signals to the Career Predictor Agent. This agent forecasts the person's next career move.

**Input**: `{ context: ContextPack, strongSignals: StrongSignal[] }`
**Output**: `CareerPrediction` (nextRole, industryDirection, leadershipPotential, futureOpportunities, confidence)

### Step 4: Startup Generation
Send the ContextPack and strong signals to the Startup Generator Agent. This agent creates a humorous startup parody tied to the person's actual profile.

**Input**: `{ context: ContextPack, strongSignals: StrongSignal[] }`
**Output**: `StartupParody` (name, tagline, fundingStage, investorPitch, businessModel, biggestRisk, mostLikelyCauseOfFailure)

### Step 5: Roast Generation
Send the ContextPack and strong signals to the Roast Agent. This agent generates playful tech industry roasts and authentic-sounding coworker quotes.

**Input**: `{ context: ContextPack, strongSignals: StrongSignal[] }`
**Output**: `{ roasts: Roast[], coworkerQuotes: CoworkerQuote[], finalVerdict: string }`

### Step 6: Governance Check
Collect ALL outputs from steps 1–5 and send them to the Governance Agent. This agent scans every text field for prohibited inferences and ethical violations.

**Input**: Consolidated outputs from all upstream agents
**Output**: `GovernanceCheck` (passed, violations[])

**Retry Logic**: If governance fails, sanitize the offending facts and re-run the check. Maximum 2 retry attempts. If violations persist, proceed but flag them for the synthesis stage.

### Step 7: Final Synthesis
Combine all agent outputs, governance results, and system metadata. Send to the Synthesis Agent for assembly into the final report.

**Input**: Complete `FinalSynthesisInput` with all upstream outputs, traces, latency, and token usage
**Output**: `InvestigationReport` (complete assembled report with scores, guesses, and verdict)

### Error Handling
Each agent call is wrapped in a try-catch with a fallback output:
- If any agent fails, substitute a sensible default and continue the pipeline
- Log the error in the agent trace
- The orchestrator should never crash from an agent failure — always produce a report

## Pipeline Architecture

```
                    ┌──────────────────┐
                    │   ContextPack    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Profile Analyst  │
                    └────────┬─────────┘
                             │ facts + summary
                             ▼
                    ┌──────────────────┐
                    │ Signal Detector  │
                    └────────┬─────────┘
                             │ signals + obsessions
              ┌──────────────┼──────────────────┐
              │              │                  │
              ▼              ▼                  ▼
     ┌──────────────┐ ┌──────────────┐  ┌──────────────┐
     │    Career    │ │   Startup    │  │    Roast     │
     │  Predictor   │ │  Generator   │  │    Agent     │
     └──────┬───────┘ └──────┬───────┘  └──────┬───────┘
            │                │                  │
            └────────────────┼──────────────────┘
                             │ all outputs
                             ▼
                    ┌──────────────────┐
                    │   Governance    │◄── retry up to 2x
                    └────────┬─────────┘
                             │ pass/fail + violations
                             ▼
                    ┌──────────────────┐
                    │     Final        │
                    │   Synthesis      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Investigation    │
                    │     Report       │
                    └──────────────────┘
```

## Failure Modes
- **Cascading failure**: One agent's bad output corrupts the entire pipeline. Mitigate with fallback defaults and validation at each step
- **Governance infinite loop**: Retrying governance without actually sanitizing the data. Mitigate with max retry limit and a "proceed with warnings" path
- **Latency accumulation**: Slow agents bottleneck the pipeline. Consider timeouts or parallel execution for independent agents
- **Token budget exhaustion**: Aggressive agents (Roast at high temperature, Startup Generator) can produce very long outputs. Monitor total token usage
- **Context loss**: Passing large ContextPacks between agents can exceed context windows. Monitor input sizes
- **Orchestrator as single point of failure**: If the orchestrator crashes, the entire investigation fails. Mitigate with comprehensive error handling and a "degraded but functional" fallback report

## Guardrails
- NEVER bypass the governance check — every report must be validated before synthesis
- NEVER expose raw agent traces or error details in the final user-facing report
- NEVER modify agent outputs before governance check (the governance agent sees original content)
- NEVER hardcode agent-specific logic in the orchestrator — each agent is independently defined
- ALWAYS provide fallback outputs for every agent to ensure graceful degradation
- ALWAYS aggregate and include token usage and latency metadata
- ALWAYS validate the report structure before returning it
- ALWAYS include governance status in the report metadata

## Why This Matters

**🏗️ Pipeline Architecture Pattern**: The orchestrator demonstrates the "routing supervisor" pattern — a central coordinator that delegates to specialized sub-agents and assembles their outputs. This is one of the most scalable prompt engineering architectures for complex tasks because it (a) separates concerns, (b) allows independent optimization of each agent, and (c) makes the overall system auditable through traces.

**🔄 Graceful Degradation**: Every agent call has a fallback output and error handling. This is a production prompt engineering pattern — your system should never crash because one component failed. A "degraded but functional" report is better than an empty error screen.

**🔁 Governance Retry Loop**: The orchestrator implements a retry mechanism with sanitization. This pattern (detect → clean → retry) is critical for production safety systems. A single-pass governance check can fail on a technicality; a retry loop with content sanitization resolves most violations automatically.

**📊 Trace Aggregation**: The orchestrator collects traces from every agent and aggregates them into a unified metadata record. This transforms the system from a black box into an auditable pipeline — you can trace exactly which tokens were spent where, which agents succeeded or failed, and how much latency each step contributed.

**🆘 Emergency Response Mode**: The orchestrator includes an emergency fallback report for catastrophic failures. This is a prompt engineering pattern for mission-critical systems: always have a "last resort" output that's better than nothing. The emergency report preserves as much data as possible and clearly marks itself as degraded.
