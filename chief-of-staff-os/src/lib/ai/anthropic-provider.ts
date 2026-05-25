import type { AIProvider, AICompletionRequest, AICompletionResult } from "./provider";

// Anthropic provider — OPT-IN ONLY.
// Activates only when AI_PROVIDER="anthropic" AND ANTHROPIC_API_KEY is set.
// All requests are sent to api.anthropic.com. Do not enable unless your
// company policy allows sending executive content to a third-party AI vendor.

const ENDPOINT = "https://api.anthropic.com/v1/messages";

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
    if (!apiKey) {
      throw new Error(
        "Anthropic provider selected but ANTHROPIC_API_KEY is not set. Edit .env or switch to AI_PROVIDER=mock in Settings.",
      );
    }
    const system =
      req.system +
      (req.jsonSchemaHint
        ? `\n\nReturn ONLY a single JSON object that matches this shape:\n${req.jsonSchemaHint}\nNo prose, no markdown fences.`
        : "");

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: req.temperature ?? 0.2,
        system,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${errorText.slice(0, 500)}`);
    }
    const data = (await res.json()) as { content?: { type: string; text: string }[] };
    const text =
      data.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n") ?? "";
    return { provider: "anthropic", model, text };
  },
};
