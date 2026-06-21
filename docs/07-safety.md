# AI Safety in Internet Detective AI

## AI Safety Layers

Internet Detective AI implements a defense-in-depth safety architecture. No single safety mechanism is trusted alone — each layer covers gaps in the others.

The safety system in `src/lib/safety/index.ts` covers five threat categories:
1. **Prompt Injection** — Attempts to override system instructions
2. **Jailbreak** — Attempts to bypass safety constraints
3. **PII** — Personally Identifiable Information leakage
4. **Toxicity** — Harmful or abusive language
5. **Sensitive Attributes** — Protected characteristic references

## Prompt Injection Detection

Prompt injection attempts to override the system prompt by telling the model to ignore instructions. The `PROMPT_INJECTION_PATTERNS` array contains 18 regex patterns:

```typescript
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|prompts|commands|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|prompts)/i,
  /system\s+prompt\s*:/i,
  /you\s+are\s+(now|free|no\s+longer|not)\s+(an?\s+)?(AI|assistant|chatbot|model|bot)/i,
  /new\s+(instructions|prompt|command|rule|directive)\s*:/i,
  /override\s+(system|default|standard|all)\s+(prompt|instruction|configuration)/i,
  /print\s+(the\s+)?(system|above|initial|default)\s+(prompt|instructions|text)/i,
  /repeat\s+(the\s+)?(words|text|prompt|instruction|above|initial|system)/i,
  /pretend\s+(that\s+)?(you\s+are|you\s+can|we\s+are|this\s+is)/i,
];
```

Detection happens in the `SafetyChecker` class:

```typescript
private detectPromptInjection(text: string): SafetyThreat | null {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: "prompt_injection",
        severity: "high",
        detail: `Prompt injection detected: "${match[0].trim()}"`,
        text: match[0],
      };
    }
  }
  return null;
}
```

## Jailbreak Detection

Jailbreak attempts try to bypass the model's safety training. The `JAILBREAK_PATTERNS` array contains 21 patterns:

```typescript
const JAILBREAK_PATTERNS: RegExp[] = [
  /\bDAN\b/i,                              // "Do Anything Now"
  /do\s+anything\s+now/i,
  /jail\s*break/i,
  /developer\s+mode/i,
  /hypothetical:\s+(scenario|situation)\s+(where|in\s+which)\s+(there\s+are\s+no\s+)?(restrictions|limits|rules|boundaries)/i,
  /roleplay\s+(as|a)\s+(an?\s+)?(evil|malicious|harmful|dangerous|unethical)/i,
  /(you\s+)?(have\s+)?no\s+(rules|limits|restrictions|boundaries|filter|guardrails)/i,
  /bypass\s+(your\s+)?(safety|security|content\s+policy|filter|moderation|restrictions|guardrails)/i,
  /unfiltered/i,
  /turn\s+off\s+(your\s+)?(ethics|morals|values|principles|guidelines|policy)/i,
];
```

Common jailbreak techniques detected:
- DAN (Do Anything Now) attacks
- Developer mode impersonation
- Hypothetical scenario framing
- Roleplay as evil characters
- Explicit safety bypass requests

## PII Detection and Redaction

PII detection covers 8 data types:

```typescript
const PII_PATTERNS = [
  { type: "email",    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, severity: "medium" },
  { type: "phone",    pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, severity: "medium" },
  { type: "ssn",      pattern: /\b\d{3}-\d{2}-\d{4}\b/, severity: "high" },
  { type: "credit_card", pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/, severity: "high" },
  { type: "ip_address", pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, severity: "low" },
  { type: "street_address", pattern: /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b/i, severity: "medium" },
  { type: "passport", pattern: /\b[A-Z]\d{8}\b/, severity: "high" },
  { type: "date_of_birth", pattern: /\b(?:birth\s*(?:date|day)|DOB|date\s+of\s+birth)\s*[:]?\s*\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4}\b/i, severity: "medium" },
];
```

The `redactPII` function replaces detected PII with placeholders:

```typescript
export function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of PII_REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}
// Result: "Contact [EMAIL REDACTED] or [PHONE REDACTED]" instead of "Contact john@example.com or 555-1234"
```

## Toxicity Filtering

Toxicity detection catches hate speech, threats, and abusive language:

```typescript
const TOXICITY_PATTERNS: RegExp[] = [
  /\b(you're|you\s+are)\s+(a|an)\s+(idiot|moron|loser|failure|stupid|dumb|trash|garbage|pathetic|worthless|useless)\b/i,
  /\b(fuck\s+(you|off)|go\s+(to\s+)?hell|screw\s+you|kiss\s+my\s+ass|bite\s+me|eat\s+shit)\b/i,
  /\b(die|kill\s+(yourself|you)|hurt\s+yourself|harm\s+yourself)\b/i,
  /\b(hate\s+(speech|crime|group|mongering)|racial\s+slur|ethnic\s+slur)\b/i,
  /(nazi|supremacist|white\s+supremacy)\b/i,
];
```

