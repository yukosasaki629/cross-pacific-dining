import { cn } from "@/lib/utils/cn";
import {
  labelFor,
  PRIORITY_LEVEL_LABELS,
  PRIORITY_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  DECISION_NEEDED_STATUS_LABELS,
} from "@/lib/labels";

const RISK_KEYWORDS = ["risk", "at risk"];
const DANGER_KEYWORDS = ["blocked", "delayed", "overdue"];
const SUCCESS_KEYWORDS = ["completed", "on track", "decided", "resolved"];

function classify(value: string): "low" | "med" | "high" | "base" {
  const v = value.toLowerCase();
  if (DANGER_KEYWORDS.some((k) => v.includes(k))) return "high";
  if (RISK_KEYWORDS.some((k) => v.includes(k))) return "med";
  if (SUCCESS_KEYWORDS.some((k) => v.includes(k))) return "low";
  return "base";
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="badge">—</span>;
  // Combine all status dicts so any internal value resolves to its Japanese label.
  const merged = {
    ...PRIORITY_STATUS_LABELS,
    ...ACTION_STATUS_LABELS,
    ...PROJECT_STATUS_LABELS,
    ...DECISION_NEEDED_STATUS_LABELS,
  };
  const label = labelFor(value, merged);
  const kind = classify(value);
  const cls =
    kind === "high"
      ? "badge-risk-high"
      : kind === "med"
        ? "badge-risk-med"
        : kind === "low"
          ? "badge-risk-low"
          : "badge";
  return <span className={cls}>{label}</span>;
}

export function LevelBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="badge">—</span>;
  const label = labelFor(value, PRIORITY_LEVEL_LABELS);
  const v = value.toLowerCase();
  const cls =
    v === "high" ? "badge-risk-high" : v === "medium" ? "badge-risk-med" : "badge-risk-low";
  return <span className={cls}>{label}</span>;
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("badge", className)}>{children}</span>;
}
