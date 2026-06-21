import {
  InvestigationReport,
  GovernanceCheck,
  GovernanceViolation,
} from "../types";

const PATTERNS: Record<string, RegExp[]> = {
  race: [
    /\b(caucasian|african\s*american|asian\s*american|hispanic|latino|latina|white|black|biracial|multiracial)\b/i,
  ],
  ethnicity: [
    /\b(ethnicity|ethnic\s+origin|ancestry|national\s+origin)\b/i,
    /\b(chinese|japanese|korean|indian|arab|persian|jewish|palestinian|turkish|kurdish|romani|sikh)\b/i,
  ],
  religion: [
    /\b(religion|religious|christian|muslim|hindu|buddhist|jewish|catholic|protestant|islam|atheist|agnostic)\b/i,
    /\b(muslim|buddhist|hindu|jewish|christian|catholic|protestant)\b/i,
    /\b(practicing|devout|orthodox|conservative|liberal)\s+(christian|muslim|jewish|hindu|buddhist)\b/i,
  ],
  sexual_orientation: [
    /\b(gay|lesbian|bisexual|heterosexual|homosexual|straight|queer|lgbt|lgbtq|sexual\s*orientation|pansexual|asexual)\b/i,
  ],
  mental_health: [
    /\b(diagnosed\s+(with|as)\s+(depression|anxiety|adhd|bipolar|PTSD|OCD|schizophrenia|autism|mental\s+illness))\b/i,
    /\b(mental\s+health\s+(diagnosis|condition|disorder|issue|problem))\b/i,
    /\b(takes?\s+medication\s+(for|to\s+treat))\b/i,
    /\b(therapist|psychiatrist|psychologist|counseling|therapy)\s+(for|because|diagnosed)\b/i,
  ],
  medical_diagnosis: [
    /\b(diagnosed\s+with|suffers?\s+from|afflicted\s+with|patient\s+has)\s+(cancer|diabetes|HIV|AIDS|hepatitis|tumor|chronic|terminal)\b/i,
    /\b(medical\s+(history|condition|record|diagnosis|treatment|surgery|procedure))\b/i,
    /\b(hospitalized|hospitalisation|surgery|transplant)\b/i,
  ],
  political_affiliation: [
    /\b(political\s+(affiliation|party|view|belief|leaning|orientation))\b/i,
    /\b(democrat|republican|libertarian|socialist|communist|conservative|liberal|progressive)\s+(party|affiliation|voter|supporter)\b/i,
    /\b(voted\s+(for|against)|campaign\s+(donor|contribution|support)|political\s+donation)\b/i,
  ],
  criminal_activity: [
    /\b(convicted\s+(of|for)|charged\s+with|arrested\s+for|sentenced\s+to|guilty\s+of)\s+(crime|criminal|felony|misdemeanor|theft|assault|fraud|DUI|possession)\b/i,
    /\b(criminal\s+(record|history|background|charges|conviction|offense))\b/i,
    /\b(felony|misdemeanor|indictment|prosecution|incarceration|imprisonment)\b/i,
  ],
};

export class GovernanceValidator {
  validate(report: Partial<InvestigationReport>): GovernanceCheck {
    const violations: GovernanceViolation[] = [];

    const textFields = this.extractTextFields(report);

    for (const [fieldName, text] of textFields) {
      if (!text || typeof text !== "string") continue;

      const fieldViolations = this.checkText(text, fieldName);
      violations.push(...fieldViolations);
    }

    if (report.facts && Array.isArray(report.facts)) {
      for (let i = 0; i < report.facts.length; i++) {
        const fact = report.facts[i];
        const factText = `${fact.observation || ""} ${fact.source || ""} ${fact.category || ""}`;
        const factViolations = this.checkText(factText, `facts[${i}]`);
        violations.push(...factViolations);
      }
    }

    if (report.strongSignals && Array.isArray(report.strongSignals)) {
      for (let i = 0; i < report.strongSignals.length; i++) {
        const signal = report.strongSignals[i];
        const signalText = `${signal.title || ""} ${signal.reasoning || ""}`;
        const signalViolations = this.checkText(
          signalText,
          `strongSignals[${i}]`,
        );
        violations.push(...signalViolations);

        if (signal.evidence) {
          for (let j = 0; j < signal.evidence.length; j++) {
            const evText = `${signal.evidence[j].detail || ""} ${signal.evidence[j].source || ""}`;
            const evViolations = this.checkText(
              evText,
              `strongSignals[${i}].evidence[${j}]`,
            );
            violations.push(...evViolations);
          }
        }
      }
    }

    if (report.brutalRoast && Array.isArray(report.brutalRoast)) {
      for (let i = 0; i < report.brutalRoast.length; i++) {
        const roastViolations = this.checkText(
          report.brutalRoast[i].line || "",
          `brutalRoast[${i}]`,
        );
        violations.push(...roastViolations);
      }
    }

    return {
      passed: violations.length === 0,
      violations: this.deduplicateViolations(violations),
      checkedAt: new Date().toISOString(),
    };
  }

