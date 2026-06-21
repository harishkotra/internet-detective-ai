import {
  ProfileInput,
  NormalizedProfile,
  ContextPack,
  Education,
  WorkExperience,
  GithubRepo,
  GithubStats,
} from "../types";
import { ContextBuildError } from "../errors";

interface ExtractedLinkedIn {
  username?: string;
  displayName?: string;
  headline?: string;
  location?: string;
}

interface ExtractedGitHub {
  username?: string;
  repos?: GithubRepo[];
  stats?: GithubStats;
}

interface ExtractedTwitter {
  handle?: string;
  bio?: string;
}

export class ContextBuilder {
  async build(input: ProfileInput): Promise<ContextPack> {
    try {
      const normalized = await this.normalize(input);
      const summary = this.generateSummary(normalized);
      const keySignals = this.extractKeySignals(normalized);
      const compressedText = this.compressContent(normalized.rawText);
      const compressionRatio = this.calculateCompression(input, normalized);

      return {
        normalized: {
          ...normalized,
          rawText: compressedText,
        },
        summary,
        keySignals,
        compressionRatio,
        noiseReduction: 0.85,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ContextBuildError(
        `Failed to build context: ${error instanceof Error ? error.message : String(error)}`,
        { source: "ContextBuilder.build", cause: error },
      );
    }
  }

  private async normalize(input: ProfileInput): Promise<NormalizedProfile> {
    const linkedInData = this.extractLinkedIn(input);
    const gitHubData = await this.extractGitHub(input);
    const twitterData = this.extractTwitter(input);
    const resumeData = this.extractResume(input);

    const allEducation = this.deduplicateEducation([
      ...(linkedInData.education || []),
      ...(resumeData.education || []),
    ]);

    const allWorkExperience = this.deduplicateWorkExperience([
      ...(linkedInData.workExperience || []),
      ...(resumeData.workExperience || []),
    ]);

    const allSkills = this.deduplicateStrings([
      ...(linkedInData.skills || []),
      ...(resumeData.skills || []),
    ]);

    const rawTextParts: string[] = [];
    if (linkedInData.rawText) rawTextParts.push(linkedInData.rawText);
    if (gitHubData.rawText) rawTextParts.push(gitHubData.rawText);
    if (twitterData.rawText) rawTextParts.push(twitterData.rawText);
    if (resumeData.rawText) rawTextParts.push(resumeData.rawText);
    if (input.rawProfileText) rawTextParts.push(input.rawProfileText);

    return {
      displayName: linkedInData.displayName || gitHubData.displayName,
      headline: linkedInData.headline,
      bio: twitterData.bio || resumeData.bio,
      location: linkedInData.location,
      education: allEducation,
      workExperience: allWorkExperience,
      skills: allSkills,
      languages: this.deduplicateStrings([
        ...(linkedInData.languages || []),
        ...(resumeData.languages || []),
      ]),
      certifications: this.deduplicateStrings([
        ...(linkedInData.certifications || []),
        ...(resumeData.certifications || []),
      ]),
      githubRepos: gitHubData.repos || [],
      githubStats: gitHubData.stats || {
        totalRepos: 0,
        totalStars: 0,
        totalForks: 0,
        contributions: 0,
        topLanguages: [],
      },
      twitterBio: twitterData.bio,
      tweetTopics: twitterData.tweetTopics || [],
      websiteContent: input.websiteUrl
        ? `Website referenced: ${input.websiteUrl}`
        : undefined,
      rawText: rawTextParts.join("\n\n").trim(),
    };
  }

  private extractLinkedIn(
    input: ProfileInput,
  ): Partial<NormalizedProfile> & ExtractedLinkedIn {
    const result: Partial<NormalizedProfile> &
      ExtractedLinkedIn & {
        education: Education[];
        workExperience: WorkExperience[];
        skills: string[];
        languages: string[];
        certifications: string[];
        rawText: string;
      } = {
      education: [],
      workExperience: [],
      skills: [],
      languages: [],
      certifications: [],
      rawText: "",
    };

    if (!input.linkedinUrl) return result;

    const parsed = this.parseLinkedInUrl(input.linkedinUrl);
    result.username = parsed.username;
    result.rawText = `LinkedIn Profile: ${input.linkedinUrl}`;

    if (parsed.username) {
      const normalizedName = parsed.username
        .replace(/[-\d]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const nameParts = normalizedName.split(" ");
      if (nameParts.length >= 2) {
        result.displayName = nameParts
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ");
      } else {
        result.displayName =
          normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
      }
    }

    result.rawText += ` | Username: ${parsed.username || "unknown"}`;

    if (input.rawProfileText) {
      const lines = input.rawProfileText.split("\n");
      let currentSection = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const lower = trimmed.toLowerCase();
        if (lower.includes("experience") || lower.includes("work")) {
          currentSection = "experience";
          continue;
        }
        if (lower.includes("education")) {
          currentSection = "education";
          continue;
        }
        if (lower.includes("skill")) {
          currentSection = "skills";
          continue;
        }

        if (currentSection === "skills") {
          trimmed.split(/[,•|;]/).forEach((s) => {
            const skill = s.trim();
            if (skill && skill.length < 50) result.skills.push(skill);
          });
        } else if (currentSection === "education") {
          const eduMatch = trimmed.match(
            /^(.+?)\s*(?:\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/,
          );
          if (eduMatch) {
            result.education.push({
              institution: eduMatch[1].trim(),
              startYear: eduMatch[2] ? parseInt(eduMatch[2]) : undefined,
              endYear:
                eduMatch[3] && eduMatch[3].toLowerCase() !== "present"
                  ? parseInt(eduMatch[3])
                  : undefined,
            });
          }
        } else if (currentSection === "experience") {
          const expMatch = trimmed.match(
            /^(.+?)\s*(?:at|@|–|-)\s*(.+?)(?:\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/i,
          );
          if (expMatch) {
            result.workExperience.push({
              role: expMatch[1].trim(),
              company: expMatch[2].trim(),
              startDate: expMatch[3] || undefined,
              endDate:
                expMatch[4] && expMatch[4].toLowerCase() !== "present"
                  ? expMatch[4]
                  : undefined,
            });
          }
        }
      }
    }

    return result;
  }

  private async extractGitHub(input: ProfileInput): Promise<
    Partial<NormalizedProfile> &
      ExtractedGitHub & {
        repos: GithubRepo[];
        stats: GithubStats;
        rawText: string;
        displayName?: string;
      }
  > {
    const result: Partial<NormalizedProfile> &
      ExtractedGitHub & {
        repos: GithubRepo[];
        stats: GithubStats;
        rawText: string;
        displayName?: string;
      } = {
      repos: [],
      stats: {
        totalRepos: 0,
        totalStars: 0,
        totalForks: 0,
        contributions: 0,
        topLanguages: [],
      },
      rawText: "",
    };

    if (!input.githubUrl) return result;

    const parsed = this.parseGitHubUrl(input.githubUrl);
    result.username = parsed.username;
    result.rawText = `GitHub Profile: ${input.githubUrl}`;

    if (parsed.username) {
      result.displayName = parsed.username;
    }

    if (input.rawProfileText) {
      const repoBlocks = input.rawProfileText.split(/\n(?=\w)/);
      const langSet = new Set<string>();

      for (const block of repoBlocks) {
        const trimmed = block.trim();
        if (!trimmed || trimmed.startsWith("http")) continue;

        const repoMatch = trimmed.match(
          /^(.+?)(?:\s*[-–—]\s*(.+))?(?:\s*⭐\s*(\d+))?(?:\s*⑂\s*(\d+))?$/,
        );
        if (repoMatch) {
          const repo: GithubRepo = {
            name: repoMatch[1].trim(),
            description: repoMatch[2]?.trim(),
            stars: repoMatch[3] ? parseInt(repoMatch[3]) : 0,
            forks: repoMatch[4] ? parseInt(repoMatch[4]) : 0,
            topics: [],
            isFork: false,
          };

          const langMatch = trimmed.match(
            /\b(JavaScript|TypeScript|Python|Go|Rust|Java|Kotlin|Swift|C\+\+|C#|Ruby|PHP|Solidity|Move)\b/,
          );
          if (langMatch) {
            repo.language = langMatch[1];
            langSet.add(langMatch[1]);
          }

          result.repos.push(repo);
        }
      }

      result.stats = {
        totalRepos: result.repos.length,
        totalStars: result.repos.reduce((sum, r) => sum + r.stars, 0),
        totalForks: result.repos.reduce((sum, r) => sum + r.forks, 0),
        contributions: 0,
        topLanguages: Array.from(langSet),
      };
    }

    return result;
  }

  private extractTwitter(input: ProfileInput): Partial<NormalizedProfile> &
    ExtractedTwitter & {
      rawText: string;
      bio?: string;
      tweetTopics: string[];
    } {
    const result: Partial<NormalizedProfile> &
      ExtractedTwitter & {
        rawText: string;
        bio?: string;
        tweetTopics: string[];
      } = {
      rawText: "",
      tweetTopics: [],
    };

    if (!input.twitterUrl) return result;

    const parsed = this.parseTwitterUrl(input.twitterUrl);
    result.handle = parsed.handle;
    result.rawText = `X/Twitter: @${parsed.handle || "unknown"}`;

    if (input.rawProfileText) {
      const lines = input.rawProfileText.split("\n").filter((l) => l.trim());
      if (lines.length > 0) {
        result.bio = lines[0];
      }

      const topicKeywords = [
        "AI",
        "ML",
        "machine learning",
        "deep learning",
        "data science",
        "web3",
        "crypto",
        "blockchain",
        "smart contracts",
        "startup",
        "entrepreneur",
        "founder",
        "building",
        "design",
        "UI",
        "UX",
        "product",
        "devops",
        "infra",
        "backend",
        "frontend",
        "fullstack",
        "open source",
        "oss",
        "contributor",
        "writing",
        "blog",
        "content",
        "gaming",
        "game dev",
        "security",
        "infosec",
        "cybersecurity",
      ];

      const text = input.rawProfileText.toLowerCase();
      for (const topic of topicKeywords) {
        if (text.includes(topic.toLowerCase())) {
          result.tweetTopics.push(topic);
        }
      }
    }

    return result;
  }

  private extractResume(input: ProfileInput): Partial<NormalizedProfile> & {
    education: Education[];
    workExperience: WorkExperience[];
    skills: string[];
    languages: string[];
    certifications: string[];
    bio?: string;
    rawText: string;
  } {
    const result: Partial<NormalizedProfile> & {
      education: Education[];
      workExperience: WorkExperience[];
      skills: string[];
      languages: string[];
      certifications: string[];
      bio?: string;
      rawText: string;
    } = {
      education: [],
      workExperience: [],
      skills: [],
      languages: [],
      certifications: [],
      rawText: input.resumeText || "",
    };

    if (!input.resumeText) return result;

    const lines = input.resumeText.split("\n").filter((l) => l.trim());
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^(education|academic|university|college)/i.test(trimmed)) {
        currentSection = "education";
        continue;
      }
      if (/^(experience|work|employment|professional)/i.test(trimmed)) {
        currentSection = "experience";
        continue;
      }
      if (/^(skills|technologies|tech stack|competencies)/i.test(trimmed)) {
        currentSection = "skills";
        continue;
      }
      if (/^(languages)/i.test(trimmed)) {
        currentSection = "languages";
        continue;
      }
      if (/^(certifications|certs|licenses)/i.test(trimmed)) {
        currentSection = "certifications";
        continue;
      }
      if (/^(summary|profile|about|bio)/i.test(trimmed)) {
        currentSection = "summary";
        continue;
      }

      if (currentSection === "summary") {
        result.bio = (result.bio ? result.bio + " " : "") + trimmed;
        continue;
      }

      if (currentSection === "education") {
        const edu = this.parseEducationLine(trimmed);
        if (edu) result.education.push(edu);
        continue;
      }

      if (currentSection === "experience") {
        const exp = this.parseWorkLine(trimmed);
        if (exp) result.workExperience.push(exp);
        continue;
      }

      if (currentSection === "skills") {
        trimmed.split(/[,•|;/\n]+/).forEach((s) => {
          const skill = s.trim();
          if (skill && skill.length < 60) result.skills.push(skill);
        });
        continue;
      }

      if (currentSection === "languages") {
        trimmed.split(/[,•|;/\n]+/).forEach((l) => {
          const lang = l
            .trim()
            .replace(/\s*\(.*?\)\s*$/, "")
            .trim();
          if (lang) result.languages.push(lang);
        });
        continue;
      }

      if (currentSection === "certifications") {
        trimmed.split(/[,•|;/\n]+/).forEach((c) => {
          const cert = c.trim();
          if (cert) result.certifications.push(cert);
        });
        continue;
      }
    }

    return result;
  }

  private parseEducationLine(text: string): Education | null {
    const patterns = [
      /^(.+?)\s*[-–||]\s*(.+?)(?:\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/i,
      /^(.+?),\s*(.+?)(?:\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/i,
      /^(.+?)\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\)\s*$/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const edu: Education = {
          institution: match[1].trim(),
          degree: match[2] ? match[2].trim() : undefined,
          startYear: match[3] ? parseInt(match[3]) : undefined,
          endYear:
            match[4] && match[4].toLowerCase() !== "present"
              ? parseInt(match[4])
              : undefined,
        };

        const fieldMatch = text.match(/in\s+(.+?)(?:\s*[-–]|\s*\(|\s*$)/i);
        if (fieldMatch) edu.field = fieldMatch[1].trim();

        return edu;
      }
    }

    if (text.length > 3 && text.length < 100 && /[A-Z]/.test(text)) {
      return { institution: text };
    }

    return null;
  }

  private parseWorkLine(text: string): WorkExperience | null {
    const patterns = [
      /^(.+?)\s+(?:at|@|[-–|])\s+(.+?)(?:\s*\((\d{4}|\w+\s+\d{4})\s*(?:-|–|to)\s*(\d{4}|\w+\s+\d{4}|Present)\))?\s*$/i,
      /^(.+?)\s*[-–|]\s*(.+?)(?:\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/i,
      /^(.+?),\s*(.+?)(?:\s*\((\d{4})\s*(?:-|–|to)\s*(\d{4}|Present)\))?\s*$/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          role: match[1].trim(),
          company: match[2].trim(),
          startDate: match[3] || undefined,
          endDate:
            match[4] && match[4].toLowerCase() !== "present"
              ? match[4]
              : undefined,
        };
      }
    }

    return null;
  }

  private parseLinkedInUrl(url: string): { username?: string } {
    const patterns = [
      /linkedin\.com\/in\/([^/?#]+)/i,
      /linkedin\.com\/pub\/([^/?#]+)/i,
      /linkedin\.com\/school\/([^/?#]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { username: decodeURIComponent(match[1]).replace(/\/$/, "") };
      }
    }

    return {};
  }

  private parseGitHubUrl(url: string): { username?: string } {
    const pattern = /github\.com\/([^/?#]+)/i;
    const match = url.match(pattern);
    if (match) {
      return { username: match[1].replace(/\/$/, "") };
    }
    return {};
  }

  private parseTwitterUrl(url: string): { handle?: string } {
    const patterns = [/(?:twitter|x)\.com\/([^/?#]+)/i];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const handle = match[1].replace(/\/$/, "");
        return { handle: handle.startsWith("@") ? handle.slice(1) : handle };
      }
    }
    return {};
  }

  private generateSummary(profile: NormalizedProfile): string {
    const parts: string[] = [];

    if (profile.displayName) {
      parts.push(profile.displayName);
    }

    if (profile.headline) {
      parts.push(`— ${profile.headline}`);
    }

    const latestRole = profile.workExperience[0];
    if (latestRole) {
      parts.push(`Currently ${latestRole.role} at ${latestRole.company}`);
    }

    const totalExp = profile.workExperience.length;
    if (totalExp > 0) {
      const companies = profile.workExperience.map((w) => w.company).join(", ");
      parts.push(`${totalExp} position(s) including ${companies}`);
    }

    if (profile.education.length > 0) {
      const edu = profile.education[0];
      parts.push(
        `Educated at ${edu.institution}${edu.degree ? ` (${edu.degree})` : ""}`,
      );
    }

    if (profile.skills.length > 0) {
      const topSkills = profile.skills.slice(0, 8).join(", ");
      parts.push(`Skills: ${topSkills}`);
    }

    if (profile.githubRepos.length > 0) {
      const totalStars = profile.githubStats.totalStars;
      const topLang = profile.githubStats.topLanguages.join(", ");
      parts.push(
        `${profile.githubRepos.length} public repos${totalStars > 0 ? `, ${totalStars} stars` : ""}${topLang ? ` [${topLang}]` : ""}`,
      );
    }

    if (profile.githubStats.contributions > 0) {
      parts.push(
        `${profile.githubStats.contributions} contributions in the last year`,
      );
    }

    if (profile.twitterBio) {
      parts.push(`On X: ${profile.twitterBio}`);
    }

    if (profile.tweetTopics.length > 0) {
      parts.push(`Active in: ${profile.tweetTopics.slice(0, 5).join(", ")}`);
    }

    if (profile.languages.length > 0) {
      parts.push(`Speaks: ${profile.languages.join(", ")}`);
    }

    if (profile.certifications.length > 0) {
      parts.push(
        `Certifications: ${profile.certifications.slice(0, 3).join(", ")}`,
      );
    }

    return parts.join(". ") + ".";
  }

  private extractKeySignals(profile: NormalizedProfile): string[] {
    const signals: string[] = [];

    const totalYearsExp = this.estimateYearsExperience(profile);
    if (totalYearsExp > 0) {
      signals.push(`${totalYearsExp}+ years of professional experience`);
    }

    const leadershipRoles = profile.workExperience.filter((w) =>
      /(head|lead|senior|principal|staff|chief|director|manager|vp|vice president|founder|cto|ceo)/i.test(
        w.role,
      ),
    );
    if (leadershipRoles.length > 0) {
      signals.push(`Held ${leadershipRoles.length} leadership/ senior role(s)`);
    }

    const topCompanies = profile.workExperience.filter((w) =>
      /(google|meta|apple|amazon|microsoft|netflix|spotify|uber|airbnb|stripe|shopify|twitter|linkedin|salesforce|oracle|ibm|intel|nvidia|openai|anthropic)/i.test(
        w.company,
      ),
    );
    if (topCompanies.length > 0) {
      signals.push(
        `Worked at ${topCompanies.length} major tech company/companies`,
      );
    }

    if (profile.githubStats.totalStars > 100) {
      signals.push(
        `Popular open-source contributor (${profile.githubStats.totalStars}+ stars)`,
      );
    }
    if (profile.githubStats.totalRepos > 10) {
      signals.push(
        ` prolific repo creator (${profile.githubStats.totalRepos} repos)`,
      );
    }
    if (profile.githubStats.contributions > 500) {
      signals.push("Highly active GitHub contributor");
    }

    const trendingTopics = [
      "AI",
      "ML",
      "machine learning",
      "deep learning",
      "LLM",
      "large language model",
      "transformer",
      "web3",
      "crypto",
      "blockchain",
      "defi",
      "solidity",
      "rust",
      "wasm",
      "webassembly",
      "kubernetes",
      "k8s",
      "docker",
      "cloud native",
      "react",
      "next.js",
      "typescript",
      "fullstack",
      "data engineering",
      "data pipeline",
      "spark",
      "kafka",
    ];

    const textForTopics =
      profile.rawText.toLowerCase() + profile.skills.join(" ").toLowerCase();
    const matchedTopics = trendingTopics.filter((topic) =>
      textForTopics.includes(topic.toLowerCase()),
    );
    if (matchedTopics.length > 0) {
      signals.push(`Focus areas: ${matchedTopics.slice(0, 5).join(", ")}`);
    }

    const startupKeywords = [
      "founder",
      "co-founder",
      "startup",
      "entrepreneur",
    ];
    const isStartup = profile.workExperience.some((w) =>
      startupKeywords.some(
        (k) =>
          w.role.toLowerCase().includes(k) ||
          w.company.toLowerCase().includes(k),
      ),
    );
    if (isStartup) {
      signals.push("Startup/ founder background");
    }

    return signals;
  }

  private estimateYearsExperience(profile: NormalizedProfile): number {
    let totalYears = 0;
    for (const exp of profile.workExperience) {
      if (exp.startDate && exp.endDate) {
        const startYear = parseInt(exp.startDate);
        const endYear =
          exp.endDate.toLowerCase() === "present"
            ? new Date().getFullYear()
            : parseInt(exp.endDate);
        if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
          totalYears += endYear - startYear;
        }
      }
    }
    return totalYears || Math.round(profile.workExperience.length * 1.5);
  }

  private compressContent(text: string): string {
    if (!text || text.length < 500) return text;

    const lines = text.split("\n");
    const compressed: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      compressed.push(trimmed);
    }

    return compressed.join("\n");
  }

  private calculateCompression(
    input: ProfileInput,
    normalized: NormalizedProfile,
  ): number {
    const rawLength =
      (input.linkedinUrl?.length || 0) +
      (input.githubUrl?.length || 0) +
      (input.twitterUrl?.length || 0) +
      (input.websiteUrl?.length || 0) +
      (input.resumeText?.length || 0) +
      (input.rawProfileText?.length || 0);

    const normalizedLength = normalized.rawText.length;
    if (rawLength === 0) return 1;

    const ratio = normalizedLength / rawLength;
    return Math.round(Math.min(ratio, 1) * 100) / 100;
  }

  private deduplicateEducation(items: Education[]): Education[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.institution}|${item.degree}|${item.field}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateWorkExperience(items: WorkExperience[]): WorkExperience[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.company}|${item.role}`;
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
}
