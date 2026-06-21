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
import { Shield, ShieldAlert, ShieldCheck, Eye } from "lucide-react";

interface SafetyEvent {
  id: string;
  investigation: string;
  check: {
    passed: boolean;
    threats: SafetyThreat[];
  };
  context: string;
}

interface SafetyThreat {
  type: string;
  severity: "low" | "medium" | "high";
  detail: string;
  text: string;
}

const THREAT_LABELS: Record<string, string> = {
  prompt_injection: "Prompt Injection",
  jailbreak: "Jailbreak",
  pii: "PII Leak",
  toxicity: "Toxicity",
  sensitive_attribute: "Sensitive Attribute",
};

const THREAT_COLORS: Record<string, string> = {
  prompt_injection: "bg-red-500/10 text-red-500 border-red-500/20",
  jailbreak: "bg-red-500/10 text-red-500 border-red-500/20",
  pii: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  toxicity: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  sensitive_attribute: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function SafetyPage() {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SafetyEvent | null>(null);

  useEffect(() => {
    fetch("/api/safety")
      .then((r) => r.json())
      .then((res) => setEvents(res.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading safety data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Safety Events</h1>
        <p className="text-sm text-muted-foreground">
          AI safety checks — prompt injection, jailbreak, PII, and toxicity
          detection
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No safety events recorded yet
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
                  <ShieldCheck className="size-5 text-green-500" />
                ) : (
                  <ShieldAlert className="size-5 text-red-500" />
                )}
                <div>
                  <span className="text-sm font-medium">
                    {event.check.passed ? "Safe" : "Threat Detected"}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {event.check.threats.length} threat
                    {event.check.threats.length !== 1 ? "s" : ""}
                  </span>
                  {event.context && (
                    <div className="mt-0.5 max-w-md truncate text-[10px] text-muted-foreground">
                      {event.context}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.check.threats.slice(0, 2).map((threat, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`border text-[10px] ${THREAT_COLORS[threat.type] || ""}`}
                  >
                    {THREAT_LABELS[threat.type] || threat.type}
                  </Badge>
                ))}
                {event.check.threats.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{event.check.threats.length - 2}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelected(event)}
                >
                  <Eye className="size-3.5" />
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
  event: SafetyEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Safety Check Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge
              variant={event.check.passed ? "default" : "destructive"}
              className="text-[10px]"
            >
              {event.check.passed ? "Safe" : "Threat Detected"}
            </Badge>
          </div>
          {event.context && (
            <p className="text-xs text-muted-foreground">
              Context: {event.context}
            </p>
          )}
          {event.check.threats.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Threats ({event.check.threats.length})
              </span>
              <div className="mt-1 space-y-2">
                {event.check.threats.map((threat, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-muted/30 p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`border text-[10px] ${THREAT_COLORS[threat.type] || ""}`}
                      >
                        {THREAT_LABELS[threat.type] || threat.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border text-[10px] ${SEVERITY_COLORS[threat.severity]}`}
                      >
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {threat.detail}
                    </p>
                    {threat.text && (
                      <pre className="mt-1 rounded bg-muted p-1.5 text-[10px] text-foreground/80">
                        "{threat.text}"
                      </pre>
                    )}
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
