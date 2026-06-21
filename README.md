# 🔍 Internet Detective AI

> *"We Analyzed Your Entire Internet Personality."*

[Live Demo](https://internet-detective-ai.vercel.app) · [Documentation](./docs) · [Report Bug](https://github.com/harishkotra/internet-detective-ai/issues)

---

## 🎯 The Product

Paste your LinkedIn, GitHub, Twitter, resume — get a brutally honest AI investigation of your entire internet personality.

Combines the energy of:
- **FBI Profiler** — Evidence-based analysis
- **Career Coach** — Professional trajectory mapping
- **Roast Comedian** — Playful, sharable humor
- **Startup Investor** — VC-style pitch parody
- **Internet Detective** — Deep signal extraction

### Sample Report Sections
- Digital Profile Summary
- Facts (directly observable)
- Strong Signals (evidence-based inferences with confidence scores)
- Hidden Obsessions
- Coworker Quotes (fictional but believable)
- Startup Parody
- Career Prediction
- Brutal Roast
- Wild Guesses (labeled speculation)
- Internet Personality Scores (Builder, Operator, Creator, Founder, Chaos)
- Cooked Meter

---

## 🏗️ The Architecture

[Full Architecture Docs](./docs/14-production-architecture.md)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS v4, shadcn/ui |
| Backend | Next.js API Routes, LangChain |
| AI Service | Provider-Abstracted Multi-Agent System |
| Database | Supabase (optional) |
| Caching | Upstash Redis (optional) |
| Auth | Clerk (optional) |
| Analytics | PostHog (optional) |
| Observability | LangSmith (optional) |
| Deployment | Vercel |

### Provider Abstraction Layer

```
Application
    ↓
Agent Layer (7 specialized agents)
    ↓
AI Service Layer
    ↓
Provider Adapter (abstract interface)
    ↓
Zen · OpenAI · Anthropic · Gemini · OpenRouter · Featherless · Ollama
```

**7 supported providers** — Adding a new one requires only a single adapter file.

### Multi-Agent System

| Agent | Role |
|-------|------|
| Profile Analyst | Extracts directly observable facts |
| Signal Detector | Finds patterns and evidence-based inferences |
| Career Predictor | Predicts future trajectory with confidence % |
| Startup Generator | Creates VC-pitch parody |
| Roast Agent | Generates playful, entertaining content |
| Governance Agent | Validates ethical compliance |
| Final Synthesis | Assembles the complete report |

---

## 🧠 AI Engineering Showcase

This repo demonstrates 14 areas of production AI engineering:

| # | Topic | Doc |
|---|-------|-----|
| 1 | Prompt Engineering | [docs/01-prompt-engineering.md](./docs/01-prompt-engineering.md) |
| 2 | Context Engineering | [docs/02-context-engineering.md](./docs/02-context-engineering.md) |
| 3 | Structured Outputs | [docs/03-structured-outputs.md](./docs/03-structured-outputs.md) |
| 4 | LangChain Integration | [docs/04-langchain.md](./docs/04-langchain.md) |
| 5 | Multi-Agent Design | [docs/05-multi-agent-design.md](./docs/05-multi-agent-design.md) |
| 6 | AI Governance | [docs/06-governance.md](./docs/06-governance.md) |
| 7 | AI Safety | [docs/07-safety.md](./docs/07-safety.md) |
| 8 | Observability | [docs/08-observability.md](./docs/08-observability.md) |
| 9 | Evaluations | [docs/09-evaluations.md](./docs/09-evaluations.md) |
| 10 | Cost Tracking | [docs/10-cost-tracking.md](./docs/10-cost-tracking.md) |
| 11 | Provider Abstraction | [docs/11-provider-abstraction.md](./docs/11-provider-abstraction.md) |
| 12 | OpenAI-Compatible APIs | [docs/12-openai-compatible-apis.md](./docs/12-openai-compatible-apis.md) |
| 13 | Zen API Integration | [docs/13-zen-api-integration.md](./docs/13-zen-api-integration.md) |
| 14 | Production Architecture | [docs/14-production-architecture.md](./docs/14-production-architecture.md) |

---

### Quick Start

```bash
git clone https://github.com/harishkotra/internet-detective-ai.git
cd internet-detective-ai
npm install
cp .env.local.example .env.local
# Add your ZEN_API_KEY (or any provider key)
npm run dev
```

### Environment Variables

```bash
AI_PROVIDER=zen
ZEN_API_KEY=your_key_here
ZEN_BASE_URL=https://api.opencode.ai/v1
# Optional: add other providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

### Run Evaluations

```bash
# Compare models against the developer dataset
curl -X POST /api/evaluate -d '{"dataset": "developer", "model": "gpt-4o", "provider": "openai"}'
```

### Project Structure

```
src/
├── lib/
│   ├── agents/        # 7 specialized agents + orchestrator
│   ├── providers/     # Provider abstraction (8 adapters)
│   ├── context/       # Context engineering
│   ├── governance/    # AI governance layer
│   ├── safety/        # AI safety checks
│   ├── rag/           # RAG system
│   ├── cost/          # Cost tracking
│   ├── eval/          # Evaluation framework
│   ├── observability/ # LangSmith + local tracing
│   └── prompts/       # Prompt registry
├── components/
│   ├── landing/       # Landing page components
│   ├── report/        # Report section components
│   ├── share/         # Share/download functionality
│   └── dashboard/     # Developer dashboard
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Developer dashboard pages
│   └── investigation/ # Report display pages
prompts/system/        # 8 system prompt markdown files
docs/                  # 14 documentation files
evals/                 # 4 evaluation datasets (20 profiles)
```

---

## 🤝 Contributing

This project is designed to be forked, extended, and learned from.

### Ideas for Contributions

- **New Agents** — Add a "Writing Style Analyzer" or "Network Graph Agent"
- **New Providers** — Add support for Together AI, Groq, Replicate
- **Social Platform Scrapers** — Real LinkedIn/GitHub/Twitter API integration
- **New Report Sections** — "Tech Stack Deep Dive", "Open Source Health Score"
- **Share Features** — OG image generation, TikTok video export
- **Mobile App** — React Native or Expo wrapper
- **Browser Extension** — One-click investigation from any profile page

### Development Guidelines

1. Each agent = 1 file in `src/lib/agents/`
2. Each provider = 1 file in `src/lib/providers/`
3. Prompts live in `prompts/system/` as markdown
4. Types are centralized in `src/lib/types.ts`
5. Run `npm run lint` before committing

---

## 📄 License

MIT

---

Built by [Harish Kotra](https://harishkotra.me) · [Check out my other builds](https://dailybuild.xyz)
