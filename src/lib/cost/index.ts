import { AgentTrace } from "../types";
import { generateId } from "../utils";

export interface CostRecord {
  id: string;
  userId?: string;
  investigationId: string;
  provider: string;
  model: string;
  agentName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: string;
}

const MODEL_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-opus-4-20250514": { input: 15, output: 75 },
  "claude-sonnet-4-20250514": { input: 4, output: 20 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "deepseek-v3": { input: 0.27, output: 1.1 },
  "deepseek-r1": { input: 0.55, output: 2.19 },
  "llama-3.1-8b": { input: 0.05, output: 0.05 },
  "llama-3.1-70b": { input: 0.59, output: 0.79 },
  "llama-3.1-405b": { input: 2.0, output: 2.0 },
  "mistral-large": { input: 2.0, output: 6.0 },
  "mistral-small": { input: 0.2, output: 0.6 },
  "grok-2": { input: 2.0, output: 10.0 },
  "grok-2-vision": { input: 5.0, output: 15.0 },
  default: { input: 1.0, output: 4.0 },
};

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = MODEL_RATES[model] || MODEL_RATES.default;
  const inputCost = (promptTokens / 1_000_000) * rates.input;
  const outputCost = (completionTokens / 1_000_000) * rates.output;
  return Number((inputCost + outputCost).toFixed(8));
}

export function defaultModelRate(model: string): {
  input: number;
  output: number;
} {
  return MODEL_RATES[model] || MODEL_RATES.default;
}

const MAX_RECORDS = 100_000;

export class CostTracker {
  private records: CostRecord[] = [];
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
  }

  async recordCost(
    trace: AgentTrace,
    investigationId: string,
  ): Promise<CostRecord> {
    const record: CostRecord = {
      id: generateId(),
      userId: this.userId,
      investigationId,
      provider: trace.provider,
      model: trace.model,
      agentName: trace.agentName,
      promptTokens: trace.tokenUsage.promptTokens,
      completionTokens: trace.tokenUsage.completionTokens,
      totalTokens: trace.tokenUsage.totalTokens,
      estimatedCost: estimateCost(
        trace.model,
        trace.tokenUsage.promptTokens,
        trace.tokenUsage.completionTokens,
      ),
      timestamp: new Date().toISOString(),
    };

    this.records.push(record);
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(-MAX_RECORDS);
    }

    return record;
  }

  async recordInvestigationCost(
    traces: AgentTrace[],
    investigationId: string,
  ): Promise<CostRecord[]> {
    const records: CostRecord[] = [];
    for (const trace of traces) {
      const record = await this.recordCost(trace, investigationId);
      records.push(record);
    }
    return records;
  }

  async getTotalCost(): Promise<number> {
    return this.records.reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  async getCostByProvider(): Promise<Record<string, number>> {
    const byProvider: Record<string, number> = {};
    for (const record of this.records) {
      byProvider[record.provider] =
        (byProvider[record.provider] || 0) + record.estimatedCost;
    }
    return byProvider;
  }

  async getCostByModel(): Promise<Record<string, number>> {
    const byModel: Record<string, number> = {};
    for (const record of this.records) {
      byModel[record.model] =
        (byModel[record.model] || 0) + record.estimatedCost;
    }
    return byModel;
  }

  async getCostByAgent(): Promise<Record<string, number>> {
    const byAgent: Record<string, number> = {};
    for (const record of this.records) {
      byAgent[record.agentName] =
        (byAgent[record.agentName] || 0) + record.estimatedCost;
    }
    return byAgent;
  }

  async getCostByUser(userId: string): Promise<number> {
    return this.records
      .filter((r) => r.userId === userId)
      .reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  async getCostByInvestigation(investigationId: string): Promise<number> {
    return this.records
      .filter((r) => r.investigationId === investigationId)
      .reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  async getCostByDateRange(start: string, end: string): Promise<number> {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    return this.records
      .filter((r) => {
        const ts = new Date(r.timestamp).getTime();
        return ts >= startMs && ts <= endMs;
      })
      .reduce((sum, r) => sum + r.estimatedCost, 0);
  }

  async getRecords(
    options: {
      limit?: number;
      offset?: number;
      provider?: string;
      model?: string;
      agentName?: string;
      investigationId?: string;
    } = {},
  ): Promise<CostRecord[]> {
    let filtered = this.records;

    if (options.provider) {
      filtered = filtered.filter((r) => r.provider === options.provider);
    }
    if (options.model) {
      filtered = filtered.filter((r) => r.model === options.model);
    }
    if (options.agentName) {
      filtered = filtered.filter((r) => r.agentName === options.agentName);
    }
    if (options.investigationId) {
      filtered = filtered.filter(
        (r) => r.investigationId === options.investigationId,
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return filtered.slice(offset, offset + limit);
  }

  async getTokenSummary(): Promise<{
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
  }> {
    return this.records.reduce(
      (acc, r) => ({
        totalPromptTokens: acc.totalPromptTokens + r.promptTokens,
        totalCompletionTokens: acc.totalCompletionTokens + r.completionTokens,
        totalTokens: acc.totalTokens + r.totalTokens,
      }),
      { totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0 },
    );
  }

  async getAverageCostPerInvestigation(): Promise<number> {
    const investigations = new Set(this.records.map((r) => r.investigationId));
    if (investigations.size === 0) return 0;
    const total = await this.getTotalCost();
    return total / investigations.size;
  }

  async exportRecords(): Promise<string> {
    const headers = [
      "id",
      "userId",
      "investigationId",
      "provider",
      "model",
      "agentName",
      "promptTokens",
      "completionTokens",
      "totalTokens",
      "estimatedCost",
      "timestamp",
    ];
    const rows = this.records.map((r) =>
      [
        r.id,
        r.userId || "",
        r.investigationId,
        r.provider,
        r.model,
        r.agentName,
        r.promptTokens,
        r.completionTokens,
        r.totalTokens,
        r.estimatedCost,
        r.timestamp,
      ].join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }

  async clear(): Promise<void> {
    this.records = [];
  }
}
