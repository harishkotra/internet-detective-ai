"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface PromptItem {
  agentType: string;
  agentLabel: string;
  content: string;
  version: string;
  loadedAt: string;
}

const COLORS: Record<string, string> = {
  profile_analyst: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  signal_detector: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  career_predictor: "bg-green-500/10 text-green-500 border-green-500/20",
  startup_generator: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  roast_agent: "bg-red-500/10 text-red-500 border-red-500/20",
  governance_agent: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  final_synthesis: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

function highlightSyntax(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => {
    let html = line
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="text-green-400">$1</span>')
      .replace(
        /(\b(true|false|null|undefined)\b)/g,
        '<span class="text-blue-400">$1</span>',
      )
      .replace(
        /(\b\d+(?:\.\d+)?\b)/g,
        '<span class="text-yellow-400">$1</span>',
      )
      .replace(/(:\s*)(\w+)/g, '$1<span class="text-orange-300">$2</span>')
      .replace(/{/g, '<span class="text-muted-foreground">{</span>')
      .replace(/}/g, '<span class="text-muted-foreground">}</span>');
    return (
      <span key={i}>
        <span className="mr-4 inline-block w-8 text-right text-[10px] text-muted-foreground select-none">
          {i + 1}
        </span>
        <span dangerouslySetInnerHTML={{ __html: html || " " }} />
        {"\n"}
      </span>
    );
  });
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((res) => setPrompts(res.prompts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading prompts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
        <p className="text-sm text-muted-foreground">
          System prompts for all agent types — version{" "}
          {prompts[0]?.version || "—"}
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No prompts loaded yet
        </div>
      ) : (
        prompts.map((prompt) => (
          <div key={prompt.agentType} className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{prompt.agentLabel}</span>
                <Badge
                  variant="outline"
                  className={`border text-[10px] ${COLORS[prompt.agentType] || ""}`}
                >
                  {prompt.agentType}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  v{prompt.version}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleCopy(prompt.content, prompt.agentType)}
              >
                {copied === prompt.agentType ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <pre className="overflow-auto p-4 text-xs leading-relaxed">
              <code>{highlightSyntax(prompt.content)}</code>
            </pre>
          </div>
        ))
      )}
    </div>
  );
}
