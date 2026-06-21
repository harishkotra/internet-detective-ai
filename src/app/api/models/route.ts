import { NextResponse } from "next/server";
import { getObservability, getCostTracker } from "@/lib/store";

export async function GET() {
  try {
    const observability = getObservability();
    const costTracker = getCostTracker();
    const [agentPerf] = await Promise.all([
      observability.getAgentPerformance(),
    ]);
    const records = await costTracker.getRecords({ limit: 500 });

    const modelMap: Record<
      string,
      {
        model: string;
        provider: string;
        latencies: number[];
        costs: number[];
        scores: number[];
        totalCalls: number;
        successes: number;
      }
    > = {};

    const traces = await observability.getTraces(1000);
    for (const trace of traces) {
      const key = `${trace.provider}/${trace.model}`;
      if (!modelMap[key]) {
        modelMap[key] = {
          model: trace.model,
          provider: trace.provider,
          latencies: [],
          costs: [],
          scores: [],
          totalCalls: 0,
          successes: 0,
        };
      }
      modelMap[key].latencies.push(trace.latency);
      modelMap[key].costs.push(trace.cost);
      modelMap[key].totalCalls++;
      if (trace.success) modelMap[key].successes++;
    }

    const models = Object.values(modelMap).map((m) => ({
      model: m.model,
      provider: m.provider,
      avgLatency:
        m.latencies.length > 0
          ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length
          : 0,
      avgCost:
        m.costs.length > 0
          ? m.costs.reduce((a, b) => a + b, 0) / m.costs.length
          : 0,
      avgScore:
        m.scores.length > 0
          ? m.scores.reduce((a, b) => a + b, 0) / m.scores.length
          : 0,
      totalCalls: m.totalCalls,
      successRate:
        m.totalCalls > 0
          ? Math.round((m.successes / m.totalCalls) * 10000) / 100
          : 100,
    }));

    models.sort((a, b) => b.totalCalls - a.totalCalls);

    return NextResponse.json({
      count: models.length,
      models,
    });
  } catch (error) {
    console.error("Failed to fetch model data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch model data",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
