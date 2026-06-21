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
import { Check, X, AlertTriangle, Info } from "lucide-react";

interface GovernanceEvent {
  id: string;
  investigation: string;
  check: {
    passed: boolean;
    violations: GovernanceViolation[];
    checkedAt: string;
  };
}

interface GovernanceViolation {
  category: string;
  attribute: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function GovernancePage() {
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GovernanceEvent | null>(null);

  useEffect(() => {
    fetch("/api/governance")
      .then((r) => r.json())
      .then((res) => setEvents(res.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading governance data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Governance Logs</h1>
        <p className="text-sm text-muted-foreground">
          Content policy compliance checks and violation history
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No governance events recorded yet
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {event.check.passed ? (
                  <span className="flex size-7 items-center justify-center rounded-full bg-green-500/10">
                    <Check className="size-4 text-green-500" />
                  </span>
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-red-500/10">
                    <X className="size-4 text-red-500" />
                  </span>
                )}
                <div>
                  <span className="text-sm font-medium">
                    {event.check.passed ? "Passed" : "Failed"}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {event.check.violations.length} violations
                  </span>
                  <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {new Date(event.check.checkedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.check.violations.slice(0, 3).map((v, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`border text-[10px] ${SEVERITY_COLORS[v.severity]}`}
                  >
                    {v.attribute}
                  </Badge>
                ))}
                {event.check.violations.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{event.check.violations.length - 3}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelected(event)}
                >
                  <Info className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailDialog event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function DetailDialog({
  event,
  onClose,
}: {
  event: GovernanceEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Governance Check Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge
              variant={event.check.passed ? "default" : "destructive"}
              className="text-[10px]"
            >
              {event.check.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            Checked at: {new Date(event.check.checkedAt).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Investigation: {event.investigation}
          </p>
          {event.check.violations.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Violations ({event.check.violations.length})
              </span>
              <div className="mt-1 space-y-1.5">
                {event.check.violations.map((v, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-muted/30 p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`border text-[10px] ${SEVERITY_COLORS[v.severity]}`}
                      >
                        {v.severity}
                      </Badge>
                      <span className="font-medium capitalize">
                        {v.attribute.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{v.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
