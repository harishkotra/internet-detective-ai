import { NextResponse } from "next/server";
import { ObservabilityTracker } from "@/lib/observability";
import { CostTracker } from "@/lib/cost";

const observability = new ObservabilityTracker();
const costTracker = new CostTracker();

export async function GET() {
  try {
    const [
      traceStats,
      agentPerformance,
      totalCost,
      costByProvider,
      costByModel,
    ] = await Promise.all([
      observability.getTraceStats(),
      observability.getAgentPerformance(),
      costTracker.getTotalCost(),
      costTracker.getCostByProvider(),
      costTracker.getCostByModel(),
    ]);

    return NextResponse.json({
      totalInvestigations: traceStats.total,
      totalCost,
      avgLatency: Math.round(traceStats.avgLatency * 100) / 100,
      totalTraces: traceStats.total,
      successfulTraces: traceStats.successful,
      failedTraces: traceStats.failed,
      successRate:
        traceStats.total > 0
          ? Math.round((traceStats.successful / traceStats.total) * 10000) / 100
          : 100,
      costByProvider,
      costByModel,
      agentPerformance,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
