import {
  ContextPack,
  InvestigationReport,
  AgentTrace,
  GovernanceCheck,
  TokenUsage,
} from "../types";
import { BaseAgent } from "./base";
import { ProfileAnalystAgent } from "./profile-analyst";
import { SignalDetectorAgent } from "./signal-detector";
import { CareerPredictorAgent } from "./career-predictor";
import { StartupGeneratorAgent } from "./startup-generator";
import { RoastAgent } from "./roast-agent";
import { GovernanceAgent, GovernanceAgentInput } from "./governance-agent";
import { FinalSynthesisAgent, FinalSynthesisInput } from "./final-synthesis";

const MAX_GOVERNANCE_RETRIES = 2;

export class InvestigationOrchestrator {
  private profileAnalyst: ProfileAnalystAgent;
  private signalDetector: SignalDetectorAgent;
  private careerPredictor: CareerPredictorAgent;
  private startupGenerator: StartupGeneratorAgent;
  private roastAgent: RoastAgent;
  private governanceAgent: GovernanceAgent;
  private finalSynthesis: FinalSynthesisAgent;

  constructor() {
    this.profileAnalyst = new ProfileAnalystAgent();
    this.signalDetector = new SignalDetectorAgent();
    this.careerPredictor = new CareerPredictorAgent();
    this.startupGenerator = new StartupGeneratorAgent();
    this.roastAgent = new RoastAgent();
    this.governanceAgent = new GovernanceAgent();
    this.finalSynthesis = new FinalSynthesisAgent();
  }

  async investigate(context: ContextPack): Promise<{
    report: InvestigationReport;
    traces: AgentTrace[];
    governanceCheck: GovernanceCheck;
  }> {
    const orchestratorStart = performance.now();
    const traces: AgentTrace[] = [];
    const allViolations: any[] = [];

    // Step 1: Profile Analyst
    const { output: profileOutput, trace: profileTrace } = await this.runAgent(
      this.profileAnalyst,
      { context },
    );
    traces.push(profileTrace);

    // Step 2: Signal Detector
    const { output: signalOutput, trace: signalTrace } = await this.runAgent(
      this.signalDetector,
      { context, facts: profileOutput.facts },
    );
    traces.push(signalTrace);

    // Step 3: Career Predictor
    const { output: careerOutput, trace: careerTrace } = await this.runAgent(
      this.careerPredictor,
      { context, strongSignals: signalOutput.strongSignals },
    );
    traces.push(careerTrace);

    // Step 4: Startup Generator
    const { output: startupOutput, trace: startupTrace } = await this.runAgent(
      this.startupGenerator,
      {
        context,
        strongSignals: signalOutput.strongSignals,
      },
    );
    traces.push(startupTrace);

    // Step 5: Roast Agent
    const { output: roastOutput, trace: roastTrace } = await this.runAgent(
      this.roastAgent,
      { context, strongSignals: signalOutput.strongSignals },
    );
    traces.push(roastTrace);

    // Step 6: Governance Check (with retries)
    let governanceOutput: GovernanceCheck;
    for (let attempt = 0; attempt <= MAX_GOVERNANCE_RETRIES; attempt++) {
      const governanceInput: GovernanceAgentInput = {
        facts: profileOutput.facts,
        strongSignals: signalOutput.strongSignals,
        roasts: roastOutput.roasts,
        coworkerQuotes: roastOutput.coworkerQuotes,
        careerPrediction: careerOutput,
        startupParody: startupOutput,
        digitalProfileSummary: profileOutput.digitalProfileSummary,
        finalVerdict: roastOutput.finalVerdict,
      };

      const { output: govOutput, trace: govTrace } = await this.runAgent(
        this.governanceAgent,
        governanceInput,
      );
      traces.push(govTrace);
      governanceOutput = govOutput;

      if (governanceOutput.passed) {
        break;
      }

      allViolations.push(...governanceOutput.violations);

      if (attempt < MAX_GOVERNANCE_RETRIES) {
        governanceInput.facts = this.sanitizeForGovernance(
          profileOutput.facts,
          governanceOutput.violations,
        );
        await this.delay(500);
      }
    }

    // Step 7: Aggregate token usage across all traces
    const allTokenUsage = this.aggregateTokenUsage(traces);
    const totalLatency = performance.now() - orchestratorStart;

    // Step 8: Final Synthesis
    const synthesisInput: FinalSynthesisInput = {
      context,
      facts: profileOutput.facts,
      strongSignals: signalOutput.strongSignals,
      hiddenObsessions: signalOutput.hiddenObsessions,
      careerPrediction: careerOutput,
      startupParody: startupOutput,
      roasts: roastOutput.roasts,
      coworkerQuotes: roastOutput.coworkerQuotes,
      provisionalVerdict: roastOutput.finalVerdict,
      governanceViolations: allViolations,
      traces,
      totalLatency,
      allTokenUsage,
    };

    const { output: report, trace: synthesisTrace } = await this.runAgent(
      this.finalSynthesis,
      synthesisInput,
    );
    traces.push(synthesisTrace);

    const finalGovernanceCheck: GovernanceCheck = {
      passed: allViolations.length === 0,
      violations: allViolations,
      checkedAt: new Date().toISOString(),
    };

    return {
      report,
      traces,
      governanceCheck: finalGovernanceCheck,
    };
  }

  private async runAgent(
    agent: BaseAgent,
    input: any,
  ): Promise<{ output: any; trace: AgentTrace }> {
    const result = await agent.process(input);
    return { output: result.output, trace: result.trace };
  }

  private sanitizeForGovernance(facts: any[], violations: any[]): any[] {
    if (!violations || violations.length === 0) return facts;
    return facts.filter((fact) => {
      return !violations.some((v: any) =>
        fact.observation
          ?.toLowerCase()
          .includes((v.attribute || "").toLowerCase()),
      );
    });
  }

  private aggregateTokenUsage(traces: AgentTrace[]): TokenUsage {
    return traces.reduce(
      (acc, t) => ({
        promptTokens: acc.promptTokens + t.tokenUsage.promptTokens,
        completionTokens: acc.completionTokens + t.tokenUsage.completionTokens,
        totalTokens: acc.totalTokens + t.tokenUsage.totalTokens,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
