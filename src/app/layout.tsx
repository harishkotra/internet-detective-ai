import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "./posthog-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Internet Detective AI - We Analyzed Your Entire Internet Personality",
  description:
    "Paste your LinkedIn, GitHub, Twitter — get a brutally honest AI investigation of your entire internet personality.",
  openGraph: {
    title: "Internet Detective AI",
    description:
      "We analyzed your entire internet personality. Paste your profile. Get roasted.",
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
