import { providerInfo } from "@/lib/ai";
import Link from "next/link";

export function ProviderBanner() {
  const info = providerInfo();
  const external = info.selected === "anthropic";
  return (
    <div
      className={
        external
          ? "border-b border-risk-high/30 bg-risk-high/5 px-8 py-2 text-xs text-risk-high"
          : "border-b border-ink-200 bg-ink-50/50 px-8 py-2 text-xs text-ink-500"
      }
    >
      <span className="font-medium">
        {external ? "External AI enabled" : "Local mode"}
      </span>
      <span className="mx-2 text-ink-300">·</span>
      <span>{info.notice}</span>
      <span className="mx-2 text-ink-300">·</span>
      <span>
        Provider: <code className="font-mono">{info.selected}</code> · Model:{" "}
        <code className="font-mono">{info.model}</code>
      </span>
      <span className="mx-2 text-ink-300">·</span>
      <Link href="/settings" className="link">
        Change in Settings
      </Link>
    </div>
  );
}
