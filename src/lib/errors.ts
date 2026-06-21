export class AIProviderError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly provider: string;
  public readonly retryable: boolean;

  public readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      provider?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = options.code ?? "AI_PROVIDER_ERROR";
    this.statusCode = options.statusCode ?? 500;
    this.provider = options.provider ?? "unknown";
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      provider: this.provider,
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

export class GovernanceViolationError extends Error {
  public readonly code: string;
  public readonly violations: ReadonlyArray<{
    category: string;
    attribute: string;
    severity: "low" | "medium" | "high";
    detail: string;
  }>;

  public readonly cause?: unknown;

  constructor(
    violations: GovernanceViolationError["violations"],
    options: { code?: string; cause?: unknown } = {},
  ) {
    const message = `Governance check failed: ${violations.length} violation(s)`;
    super(message);
    this.name = "GovernanceViolationError";
    this.code = options.code ?? "GOVERNANCE_VIOLATION";
    this.violations = violations;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      violations: this.violations,
      stack: this.stack,
    };
  }
}

export class SafetyCheckError extends Error {
  public readonly code: string;
  public readonly threats: ReadonlyArray<{
    type:
      | "prompt_injection"
      | "jailbreak"
      | "pii"
      | "toxicity"
      | "sensitive_attribute";
    severity: "low" | "medium" | "high";
    detail: string;
    text: string;
  }>;

  public readonly cause?: unknown;

  constructor(
    threats: SafetyCheckError["threats"],
    options: { code?: string; cause?: unknown } = {},
  ) {
    const message = `Safety check failed: ${threats.length} threat(s) detected`;
    super(message);
    this.name = "SafetyCheckError";
    this.code = options.code ?? "SAFETY_CHECK_FAILED";
    this.threats = threats;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      threats: this.threats,
      stack: this.stack,
    };
  }
}

export class InvestigationError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly retryable: boolean;

  public readonly cause?: unknown;

  constructor(
    message: string,
    options: {
      code?: string;
      stage?: string;
      retryable?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "InvestigationError";
    this.code = options.code ?? "INVESTIGATION_FAILED";
    this.stage = options.stage ?? "unknown";
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stage: this.stage,
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

export class ContextBuildError extends Error {
  public readonly code: string;
  public readonly source: string;

  public readonly cause?: unknown;

  constructor(
    message: string,
    options: { code?: string; source?: string; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "ContextBuildError";
    this.code = options.code ?? "CONTEXT_BUILD_FAILED";
    this.source = options.source ?? "unknown";
    this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      source: this.source,
      stack: this.stack,
    };
  }
}