This is applied to the investigation output (not just the input), ensuring that generated content (roasts, coworker quotes) doesn't cross into genuine toxicity.

## Sensitive Attribute Detection

The `SENSITIVE_ATTRIBUTE_PATTERNS` catch references to protected characteristics:

```typescript
const SENSITIVE_ATTRIBUTE_PATTERNS = [
  { type: "race",    pattern: /\b(this\s+person|they|he|she)\s+(is|seems|appears|looks|identifies\s+as)\s+(black|white|asian|hispanic|caucasian|african\s+american)\b/i },
  { type: "religion", pattern: /\b(this\s+person|they|he|she)\s+(is|practices|follows|believes\s+in)\s+(christianity|islam|hinduism|buddhism|judaism)\b/i },
  { type: "political", pattern: /\b(this\s+person|they|he|she)\s+(is|leans|votes|supports|identifies\s+as)\s+(democrat|republican|liberal|conservative|socialist)\b/i },
  { type: "sexual_orientation", pattern: /\b(this\s+person|they|he|she)\s+(is|identifies\s+as)\s+(gay|lesbian|bisexual|straight|queer)\b/i },
  { type: "health", pattern: /\b(this\s+person|they|he|she)\s+(has|suffers\s+from|was\s+diagnosed\s+with|struggles\s+with)\b/i },
  { type: "income", pattern: /\b(their\s+)?(salary|income|net\s+worth)\s+is\s+\$?\d{2,6}[k]?\b/i },
];
```

## Defense in Depth

Safety operates at multiple points in the pipeline:

```
Input → Input Safety Check (prompt injection, jailbreak, PII)
   ↓
Context Builder (normalization, deduplication)
   ↓
Agents (content generation)
   ↓
Governance Agent (LLM-based ethical check)
   ↓
Safety Check on Output (PII, toxicity, sensitive attributes)
   ↓
GovernanceValidator (pattern-based final check)
   ↓
Final Report
```

### Pre-Generation Safety
The `SafetyChecker.checkPrompt()` method validates user input before it reaches any agent:

```typescript
const safetyCheck = safetyChecker.checkPrompt(userInput);
if (!safetyCheck.passed) {
  // Block the investigation and notify the user
  throw new SafetyCheckError(safetyCheck.threats);
}
```

### Post-Generation Safety
The `SafetyChecker.checkOutput()` method validates the final report:

```typescript
const safetyCheck = safetyChecker.checkOutput(finalReport);
// Log threats, redact PII, proceed with warnings if non-critical
```

### Safety Event Recording
All safety events are recorded and visible in the dashboard:

```typescript
export function recordSafetyEvent(investigation: string, check: SafetyCheck, context: string) {
  safetyEvents.push({
    id: `safe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    investigation, check, context,
  });
  // Keep last 1000 events
}
```

### Custom Error Classes
Safety failures throw typed errors:

```typescript
export class SafetyCheckError extends Error {
  public readonly threats: SafetyThreat[];
  // Includes type, severity, detail for each threat
}

export class GovernanceViolationError extends Error {
  public readonly violations: GovernanceViolation[];
  // Includes category, attribute, severity for each violation
}
```

## Production Lessons Learned

1. **Defense in depth is not optional.** No single safety mechanism catches everything. Pattern-based detection catches what LLMs miss; LLM-based detection catches what patterns miss. Use both.

2. **Safety checks must be fast.** The prompt injection check runs on every user input before any LLM call. It must complete in <1ms. Keep patterns simple and avoid backtracking.

3. **PII redaction is lossy but necessary.** Redacting emails from output text is not perfect (some legitimate career information may reference email addresses), but the cost of leaking PII is higher than the cost of redacting legitimate content.

4. **Severity levels guide responses.** Low-severity threats get logged; high-severity threats block execution. Define the response threshold clearly.

5. **Record every safety event.** When something goes wrong, you need to audit exactly what happened. Safety event logs are your first debugging tool.

6. **Toxicity filtering for generated content is essential.** A "roast" agent can cross into genuine toxicity. Always check output content, not just input.

7. **Update patterns regularly.** New prompt injection techniques, jailbreak methods, and coded slurs emerge constantly. Set a regular review cadence for safety patterns.

8. **Test safety with adversarial inputs.** Before deploying new safety patterns, test them against known attack vectors. Keep a test suite of adversarial inputs.

9. **Don't block on false positives alone.** If your safety system has false positives, log them but allow the user to proceed. Over-blocking destroys user trust.

10. **Safety checks must be provider-agnostic.** The safety system works regardless of which LLM provider is used. This ensures consistent safety regardless of backend.
