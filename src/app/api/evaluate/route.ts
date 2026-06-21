import { NextRequest, NextResponse } from "next/server";
import { Evaluator } from "@/lib/eval";
import type { EvalResult } from "@/lib/types";
import { addEvalRun, getEvalRuns } from "@/lib/store";

const DATASETS = [
  { name: "default", description: "Default evaluation dataset" },
  { name: "full", description: "Full dataset with all test cases" },
  { name: "regression", description: "Regression test cases" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.dataset || typeof body.dataset !== "string") {
      return NextResponse.json(
        { error: "dataset is required" },
        { status: 400 },
      );
    }

    if (!body.model || typeof body.model !== "string") {
      return NextResponse.json({ error: "model is required" }, { status: 400 });
    }

    const provider =
      typeof body.provider === "string" ? body.provider : "openai";

    const evaluator = new Evaluator();
    const run: {
      id: string;
      dataset: string;
      model: string;
      provider: string;
      status: "running" | "completed" | "failed";
      results: EvalResult[];
      error?: string;
      createdAt: string;
      completedAt?: string;
    } = {
      id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dataset: body.dataset,
      model: body.model,
      provider,
      status: "running",
      results: [],
      createdAt: new Date().toISOString(),
    };

    addEvalRun(run);

    try {
      const results = await evaluator.runEvaluation(
        body.dataset,
        body.model,
        provider,
      );
      run.status = "completed";
      run.results = results;
      run.completedAt = new Date().toISOString();
    } catch (evalError) {
      run.status = "failed";
      run.error = (evalError as Error).message;
      run.completedAt = new Date().toISOString();
    }

    return NextResponse.json(
      {
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
      },
      { status: run.status === "failed" ? 500 : 201 },
    );
  } catch (error) {
    console.error("Evaluation failed:", error);
    return NextResponse.json(
      { error: "Evaluation failed", message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const pastResults = getEvalRuns().map((r) => ({
      id: r.id,
      dataset: r.dataset,
      model: r.model,
      provider: r.provider,
      status: r.status,
      resultCount: r.results.length,
      error: r.error,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));

    return NextResponse.json({
      datasets: DATASETS,
      pastResults,
    });
  } catch (error) {
    console.error("Failed to list evaluations:", error);
    return NextResponse.json(
      {
        error: "Failed to list evaluations",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
