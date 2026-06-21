import { NextRequest, NextResponse } from "next/server";
import { ObservabilityTracker } from "@/lib/observability";

const observability = new ObservabilityTracker();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get("agent");
    const investigation = searchParams.get("investigation");
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(200, Math.max(1, parseInt(limitParam, 10) || 50))
      : 50;

    let traces;

    if (agent) {
      traces = await observability.getTracesByAgent(agent);
    } else if (investigation) {
      traces = await observability.getTracesByInvestigation(investigation);
    } else {
      traces = await observability.getTraces(limit);
    }

    if (traces.length > limit) {
      traces = traces.slice(0, limit);
    }

    return NextResponse.json({
      count: traces.length,
      agentFilter: agent || null,
      investigationFilter: investigation || null,
      traces,
    });
  } catch (error) {
    console.error("Failed to fetch traces:", error);
    return NextResponse.json(
      { error: "Failed to fetch traces", message: (error as Error).message },
      { status: 500 },
    );
  }
}
