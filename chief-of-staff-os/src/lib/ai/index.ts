import type { AIProvider } from "./provider";
import { mockProvider } from "./mock-provider";
import { anthropicProvider } from "./anthropic-provider";

export function getProvider(): AIProvider {
  const sel = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (sel === "anthropic") return anthropicProvider;
  return mockProvider;
}

export function providerInfo() {
  const sel = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  return {
    selected: sel,
    available: {
      mock: true,
      anthropic: hasKey,
    },
    model: sel === "anthropic" ? process.env.ANTHROPIC_MODEL || "claude-opus-4-7" : "rule-based-v1",
    notice:
      sel === "anthropic"
        ? "External AI is ENABLED. Meeting notes will be sent to Anthropic."
        : "Local mode. No meeting content leaves this machine.",
  };
}

export type { AIProvider } from "./provider";
