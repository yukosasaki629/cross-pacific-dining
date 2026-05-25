import type { AIProvider, AICompletionRequest, AICompletionResult } from "./provider";

// MockProvider returns a deterministic, rule-based extraction so the system is
// fully usable offline. It never makes a network call and never sees more than
// the text you paste into it.
//
// The mock looks at the agent name embedded in the system prompt to decide
// which JSON shape to return. The agent definitions (see ./agents) call this
// directly via the `extract*` helpers below, so the mock branches by the
// `agentTag` string they pass in their `system` prompts.

const META_TAG = /\[AGENT:(\w+)\]/;

export const mockProvider: AIProvider = {
  name: "mock",
  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const tag = req.system.match(META_TAG)?.[1] ?? "Unknown";
    const text = JSON.stringify(extract(tag, req.user), null, 2);
    return { provider: "mock", model: "rule-based-v1", text };
  },
};

function extract(agent: string, input: string): unknown {
  switch (agent) {
    case "MeetingNoteAgent":
      return extractMeeting(input);
    case "PriorityAgent":
      return extractPriorities(input);
    case "ActionTrackingAgent":
      return extractActions(input);
    case "DecisionAgent":
      return extractDecisions(input);
    case "RiskBottleneckAgent":
      return extractRisks(input);
    case "WeeklyBriefAgent":
      return { brief: "(weekly brief is composed deterministically by the brief generator)" };
    case "FrictionAnalysisAgent":
      return { patterns: [] };
    default:
      return { note: "Unknown agent — mock provider returned empty payload." };
  }
}

// -----------------------------------------------------------------------------
// Heuristics. Conservative on purpose — the human reviews every output.
// -----------------------------------------------------------------------------

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-\*•]+/, "").trim())
    .filter(Boolean);
}

function sentences(input: string): string[] {
  return input
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const ACTION_VERBS = [
  "will",
  "to do",
  "todo",
  "action",
  "follow up",
  "follow-up",
  "send",
  "draft",
  "review",
  "schedule",
  "prepare",
  "confirm",
  "share",
  "set up",
  "build",
  "deliver",
  "ship",
  "complete",
  "owns",
  "owner:",
  "next step",
];
const DECISION_VERBS = [
  "decided",
  "decision:",
  "approved",
  "agreed",
  "we will go with",
  "selected",
  "chose",
  "endorsed",
  "rejected",
];
const QUESTION_VERBS = ["?", "open question", "tbd", "to be decided", "unclear"];
const RISK_VERBS = ["risk", "concern", "blocker", "blocked", "delay", "behind", "issue"];
const ESCALATION_VERBS = ["escalate", "needs ceo", "ceo decision", "requires approval"];

function classify(line: string): Set<string> {
  const tags = new Set<string>();
  const l = line.toLowerCase();
  if (ACTION_VERBS.some((v) => l.includes(v))) tags.add("action");
  if (DECISION_VERBS.some((v) => l.includes(v))) tags.add("decision");
  if (QUESTION_VERBS.some((v) => l.includes(v))) tags.add("question");
  if (RISK_VERBS.some((v) => l.includes(v))) tags.add("risk");
  if (ESCALATION_VERBS.some((v) => l.includes(v))) tags.add("escalation");
  return tags;
}

function guessOwner(line: string): string | null {
  const m =
    line.match(/owner[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/) ||
    line.match(/\(([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\)/) ||
    line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?):/);
  return m ? m[1] : null;
}

function guessUrgency(line: string): "High" | "Medium" | "Low" {
  const l = line.toLowerCase();
  if (/urgent|asap|today|tomorrow|by eod|critical/.test(l)) return "High";
  if (/this week|by friday|soon/.test(l)) return "Medium";
  return "Medium";
}

function extractMeeting(input: string) {
  const lines = splitLines(input);
  const sents = sentences(input);
  const summary =
    sents.slice(0, 3).join(" ") ||
    "(Mock summary — paste richer notes to see better extraction, or enable an AI provider in Settings.)";

  const actionItems: any[] = [];
  const decisions: any[] = [];
  const decisionsNeeded: any[] = [];
  const risks: any[] = [];
  const openQuestions: string[] = [];
  const followUps: string[] = [];

  for (const line of lines) {
    const tags = classify(line);
    if (tags.has("action")) {
      actionItems.push({
        description: line,
        owner: guessOwner(line),
        urgency: guessUrgency(line),
      });
    }
    if (tags.has("decision")) {
      decisions.push({ title: line, rationale: null });
    }
    if (tags.has("question") || (line.endsWith("?") && line.length > 6)) {
      openQuestions.push(line);
      if (tags.has("escalation")) {
        decisionsNeeded.push({
          title: line,
          recommendation: null,
          impactIfDelayed: null,
        });
      }
    }
    if (tags.has("risk")) {
      risks.push({ description: line, severity: "Medium" });
    }
    if (line.toLowerCase().startsWith("follow up") || line.toLowerCase().startsWith("follow-up")) {
      followUps.push(line);
    }
  }

  const relatedDepartments = Array.from(
    new Set(
      ["HR", "IT", "Finance", "Marketing", "Operations", "Legal", "Construction", "Japan HQ"].filter(
        (d) => new RegExp(`\\b${d}\\b`, "i").test(input),
      ),
    ),
  );

  return {
    summary,
    actionItems,
    decisions,
    decisionsNeeded,
    openQuestions,
    risks,
    followUps,
    relatedDepartments,
    suggestedNextSteps: actionItems.slice(0, 3).map((a) => a.description),
    recurringThemes: [],
  };
}

function extractPriorities(input: string) {
  const lines = splitLines(input);
  const suggestions = lines
    .filter((l) => /priority|strategic|focus|initiative|must|critical/i.test(l))
    .slice(0, 5)
    .map((l) => ({ name: l.slice(0, 80), level: "High", status: "On Track" }));
  return { suggestedPriorities: suggestions, priorityShifts: [], emergingPriorities: [] };
}

function extractActions(input: string) {
  const m = extractMeeting(input);
  return { newActionItems: m.actionItems, updates: [], overdueWarnings: [] };
}

function extractDecisions(input: string) {
  const m = extractMeeting(input);
  return {
    decisionsMade: m.decisions,
    decisionsNeeded: m.decisionsNeeded,
    unresolvedIssues: m.openQuestions,
  };
}

function extractRisks(input: string) {
  const m = extractMeeting(input);
  return { risks: m.risks, blockers: [], dependencies: [], escalationSuggestions: [] };
}
