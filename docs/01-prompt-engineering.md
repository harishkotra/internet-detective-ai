# Prompt Engineering in Internet Detective AI

## What Is Prompt Engineering

Prompt engineering is the discipline of designing inputs to large language models to reliably produce desired outputs. It is not "chatting with AI" — it is a systematic engineering practice encompassing instruction design, output structuring, constraint specification, and failure mode analysis.

In Internet Detective AI, prompt engineering is the foundational layer. Every agent, every persona, and every structured output begins with a carefully crafted prompt. The quality of the investigation report is directly bounded by the quality of the prompts that produce it.

## Persona-Driven Prompts

A persona is a role-based identity assigned to the model before it performs a task. Personas activate the model's latent understanding of social roles, genre conventions, and behavioral norms.

### The Five Personas

**FBI Profiler** (Signal Detector Agent)
- Prompt identity: "You are SignalDetector, a behavioral pattern recognition AI."
- Effect: The model adopts analytical, evidence-weighing language. It looks for patterns, clusters evidence, and avoids casual observation.
- Best for: Tasks requiring structured inference from noisy data.

**Career Coach** (Career Predictor Agent)
- Prompt identity: "You are CareerPredictor, a career trajectory analyst."
- Effect: The model focuses on professional development, trajectory mapping, and forward-looking predictions. It naturally adopts a mentorship-like tone.
- Best for: Tasks requiring judgment about professional paths and potential.

**Roast Comedian** (Roast Agent)
- Prompt identity: "You are RoastAgent, a roast comedian specializing in tech industry satire."
- Effect: The model shifts to humor mode — puns, exaggeration, and playful cruelty. Crucially, the roast comedian persona has built-in ethical constraints (roast comedians know not to cross certain lines).
- Best for: Creative, humorous content that must remain within safety bounds.

**Startup Investor** (Startup Generator Agent)
- Prompt identity: "You are StartupGenerator, a startup parody generator."
- Effect: The model adopts venture-capital language, buzzword fluency, and ironic detachment. It naturally produces YC-pitch-style content.
- Best for: Parody and satire that requires domain-specific language.

**Internet Detective** (Orchestrator / Synthesis Agent)
- Prompt identity: "You are FinalSynthesis, the master assembler."
- Effect: The model takes on an investigative, synthesizing tone. It connects disparate pieces of evidence into a coherent narrative.
- Best for: Multi-source synthesis and final output assembly.

### Why Personas Work

Personas work because LLMs are trained on vast corpora that include role-specific language patterns. When you say "you are a roast comedian," you activate the subset of training data related to comedy, roasting culture, and comedic ethics. This is more effective than instructing "be funny but not offensive" because the persona carries implicit constraints — a roast comedian knows the rules of roasting.

The persona pattern also provides a "mental model" for the user. When someone reads "FBI Profiler," they instantly understand the tone and level of analysis to expect.

## System vs. User Prompts

The project uses a strict separation:

```typescript
const messages: ChatCompletionRequest["messages"] = [
  { role: "system", content: options.systemPrompt },
  { role: "user", content: options.userPrompt },
];
```

**System prompts** define the agent's identity, capabilities, constraints, and output format. They are static per agent type. Examples:
- "You are ProfileAnalyst, a senior technical recruiter and open-source intelligence analyst."
- The JSON schema the agent must output.
- The rules the agent must follow.

**User prompts** contain the dynamic input for a specific investigation. They are built per-call and include:
- The normalized profile data for this investigation.
- The facts or signals from upstream agents.
- Context-specific instructions.

The separation is critical for production: system prompts are versioned, cached, and audited. User prompts are ephemeral.

## Few-Shot Examples

Every agent prompt includes example outputs. These are not afterthoughts — they are integral to prompt design:

```markdown
## Example Outputs

### Good Fact
{
  "observation": "Has 5 years of software engineering experience at Google",
  "source": "Work experience: Software Engineer at Google (2019-2024)",
  "category": "experience"
}

### Bad Fact
{
  "observation": "Is a hard worker who loves coding",
  "source": "Inferred from job history",
  "category": "personality"
}
```

The "Good vs. Bad" pattern is particularly effective. It shows the model both what to do and what not to do, in one shot.

## Chain-of-Thought Reasoning

All agent prompts use structured step-by-step instructions. For example, the Profile Analyst prompt:

```
### Step 1: Scan the Profile
### Step 2: Extract Facts
### Step 3: Write the Summary
### Step 4: Validate
```

This is explicit chain-of-thought prompting. We don't just tell the model *what* to do — we tell it *how* to think about the task, in what order, and what to check at each step.

The Signal Detector prompt adds metacognitive steps:

```
### Step 1: Analyze Fact Clusters
Group the facts by category and look for clusters. A single fact is noise; three facts pointing in the same direction is a signal.
```

This forces the model to aggregate before it concludes, reducing the chance of jumping to conclusions from single data points.

## Temperature and Sampling Parameters

