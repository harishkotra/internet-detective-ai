# Production Architecture of Internet Detective AI

## Full Architecture Overview

Internet Detective AI is a full-stack Next.js application with an intelligent agent layer for AI-powered profile investigation. The architecture follows a **layered design** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15 App Router)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Landing  │ │Investi-  │ │Dashboard │ │ Report View  │   │
│  │  Page    │ │gation    │ │  Pages   │ │   (MD/JSON)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   API Layer (Next.js Route Handlers)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Investi-  │ │ Evaluate │ │  Cost    │ │ Model/Agent  │   │
│  │gate      │ │          │ │  API     │ │   API        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Agent Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Profile   │ │ Signal   │ │ Career   │ │  Roast Agent │   │
│  │Analyst   │ │Detector  │ │Predictor │ │              │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │Startup   │ │Governance│ │Synthesis │                    │
│  │Generator │ │ Agent    │ │  Agent   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Provider │ │ Context  │ │ Safety   │ │  Observability│   │
│  │Factory   │ │ Builder  │ │ Checker  │ │  Tracker     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Optional External Services                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Supabase │ │ Redis    │ │ Clerk    │ │  PostHog     │   │
│  │ (DB)     │ │ (Cache)  │ │ (Auth)   │ │ (Analytics)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend: Next.js 15 App Router

The frontend uses Next.js 15 (v16.2.9 in package.json) with the **App Router** and React 19.

### Directory Structure
```
src/app/
├── page.tsx                  # Landing page (HeroSection, InvestigationForm)
├── layout.tsx                # Root layout (dark theme, PostHog, TooltipProvider)
├── globals.css               # Global styles with Tailwind v4
├── posthog-provider.tsx      # PostHog analytics wrapper
├── investigation/
│   └── [id]/                 # Dynamic investigation results page
├── dashboard/
│   ├── page.tsx              # Dashboard home
│   ├── layout.tsx            # Dashboard layout
│   ├── costs/                # Cost analytics pages
│   ├── evaluations/          # Evaluation results pages
│   ├── governance/           # Governance check history
│   ├── models/               # Model comparison pages
│   ├── prompts/              # Prompt management pages
│   ├── safety/               # Safety check history
│   └── traces/               # Agent trace viewer
└── api/
    ├── investigate/          # POST — run an investigation
    ├── investigate-raw/      # POST — run with raw text
    ├── agents/               # Agent management
    ├── models/               # Model listing
    ├── prompts/              # Prompt management
    ├── evaluate/             # Run evaluations
    ├── costs/                # Cost data
    ├── traces/               # Trace data
    ├── governance/           # Governance history
    ├── safety/               # Safety history
    └── feedback/             # User feedback submission
```

### UI Components
Components are organized by domain:
```
src/components/
├── ui/           # Base UI primitives (button, tooltip, etc.) — shadcn-based
├── landing/      # Landing page (HeroSection, InvestigationForm, FeaturesSection, ExampleReport)
├── report/       # Report display components
├── dashboard/    # Dashboard charts and tables
└── share/        # Social sharing components
```

Styling uses **Tailwind CSS v4** with `tw-merge` for class merging and `tw-animate-css` for animations.

### Layout
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-black text-white antialiased">
        <Suspense>
          <PostHogProvider>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
