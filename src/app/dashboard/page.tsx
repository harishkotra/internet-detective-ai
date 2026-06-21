"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart } from "@/components/dashboard/BarChart";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalInvestigations: number;
  totalCost: number;
  avgLatency: number;
  totalTraces: number;
  successfulTraces: number;
  failedTraces: number;
  successRate: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  agentPerformance: Record<
    string,
    {
      totalCalls: number;
      avgLatency: number;
      totalCost: number;
      successRate: number;
    }
  >;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-destructive">
        Failed to load dashboard data
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
  const agentEntries = Object.entries(data.agentPerformance);
  const recentAgentNames = agentEntries
    .sort((a, b) => b[1].totalCalls - a[1].totalCalls)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of all investigations and system performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Investigations"
          value={data.totalInvestigations.toLocaleString()}
          description="All-time investigations"
        />
        <StatCard
          title="Total Cost"
          value={`$${data.totalCost.toFixed(4)}`}
          description="Across all investigations"
        />
        <StatCard
          title="Avg Latency"
          value={`${data.avgLatency.toFixed(0)}ms`}
          description="Per trace"
        />
        <StatCard
          title="Success Rate"
          value={`${data.successRate.toFixed(1)}%`}
          description={`${data.successfulTraces} successful, ${data.failedTraces} failed`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Cost by Provider</h3>
          {providerData.length > 0 ? (
            <BarChart data={providerData} />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No provider cost data yet
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Cost by Model</h3>
          {modelData.length > 0 ? (
            <BarChart data={modelData} />
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No model cost data yet
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4">
          <h3 className="text-sm font-medium">Recent Agent Performance</h3>
        </div>
        <Separator />
        <div className="divide-y">
          {recentAgentNames.length > 0 ? (
            recentAgentNames.map(([name, perf]) => (
              <div
                key={name}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {name.replace(/_/g, " ")}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {perf.totalCalls} calls
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{perf.avgLatency.toFixed(0)}ms</span>
                  <span>${perf.totalCost.toFixed(4)}</span>
                  <span
                    className={
                      perf.successRate >= 0.9
                        ? "text-green-500"
                        : perf.successRate >= 0.7
                          ? "text-yellow-500"
                          : "text-red-500"
                    }
                  >
                    {(perf.successRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              No agent data yet. Run an investigation to see results.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
