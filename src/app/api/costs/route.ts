import { NextResponse } from "next/server";
import { getCostTracker, getObservability } from "@/lib/store";

export async function GET() {
  try {
    const costTracker = getCostTracker();
    const observability = getObservability();

    const [totalCost, costByProvider, costByModel] = await Promise.all([
      costTracker.getTotalCost(),
      costTracker.getCostByProvider(),
      costTracker.getCostByModel(),
    ]);

    const records = await costTracker.getRecords({ limit: 100 });
    const avgPerInvestigation =
      await costTracker.getAverageCostPerInvestigation();
    const tokenSummary = await costTracker.getTokenSummary();
    const traceStats = await observability.getTraceStats();

    return NextResponse.json({
      totalCost,
      costByProvider,
      costByModel,
      avgPerInvestigation,
      tokenSummary,
      totalTraces: traceStats.total,
      records,
    });
  } catch (error) {
    console.error("Failed to fetch cost data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost data", message: (error as Error).message },
      { status: 500 },
    );
  }
}