```

## Backend: API Routes + Agent Layer

### API Routes (Next.js Route Handlers)

The backend consists of 12 API route modules under `src/app/api/`. Each handles a specific domain:

```typescript
// Example: POST /api/investigate
export async function POST(request: Request) {
  const body = await request.json();
  const input: ProfileInput = {
    linkedinUrl: body.linkedinUrl,
    githubUrl: body.githubUrl,
    // ...
  };

  // Build context
  const contextBuilder = new ContextBuilder();
  const context = await contextBuilder.build(input);

  // Run investigation
  const orchestrator = new InvestigationOrchestrator();
  const { report, traces, governanceCheck } = await orchestrator.investigate(context);

  // Record observability and cost
  await observability.recordInvestigation(report, traces);
  await costTracker.recordInvestigationCost(traces, report.id);

  return NextResponse.json({ report, traces, governanceCheck });
}
```

### Agent Layer

The agent layer is the core of the application, implementing:
- **7 specialized agents** with individual prompts and schemas
- **InvestigationOrchestrator** for pipeline coordination
- **AIService** for provider-agnostic LLM calls
- **PromptRegistry** for file-based prompt management

### Infrastructure Layer

Cross-cutting services:
- **SafetyChecker**: Prompt injection, jailbreak, PII, toxicity, sensitive attribute detection
- **GovernanceValidator**: Pattern-based ethical violation detection
- **ContextBuilder**: Input normalization, deduplication, compression
- **ProviderFactory**: Multi-provider LLM abstraction
- **CostTracker**: Per-investigation cost calculation and analytics
- **ObservabilityTracker**: Agent tracing and LangSmith integration

## Database: Supabase (Optional)

Supabase is included as a dependency (`@supabase/supabase-js` v2.108.2) for optional persistent storage.

### When to Use Supabase
- **User accounts**: Store user preferences and investigation history
- **Persistent cost tracking**: Cost records survive server restarts
- **Evaluation datasets**: Store and manage evaluation datasets
- **Shared investigations**: Share reports via permalink

### Integration Pattern
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// Store investigation
await supabase.from("investigations").insert({
  id: report.id,
  profile_hash: report.profileHash,
  report_json: report,
  created_at: new Date().toISOString(),
});

// Query by user
const { data } = await supabase
  .from("investigations")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(20);
```

## Caching: Redis/Upstash (Optional)

Upstash Redis (`@upstash/redis` v1.38.0) provides optional caching.

### Caching Strategy
```
1. Check Redis cache for profile hash
2. If exists, return cached report
3. If not, run investigation and cache result
4. Cache TTL: 24 hours by default
```

### Integration Pattern
```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache investigation result
await redis.setex(
  `report:${profileHash}`,
  86400,  // 24 hours
  JSON.stringify(report),
);

// Retrieve cached result
const cached = await redis.get(`report:${profileHash}`);
if (cached) return JSON.parse(cached);
```

### What to Cache
- **Full investigation reports** (24h TTL)
- **Model availability lists** (1h TTL)
- **Cost aggregation data** (5min TTL)
- **Rate limit counters** (sliding window)

## Auth: Clerk (Optional)

Clerk (`@clerk/nextjs` v7.5.7) provides optional authentication.

### When to Use Clerk
- **User-specific history**: Show users their past investigations
- **Rate limiting**: Apply different rate limits based on plan
- **Premium features**: Gate certain models or features behind auth

### Integration Pattern
```typescript
import { auth, currentUser } from "@clerk/nextjs";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Protected API route
export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await currentUser();
  // Proceed with authenticated user
}
```

## Analytics: PostHog (Optional)

PostHog (`posthog-js` v1.391.2, `posthog-node` v5.38.2) provides product analytics.

### What to Track
- **Investigation started/completed**: Conversion funnel
- **Model selection**: Popularity of different providers
- **Error rates**: Crash and failure tracking
- **Feature usage**: Dashboard page visits
- **User feedback**: Rating and comments

### Integration Pattern
```typescript
// src/app/posthog-provider.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export function PostHogProvider({ children }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Track events
posthog.capture("investigation_completed", {
  model: "deepseek-v3",
  provider: "zen",
  latency: 5432,
  cost: 0.016,
  governance_passed: true,
});
```

## Deployment: Vercel

The application is designed to deploy on **Vercel** (the Next.js platform).

### Deployment Configuration
```json
// vercel.json (implied by next.config.ts)
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

### Environment Variables on Vercel
Required:
- `ZEN_API_KEY` — OpenAI-compatible API key for LLM inference

Optional:
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, etc.
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`

### Serverless Function Considerations
- **Cold starts**: Vercel serverless functions cold-start in ~500ms. The full investigation (7 LLM calls) takes 5-15 seconds on first request.
- **Timeout**: Default Vercel function timeout is 10s (Hobby) / 60s (Pro / Enterprise). The investigation pipeline needs at least 30s.
- **Memory**: LLM response parsing is memory-light (~100MB). Default 1GB Vercel allocation is sufficient.
- **Concurrent requests**: Vercel handles concurrent requests well. Each investigation is self-contained.

## Scaling Considerations

### Horizontal Scaling
- **Stateless design**: Each investigation is self-contained. No shared state between requests.
- **Concurrent investigations**: The serverless architecture handles concurrent requests naturally. Each request spawns its own agent pipeline.
- **Provider rate limiting**: The bottleneck is LLM provider rate limits, not application capacity. At scale, distribute across providers.

