"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";

interface ModelSummary {
  model: string;
  provider: string;
  avgLatency: number;
  avgCost: number;
  avgScore: number;
  totalCalls: number;
  successRate: number;
}

type SortKey = keyof ModelSummary;

export default function ModelsPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("totalCalls");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((res) => setModels(res.models || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "avgLatency" || key === "avgCost" ? "asc" : "desc");
    }
  };

  const sorted = [...models].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const cmp =
      typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortHeader = ({
    label,
    sortKey: sk,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <th
      className="cursor-pointer px-3 py-2 text-right font-medium hover:text-foreground"
      onClick={() => handleSort(sk)}
    >
      <div className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="size-3 text-muted-foreground" />
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading model data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Model Comparison</h1>
        <p className="text-sm text-muted-foreground">
          Compare models across performance metrics
        </p>
      </div>

      {models.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No model data yet. Run investigations to see model metrics.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="cursor-pointer px-3 py-2 text-left font-medium hover:text-foreground"
                  onClick={() => handleSort("model" as SortKey)}
                >
                  <div className="inline-flex items-center gap-1">
                    Model
                    <ArrowUpDown className="size-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-3 py-2 text-left font-medium">Provider</th>
                <SortHeader label="Avg Score" sortKey="avgScore" />
                <SortHeader label="Avg Latency" sortKey="avgLatency" />
                <SortHeader label="Avg Cost" sortKey="avgCost" />
                <SortHeader label="Calls" sortKey="totalCalls" />
                <SortHeader label="Success Rate" sortKey="successRate" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((m) => (
                <tr
                  key={`${m.provider}/${m.model}`}
                  className="hover:bg-muted/30"
                >
                  <td className="max-w-48 truncate px-3 py-2 font-medium">
                    {m.model}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {m.provider}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {m.avgScore > 0 ? m.avgScore.toFixed(3) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {m.avgLatency.toFixed(0)}ms
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ${m.avgCost.toFixed(6)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {m.totalCalls}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span
                      className={
                        m.successRate >= 90
                          ? "text-green-500"
                          : m.successRate >= 70
                            ? "text-yellow-500"
                            : "text-red-500"
                      }
                    >
                      {m.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