  sanitize(
    report: Partial<InvestigationReport>,
    violations: GovernanceViolation[],
  ): Partial<InvestigationReport> {
    if (violations.length === 0) return report;

    const sanitized = { ...report };
    const redactedFields = new Set(
      violations.map((v) => v.detail.split(":")[0]?.trim()),
    );

    if (
      sanitized.digitalProfileSummary &&
      redactedFields.has("digitalProfileSummary")
    ) {
      sanitized.digitalProfileSummary = this.redactText(
        sanitized.digitalProfileSummary,
        violations,
      );
    }

    if (sanitized.facts && redactedFields.has("facts")) {
      sanitized.facts = sanitized.facts.map((fact) => ({
        ...fact,
        observation: this.redactText(fact.observation || "", violations),
        source: this.redactText(fact.source || "", violations),
      }));
    }

    if (sanitized.strongSignals) {
      sanitized.strongSignals = sanitized.strongSignals.map((signal) => ({
        ...signal,
        title: this.redactText(signal.title || "", violations),
        reasoning: this.redactText(signal.reasoning || "", violations),
        evidence: signal.evidence.map((ev) => ({
          ...ev,
          detail: this.redactText(ev.detail || "", violations),
          source: this.redactText(ev.source || "", violations),
        })),
      }));
    }

    if (sanitized.brutalRoast) {
      sanitized.brutalRoast = sanitized.brutalRoast.map((roast) => ({
        ...roast,
        line: this.redactText(roast.line || "", violations),
      }));
    }

    if (sanitized.finalVerdict) {
      sanitized.finalVerdict = this.redactText(
        sanitized.finalVerdict,
        violations,
      );
    }

    if (sanitized.careerPrediction) {
      sanitized.careerPrediction = {
        ...sanitized.careerPrediction,
        nextRole: this.redactText(
          sanitized.careerPrediction.nextRole || "",
          violations,
        ),
        industryDirection: this.redactText(
          sanitized.careerPrediction.industryDirection || "",
          violations,
        ),
        futureOpportunities: sanitized.careerPrediction.futureOpportunities.map(
          (o) => this.redactText(o, violations),
        ),
      };
    }

    if (sanitized.wildGuesses) {
      sanitized.wildGuesses = sanitized.wildGuesses.map((g) => ({
        ...g,
        prediction: this.redactText(g.prediction || "", violations),
        reasoning: this.redactText(g.reasoning || "", violations),
      }));
    }

    return sanitized;
  }

  private checkText(text: string, fieldName: string): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];

    for (const [attribute, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          violations.push({
            category: "prohibited_attribute",
            attribute,
            severity: "high",
            detail: `${fieldName}: Matched "${match[0].trim()}" (${attribute})`,
          });
          break;
        }
      }
    }

    return violations;
  }

  private extractTextFields(
    report: Partial<InvestigationReport>,
  ): [string, string][] {
    const fields: [string, string][] = [];

    if (report.digitalProfileSummary) {
      fields.push(["digitalProfileSummary", report.digitalProfileSummary]);
    }
    if (report.finalVerdict) {
      fields.push(["finalVerdict", report.finalVerdict]);
    }

    return fields;
  }

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

  private deduplicateViolations(
    violations: GovernanceViolation[],
  ): GovernanceViolation[] {
    const seen = new Set<string>();
    return violations.filter((v) => {
      const key = `${v.attribute}:${v.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
