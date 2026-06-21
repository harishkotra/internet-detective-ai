import {
  Search,
  Sparkles,
  Radar,
  Speech,
  Lightbulb,
  TrendingUp,
  Skull,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
}

const features: Feature[] = [
  {
    icon: Search,
    title: "Digital Profile Summary",
    description:
      "A distilled overview of your entire internet presence — from LinkedIn to GitHub to the dark corners of your Twitter likes.",
    badge: "Facts",
  },
  {
    icon: Radar,
    title: "Strong Signal Detection",
    description:
      "We find the patterns you didn't know you were broadcasting. Career hopping? Obsessive midnight commits? It's all in the data.",
    badge: "Signals",
  },
  {
    icon: Sparkles,
    title: "Hidden Obsessions",
    description:
      "What topic do you keep circling back to? AI, crypto, productivity porn? We quantify your secret fixations.",
    badge: "Obsessions",
  },
  {
    icon: Speech,
    title: "Coworker Quotes",
    description:
      "The things your colleagues would say about you at happy hour. Generated with painful accuracy.",
    badge: "Quotes",
  },
  {
    icon: Lightbulb,
    title: "Startup Parody",
    description:
      "We generate a fake startup based entirely on your personality. Includes funding stage, business model, and likely failure cause.",
    badge: "Parody",
  },
  {
    icon: TrendingUp,
    title: "Career Prediction",
    description:
      "Where are you headed in 5 years? Our AI predicts your next role, industry direction, and leadership potential.",
    badge: "Prediction",
  },
  {
    icon: Skull,
    title: "Brutal Roast",
    description:
      "The main event. A multi-category roast that spares no aspect of your internet identity. You asked for this.",
    badge: "Roast",
  },
  {
    icon: Zap,
    title: "Internet Persona Scores",
    description:
      "Five dimensions: Builder, Operator, Creator, Founder, Chaos. See where you rank on the spectrum of internet archetypes.",
    badge: "Scores",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative w-full px-4 py-24">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-white/10 text-xs text-white/50"
          >
            Full Investigation Report
          </Badge>
          <h2 className="text-gradient text-3xl font-bold tracking-tight sm:text-4xl">
            Every angle. No mercy.
          </h2>
          <p className="mt-3 text-white/40">
            Your report covers 8 sections of brutally honest analysis.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.06]"
              >
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10">
                    <Icon className="size-4 text-white/60" />
                  </div>
                  <CardTitle className="text-sm font-medium text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-white/35">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="secondary"
                    className="bg-white/5 text-[10px] text-white/40"
                  >
                    {feature.badge}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
