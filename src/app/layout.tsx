import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "./posthog-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Internet Detective AI — AI-Powered Personality Investigation Report",
  description:
    "Paste your LinkedIn, GitHub, Twitter, or resume. Our AI analyzes your online footprint and generates a detailed personality report with career predictions, personality scores, and more.",
  openGraph: {
    title: "Internet Detective AI",
    description:
      "Get an AI-generated personality investigation report from your online profiles.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Suspense fallback={null}>
          <PostHogProvider>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
