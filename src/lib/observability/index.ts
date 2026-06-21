import { AgentTrace, InvestigationReport } from "../types";

interface LangSmithConfig {
  apiKey?: string;
  projectName?: string;
  endpoint?: string;
}

interface StoredInvestigation {
  id: string;
  report: InvestigationReport;
  traces: AgentTrace[];
  timestamp: string;
}

const MAX_STORED_TRACES = 10_000;
const MAX_STORED_INVESTIGATIONS = 1_000;

export class ObservabilityTracker {
  private traces: AgentTrace[] = [];
  private investigations: StoredInvestigation[] = [];
  private langSmithConfig: LangSmithConfig | null = null;

  constructor(langSmithConfig?: LangSmithConfig) {
    if (langSmithConfig?.apiKey) {
      this.langSmithConfig = langSmithConfig;
    }
  }

  async recordTrace(trace: AgentTrace): Promise<void> {
    this.traces.push(trace);
    if (this.traces.length > MAX_STORED_TRACES) {
      this.traces = this.traces.slice(-MAX_STORED_TRACES);
    }

    if (this.langSmithConfig) {
      await this.recordToLangSmith(trace).catch(() => {});
    }
  }

  async recordInvestigation(
    report: InvestigationReport,
    traces: AgentTrace[],
  ): Promise<void> {
    const investigation: StoredInvestigation = {
      id: report.id,
      report,
      traces,
      timestamp: new Date().toISOString(),
    };

    this.investigations.push(investigation);
    if (this.investigations.length > MAX_STORED_INVESTIGATIONS) {
      this.investigations = this.investigations.slice(
        -MAX_STORED_INVESTIGATIONS,
      );
    }

    for (const trace of traces) {
      await this.recordTrace(trace);
    }
  }

  async getTraces(limit: number = 50): Promise<AgentTrace[]> {
    return this.traces.slice(-limit).reverse();
  }

  async getTracesByAgent(agentName: string): Promise<AgentTrace[]> {
    return this.traces
      .filter((t) => t.agentName === agentName)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
  }

  async getTracesByInvestigation(
    investigationId: string,
  ): Promise<AgentTrace[]> {
    const investigation = this.investigations.find(
      (i) => i.id === investigationId,
    );
    return investigation?.traces || [];
  }

  async getInvestigations(limit: number = 20): Promise<StoredInvestigation[]> {
    return this.investigations.slice(-limit).reverse();
  }

  async getInvestigation(id: string): Promise<StoredInvestigation | undefined> {
    return this.investigations.find((i) => i.id === id);
  }

  async getFailedTraces(): Promise<AgentTrace[]> {
    return this.traces
      .filter((t) => !t.success)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
  }

  async getTraceStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgLatency: number;
    totalCost: number;
  }> {
    const total = this.traces.length;
    const successful = this.traces.filter((t) => t.success).length;
    const failed = total - successful;
    const totalLatency = this.traces.reduce((sum, t) => sum + t.latency, 0);
    const avgLatency = total > 0 ? totalLatency / total : 0;
    const totalCost = this.traces.reduce((sum, t) => sum + t.cost, 0);

    return { total, successful, failed, avgLatency, totalCost };
  }

  async getAgentPerformance(): Promise<
    Record<
      string,
      {
        totalCalls: number;
        avgLatency: number;
        totalCost: number;
        successRate: number;
      }
    >
  > {
    const byAgent: Record<
      string,
      { latencies: number[]; costs: number[]; successes: number; total: number }
    > = {};

    for (const trace of this.traces) {
      if (!byAgent[trace.agentName]) {
        byAgent[trace.agentName] = {
          latencies: [],
          costs: [],
          successes: 0,
          total: 0,
        };
      }
      byAgent[trace.agentName].latencies.push(trace.latency);
      byAgent[trace.agentName].costs.push(trace.cost);
      byAgent[trace.agentName].total++;
      if (trace.success) byAgent[trace.agentName].successes++;
    }

    const result: Record<
      string,
      {
        totalCalls: number;
        avgLatency: number;
        totalCost: number;
        successRate: number;
      }
    > = {};

    for (const [name, stats] of Object.entries(byAgent)) {
      result[name] = {
        totalCalls: stats.total,
        avgLatency:
          stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length,
        totalCost: stats.costs.reduce((a, b) => a + b, 0),
        successRate: stats.total > 0 ? stats.successes / stats.total : 0,
      };
    }

    return result;
  }

  async exportTraces(format: "json" | "csv" = "json"): Promise<string> {
    if (format === "csv") {
      const headers = [
        "agentId",
        "agentName",
        "latency",
        "promptTokens",
        "completionTokens",
        "totalTokens",
        "cost",
        "model",
        "provider",
        "startTime",
        "endTime",
        "success",
        "error",
      ];
      const rows = this.traces.map((t) =>
        [
          t.agentId,
          t.agentName,
          t.latency,
          t.tokenUsage.promptTokens,
          t.tokenUsage.completionTokens,
          t.tokenUsage.totalTokens,
          t.cost,
          t.model,
          t.provider,
          t.startTime,
          t.endTime,
          t.success,
          t.error || "",
        ].join(","),
      );
      return [headers.join(","), ...rows].join("\n");
    }

    return JSON.stringify(this.traces, null, 2);
  }

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

    const endpoint =
      this.langSmithConfig.endpoint || "https://api.smith.langchain.com";
    const apiKey = this.langSmithConfig.apiKey;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${endpoint}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `LangSmith API error: ${response.status} ${response.statusText}`,
      );
    }
  }
}
