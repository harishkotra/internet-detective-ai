"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InvestigationReport, InternetPersonalityScores } from "@/lib/types";

function ScoresPreview({ scores }: { scores: InternetPersonalityScores }) {
  const items = [
    { label: "Builder", value: scores.builderScore, color: "bg-blue-400" },
    { label: "Operator", value: scores.operatorScore, color: "bg-emerald-400" },
    { label: "Creator", value: scores.creatorScore, color: "bg-purple-400" },
    { label: "Founder", value: scores.founderScore, color: "bg-amber-400" },
    { label: "Chaos", value: scores.chaosScore, color: "bg-red-400" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`size-2 rounded-full ${item.color}`} />
          <span className="text-[10px] text-white/30">{item.label}</span>
          <span className="text-[10px] text-white/50 tabular-nums font-medium">
            {item.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function ShareButtons({ report }: { report: InvestigationReport }) {
  const [copied, setCopied] = useState(false);

  const reportUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/investigation/${report.id}`
      : "";

  const shareText = `🔍 I just got investigated by Internet Detective AI\n\n${report.cookedLevel} — "${report.finalVerdict}"\n\nSee your own report at:`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(reportUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = reportUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="space-y-4 pb-16">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-white/5">
          <svg
            className="size-3.5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>
        </div>
        <h2 className="text-sm font-medium text-white/60">Share Your Report</h2>
      </div>

      <Card className="border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent transition-all hover:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-fit items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3">
              <Badge
                variant="outline"
                className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400"
              >
                {report.cookedLevel}
              </Badge>
              <ScoresPreview scores={report.personalityScores} />
            </div>
          </CardTitle>
        </CardHeader>

        <Separator className="bg-white/5" />

        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="border-white/10 text-xs text-white/50 hover:bg-white/5 hover:text-white/70"
            >
              {copied ? (
                <>
                  <svg
                    className="size-3.5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="size-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                  Copy Report Link
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(twitterUrl, "_blank", "noopener,noreferrer")
              }
              className="border-white/10 text-xs text-white/50 hover:bg-white/5 hover:text-white/70"
            >
              <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="border-white/10 text-xs text-white/50 hover:bg-white/5 hover:text-white/70"
            >
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                />
              </svg>
              Print / Save PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
