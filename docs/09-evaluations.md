# Evaluations in Internet Detective AI

## Evaluation Framework Design

Evaluating LLM output quality is one of the hardest problems in AI engineering. Unlike traditional software where tests have binary pass/fail outcomes, LLM evaluation requires measuring subjective qualities: coherence, humor, accuracy, and compliance.

The evaluation framework in `src/lib/eval/index.ts` defines:
- **5 metrics** for automatic evaluation
- **4 datasets** for test profiles
- **Model comparison** capabilities
- **Dataset loading** (placeholder for future implementation)

## The 4 Evaluation Datasets

The `evals/` directory contains 4 datasets representing different profile archetypes:

| Dataset | File | Profile Archetype |
|---------|------|-------------------|
| Developer | `evals/developer.json` | Software engineer with open source contributions |
| Designer | `evals/designer.json` | UX/UI designer with portfolio |
| Founder | `evals/founder.json` | Startup founder with multiple ventures |
| Creator | `evals/creator.json` | Content creator with strong writing/speaking presence |

Each dataset contains pre-computed `InvestigationReport` examples representing a "known good" output for that profile type. The evaluation framework measures how closely new outputs match these known-good results.

## Metrics: JSON Compliance, Consistency, Hallucination Rate, Humor Score, Accuracy

### json_compliance
Measures whether the output conforms to the expected JSON schema:

```typescript
private measureJSONCompliance(output: string): number {
  try {
    const parsed = JSON.parse(output);
    const requiredKeys = Object.keys(JSON_STRUCTURE_SCHEMA);
    const presentKeys = new Set(Object.keys(parsed));
    const missingFields = requiredKeys.filter((k) => !presentKeys.has(k));
    const extraKeys = Object.keys(parsed).filter((k) => !requiredKeys.includes(k));

    // Score: 50% for having all fields, 50% for correct types
    let score = 0;
    if (hasAllFields) score += 0.5;
    score += 0.5 * (correctTypes / totalChecks);

    // Penalty for missing/extra keys
    if (missingFields.length > 0 || extraKeys.length > 0) {
      score *= Math.max(0, 1 - (missingFields.length + extraKeys.length) * 0.1);
    }
    return Math.round(score * 100) / 100;
  } catch {
    // Non-JSON output — calculate partial credit based on field presence
    return Math.round((matchFields / totalFields) * 100) / 100;
  }
}
```

### consistency
Measures internal consistency of the report — whether facts support the summary, whether predictions align with evidence:

```typescript
private measureConsistency(report: InvestigationReport): number {
  let consistency = 1.0;
  let checks = 0;

  // Check if career prediction mentions roles from the facts
  const mentionedRoles = new Set(report.facts
    .filter((f) => f.category === "role" || f.category === "position")
    .map((f) => f.observation.toLowerCase()));

  const prediction = report.careerPrediction.nextRole.toLowerCase();
  if (mentionedRoles.has(prediction)) consistency -= 0.1;

  // Check if summary references facts
  for (const fact of report.facts) {
    const factKey = fact.observation.slice(0, 30).toLowerCase();
    if (!summaryLower.includes(factKey)) consistency -= 0.05;
  }

  return Math.max(0, Math.round((consistency / Math.max(1, checks)) * 100) / 100);
}
```

### hallucination_rate
Estimates how much content is unsupported by the input data:

```typescript
private measureHallucinationRate(report: InvestigationReport, context: ContextPack): number {
  const contextText = context.summary.toLowerCase();
  if (!contextText) return 0.5; // Can't measure without reference

  let hallucinations = 0;
  let totalChecks = 0;

  for (const fact of report.facts) {
    totalChecks++;
    const factWords = fact.observation.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchedWords = factWords.filter(w => contextText.includes(w));
    const matchRatio = factWords.length > 0 ? matchedWords.length / factWords.length : 0;
    if (matchRatio < 0.3) hallucinations++;
  }

  // Wild guesses get a built-in 30% hallucination penalty
  if (report.wildGuesses && report.wildGuesses.length > 0) {
    hallucinations += Math.floor(report.wildGuesses.length * 0.3);
  }

  return Math.round((hallucinations / totalChecks) * 100) / 100;
}
```

### humor_score
A heuristic measure of comedic quality in roasts and parodies:

```typescript
private measureHumorScore(report: InvestigationReport): number {
  let humorScore = 0;
  const checks: boolean[] = [];

  // Roasts: check count, variety, intensity, length, structure
  if (report.brutalRoast?.length > 0) {
    checks.push(report.brutalRoast.length >= 2);
    checks.push(new Set(report.brutalRoast.map(r => r.category)).size >= 2);

    const goodIntensity = report.brutalRoast.filter(
      r => r.intensity >= 4 && r.intensity <= 9
    ).length >= 2;
    checks.push(goodIntensity);
  }

  // Coworker quotes: check count and tone variety
  if (report.coworkerQuotes?.length > 0) {
    checks.push(new Set(report.coworkerQuotes.map(q => q.tone)).size >= 2);
  }

  // Startup parody: check field completeness
  if (report.startupParody) {
    checks.push(report.startupParody.name.length > 5);
    checks.push(report.startupParody.investorPitch.length > 30);
  }

  humorScore = checks.filter(Boolean).length / checks.length;
  return Math.round(humorScore * 100) / 100;
}
```

