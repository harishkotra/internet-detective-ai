# AI Governance in Internet Detective AI

## AI Governance Principles

AI governance is the practice of ensuring AI systems operate within ethical, legal, and safety boundaries. In Internet Detective AI, governance addresses a specific challenge: the system makes inferences about real people based on their public data. Without governance, the system could:

- Make inappropriate inferences about race, religion, or sexual orientation
- Generate outputs that stereotype or discriminate
- Produce content that could harm individuals or groups
- Violate privacy expectations even when using public data

The governance system implements the principle of **"prohibited inference categories"** — there are certain things this system must never infer, regardless of what the data suggests.

## Prohibited Inference Categories

The system defines 7 categories of prohibited inferences:

| Category | Rationale | Examples |
|----------|-----------|----------|
| Race or Ethnicity | Racial profiling is harmful and often illegal | "Asian", "Latino", "ethnically ambiguous" |
| Religion | Religious discrimination is protected | "Christian", "Muslim", "prays before commits" |
| Sexual Orientation | Private, protected characteristic | "Gay", "definitely straight energy" |
| Mental Health | Unqualified diagnosis is dangerous | "ADHD", "OCD", "depressed", "autistic" |
| Medical Conditions | Medical privacy is protected | "Chronic illness", "probably has carpal tunnel" |
| Political Affiliation | Political discrimination is harmful | "Conservative", "liberal", "libertarian" |
| Criminal Activity | Accusation without evidence is libelous | "Convicted of", "arrested for" (without verified legal sources) |

These categories are defined in the `GovernanceAgent` system prompt and replicated as regex patterns in the `GovernanceValidator` class.

## The GovernanceValidator Class

The `GovernanceValidator` in `src/lib/governance/index.ts` provides pattern-based detection and sanitization. It operates on the investigation report after all agents have finished:

```typescript
export class GovernanceValidator {
  validate(report: Partial<InvestigationReport>): GovernanceCheck {
    const violations: GovernanceViolation[] = [];

    // Check top-level text fields
    const textFields = this.extractTextFields(report);
    for (const [fieldName, text] of textFields) {
      const fieldViolations = this.checkText(text, fieldName);
      violations.push(...fieldViolations);
    }

    // Check nested fields: facts, signals with evidence, roasts
    if (report.facts) {
      for (let i = 0; i < report.facts.length; i++) {
        const factText = `${report.facts[i].observation} ${report.facts[i].source}`;
        violations.push(...this.checkText(factText, `facts[${i}]`));
      }
    }

    // ... check strongSignals, evidence, roasts, predictions

    return { passed: violations.length === 0, violations, checkedAt };
  }
}
```

## Pattern-Based Detection

Governance detection uses regex patterns organized by prohibited category:

```typescript
const PATTERNS: Record<string, RegExp[]> = {
  race: [
    /\b(caucasian|african\s*american|asian\s*american|hispanic|latino|latina|white|black|biracial|multiracial)\b/i,
  ],
  religion: [
    /\b(religion|religious|christian|muslim|hindu|buddhist|jewish|catholic|protestant|islam|atheist|agnostic)\b/i,
  ],
  sexual_orientation: [
    /\b(gay|lesbian|bisexual|heterosexual|homosexual|straight|queer|lgbt|lgbtq|sexual\s*orientation|pansexual|asexual)\b/i,
  ],
  mental_health: [
    /\b(diagnosed\s+(with|as)\s+(depression|anxiety|adhd|bipolar|PTSD|OCD|schizophrenia|autism|mental\s+illness))\b/i,
  ],
  medical_diagnosis: [
    /\b(diagnosed\s+with|suffers?\s+from|afflicted\s+with|patient\s+has)\s+(cancer|diabetes|HIV|AIDS|hepatitis|tumor|chronic|terminal)\b/i,
  ],
  political_affiliation: [
    /\b(political\s+(affiliation|party|view|belief|leaning|orientation))\b/i,
    /\b(democrat|republican|libertarian|socialist|communist|conservative|liberal|progressive)\s+(party|affiliation|voter|supporter)\b/i,
  ],
  criminal_activity: [
    /\b(convicted\s+(of|for)|charged\s+with|arrested\s+for|sentenced\s+to|guilty\s+of)\s+(crime|criminal|felony|misdemeanor|theft|assault|fraud|DUI|possession)\b/i,
  ],
};
```

Each pattern is checked against every text field in the report. The validator traverses the entire report tree — top-level fields, nested arrays, and object fields.

## Sanitization Strategies

When violations are detected, the `GovernanceValidator.sanitize` method redacts offending content:

