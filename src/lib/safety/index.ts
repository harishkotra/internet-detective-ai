import { SafetyCheck, SafetyThreat } from "../types";

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|prompts|commands|rules)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|prompts)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|prompts)/i,
  /system\s+prompt\s*:/i,
  /you\s+are\s+(now|free|no\s+longer|not)\s+(an?\s+)?(AI|assistant|chatbot|model|bot)/i,
  /act\s+as\s+(if\s+you\s+are|you\s+are|an?\s+)?(human|person|real|actual)/i,
  /new\s+(instructions|prompt|command|rule|directive)\s*:/i,
  /override\s+(system|default|standard|all)\s+(prompt|instruction|configuration)/i,
  /you\s+must\s+(obey|follow|listen|respond)\s+(to\s+)?(only|exclusively)\s+(this|these|my)/i,
  /print\s+(the\s+)?(system|above|initial|default)\s+(prompt|instructions|text)/i,
  /output\s+(the\s+)?(system|above|initial|default)\s+(prompt|instructions|text)/i,
  /show\s+(me\s+)?(the\s+)?(system|above|initial|default)\s+(prompt|instructions|text)/i,
  /repeat\s+(the\s+)?(words|text|prompt|instruction|above|initial|system)/i,
  /pretend\s+(that\s+)?(you\s+are|you\s+can|we\s+are|this\s+is)/i,
  /simulate\s+(a\s+)?(jailbreak|bypass|breach|hack|admin|root)/i,
];

const JAILBREAK_PATTERNS: RegExp[] = [
  /\bDAN\b/i,
  /do\s+anything\s+now/i,
  /jail\s*break/i,
  /jailbroken/i,
  /developer\s+mode/i,
  /dev\s*Mode\s*v2/i,
  /super\s+prompt/i,
  /prompt\s+injection\s+(test|challenge|attempt)/i,
  /hypothetical:\s+(scenario|situation)\s+(where|in\s+which)\s+(there\s+are\s+no\s+)?(restrictions|limits|rules|boundaries)/i,
  /fictional\s+(world|setting|universe|scenario)\s+(where|in\s+which)\s+(there\s+are\s+no\s+)?(restrictions|limits|rules|boundaries)/i,
  /roleplay\s+(as|a)\s+(an?\s+)?(evil|malicious|harmful|dangerous|unethical)/i,
  /(you\s+)?(have\s+)?no\s+(rules|limits|restrictions|boundaries|filter|guardrails)/i,
  /you\s+(can|could|will)\s+(say|do|write|produce|generate)\s+(anything|whatever|everything)/i,
  /bypass\s+(your\s+)?(safety|security|content\s+policy|filter|moderation|restrictions|guardrails)/i,
  /remove\s+(your\s+)?(filter|restrictions|guardrails|moderation|safety)/i,
  /unfiltered/i,
  /unsafe\s+(mode|content|response|output)/i,
  /ethical\s+(bypass|override|disable|turn\s+off)/i,
  /turn\s+off\s+(your\s+)?(ethics|morals|values|principles|guidelines|policy)/i,
];

const PII_PATTERNS: {
  type: string;
  pattern: RegExp;
  severity: "low" | "medium" | "high";
}[] = [
  {
    type: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    severity: "medium",
  },
  {
    type: "phone",
    pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    severity: "medium",
  },
  { type: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/, severity: "high" },
  {
    type: "credit_card",
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
    severity: "high",
  },
  {
    type: "ip_address",
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
    severity: "low",
  },
  {
    type: "street_address",
    pattern:
      /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b/i,
    severity: "medium",
  },
  { type: "passport", pattern: /\b[A-Z]\d{8}\b/, severity: "high" },
  {
    type: "date_of_birth",
    pattern:
      /\b(?:birth\s*(?:date|day)|DOB|date\s+of\s+birth)\s*[:]?\s*\d{1,2}[\s/-]\d{1,2}[\s/-]\d{2,4}\b/i,
    severity: "medium",
  },
];

