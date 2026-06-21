"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, SearchIcon } from "lucide-react";

interface Trace {
  agentId: string;
  agentName: string;
  input: unknown;
  output: unknown;
  latency: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  provider: string;
  startTime: string;
  endTime: string;
  success: boolean;
  error?: string;
}

export default function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [agents, setAgents] = useState<string[]>([]);

  useEffect(() => {
    const params = agentFilter ? `?agent=${agentFilter}` : "";
    fetch(`/api/traces${params}`)
      .then((r) => r.json())
      .then((res) => {
        const t = res.traces || [];
        setTraces(t);
        const unique = [
          ...new Set(t.map((tr: Trace) => tr.agentName)),
        ] as string[];
        setAgents((prev) => (prev.length ? prev : unique));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [agentFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Traces</h1>
          <p className="text-sm text-muted-foreground">
            Inspect individual agent invocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchIcon className="size-4 text-muted-foreground" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm outline-none"
          >
            <option value="">All Agents</option>
            {agents.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading traces...
        </div>
      ) : traces.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No traces found. Run an investigation to see traces.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2 text-left font-medium">Agent</th>
                <th className="px-3 py-2 text-left font-medium">Provider</th>
                <th className="px-3 py-2 text-left font-medium">Model</th>
                <th className="px-3 py-2 text-right font-medium">Latency</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 text-right font-medium">Cost</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {traces.map((trace) => {
                const isExpanded = expandedId === trace.agentId;
                return (
                  <>
                    <tr
                      key={trace.agentId}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedTrace(trace)}
                    >
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : trace.agentId);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="max-w-32 truncate px-3 py-2 font-medium capitalize">
                        {trace.agentName.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {trace.provider}
                      </td>
                      <td className="max-w-40 truncate px-3 py-2 text-muted-foreground">
                        {trace.model}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {trace.latency.toFixed(0)}ms
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {trace.tokenUsage.totalTokens.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        ${trace.cost.toFixed(6)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={trace.success ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {trace.success ? "OK" : "FAIL"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                        {new Date(trace.startTime).toLocaleString()}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${trace.agentId}-detail`}>
                        <td colSpan={9} className="bg-muted/20 px-4 py-3">
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Input
                              </span>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                                {JSON.stringify(trace.input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">
                                Output
                              </span>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                                {JSON.stringify(trace.output, null, 2)}
                              </pre>
                            </div>
                            {trace.error && (
                              <div>
                                <span className="text-xs font-medium text-red-500">
                                  Error
                                </span>
                                <pre className="mt-1 rounded-md bg-red-500/10 p-2 text-xs text-red-500">
                                  {trace.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DetailDialog
        trace={selectedTrace}
        onClose={() => setSelectedTrace(null)}
      />
    </div>
  );
}

function DetailDialog({
  trace,
  onClose,
}: {
  trace: Trace | null;
  onClose: () => void;
}) {
  if (!trace) return null;
  return (
    <Dialog open={!!trace} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {trace.agentName.replace(/_/g, " ")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Provider</span>
            <p>{trace.provider}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Model</span>
            <p>{trace.model}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Latency</span>
            <p>{trace.latency.toFixed(0)}ms</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Cost</span>
            <p>${trace.cost.toFixed(6)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Tokens</span>
            <p>
              {trace.tokenUsage.promptTokens} prompt /{" "}
              {trace.tokenUsage.completionTokens} completion
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge
              variant={trace.success ? "default" : "destructive"}
              className="mt-0.5 text-[10px]"
            >
              {trace.success ? "Success" : "Failed"}
            </Badge>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground">Timestamp</span>
            <p className="tabular-nums">
              {new Date(trace.startTime).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Input
          </span>
          <pre className="max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
            {JSON.stringify(trace.input, null, 2)}
          </pre>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Output
          </span>
          <pre className="max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
            {JSON.stringify(trace.output, null, 2)}
          </pre>
        </div>
        {trace.error && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-red-500">Error</span>
            <pre className="rounded-md bg-red-500/10 p-2 text-xs text-red-500">
              {trace.error}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
