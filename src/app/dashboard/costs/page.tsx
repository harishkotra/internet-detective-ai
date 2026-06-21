"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart } from "@/components/dashboard/BarChart";
import { Separator } from "@/components/ui/separator";

interface CostRecord {
  id: string;
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

interface CostData {
  totalCost: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  avgPerInvestigation: number;
  tokenSummary: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
  };
  totalTraces: number;
  records: CostRecord[];
}

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/costs")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading cost data...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-destructive">
        Failed to load cost data
      </div>
    );
  }

  const providerData = Object.entries(data.costByProvider).map(
    ([label, value]) => ({ label, value }),
  );
  const modelData = Object.entries(data.costByModel).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cost Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Detailed cost breakdown across providers, models, and time
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cost"
          value={`$${data.totalCost.toFixed(4)}`}
          description={`Across ${data.totalTraces} traces`}
        />
        <StatCard
          title="Avg per Investigation"
          value={`$${data.avgPerInvestigation.toFixed(6)}`}
          description="Estimated cost per investigation"
        />
        <StatCard
          title="Total Tokens"
          value={data.tokenSummary.totalTokens.toLocaleString()}
          description={`${data.tokenSummary.totalPromptTokens.toLocaleString()} prompt / ${data.tokenSummary.totalCompletionTokens.toLocaleString()} completion`}
        />
        <StatCard
          title="Total Traces"
          value={data.totalTraces.toLocaleString()}
          description="All-time agent invocations"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Cost by Provider</h3>
          {providerData.length > 0 ? (
            <BarChart data={providerData} />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No cost data yet
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Cost by Model</h3>
          {modelData.length > 0 ? (
            <BarChart data={modelData} />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No cost data yet
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4">
          <h3 className="text-sm font-medium">Cost Records</h3>
        </div>
        <Separator />
        {data.records.length > 0 ? (
          <div className="divide-y">
            {data.records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-28 truncate font-medium capitalize">
                    {rec.agentName.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rec.provider}/{rec.model}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
                  <span>{rec.totalTokens.toLocaleString()} tokens</span>
                  <span>${rec.estimatedCost.toFixed(6)}</span>
                  <span className="text-[10px]">
                    {new Date(rec.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No cost records yet
          </p>
        )}
      </div>
    </div>
  );
}