```typescript
sanitize(report: Partial<InvestigationReport>, violations: GovernanceViolation[]) {
  if (violations.length === 0) return report;

  const sanitized = { ...report };

  if (sanitized.digitalProfileSummary && redactedFields.has("digitalProfileSummary")) {
    sanitized.digitalProfileSummary = this.redactText(
      sanitized.digitalProfileSummary, violations
    );
  }

  if (sanitized.facts && redactedFields.has("facts")) {
    sanitized.facts = sanitized.facts.map((fact) => ({
      ...fact,
      observation: this.redactText(fact.observation || "", violations),
    }));
  }

  // ... similar for strongSignals, roasts, predictions
  return sanitized;
}
```

The redaction replaces matched text with `[REDACTED]`:

```typescript
private redactText(text: string, violations: GovernanceViolation[]): string {
  let redacted = text;
  for (const violation of violations) {
    const match = violation.detail.match(/Matched "([^"]+)"/);
    if (match) {
      const matchedText = match[1];
      const escaped = matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      redacted = redacted.replace(new RegExp(escaped, "gi"), "[REDACTED]");
    }
  }
  return redacted;
}
```

## Governance Check Integration

Governance operates at two levels:

### 1. LLM-Based Governance Agent
The `GovernanceAgent` uses an LLM to scan content for violations. This catches nuanced violations that regex might miss — humor disguised as bias, implicit stereotyping, context-dependent issues.

### 2. Rule-Based GovernanceValidator
The `GovernanceValidator` uses regex patterns for deterministic detection. This catches violations the LLM might miss or ignore (e.g., the model forgetting to check a field).

### Integration Flow

```
1. All agents generate content
2. Governance Agent (LLM) checks everything
3. If violations detected → orchestrator sanitizes → re-run governance (up to 2x)
4. GovernanceValidator (pattern-based) final check on the assembled report
5. Governance check result stored in report metadata
```

The `recordGovernanceCheck` function stores all governance events:

```typescript
export function recordGovernanceCheck(investigation: string, check: GovernanceCheck) {
  governanceEvents.push({
    id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    investigation,
    check,
  });
  // Keep last 1000 events
}
```

## Production Considerations

### False Positives vs. False Negatives
The governance system errs on the side of flagging. A false positive (flagged content that was actually fine) is better than a false negative (missed violation). False positives cause minor inconvenience; false negatives can cause reputational damage.

### Context-Aware Flagging
Not all mentions of protected categories are violations. "Works at a religious university" is a factual statement, not religious stereotyping. The system uses severity levels (low/medium/high) to distinguish:
- **low**: Vague implication that could be interpreted as prohibited
- **medium**: Direct mention but in non-harmful context
- **high**: Clear prohibited inference

### The Governance Dashboard
The `/dashboard/governance` route displays governance events, enabling monitoring of:
- How often violations are detected
- Which categories are most commonly violated
- Which agents produce the most violations

### Dual-Pass Architecture
The separation between generation and verification is intentional. The Roast Agent can be maximally funny because it doesn't self-censor. The Governance Agent handles all censorship post-generation. This pattern (generate freely, verify strictly) is more effective than asking each agent to self-govern.

## Tradeoffs

### LLM-Based vs. Pattern-Based Governance

| Approach | Pros | Cons |
|----------|------|------|
| LLM-Based (Governance Agent) | Catches nuanced violations, understands context | Expensive, non-deterministic, can miss obvious patterns |
| Pattern-Based (GovernanceValidator) | Fast, deterministic, inexpensive | Brittle, misses context, high false positive rate |

Both are used together for defense in depth.

## Production Lessons Learned

1. **Governance must check every text field.** Facts, signals, evidence, roasts, quotes, predictions — violations can hide anywhere. Traverse the entire report tree.

2. **Jokes need governance too.** The "it's just a joke" defense is not acceptable. Startup parodies and roasts must be checked against the same categories as factual content.

3. **Severity levels enable proportional response.** Without severity, every violation is equal. With severity, you can decide: block high-severity, warn for medium, log low.

4. **Governance retry with sanitization is better than blocking.** Instead of failing the investigation, sanitize and proceed. A partially redacted report is better than no report.

5. **Patterns need regular maintenance.** New slang, cultural references, and coded language emerge constantly. Review and update governance patterns periodically.

6. **Log all governance events.** If a violation is later disputed, you need the log. Timestamps, violation details, and remediation actions should all be recorded.

7. **False positive rate must be monitored.** If your governance system flags 90% of reports as violations, the system is too strict and undermines trust.

8. **The Governance Agent prompt should include examples of subtle violations.** Models are good at catching obvious violations but miss subtle ones unless explicitly shown patterns.

9. **Field-level location tracking is essential for remediation.** Knowing that `strongSignals[2].evidence[1]` triggered a violation is actionable. "A field had a violation" is not.

10. **Governance is a product feature, not just a safety measure.** A well-governed AI system builds user trust. Transparently report governance checks in the output, showing that the system is accountable.
