"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart } from "@/components/dashboard/BarChart";
import { Check, X, Loader2 } from "lucide-react";

interface EvalRunSummary {
  id: string;
  dataset: string;
  model: string;
  provider: string;
  status: "running" | "completed" | "failed";
  resultCount: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface EvalDetail extends EvalRunSummary {
  results: EvalResultItem[];
}

interface EvalResultItem {
  id: string;
  metrics: Record<string, number>;
  latency: number;
  cost: number;
  timestamp: string;
}

const METRIC_LABELS: Record<string, string> = {
  json_compliance: "JSON Compliance",
  consistency: "Consistency",
  hallucination_rate: "Hallucination Rate",
  humor_score: "Humor Score",
  accuracy: "Accuracy",
  latency: "Latency",
  cost: "Cost",
};

export default function EvaluationsPage() {
  const [runs, setRuns] = useState<EvalRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<EvalDetail[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetch("/api/evaluate")
      .then((r) => r.json())
      .then((res) => setRuns(res.pastResults || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
  };

  const runComparison = async () => {
    setShowCompare(true);
    setCompareData([]);
    const details = await Promise.all(
      compareIds.map(async (id) => {
        const res = await fetch(`/api/evaluate/${id}`);
        return res.json();
      }),
    );
    setCompareData(details.filter(Boolean));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading evaluations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Evaluations</h1>
        <p className="text-sm text-muted-foreground">
          Past evaluation runs and model comparison
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No evaluations yet. Run one from the API.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-3 py-2"></th>
                  <th className="px-3 py-2 text-left font-medium">Dataset</th>
                  <th className="px-3 py-2 text-left font-medium">Model</th>
                  <th className="px-3 py-2 text-left font-medium">Provider</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Results</th>
                  <th className="px-3 py-2 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(run.id)}
                        onChange={() => toggleCompare(run.id)}
                        className="size-3.5 rounded border-border accent-foreground"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium capitalize">
                      {run.dataset}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {run.model}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {run.provider}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "default"
                            : run.status === "running"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {run.status === "running" && (
                          <Loader2 className="mr-1 size-2.5 animate-spin" />
                        )}
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {run.resultCount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {compareIds.length >= 2 && (
            <div className="flex justify-end">
              <Button onClick={runComparison} size="sm">
                Compare Selected ({compareIds.length})
              </Button>
            </div>
          )}

          {showCompare && compareData.length >= 2 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="mb-4 text-sm font-medium">Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">
                        Metric
                      </th>
                      {compareData.map((d) => (
                        <th
                          key={d.id}
                          className="px-3 py-2 text-right font-medium"
                        >
                          {d.model} ({d.provider})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.keys(METRIC_LABELS).map((metricKey) => {
                      const values = compareData.map((d) => {
                        const avg =
                          d.results.reduce(
                            (s, r) => s + (r.metrics[metricKey] || 0),
                            0,
                          ) / (d.results.length || 1);
                        return { id: d.id, value: avg };
                      });
                      const best = Math.max(...values.map((v) => v.value));
                      const isHallucination =
                        metricKey === "hallucination_rate";
                      const bestVal = isHallucination
                        ? Math.min(...values.map((v) => v.value))
                        : Math.max(...values.map((v) => v.value));
                      return (
                        <tr key={metricKey}>
                          <td className="px-3 py-2 text-muted-foreground">
                            {METRIC_LABELS[metricKey]}
                          </td>
                          {compareData.map((d) => {
                            const v = values.find((x) => x.id === d.id)!;
                            const isBest = isHallucination
                              ? v.value === bestVal
                              : v.value === bestVal;
                            return (
                              <td
                                key={d.id}
                                className={`px-3 py-2 text-right tabular-nums ${
                                  isBest ? "text-green-500 font-medium" : ""
                                }`}
                              >
                                {typeof v.value === "number"
                                  ? v.value.toFixed(3)
                                  : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="px-3 py-2 text-muted-foreground">
                        Avg Latency
                      </td>
                      {compareData.map((d) => {
                        const avg =
                          d.results.reduce((s, r) => s + r.latency, 0) /
                          (d.results.length || 1);
                        return (
                          <td
                            key={d.id}
                            className="px-3 py-2 text-right tabular-nums"
                          >
                            {avg.toFixed(0)}ms
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-muted-foreground">
                        Avg Cost
                      </td>
                      {compareData.map((d) => {
                        const avg =
                          d.results.reduce((s, r) => s + r.cost, 0) /
                          (d.results.length || 1);
                        return (
                          <td
                            key={d.id}
                            className="px-3 py-2 text-right tabular-nums"
                          >
                            ${avg.toFixed(6)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
