export interface ProfileInput {
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  resumeText?: string;
  rawProfileText?: string;
}

export interface NormalizedProfile {
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  education: Education[];
  workExperience: WorkExperience[];
  skills: string[];
  languages: string[];
  certifications: string[];
  githubRepos: GithubRepo[];
  githubStats: GithubStats;
  twitterBio?: string;
  tweetTopics: string[];
  websiteContent?: string;
  rawText: string;
}

export interface Education {
  institution: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  skills?: string[];
}

export interface GithubRepo {
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  topics: string[];
  isFork: boolean;
  lastPushed?: string;
}

export interface GithubStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  contributions: number;
  topLanguages: string[];
  streak?: number;
}

export interface Evidence {
  source: string;
  detail: string;
  direct: boolean;
}

export interface StrongSignal {
  title: string;
  category: string;
  evidence: Evidence[];
  reasoning: string;
  confidenceScore: number;
}

export interface Fact {
  observation: string;
  source: string;
  category: string;
}

export interface HiddenObsession {
  theme: string;
  evidence: Evidence[];
  intensity: number;
}

export interface CoworkerQuote {
  quote: string;
  context: string;
  tone: "playful" | "admiring" | "frustrated" | "impressed";
}

export interface StartupParody {
  name: string;
  tagline: string;
  fundingStage: string;
  investorPitch: string;
  businessModel: string;
  biggestRisk: string;
  mostLikelyCauseOfFailure: string;
}

export interface CareerPrediction {
  nextRole: string;
  industryDirection: string;
  leadershipPotential: number;
  futureOpportunities: string[];
  confidence: number;
}

export interface Roast {
  line: string;
  category: string;
  intensity: number;
}

export interface WildGuess {
  prediction: string;
  reasoning: string;
  confidence: number;
}

export interface InternetPersonalityScores {
  builderScore: number;
  operatorScore: number;
  creatorScore: number;
  founderScore: number;
  chaosScore: number;
}

export type CookedLevel =
  | "Not Cooked"
  | "Mildly Cooked"
  | "Cooked"
  | "Deep Fried"
  | "Absolutely Cooked";

export interface InvestigationReport {
  id: string;
  profileHash: string;
  digitalProfileSummary: string;
  facts: Fact[];
  strongSignals: StrongSignal[];
  hiddenObsessions: HiddenObsession[];
  coworkerQuotes: CoworkerQuote[];
  startupParody: StartupParody;
  careerPrediction: CareerPrediction;
  brutalRoast: Roast[];
  wildGuesses: WildGuess[];
  finalVerdict: string;
  personalityScores: InternetPersonalityScores;
  cookedLevel: CookedLevel;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  model: string;
  provider: string;
  latency: number;
  tokenUsage: TokenUsage;
  cost: number;
  promptVersion: string;
  governancePassed: boolean;
  safetyChecked: boolean;
  generatedAt: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentTrace {
  agentId: string;
  agentName: string;
  input: unknown;
  output: unknown;
  latency: number;
  tokenUsage: TokenUsage;
  cost: number;
  model: string;
  provider: string;
  startTime: string;
  endTime: string;
  success: boolean;
  error?: string;
}

export interface GovernanceCheck {
  passed: boolean;
  violations: GovernanceViolation[];
  checkedAt: string;
}

export interface GovernanceViolation {
  category: string;
  attribute: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface SafetyCheck {
  passed: boolean;
  threats: SafetyThreat[];
}

export interface SafetyThreat {
  type:
    | "prompt_injection"
    | "jailbreak"
    | "pii"
    | "toxicity"
    | "sensitive_attribute";
  severity: "low" | "medium" | "high";
  detail: string;
  text: string;
}

export type AgentType =
  | "profile_analyst"
  | "signal_detector"
  | "career_predictor"
  | "startup_generator"
  | "roast_agent"
  | "governance_agent"
  | "final_synthesis";

export type ProviderType =
  | "zen"
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "featherless"
  | "ollama";

export type EvalMetric =
  | "json_compliance"
  | "consistency"
  | "hallucination_rate"
  | "humor_score"
  | "accuracy"
  | "latency"
  | "cost";

export interface EvalResult {
  id: string;
  dataset: string;
  promptVersion: string;
  model: string;
  provider: string;
  metrics: Record<EvalMetric, number>;
  report: InvestigationReport;
  latency: number;
  cost: number;
  timestamp: string;
  feedback?: UserFeedback;
}

export interface UserFeedback {
  approved: boolean;
  corrections?: string;
  rating: number;
  timestamp: string;
}

export interface ModelComparison {
  model: string;
  provider: string;
  avgMetrics: Record<EvalMetric, number>;
  avgLatency: number;
  avgCost: number;
  sampleSize: number;
}

export interface ContextPack {
  normalized: NormalizedProfile;
  summary: string;
  keySignals: string[];
  compressionRatio: number;
  noiseReduction: number;
  timestamp: string;
}