const TOXICITY_PATTERNS: RegExp[] = [
  /\b(you're|you\s+are)\s+(a|an)\s+(idiot|moron|loser|failure|stupid|dumb|trash|garbage|pathetic|worthless|useless)\b/i,
  /\b(fuck\s+(you|off)|go\s+(to\s+)?hell|screw\s+you|kiss\s+my\s+ass|bite\s+me|eat\s+shit)\b/i,
  /\b(die|kill\s+(yourself|you)|hurt\s+yourself|harm\s+yourself)\b/i,
  /\b(hate\s+(speech|crime|group|mongering)|racial\s+slur|ethnic\s+slur)\b/i,
  /(nazi|supremacist|white\s+supremacy)\b/i,
];

const SENSITIVE_ATTRIBUTE_PATTERNS: { type: string; pattern: RegExp }[] = [
  {
    type: "race",
    pattern:
      /\b(this\s+person|they|he|she)\s+(is|seems|appears|looks|identifies\s+as)\s+(black|white|asian|hispanic|caucasian|african\s+american)\b/i,
  },
  {
    type: "religion",
    pattern:
      /\b(this\s+person|they|he|she)\s+(is|practices|follows|believes\s+in)\s+(christianity|islam|hinduism|buddhism|judaism)\b/i,
  },
  {
    type: "political",
    pattern:
      /\b(this\s+person|they|he|she)\s+(is|leans|votes|supports|identifies\s+as)\s+(democrat|republican|liberal|conservative|socialist)\b/i,
  },
  {
    type: "sexual_orientation",
    pattern:
      /\b(this\s+person|they|he|she)\s+(is|identifies\s+as)\s+(gay|lesbian|bisexual|straight|queer)\b/i,
  },
  {
    type: "health",
    pattern:
      /\b(this\s+person|they|he|she)\s+(has|suffers\s+from|was\s+diagnosed\s+with|struggles\s+with)\b/i,
  },
  {
    type: "income",
    pattern:
      /\b(their\s+)?(salary|income|net\s+worth)\s+is\s+\$?\d{2,6}[k]?\b/i,
  },
];

export class SafetyChecker {
  checkPrompt(input: string): SafetyCheck {
    const threats: SafetyThreat[] = [];

    const injectionThreat = this.detectPromptInjection(input);
    if (injectionThreat) threats.push(injectionThreat);

    const jailbreakThreat = this.detectJailbreak(input);
    if (jailbreakThreat) threats.push(jailbreakThreat);

    const piiThreats = this.detectPII(input);
    threats.push(...piiThreats);

    return {
      passed: threats.length === 0,
      threats,
    };
  }

  checkOutput(output: string): SafetyCheck {
    const threats: SafetyThreat[] = [];

    const piiThreats = this.detectPII(output);
    threats.push(...piiThreats);

    const toxicityThreat = this.detectToxicity(output);
    if (toxicityThreat) threats.push(toxicityThreat);

    const sensitiveThreats = this.detectSensitiveAttributes(output);
    threats.push(...sensitiveThreats);

    return {
      passed: threats.length === 0,
      threats,
    };
  }

  private detectPromptInjection(text: string): SafetyThreat | null {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return {
          type: "prompt_injection",
          severity: "high",
          detail: `Prompt injection detected: "${match[0].trim()}"`,
          text: match[0],
        };
      }
    }
    return null;
  }

  private detectJailbreak(text: string): SafetyThreat | null {
    for (const pattern of JAILBREAK_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return {
          type: "jailbreak",
          severity: "high",
          detail: `Jailbreak attempt detected: "${match[0].trim()}"`,
          text: match[0],
        };
      }
    }
    return null;
  }

  private detectPII(text: string): SafetyThreat[] {
    const threats: SafetyThreat[] = [];
    for (const { type, pattern, severity } of PII_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        const unique = new Set(matches.map((m) => m.trim()));
        for (const match of unique) {
          threats.push({
            type: "pii",
            severity,
            detail: `PII detected: ${type} - "${match}"`,
            text: match,
          });
        }
      }
    }
    return threats;
  }

  private detectToxicity(text: string): SafetyThreat | null {
    for (const pattern of TOXICITY_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return {
          type: "toxicity",
          severity: "high",
          detail: `Toxic content detected: "${match[0].trim()}"`,
          text: match[0],
        };
      }
    }
    return null;
  }

  private detectSensitiveAttributes(text: string): SafetyThreat[] {
    const threats: SafetyThreat[] = [];
    for (const { type, pattern } of SENSITIVE_ATTRIBUTE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        threats.push({
          type: "sensitive_attribute",
          severity: "medium",
          detail: `Sensitive attribute referenced: ${type} - "${match[0].trim()}"`,
          text: match[0],
        });
      }
    }
    return threats;
  }
}

const PII_REDACTION_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: "[EMAIL REDACTED]",
  },
  {
    pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[PHONE REDACTED]",
  },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: "[CC REDACTED]" },
  { pattern: /\b[A-Z]\d{8}\b/g, replacement: "[PASSPORT REDACTED]" },
  {
    pattern:
      /\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Circle|Cir)\b/gi,
    replacement: "[ADDRESS REDACTED]",
  },
];

export function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of PII_REDACTION_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}
