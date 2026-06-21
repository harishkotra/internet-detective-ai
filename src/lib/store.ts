import { ObservabilityTracker } from "@/lib/observability";
import { CostTracker } from "@/lib/cost";
import type { GovernanceCheck, SafetyCheck, EvalResult } from "@/lib/types";

let observabilityInstance: ObservabilityTracker | null = null;
let costInstance: CostTracker | null = null;

const governanceEvents: {
  id: string;
  investigation: string;
  check: GovernanceCheck;
}[] = [];
const safetyEvents: {
  id: string;
  investigation: string;
  check: SafetyCheck;
  context: string;
}[] = [];

export function getObservability(): ObservabilityTracker {
  if (!observabilityInstance) {
    observabilityInstance = new ObservabilityTracker();
  }
  return observabilityInstance;
}

export function getCostTracker(): CostTracker {
  if (!costInstance) {
    costInstance = new CostTracker();
  }
  return costInstance;
}

export function recordGovernanceCheck(
  investigation: string,
  check: GovernanceCheck,
): void {
  governanceEvents.push({
    id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    investigation,
    check,
  });
  if (governanceEvents.length > 1000) {
    governanceEvents.splice(0, governanceEvents.length - 1000);
  }
}

export function getGovernanceEvents() {
  return governanceEvents.slice().reverse();
}

export function recordSafetyEvent(
  investigation: string,
  check: SafetyCheck,
  context: string,
): void {
  safetyEvents.push({
    id: `safe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    investigation,
    check,
    context,
  });
  if (safetyEvents.length > 1000) {
    safetyEvents.splice(0, safetyEvents.length - 1000);
  }
}

export function getSafetyEvents() {
  return safetyEvents.slice().reverse();
}

interface EvalRun {
  id: string;
  dataset: string;
  model: string;
  provider: string;
  status: "running" | "completed" | "failed";
  results: EvalResult[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const evalRuns: EvalRun[] = [];
const MAX_EVALS = 100;

export function addEvalRun(run: EvalRun): void {
  evalRuns.push(run);
  if (evalRuns.length > MAX_EVALS) {
    evalRuns.splice(0, evalRuns.length - MAX_EVALS);
  }
}

export function getEvalRun(id: string): EvalRun | undefined {
  return evalRuns.find((r) => r.id === id);
}

export function getEvalRuns(): EvalRun[] {
  return evalRuns.slice(-20).reverse();
}

export function isEvalStoreInitialized(): boolean {
  return evalRuns.length > 0;
}

export function seedDemoData(): void {
  if (getObservability()["traces"]?.length > 0) return;
}