Each agent uses a different temperature based on its task:

| Agent | Temperature | Rationale |
|-------|-------------|-----------|
| Profile Analyst | 0.3 | Low temperature for factual extraction — repeatability is critical |
| Signal Detector | 0.4 | Low-medium — needs some creativity in pattern detection, but must stay grounded |
| Career Predictor | 0.5 | Medium — prediction requires creative extrapolation within constraints |
| Startup Generator | 0.8 | High — creativity and humor benefit from more randomness |
| Roast Agent | 0.9 | Very high — maximum creative variability for comedy |
| Governance Agent | 0.2 | Very low — consistent, strict evaluation is required |
| Final Synthesis | 0.5 | Medium — needs creativity in scoring without drifting from evidence |

The pattern: **generation tasks get high temperature; evaluation tasks get low temperature**. This is a core production lesson. Never use high temperature for tasks that require consistency (evaluation, extraction, validation).

## The 8 Prompt Files in prompts/system/

The project stores prompts as Markdown files in `prompts/system/`. Each file contains the full prompt definition including purpose, inputs, outputs, instructions, failure modes, guardrails, and examples.

| File | Agent | Purpose |
|------|-------|---------|
| `analysis.md` | Profile Analyst | Extract facts and write professional summary |
| `signal-detection.md` | Signal Detector | Detect behavioral patterns and hidden obsessions |
| `career.md` | Career Predictor | Predict next career move |
| `startup.md` | Startup Generator | Create humorous startup parody |
| `roast.md` | Roast Agent | Generate roasts and coworker quotes |
| `governance.md` | Governance Agent | Validate against ethical guidelines |
| `synthesis.md` | Final Synthesis | Assemble final report |
| `orchestrator.md` | Orchestrator | Coordinate the multi-agent pipeline |

Each prompt file serves as both documentation and executable configuration. The `PromptRegistry` class loads these files at runtime:

```typescript
export class PromptRegistry {
  private prompts: Map<AgentType, string> = new Map();

  async load(): Promise<void> {
    const entries = await fs.promises.readdir(PROMPTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      const agentType = this.resolveAgentType(entry.name);
      if (!agentType) continue;
      const content = await fs.promises.readFile(
        path.join(PROMPTS_DIR, entry.name), "utf-8"
      );
      this.prompts.set(agentType, content.trim());
    }
  }
}
```

## Why Each Prompt Is Structured the Way It Is

### Purpose Section
Every prompt starts with a purpose statement. This orients the model by answering "why does this agent exist?" before telling it what to do.

### Version Header
Prompts include version numbers. This enables A/B testing, rollback, and regression tracking. When a prompt change produces worse outputs, the version number makes it findable.

### Expected Inputs / Outputs
Specifying the exact JSON schema before the instructions gives the model a target structure. This is called "output-first design" — the model builds an internal representation of the target structure early, improving compliance.

### Step-by-Step Instructions
Breaking tasks into numbered steps creates a chain-of-thought scaffold. Each step has a clear purpose and output.

### Failure Modes
Listing failure modes is a form of few-shot learning. By naming specific patterns (recency bias, source confusion, over-extraction), we make the model more likely to self-correct. It's also invaluable documentation for developers debugging prompt issues.

### Guardrails
Guardrails come before examples intentionally (primacy effect). Ethical constraints anchor the model's behavior before it sees task examples.

### Examples
Every prompt includes both good and bad examples. This creates a clear boundary between desired and undesired behavior.

### Why This Matters
Each prompt ends with a meta-section explaining the prompt engineering techniques used. This is documentation for future prompt engineers — it turns the prompt file into a teaching tool.

## Production Lessons Learned

1. **Prompt files should be loadable at runtime.** Hardcoded prompts in source code cannot be updated without redeployment. File-based prompts can be hot-reloaded.

2. **Version everything.** Prompts change over time. Without versions, you cannot know which prompt produced which output.

3. **Temperature is a per-agent setting.** Using the same temperature for all agents is a mistake. Match temperature to task type.

4. **System/user prompt separation is non-negotiable.** It enables prompt versioning, caching, and audit trails.

5. **Good examples are more important than good instructions.** A well-chosen example output shapes model behavior more than paragraphs of rules.

6. **Failure modes are training data.** Listing what can go wrong makes the model more careful. It's not documentation — it's prompt design.

7. **Persona prompts need ethical anchors.** A "roast comedian" persona is funny because it has built-in constraints. A persona without ethical guardrails is dangerous.

8. **Test with temperature=0 first.** Before deploying a new prompt, test it with temperature 0 to verify it produces the correct structure. Then add temperature for creativity.

9. **Prompt files are documentation.** Well-structured prompt files serve as executable specifications, developer docs, and training materials simultaneously.

10. **Chain-of-thought should be explicit, not implicit.** Numbered steps force the model through a reasoning process. "Think step by step" is too vague — tell the model exactly what steps to take.
