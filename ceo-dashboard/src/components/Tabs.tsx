"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Tab = {
  key: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
};

export function Tabs({ tabs, initial }: { tabs: Tab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div>
      <div className="sticky top-[57px] z-10 -mx-3 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition active:scale-[0.98]",
                active === t.key
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100",
              )}
            >
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 ? (
                <span
                  className={cn(
                    "ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px]",
                    active === t.key ? "bg-white/20 text-white" : "bg-ink-200 text-ink-700",
                  )}
                >
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="py-4">{current?.content}</div>
    </div>
  );
}
