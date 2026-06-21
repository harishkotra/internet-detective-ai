"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/traces", label: "Traces" },
  { href: "/dashboard/prompts", label: "Prompts" },
  { href: "/dashboard/evaluations", label: "Evaluations" },
  { href: "/dashboard/costs", label: "Costs" },
  { href: "/dashboard/models", label: "Models" },
  { href: "/dashboard/governance", label: "Governance" },
  { href: "/dashboard/safety", label: "Safety" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            D
          </span>
          <span className="hidden sm:inline">Developer Dashboard</span>
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