### Vertical Scaling
- **Larger models for better quality**: Use GPT-4o or Claude Opus for premium investigations
- **Smaller models for volume**: Use DeepSeek V3 or Gemini Flash for high-volume, lower-stakes investigations

### Data Scaling
- **In-memory storage limits**: Current implementation keeps traces (10K), cost records (100K), and governance events (1K) in memory.
- **Database migration path**: When in-memory limits are exceeded, migrate to PostgreSQL (Supabase) for persistent storage.

### Cost Scaling
At 1,000 investigations/day with DeepSeek V3:
- API cost: ~$16/day
- Vercel cost: ~$0 (Hobby plan) or ~$20/month (Pro plan)
- Total: ~$500/month

At 10,000 investigations/day:
- Switch to Gemini Flash or GPT-4o-mini to reduce cost
- API cost: ~$5-50/day
- Total: ~$150-1,500/month

## Security Considerations

### API Key Management
- API keys are stored in environment variables, never in code
- Different providers can be enabled/disabled via env vars
- `ProviderFactory` skips providers without configured API keys

### Input Sanitization
- User input is scanned for prompt injection and jailbreak attempts
- PII is detected and redacted in outputs
- URL inputs are parsed and validated, not sent raw to LLMs

### Output Governance
- Every report passes through the Governance Agent
- The GovernanceValidator provides a second pass of pattern-based detection
- Violations are sanitized (redacted) before the report reaches the user

### Rate Limiting
- Not currently implemented on the API side (assumes Clerk for auth-based rate limiting)
- Future: Add IP-based rate limiting using Upstash Redis

### CORS
- Not currently configured (API routes only serve the same domain)
- If exposing APIs to third parties, add CORS headers

## Monitoring and Alerting

### Application Monitoring
- **PostHog** for product analytics and user behavior tracking
- **Vercel Analytics** for page views and performance monitoring (if enabled)

### LLM Monitoring
- **LangSmith** for agent trace visualization and debugging
- **CostTracker** for cost monitoring per investigation, per agent, per model
- **ObservabilityTracker** for success rates, latency distributions, and error tracking

### Alerting Triggers
- Cost per investigation exceeds threshold
- Agent success rate drops below 95%
- Governance violation rate spikes
- Specific provider failure rates increase
- Investigation pipeline latency exceeds 30s

### Dashboard
The built-in dashboard at `/dashboard/` provides:
- Cost breakdown by provider, model, and agent
- Evaluation results and model comparisons
- Trace viewer with filtering by agent
- Governance and safety event history
- Prompt version management

## Production Lessons Learned

1. **All external services should be optional.** The application works without Supabase, Redis, Clerk, PostHog — it uses them when available and degrades gracefully when they're not. This makes development and testing simpler.

2. **Serverless cold starts are real.** The first investigation after a period of inactivity triggers cold starts on all 7 agent calls. Consider using Vercel's Cron Jobs to keep the function warm, or add a loading state for the first investigation.

3. **In-memory storage is fine for prototypes but not production.** The current trace/cost/governance stores are in-memory arrays with caps. For production, replace with Supabase or another database.

4. **API route organization mirrors the agent architecture.** Each domain (costs, traces, governance, safety) has its own route handler. This makes the codebase navigable — you know where to find cost code.

5. **Dark mode is a design constraint, not just a preference.** The black background (`bg-black text-white`) is intentional — LLM report UIs look better in dark mode, and it reduces visual fatigue.

6. **Dashboard routes are feature gates for development.** The dashboard pages (costs, evaluations, governance, etc.) are also development tooling. They enable debugging and monitoring without needing external services.

7. **Use middleware for cross-cutting concerns.** The project has `src/middleware.ts` for Clerk auth and potentially for request logging, rate limiting, and header management.

8. **PostHog should be used sparingly.** Too many events create noise. Track high-value events (investigation completed, error occurred, feedback submitted) rather than every click.

9. **Report rendering uses react-markdown.** The investigation report is rendered as Markdown through react-markdown (v10.1.0). This allows the LLM to use standard Markdown formatting in the report.

10. **The footer on the landing page sets the tone.** "Roasts may sting" is both a warning and brand positioning. Production applications should match their tone across all surfaces.
