import {
  ContextPack,
  InvestigationReport,
  AgentTrace,
  GovernanceCheck,
  TokenUsage,
} from "../types";
import { BaseAgent } from "./base";
import { ProfileAnalystAgent, ProfileAnalystOutput } from "./profile-analyst";
import { SignalDetectorAgent, SignalDetectorOutput } from "./signal-detector";
import { CareerPredictorAgent } from "./career-predictor";
import { StartupGeneratorAgent } from "./startup-generator";
import { RoastAgent, RoastAgentOutput } from "./roast-agent";
import {
  GovernanceAgent,
  GovernanceAgentInput,
  GovernanceAgentOutput,
} from "./governance-agent";
import { FinalSynthesisAgent, FinalSynthesisInput } from "./final-synthesis";
import { generateId } from "../utils";

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

    const emptyTokenUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    try {
      // Step 1: Profile Analyst
      const { output: profileOutput, trace: profileTrace } =
        await this.runAgent(
          this.profileAnalyst,
          { context },
          { facts: [], digitalProfileSummary: "" },
        );
      traces.push(profileTrace);

      // Step 2: Signal Detector
      const { output: signalOutput, trace: signalTrace } = await this.runAgent(
        this.signalDetector,
        { context, facts: profileOutput.facts },
        { strongSignals: [], hiddenObsessions: [] },
      );
      traces.push(signalTrace);

      // Step 3: Career Predictor
      const { output: careerOutput, trace: careerTrace } = await this.runAgent(
        this.careerPredictor,
        { context, strongSignals: signalOutput.strongSignals },
        {
          nextRole: "Unknown",
          industryDirection: "Unknown",
          leadershipPotential: 0,
          futureOpportunities: [],
          confidence: 0,
        },
      );
      traces.push(careerTrace);

      // Step 4: Startup Generator
      const { output: startupOutput, trace: startupTrace } =
        await this.runAgent(
          this.startupGenerator,
          { context, strongSignals: signalOutput.strongSignals },
          {
            name: "Failed Startup",
            tagline: "Failed to generate",
            fundingStage: "Pre-Seed",
            investorPitch: "No pitch",
            businessModel: "Unknown",
            biggestRisk: "Unknown",
            mostLikelyCauseOfFailure: "Generator failed",
          },
        );
      traces.push(startupTrace);

      // Step 5: Roast Agent
      const { output: roastOutput, trace: roastTrace } = await this.runAgent(
        this.roastAgent,
        { context, strongSignals: signalOutput.strongSignals },
        { roasts: [], coworkerQuotes: [], finalVerdict: "A curious case." },
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
          { passed: true, violations: [], checkedAt: new Date().toISOString() },
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
        this.buildFallbackReport(
          context,
          profileOutput,
          signalOutput,
          careerOutput,
          startupOutput,
          roastOutput,
          allViolations,
          totalLatency,
          allTokenUsage,
        ),
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const elapsed = performance.now() - orchestratorStart;

      return {
        report: this.buildEmergencyReport(
          context,
          errorMessage,
          traces,
          elapsed,
        ),
        traces,
        governanceCheck: {
          passed: false,
          violations: [
            {
              category: "system",
              attribute: "orchestrator_failure",
              severity: "high",
              detail: errorMessage,
            },
          ],
          checkedAt: new Date().toISOString(),
        },
      };
    }
  }

  private async runAgent<T>(
    agent: BaseAgent,
    input: any,
    fallback: T,
  ): Promise<{ output: T; trace: AgentTrace }> {
    try {
      const result = await agent.process(input);
      const output = (result.output ?? fallback) as T;
      return { output, trace: result.trace };
    } catch (error) {
      const now = new Date().toISOString();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        output: fallback,
        trace: {
          agentId: generateId(),
          agentName: agent["config"]?.name || "unknown",
          input,
          output: fallback,
          latency: 0,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          cost: 0,
          model: agent["config"]?.model || "unknown",
          provider: "unknown",
          startTime: now,
          endTime: now,
          success: false,
          error: errorMessage,
        },
      };
    }
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

  private buildFallbackReport(
    context: ContextPack,
    profileOutput: ProfileAnalystOutput,
    signalOutput: SignalDetectorOutput,
    careerOutput: any,
    startupOutput: any,
    roastOutput: RoastAgentOutput,
    violations: any[],
    totalLatency: number,
    allTokenUsage: TokenUsage,
  ): any {
    return {
      id: generateId(),
      profileHash: "fallback",
      digitalProfileSummary: profileOutput.digitalProfileSummary,
      facts: profileOutput.facts,
      strongSignals: signalOutput.strongSignals,
      hiddenObsessions: signalOutput.hiddenObsessions,
      coworkerQuotes: roastOutput.coworkerQuotes,
      startupParody: startupOutput,
      careerPrediction: careerOutput,
      brutalRoast: roastOutput.roasts,
      wildGuesses: [],
      finalVerdict:
        roastOutput.finalVerdict ||
        "Investigation completed with degraded results.",
      personalityScores: {
        builderScore: 50,
        operatorScore: 50,
        creatorScore: 50,
        founderScore: 50,
        chaosScore: 50,
      },
      cookedLevel: "Mildly Cooked",
      metadata: {
        model: "gpt-4o",
        provider: "fallback",
        latency: totalLatency,
        tokenUsage: allTokenUsage,
        cost: 0,
        promptVersion: "1.0.0",
        governancePassed: violations.length === 0,
        safetyChecked: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private buildEmergencyReport(
    context: ContextPack,
    errorMessage: string,
    traces: AgentTrace[],
    elapsed: number,
  ): InvestigationReport {
    return {
      id: generateId(),
      profileHash: "error",
      digitalProfileSummary: "Investigation failed due to a system error.",
      facts: [],
      strongSignals: [],
      hiddenObsessions: [],
      coworkerQuotes: [],
      startupParody: {
        name: "Crashed.exe",
        tagline: "It was not supposed to end this way",
        fundingStage: "Error",
        investorPitch:
          "The investigation encountered an error before completion.",
        businessModel: "None",
        biggestRisk: "Unhandled exceptions",
        mostLikelyCauseOfFailure: errorMessage,
      },
      careerPrediction: {
        nextRole: "Unknown",
        industryDirection: "Unknown",
        leadershipPotential: 0,
        futureOpportunities: [],
        confidence: 0,
      },
      brutalRoast: [],
      wildGuesses: [],
      finalVerdict: "The investigation failed to reach a verdict.",
      personalityScores: {
        builderScore: 0,
        operatorScore: 0,
        creatorScore: 0,
        founderScore: 0,
        chaosScore: 100,
      },
      cookedLevel: "Absolutely Cooked",
      metadata: {
        model: "unknown",
        provider: "error",
        latency: elapsed,
        tokenUsage: this.aggregateTokenUsage(traces),
        cost: 0,
        promptVersion: "1.0.0",
        governancePassed: false,
        safetyChecked: false,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
