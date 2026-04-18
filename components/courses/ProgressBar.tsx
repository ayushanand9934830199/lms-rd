"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface ProgressBarProps {
  value: number;   // 0–100
  className?: string;
  showLabel?: boolean;
  height?: "thin" | "default";
}

export default function ProgressBar({
  value,
  className,
  showLabel = false,
  height = "default",
}: ProgressBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate on mount
    const el = fillRef.current;
    if (!el) return;
    el.style.width = "0%";
    const raf = requestAnimationFrame(() => {
      el.style.width = `${Math.min(100, Math.max(0, value))}%`;
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 bg-rd-border rounded-full overflow-hidden",
          height === "thin" ? "h-1" : "h-1.5"
        )}
      >
        <div
          ref={fillRef}
          className="h-full bg-rd-accent rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-rd-muted shrink-0 w-9 text-right">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
