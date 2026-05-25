import { cn } from "@/lib/utils/cn";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="badge">—</span>;
  const v = value.toLowerCase();
  const cls = v.includes("risk")
    ? "badge-risk-med"
    : v.includes("blocked") || v.includes("delayed") || v.includes("overdue")
      ? "badge-risk-high"
      : v.includes("completed") || v.includes("track") || v.includes("decided")
        ? "badge-risk-low"
        : "badge";
  return <span className={cls}>{value}</span>;
}

export function LevelBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="badge">—</span>;
  const v = value.toLowerCase();
  const cls =
    v === "high" ? "badge-risk-high" : v === "medium" ? "badge-risk-med" : "badge-risk-low";
  return <span className={cls}>{value}</span>;
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("badge", className)}>{children}</span>;
}
