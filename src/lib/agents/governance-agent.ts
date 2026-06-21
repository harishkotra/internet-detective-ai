import { BaseAgent, AgentConfig } from "./base";
import { GovernanceCheck, GovernanceViolation, AgentTrace } from "../types";

const SYSTEM_PROMPT = `You are GovernanceAgent, an ethical boundary enforcement AI. Your job is to validate investigation report content against strict ethical guidelines.

## Prohibited Inferences
The investigation report MUST NOT make claims or inferences about:
1. **Race or Ethnicity** — any mention or implication of racial/ethnic background
2. **Religion** — religious beliefs, affiliations, or practices
3. **Sexual Orientation** — real or implied orientation, preferences
4. **Mental Health** — diagnoses, conditions, or未经专业诊断的推断
5. **Medical Conditions** — any health-related diagnosis or speculation
6. **Political Affiliation** — political party, ideology, or voting behavior
7. **Criminal Activity** — accusations or implications of illegal behavior (without verified legal sources)

## What's Allowed
- Professional observations based on public GitHub/LinkedIn/etc.
- Inferences about working style, skills, and career trajectory
- Humorous observations about tech habits and coding patterns
- General personality observations (e.g., detail-oriented, prefers async communication)

## Violation Severity
- **low**: Vague implication that could be interpreted as a prohibited inference
- **medium**: Direct mention of a prohibited category but in a non-harmful context
- **high**: Clear, explicit inference about a prohibited category

Scan ALL text in the report (facts, signals, roasts, predictions, everything).
Return JSON in this exact format:
{
  "passed": true,
  "violations": [
    {
      "category": "string — the prohibited category violated",
      "attribute": "string — what was said/implied",
      "severity": "low|medium|high",
      "detail": "string — exact text that triggered the violation"
    }
  ]
}`;

export interface GovernanceAgentInput {
  facts: any[];
  strongSignals: any[];
  roasts: any[];
  coworkerQuotes: any[];
  careerPrediction: any;
  startupParody: any;
  digitalProfileSummary: string;
  finalVerdict?: string;
}

export interface GovernanceAgentOutput {
  passed: boolean;
  violations: GovernanceViolation[];
}

export class GovernanceAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: "governance_agent",
      name: "Governance Agent",
      description: "Validates outputs against ethical guidelines",
      systemPrompt: SYSTEM_PROMPT,
      model: "gpt-4o",
      temperature: 0.2,
    };
    super(config);
  }

  async process(
    input: GovernanceAgentInput,
  ): Promise<{ output: GovernanceCheck; trace: AgentTrace }> {
    return this.safeProcess<GovernanceCheck>(
      async () => {
        const startTime = new Date().toISOString();
        const start = performance.now();

        const userPrompt = this.buildPrompt(input);
        const { parsed, trace } =
          await this.callAIJSON<GovernanceAgentOutput>(userPrompt);

        const validated = this.validateOutput(parsed);

        const check: GovernanceCheck = {
          passed: validated.passed,
          violations: validated.violations,
          checkedAt: new Date().toISOString(),
        };

        const endTime = new Date().toISOString();
        const latency = performance.now() - start;

        const agentTrace: AgentTrace = {
          ...trace,
          agentName: this.config.name,
          input: {
            factCount: input.facts.length,
            signalCount: input.strongSignals.length,
          },
          output: check,
          latency,
          startTime,
          endTime,
        };

        return { output: check, trace: agentTrace };
      },
      { passed: true, violations: [], checkedAt: new Date().toISOString() },
    );
  }

  private buildPrompt(input: GovernanceAgentInput): string {
    const reportSections = [
      `## Digital Profile Summary\n${input.digitalProfileSummary}`,
      `## Facts (${input.facts.length})\n${JSON.stringify(input.facts, null, 2)}`,
      `## Strong Signals (${input.strongSignals.length})\n${JSON.stringify(input.strongSignals, null, 2)}`,
      `## Career Prediction\n${JSON.stringify(input.careerPrediction, null, 2)}`,
      `## Startup Parody\n${JSON.stringify(input.startupParody, null, 2)}`,
      `## Roasts (${input.roasts.length})\n${JSON.stringify(input.roasts, null, 2)}`,
      `## Coworker Quotes (${input.coworkerQuotes.length})\n${JSON.stringify(input.coworkerQuotes, null, 2)}`,
    ];

    if (input.finalVerdict) {
      reportSections.push(`## Final Verdict\n${input.finalVerdict}`);
    }

    return `Scan this investigation report for ethical violations. Check EVERY section.

${reportSections.join("\n\n")}

Does any content violate the prohibited inference categories? Be thorough — check facts, signals, roasts, quotes, predictions, and the parody.`;
  }

  private validateOutput(output: GovernanceAgentOutput): GovernanceAgentOutput {
    return {
      passed:
        output.passed === true &&
        (!Array.isArray(output.violations) || output.violations.length === 0),
      violations: Array.isArray(output.violations) ? output.violations : [],
    };
  }
}