### accuracy
Simply the inverse of hallucination rate:

```typescript
private measureAccuracy(report: InvestigationReport, context: ContextPack): number {
  return 1 - this.measureHallucinationRate(report, context);
}
```

## Running Evaluations

The `Evaluator` class runs evaluations and aggregates results:

```typescript
export class Evaluator {
  async runEvaluation(
    dataset: string,
    model: string,
    provider: string,
  ): Promise<EvalResult[]> {
    const reports = await this.loadDataset(dataset);
    const results: EvalResult[] = [];

    for (const report of reports) {
      const metrics = this.computeMetrics(report, context);
      const cost = report.metadata?.cost ?? 0;

      results.push({
        id: uuidv4(),
        dataset, model, provider,
        metrics, report,
        latency, cost,
        timestamp: new Date().toISOString(),
      });
    }
    return results;
  }
}
```

Evaluation runs are stored in memory and exposed via API:

```
POST /api/evaluate?dataset=developer&model=gpt-4o&provider=openai
GET  /api/evaluate/runs
```

## Comparing Models

The `compareModelsWithConfigs` method runs evaluations across multiple model/provider combinations:

```typescript
async compareModelsWithConfigs(
  dataset: string,
  configs: Array<{ model: string; provider: string }>,
): Promise<ModelComparison[]> {
  const allResults = await Promise.all(
    configs.map((cfg) => this.runEvaluation(dataset, cfg.model, cfg.provider)),
  );

  return configs.map((cfg, i) => ({
    model: cfg.model,
    provider: cfg.provider,
    avgMetrics: this.averageMetrics(allResults[i].map(r => r.metrics)),
    avgLatency, avgCost,
    sampleSize: allResults[i].length,
  }));
}
```

This enables answering questions like:
- "Does GPT-4o produce more consistent reports than Claude 3.5 Sonnet?"
- "Is Gemini 2.0 Flash's humor score competitive with GPT-4o?"
- "Which provider gives the best latency-to-quality tradeoff?"

## Using Results to Improve Prompts

Evaluation results drive prompt iteration through a feedback loop:

```
1. Baseline evaluation → record metrics
2. Modify prompt → change instruction, examples, or structure
3. Re-run evaluation → compare metrics to baseline
4. A/B test → run old vs. new prompt on same dataset
5. Promote winner → if metrics improve, deploy new prompt version
```

### Prompt Version Tracking
Each prompt has a version number in its file header (`# Version: 1.0.0`). Evaluation results include the prompt version, enabling version-level comparison:

```typescript
export interface EvalResult {
  id: string;
  dataset: string;
  promptVersion: string;  // ← Track which prompt version produced this
  model: string;
  provider: string;
  metrics: Record<EvalMetric, number>;
  // ...
}
```

### Example: Improving Roast Quality
If humor_score is low (e.g., 0.35):
1. Add more roast examples to the prompt
2. Increase temperature from 0.8 to 0.9
3. Add intensity variety requirement
4. Re-run evaluation
5. Compare humor_score pre and post change
6. If humor_score improved to 0.55, promote the new prompt

## Production Lessons Learned

1. **Automatic metrics are proxies, not ground truth.** Humor_score measures structural properties (variety, length, intensity) but can't tell if something is actually funny. Always pair automatic metrics with human evaluation.

2. **Hallucination rate measurement is approximate.** Word-overlap with context is a weak proxy for grounding. A fact can use words from the context while being factually wrong. Better techniques (semantic similarity, NLI models) are more accurate but more expensive.

3. **Consistency scoring needs refinement.** The current approach (checking if summary mentions facts) is simple but misses many consistency issues. A fact could be: "Has 10 years experience at Google" but the job history shows 3 years. Semantic consistency checking would catch this.

4. **Datasets should include real profiles with known "right answers."** The current datasets contain pre-computed reports, but for accuracy measurement, you need ground-truth facts that the model should extract.

5. **Model comparison is only valid on the same dataset.** Comparing "developer" results to "creator" results is meaningless. Always compare within the same dataset.

6. **Prompt version tracking is essential for regression testing.** When you update a prompt, you need to verify it still works on all datasets, not just the dataset you optimized for.

7. **Cost and latency should be part of the evaluation.** A model with perfect scores but 10x the cost may not be the best choice. Include cost and latency in model comparison metrics.

8. **Automated evaluation is a complement to, not a replacement for, human review.** Spot-check reports yourself. The feel of a good report can't be captured in metrics.

9. **Evaluation edge cases matter more than averages.** A model that averages 0.9 compliance but sometimes returns non-JSON is worse than one that always returns 0.85. Track min/max alongside averages.

10. **Build a regression suite.** When you make any change to prompts, agents, or context building, run the full evaluation suite to catch regressions before they reach users.
