"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Code2,
  Briefcase,
  Globe,
  FileText,
  AlignLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormFields {
  linkedinUrl: string;
  githubUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  resumeText: string;
  rawProfileText: string;
}

export function InvestigationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FormFields>({
    linkedinUrl: "",
    githubUrl: "",
    twitterUrl: "",
    websiteUrl: "",
    resumeText: "",
    rawProfileText: "",
  });

  const updateField = (key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const hasAnyInput = Object.values(fields).some((v) => v.trim().length > 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasAnyInput) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {};
      for (const [key, val] of Object.entries(fields)) {
        if (val.trim()) body[key] = val.trim();
      }

      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Investigation failed");
      }

      const data = await res.json();
      router.push(`/investigation/${data.report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section
      id="investigation-form"
      className="relative flex w-full justify-center px-4 py-24"
    >
      <Card className="relative z-10 w-full max-w-2xl border-white/10 bg-white/[0.02]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <SearchIcon className="size-4 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold text-white">
              Start Investigation
            </CardTitle>
          </div>
          <CardDescription className="text-white/40">
            Paste at least one profile link or some text. The more you provide,
            the deeper the roast.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                icon={<Briefcase className="size-4 shrink-0 text-white/40" />}
                placeholder="LinkedIn URL (optional)"
                value={fields.linkedinUrl}
                onChange={(v) => updateField("linkedinUrl", v)}
              />
              <InputField
                icon={<Code2 className="size-4 shrink-0 text-white/40" />}
                placeholder="GitHub URL (optional)"
                value={fields.githubUrl}
                onChange={(v) => updateField("githubUrl", v)}
              />
              <InputField
                icon={<AtSign className="size-4 shrink-0 text-white/40" />}
                placeholder="X / Twitter URL (optional)"
                value={fields.twitterUrl}
                onChange={(v) => updateField("twitterUrl", v)}
              />
              <InputField
                icon={<Globe className="size-4 shrink-0 text-white/40" />}
                placeholder="Personal Website (optional)"
                value={fields.websiteUrl}
                onChange={(v) => updateField("websiteUrl", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <FileText className="size-3.5" />
                Resume / Bio Text
              </div>
              <Textarea
                placeholder="Paste your resume, bio, or about me..."
                className="min-h-[80px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
                value={fields.resumeText}
                onChange={(e) => updateField("resumeText", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <AlignLeft className="size-3.5" />
                Raw Profile Data
              </div>
              <Textarea
                placeholder="Paste raw profile text, social media dumps, or any other data..."
                className="min-h-[80px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25"
                value={fields.rawProfileText}
                onChange={(e) => updateField("rawProfileText", e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!hasAnyInput || loading}
              size="lg"
              className="h-11 w-full cursor-pointer rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-30"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Investigating...
                </>
              ) : (
                <>
                  Investigate Me
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-white/30">
      {icon}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/25 focus-visible:ring-0"
      />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
