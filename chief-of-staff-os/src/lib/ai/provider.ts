// AIProvider is the only seam between the Chief of Staff OS and any LLM.
// Implementations live in `mock-provider.ts` and `anthropic-provider.ts`.
// To add OpenAI / a local model, add another file and register it in `index.ts`.

export interface AICompletionRequest {
  system: string;
  user: string;
  jsonSchemaHint?: string; // human-readable schema description appended to the system prompt
  temperature?: number;
}

export interface AICompletionResult {
  provider: "mock" | "anthropic";
  model: string;
  text: string;
}

export interface AIProvider {
  name: "mock" | "anthropic";
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}
