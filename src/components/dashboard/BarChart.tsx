"use client";

import { cn } from "@/lib/utils";

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  className?: string;
  maxHeight?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export function BarChart({
  data,
  className,
  maxHeight = 200,
  showValues = true,
  horizontal = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-24 shrink-0 truncate text-right text-xs text-muted-foreground"
              title={item.label}
            >
              {item.label}
            </span>
            <div className="flex flex-1 items-center gap-1.5">
              <div
                className="h-5 min-w-[4px] rounded-sm transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || "var(--chart-1)",
                }}
              />
              {showValues && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatValue(item.value)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-end gap-1", className)}
      style={{ height: maxHeight }}
    >
      {data.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 flex-col items-center gap-1"
        >
          {showValues && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatValue(item.value)}
            </span>
          )}
          <div
            className="w-full rounded-sm transition-all duration-500"
            style={{
              height: `${(item.value / maxValue) * (maxHeight - 20)}px`,
              backgroundColor: item.color || "var(--chart-1)",
            }}
          />
          <span
            className="max-w-16 truncate text-[10px] text-muted-foreground"
            title={item.label}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(2);
  return value.toFixed(1);
}
