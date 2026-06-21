import { NextRequest, NextResponse } from "next/server";
import { getEvalRun } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const run = getEvalRun(id);

    if (!run) {
      return NextResponse.json(
        { error: "Evaluation run not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: run.id,
      dataset: run.dataset,
      model: run.model,
      provider: run.provider,
      status: run.status,
      resultCount: run.results.length,
      results: run.results,
      error: run.error,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
    });
  } catch (error) {
    console.error("Failed to fetch evaluation:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch evaluation",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
