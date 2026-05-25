import { cn } from "@/lib/utils";

function colorFor(value: string): string {
  switch (value) {
    case "順調":
    case "判断済":
    case "完了":
    case "解消":
      return "bg-ok-50 text-ok-700";
    case "注意":
    case "進行中":
    case "対応中":
    case "検討中":
    case "中":
      return "bg-warn-50 text-warn-700";
    case "遅延":
    case "ブロック":
    case "未対応":
    case "高":
      return "bg-bad-50 text-bad-700";
    case "停止中":
    case "待機中":
    case "中止":
      return "bg-ink-100 text-ink-600";
    case "低":
      return "bg-ok-50 text-ok-700";
    default:
      return "bg-ink-100 text-ink-700";
  }
}

export function Pill({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <span className="pill bg-ink-100 text-ink-500">—</span>;
  return <span className={cn("pill", colorFor(value), className)}>{value}</span>;
}

export function Dot({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const c =
    value === "高" || value === "遅延" || value === "未対応" || value === "ブロック"
      ? "bg-bad-600"
      : value === "中" || value === "注意" || value === "対応中" || value === "進行中" || value === "検討中"
        ? "bg-warn-600"
        : value === "低" || value === "順調" || value === "完了" || value === "判断済" || value === "解消"
          ? "bg-ok-600"
          : "bg-ink-400";
  return <span className={cn("inline-block h-2 w-2 rounded-full", c)} aria-hidden />;
}
