import { v4 as uuidv4 } from "uuid";
import {
  InvestigationReport,
  ContextPack,
  NormalizedProfile,
  EvalResult,
  EvalMetric,
  ModelComparison,
} from "../types";
import { estimateCost } from "../cost";

const JSON_STRUCTURE_SCHEMA: Record<
  string,
  "string" | "number" | "object" | "array" | "boolean"
> = {
  id: "string",
  profileHash: "string",
  digitalProfileSummary: "string",
  facts: "array",
  strongSignals: "array",
  hiddenObsessions: "array",
  coworkerQuotes: "array",
  startupParody: "object",
  careerPrediction: "object",
  brutalRoast: "array",
  wildGuesses: "array",
  finalVerdict: "string",
  personalityScores: "object",
  cookedLevel: "string",
  metadata: "object",
};

export class Evaluator {
  async runEvaluation(
    dataset: string,
    model: string,
    provider: string,
  ): Promise<EvalResult[]> {
    const results: EvalResult[] = [];
    const reports = await this.loadDataset(dataset);

    for (const report of reports) {
      const startTime = performance.now();
      const latency = performance.now() - startTime;

      const metrics = this.computeMetrics(report, {
        normalized: {} as NormalizedProfile,
        summary: "",
        keySignals: [],
        compressionRatio: 0,
        noiseReduction: 0,
        timestamp: "",
      });
      const cost =
        report.metadata?.cost ??
        estimateCost(
          model,
          report.metadata?.tokenUsage?.promptTokens ?? 0,
          report.metadata?.tokenUsage?.completionTokens ?? 0,
        );

      results.push({
        id: uuidv4(),
        dataset,
        promptVersion: report.metadata?.promptVersion || "1.0.0",
        model,
        provider,
        metrics,
        report,
        latency,
        cost,
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  async compareModels(dataset: string): Promise<ModelComparison[]> {
    throw new Error(
      "compareModels requires a list of model/provider pairs. Use compareModelsWithConfigs instead.",
    );
  }

  async compareModelsWithConfigs(
    dataset: string,
    configs: Array<{ model: string; provider: string }>,
  ): Promise<ModelComparison[]> {
    const allResults = await Promise.all(
      configs.map((cfg) =>
        this.runEvaluation(dataset, cfg.model, cfg.provider),
      ),
    );

    return configs.map((cfg, i) => {
      const results = allResults[i];
      const avgMetrics = this.averageMetrics(results.map((r) => r.metrics));
      const avgLatency =
        results.reduce((s, r) => s + r.latency, 0) / results.length;
      const avgCost = results.reduce((s, r) => s + r.cost, 0) / results.length;

      return {
        model: cfg.model,
        provider: cfg.provider,
        avgMetrics,
        avgLatency,
        avgCost,
        sampleSize: results.length,
      };
    });
  }

  computeMetrics(
    report: InvestigationReport,
    context: ContextPack,
  ): Record<EvalMetric, number> {
    const reportJson = JSON.stringify(report);

    return {
      json_compliance: this.measureJSONCompliance(reportJson),
      consistency: this.measureConsistency(report),
      hallucination_rate: this.measureHallucinationRate(report, context),
      humor_score: this.measureHumorScore(report),
      accuracy: this.measureAccuracy(report, context),
      latency: 0,
      cost: 0,
    };
  }

  private measureJSONCompliance(output: string): number {
    try {
      const parsed = JSON.parse(output);
      const requiredKeys = Object.keys(JSON_STRUCTURE_SCHEMA);
      const presentKeys = new Set(Object.keys(parsed));
      const missingFields = requiredKeys.filter((k) => !presentKeys.has(k));
      const extraKeys = Object.keys(parsed).filter(
        (k) => !requiredKeys.includes(k),
      );

      const hasAllFields = missingFields.length === 0;
      const typeChecks = requiredKeys
        .filter((k) => presentKeys.has(k))
        .map((k) => {
          const expectedType = JSON_STRUCTURE_SCHEMA[k];
          const actual = parsed[k];
          if (actual === null || actual === undefined) return false;
          if (expectedType === "array") return Array.isArray(actual);
          return typeof actual === expectedType;
        });
      const correctTypes = typeChecks.filter(Boolean).length;
      const totalChecks = typeChecks.length || 1;

      let score = 0;
      if (hasAllFields) score += 0.5;
      score += 0.5 * (correctTypes / totalChecks);

      if (missingFields.length > 0 || extraKeys.length > 0) {
        score *= Math.max(
          0,
          1 - (missingFields.length + extraKeys.length) * 0.1,
        );
      }

      return Math.round(score * 100) / 100;
    } catch {
      const matchFields = Object.keys(JSON_STRUCTURE_SCHEMA).filter((k) =>
        output.includes(`"${k}"`),
      ).length;
      const totalFields = Object.keys(JSON_STRUCTURE_SCHEMA).length;
      return Math.round((matchFields / totalFields) * 100) / 100;
    }
  }

  private measureConsistency(report: InvestigationReport): number {
    let consistency = 1.0;
    let checks = 0;

    const mentionedRoles = new Set(
      report.facts
        .filter((f) => f.category === "role" || f.category === "position")
        .map((f) => f.observation.toLowerCase()),
    );

    if (report.careerPrediction) {
      checks++;
      const prediction = report.careerPrediction.nextRole.toLowerCase();
      if (mentionedRoles.has(prediction)) {
        consistency -= 0.1;
      }
    }

    const summaryLower = (report.digitalProfileSummary || "").toLowerCase();
    for (const fact of report.facts) {
      checks++;
      const factKey = fact.observation.slice(0, 30).toLowerCase();
      if (!summaryLower.includes(factKey)) {
        consistency -= 0.05;
      }
    }

    const startYear = report.facts
      .map((f) => parseInt(f.observation.match(/\b(19|20)\d{2}\b/)?.[0] || ""))
      .filter((y) => !isNaN(y));
    if (startYear.length > 1) {
      checks++;
      const sorted = startYear.sort((a, b) => a - b);
      if (sorted[sorted.length - 1] - sorted[0] > 40) {
        consistency -= 0.15;
      }
    }

    if (checks === 0) return 1;
    return Math.max(
      0,
      Math.round((consistency / Math.max(1, checks)) * 100) / 100,
    );
  }

  private measureHallucinationRate(
    report: InvestigationReport,
    context: ContextPack,
  ): number {
    const contextText = (context.summary || "").toLowerCase();
    if (!contextText) return 0.5;

    let hallucinations = 0;
    let totalChecks = 0;

    for (const fact of report.facts) {
      totalChecks++;
      const factLower = fact.observation.toLowerCase();
      const factWords = factLower.split(/\s+/).filter((w) => w.length > 3);
      const matchedWords = factWords.filter((w) => contextText.includes(w));
      const matchRatio =
        factWords.length > 0 ? matchedWords.length / factWords.length : 0;

      if (matchRatio < 0.3) {
        hallucinations++;
      }
    }

    for (const signal of report.strongSignals) {
      totalChecks++;
      const signalLower = signal.title.toLowerCase();
      const signalWords = signalLower.split(/\s+/).filter((w) => w.length > 3);
      const matchedWords = signalWords.filter((w) => contextText.includes(w));
      const matchRatio =
        signalWords.length > 0 ? matchedWords.length / signalWords.length : 0;

      if (matchRatio < 0.2) {
        hallucinations++;
      }
    }

    if (report.wildGuesses && report.wildGuesses.length > 0) {
      totalChecks += report.wildGuesses.length;
      hallucinations += Math.floor(report.wildGuesses.length * 0.3);
    }

    if (totalChecks === 0) return 0;
    return Math.round((hallucinations / totalChecks) * 100) / 100;
  }

  private measureHumorScore(report: InvestigationReport): number {
    let humorScore = 0;
    const checks: boolean[] = [];

    if (report.brutalRoast && report.brutalRoast.length > 0) {
      checks.push(report.brutalRoast.length >= 2);
      checks.push(report.brutalRoast.length <= 8);

      const hasVariety =
        new Set(report.brutalRoast.map((r) => r.category)).size >= 2;
      checks.push(hasVariety);

      const hasGoodIntensity =
        report.brutalRoast.filter((r) => r.intensity >= 4 && r.intensity <= 9)
          .length >= 2;
      checks.push(hasGoodIntensity);

      const roastLines = report.brutalRoast.map((r) => r.line);
      const avgRoastLength =
        roastLines.reduce((s, l) => s + l.length, 0) / roastLines.length;
      checks.push(avgRoastLength > 40 && avgRoastLength < 200);

      const structureWords = [
        "basically",
        "honestly",
        "looks like",
        "energy",
        "vibe",
        "definitely",
      ];
      const hasStructure = roastLines.some((l) =>
        structureWords.some((w) => l.toLowerCase().includes(w)),
      );
      checks.push(hasStructure);
    } else {
      checks.push(false);
    }

    if (report.coworkerQuotes && report.coworkerQuotes.length > 0) {
      checks.push(report.coworkerQuotes.length >= 1);
      const tones = new Set(report.coworkerQuotes.map((q) => q.tone));
      checks.push(tones.size >= 2);
    } else {
      checks.push(false);
    }

    if (report.startupParody) {
      const parody = report.startupParody;
      checks.push(parody.name.length > 5);
      checks.push(parody.tagline.length > 10);
      checks.push(parody.investorPitch.length > 30);
      checks.push(parody.biggestRisk.length > 10);
      checks.push(parody.mostLikelyCauseOfFailure.length > 10);
    }

    const finalVerdictLower = (report.finalVerdict || "").toLowerCase();
    const humorIndicators = [
      "honestly",
      "let's be",
      "truth is",
      "brutal",
      "reality",
      "unfiltered",
      "hot take",
      "controversial",
      "truth bomb",
    ];
    const hasHumorIndicators = humorIndicators.some((w) =>
      finalVerdictLower.includes(w),
    );
    checks.push(hasHumorIndicators);

    if (checks.length > 0) {
      humorScore = checks.filter(Boolean).length / checks.length;
    }

    return Math.round(humorScore * 100) / 100;
  }

  private measureAccuracy(
    report: InvestigationReport,
    context: ContextPack,
  ): number {
    return 1 - this.measureHallucinationRate(report, context);
  }

  private async loadDataset(_dataset: string): Promise<InvestigationReport[]> {
    return [];
  }

  private averageMetrics(
    metricsList: Record<EvalMetric, number>[],
  ): Record<EvalMetric, number> {
    const metrics = metricsList[0];
    if (!metrics) {
      const zeroMetrics: Record<string, number> = {};
      for (const key of Object.keys(JSON_STRUCTURE_SCHEMA)) {
        zeroMetrics[key] = 0;
      }
      return zeroMetrics as Record<EvalMetric, number>;
    }

    const keys = Object.keys(metrics) as EvalMetric[];
    const result: Record<string, number> = {};
    for (const key of keys) {
      result[key] =
        metricsList.reduce((sum, m) => sum + (m[key] || 0), 0) /
        metricsList.length;
    }
    return result as Record<EvalMetric, number>;
  }
}
