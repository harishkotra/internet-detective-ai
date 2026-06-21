# Context Engineering in Internet Detective AI

## What Is Context Engineering

Context engineering is the practice of preparing, cleaning, and structuring input data before it reaches an LLM. While prompt engineering designs *how* to ask, context engineering designs *what* to give the model. It is the difference between giving someone a messy pile of documents vs. a well-organized briefing packet.

In Internet Detective AI, context engineering transforms raw user input (URLs, resume text, scraped profiles) into a structured `ContextPack` that agents can consume efficiently. This is implemented in `src/lib/context/builder.ts` (841 lines — the largest file in the project).

## The Context Builder Class

The `ContextBuilder` is the entry point for all data processing:

```typescript
export class ContextBuilder {
  async build(input: ProfileInput): Promise<ContextPack> {
    const normalized = await this.normalize(input);
    const summary = this.generateSummary(normalized);
    const keySignals = this.extractKeySignals(normalized);
    const compressedText = this.compressContent(normalized.rawText);

    return {
      normalized: { ...normalized, rawText: compressedText },
      summary,
      keySignals,
      compressionRatio,
      noiseReduction: 0.85,
      timestamp: new Date().toISOString(),
    };
  }
}
```

The `ContextPack` struct contains everything an agent needs:

```typescript
export interface ContextPack {
  normalized: NormalizedProfile;
  summary: string;
  keySignals: string[];
  compressionRatio: number;
  noiseReduction: number;
  timestamp: string;
}
```

## Input Normalization

The first step is parsing URLs and raw text into structured fields. The `normalize` method delegates to four extractors:

```typescript
private async normalize(input: ProfileInput): Promise<NormalizedProfile> {
  const linkedInData = this.extractLinkedIn(input);
  const gitHubData = await this.extractGitHub(input);
  const twitterData = this.extractTwitter(input);
  const resumeData = this.extractResume(input);

  // Merge and deduplicate across sources
  const allEducation = this.deduplicateEducation([
    ...(linkedInData.education || []),
    ...(resumeData.education || []),
  ]);
  // ... same for work experience, skills, languages, certifications
}
```

Each extractor handles URL parsing and text pattern matching:

```typescript
private parseLinkedInUrl(url: string): { username?: string } {
  const patterns = [
    /linkedin\.com\/in\/([^/?#]+)/i,
    /linkedin\.com\/pub\/([^/?#]+)/i,
    /linkedin\.com\/school\/([^/?#]+)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { username: decodeURIComponent(match[1]) };
  }
  return {};
}
```

For resumes and raw text, the extractor uses section-based parsing — it identifies sections by headers ("Education", "Experience", "Skills") and extracts structured data from each:

```typescript
if (/^(skills|technologies|tech stack|competencies)/i.test(trimmed)) {
  currentSection = "skills";
  continue;
}
// ...
if (currentSection === "skills") {
  trimmed.split(/[,•|;/\n]+/).forEach((s) => {
    const skill = s.trim();
    if (skill && skill.length < 60) result.skills.push(skill);
  });
}
```

## Noise Removal

Noise is data that degrades model performance without providing signal. Sources of noise include:

- **Empty lines and whitespace**: Stripped during parsing
- **URL fragments**: Parsed into structured data, raw URLs discarded
- **Duplicate information**: Same skills listed on LinkedIn and resume
- **Irrelevant text**: Social media noise, boilerplate profile text
- **Extremely long lines**: Lines >500 chars are suspicious (likely scraped artifacts)

Noise removal happens primarily through the section-based parser — by only extracting text under known section headers, we discard everything else.

## Deduplication

Deduplication operates at multiple levels:

```typescript
private deduplicateEducation(items: Education[]): Education[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.institution}|${item.degree}|${item.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

private deduplicateStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

The deduplication is key-based and case-insensitive for strings. For complex objects (Education, WorkExperience), it uses composite keys that account for all identifying fields.

## Content Compression

Raw profile text can be very long (especially GitHub profiles with many repos). The `compressContent` method reduces size while preserving signal:

```typescript
private compressContent(text: string): string {
  if (!text || text.length < 500) return text;

  const lines = text.split("\n");
  const compressed: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalized)) continue;  // Skip duplicate lines
    seen.add(normalized);
    compressed.push(trimmed);
  }

  return compressed.join("\n");
}
```

The compression ratio is calculated and stored in the ContextPack:

```typescript
private calculateCompression(input: ProfileInput, normalized: NormalizedProfile): number {
  const rawLength = /* sum of all input field lengths */;
  const normalizedLength = normalized.rawText.length;
  if (rawLength === 0) return 1;
  return Math.round(Math.min(normalizedLength / rawLength, 1) * 100) / 100;
}
```

## Signal Extraction

Before any LLM inference, the Context Builder extracts key signals from the normalized profile:

```typescript
private extractKeySignals(profile: NormalizedProfile): string[] {
  const signals: string[] = [];

  const totalYearsExp = this.estimateYearsExperience(profile);
  if (totalYearsExp > 0)
    signals.push(`${totalYearsExp}+ years of professional experience`);

  const leadershipRoles = profile.workExperience.filter((w) =>
    /(head|lead|senior|principal|staff|chief|director|manager|vp)/i.test(w.role)
  );
  if (leadershipRoles.length > 0)
    signals.push(`Held ${leadershipRoles.length} leadership/senior role(s)`);

  // ... more signal detection logic
}
```

These pre-extracted signals serve two purposes:
1. They provide agents with quick-summary heuristics
2. They act as a "sanity check" — if an agent's analysis contradicts these signals, something is wrong

## Context Pack Generation

The final ContextPack is the output of the entire pipeline:

```typescript
{
  normalized: NormalizedProfile,  // Clean, structured, deduplicated
  summary: string,                // 5-8 sentence summary
  keySignals: string[],           // 3-10 pre-detected signals
  compressionRatio: number,       // How much smaller than input
  noiseReduction: number,         // Always 0.85 in current implementation
  timestamp: string               // When this was assembled
}
```

## Code Examples

### Building Context from User Input

```typescript
import { ContextBuilder } from "@/lib/context/builder";

const builder = new ContextBuilder();

const context = await builder.build({
  linkedinUrl: "https://linkedin.com/in/janedoe",
  githubUrl: "https://github.com/janedoe",
  twitterUrl: "https://x.com/janedoe",
  resumeText: `Senior Software Engineer at Acme Corp (2020-present)...`,
  rawProfileText: `Software Engineer | React, TypeScript, Go...`,
});

console.log(context.summary);
// "Jane Doe — Senior Software Engineer at Acme Corp. Currently Software Engineer at Acme Corp..."
console.log(context.keySignals);
// ["8+ years of professional experience", "Held 2 leadership/senior role(s)", ...]
console.log(context.compressionRatio);
// 0.42 (input was reduced to 42% of original size)
```

### Normalizing a Resume

```typescript
const input: ProfileInput = {
  resumeText: `
    EDUCATION
    MIT (2016-2020) — B.S. Computer Science

    EXPERIENCE
    Software Engineer at Google (2020-2023)
    Senior Engineer at Stripe (2023-present)

    SKILLS
    TypeScript, React, Python, Go, Kubernetes
  `,
};

const context = await builder.build(input);
console.log(context.normalized.workExperience);
// [
//   { role: "Senior Engineer", company: "Stripe", startDate: "2023", endDate: undefined },
//   { role: "Software Engineer", company: "Google", startDate: "2020", endDate: "2023" }
// ]
console.log(context.normalized.skills);
// ["TypeScript", "React", "Python", "Go", "Kubernetes"]
```

## Tradeoffs

### Rule-Based vs. LLM-Based Extraction

| Approach | Pros | Cons |
|----------|------|------|
| Rule-based (current) | Fast, deterministic, zero cost, debuggable | Brittle, misses edge cases, requires maintenance |
| LLM-based extraction | Handles any format, adapts to patterns | Slow, expensive, non-deterministic, can hallucinate |

**Decision**: We use rule-based extraction for the context builder. The determinism matters — the same input should always produce the same ContextPack. LLM extraction is reserved for the agent layer, which operates on the already-structured ContextPack.

### Compression vs. Information Preservation

Compression reduces LLM costs (fewer tokens) but may discard signal. Our approach is conservative:
- Only deduplicate exact or near-exact duplicates
- Only remove empty/noise lines
- Never truncate by character count
- Always report compression ratio so downstream consumers can adjust expectations

## Production Lessons Learned

1. **Context engineering is a cross-cutting concern.** It affects prompt effectiveness, cost, latency, and output quality. Invest proportional effort.

2. **Deduplication must happen before LLM calls.** Duplicate data wastes tokens and confuses models. A fact appearing twice can create false signal patterns.

3. **URL parsing is harder than it looks.** LinkedIn URLs have multiple formats (`/in/`, `/pub/`, `/school/`). Account for all known variants and fail gracefully for unknown ones.

4. **Section header detection is language-sensitive.** Resume sections have different names in different locales. Support multiple synonyms for each section.

5. **Measure compression ratio.** Without measurement, you don't know how effective your compression is. Track it per-input and look for outliers.

6. **Key signal extraction is a prioritization signal for agents.** Pre-extracted signals tell the model "these are the important things" — effectively a form of soft attention.

7. **Noise reduction is hard to measure.** We report 0.85 as a constant, but in practice it varies wildly by input quality. Future work should make this metric real.

8. **The ContextPack should never contain raw input.** Always normalize first. The model should never have to parse URLs or extract text from HTML.

9. **Resume parsing with regex is a maintenance burden.** Every new resume format requires a new pattern. Consider a dedicated resume parser for production scale.

10. **Timestamp every context pack.** Context staleness affects agent behavior. A profile cached for 6 months may have different data than current reality.
