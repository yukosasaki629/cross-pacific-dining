// Agent definitions. Each agent has:
//   - a tagged system prompt (the tag `[AGENT:Name]` is read by the mock provider)
//   - a JSON schema hint (passed to the AI for structured output)
//   - a Zod schema for parsing the response
//   - a `run` function that calls the configured provider and returns parsed output
//
// All outputs are saved to AgentOutput for audit, and require human review
// before they touch any structured table.

import { z } from "zod";
import { getProvider } from "../index";
import { prisma } from "@/lib/db";

function safeJson<S extends z.ZodTypeAny>(
  text: string,
  schema: S,
): { ok: true; data: z.output<S> } | { ok: false; error: string; raw: string } {
  let cleaned = text.trim();
  // Strip code fences if a model decided to add them anyway.
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const result = schema.safeParse(parsed);
    if (!result.success) return { ok: false, error: result.error.message, raw: cleaned };
    return { ok: true, data: result.data as z.output<S> };
  } catch (e) {
    return { ok: false, error: (e as Error).message, raw: cleaned };
  }
}

async function runAgent<S extends z.ZodTypeAny>(
  agent: string,
  system: string,
  user: string,
  schemaHint: string,
  zodSchema: S,
  audit: { meetingId?: string; transcriptId?: string },
): Promise<{ data: z.output<S>; raw: string; provider: string; model: string }> {
  const provider = getProvider();
  const result = await provider.complete({
    system: `[AGENT:${agent}]\n${system}`,
    user,
    jsonSchemaHint: schemaHint,
    temperature: 0.2,
  });
  const parsed = safeJson(result.text, zodSchema);
  await prisma.agentOutput.create({
    data: {
      agent,
      provider: provider.name,
      model: result.model,
      input: user.slice(0, 20000), // truncate for audit log size
      outputJson: result.text,
      meetingId: audit.meetingId,
      transcriptId: audit.transcriptId,
    },
  });
  if (!parsed.ok) {
    throw new Error(`Agent ${agent} produced malformed output: ${parsed.error}`);
  }
  return { data: parsed.data, raw: result.text, provider: provider.name, model: result.model };
}

// -----------------------------------------------------------------------------
// A. Meeting Note Agent
// -----------------------------------------------------------------------------

export const MeetingExtractionSchema = z.object({
  summary: z.string(),
  actionItems: z
    .array(
      z.object({
        description: z.string(),
        owner: z.string().nullable().optional(),
        urgency: z.enum(["High", "Medium", "Low"]).optional(),
        dueHint: z.string().nullable().optional(),
      }),
    )
    .default([]),
  decisions: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string().nullable().optional(),
      }),
    )
    .default([]),
  decisionsNeeded: z
    .array(
      z.object({
        title: z.string(),
        recommendation: z.string().nullable().optional(),
        impactIfDelayed: z.string().nullable().optional(),
      }),
    )
    .default([]),
  openQuestions: z.array(z.string()).default([]),
  risks: z
    .array(z.object({ description: z.string(), severity: z.enum(["High", "Medium", "Low"]).optional() }))
    .default([]),
  followUps: z.array(z.string()).default([]),
  relatedDepartments: z.array(z.string()).default([]),
  suggestedNextSteps: z.array(z.string()).default([]),
  recurringThemes: z.array(z.string()).default([]),
});

export type MeetingExtraction = z.output<typeof MeetingExtractionSchema>;

const MEETING_SYSTEM = `You are the Meeting Note Agent for a Chief of Staff working with the CEO of a NASDAQ-listed Japanese company in the U.S.
Your job is to read raw meeting notes and produce a structured, faithful extraction.
Be concise and conservative. Do not invent facts. If a field is not present in the notes, return an empty list or null.
Treat all content as confidential. Do not include speculation about people's character.`;

const MEETING_SCHEMA_HINT = `{
  "summary": "string (3-6 sentences)",
  "actionItems": [ { "description": "string", "owner": "string|null", "urgency": "High|Medium|Low", "dueHint": "string|null" } ],
  "decisions": [ { "title": "string", "rationale": "string|null" } ],
  "decisionsNeeded": [ { "title": "string", "recommendation": "string|null", "impactIfDelayed": "string|null" } ],
  "openQuestions": ["string"],
  "risks": [ { "description": "string", "severity": "High|Medium|Low" } ],
  "followUps": ["string"],
  "relatedDepartments": ["string"],
  "suggestedNextSteps": ["string"],
  "recurringThemes": ["string"]
}`;

export async function runMeetingNoteAgent(
  rawNotes: string,
  audit: { meetingId?: string; transcriptId?: string } = {},
) {
  return runAgent("MeetingNoteAgent", MEETING_SYSTEM, rawNotes, MEETING_SCHEMA_HINT, MeetingExtractionSchema, audit);
}

// -----------------------------------------------------------------------------
// B. Priority Agent
// -----------------------------------------------------------------------------

export const PrioritySuggestionSchema = z.object({
  suggestedPriorities: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["High", "Medium", "Low"]).optional(),
        status: z.enum(["On Track", "At Risk", "Delayed", "Paused", "Completed"]).optional(),
        rationale: z.string().nullable().optional(),
      }),
    )
    .default([]),
  priorityShifts: z.array(z.object({ priority: z.string(), change: z.string() })).default([]),
  emergingPriorities: z.array(z.string()).default([]),
});

const PRIORITY_SYSTEM = `You are the Priority Agent. Based on meeting notes and existing priorities,
suggest priority updates, status changes, and emerging strategic priorities for the CEO.`;

const PRIORITY_SCHEMA_HINT = `{
  "suggestedPriorities": [ { "name": "string", "level": "High|Medium|Low", "status": "On Track|At Risk|Delayed|Paused|Completed", "rationale": "string|null" } ],
  "priorityShifts": [ { "priority": "string", "change": "string" } ],
  "emergingPriorities": ["string"]
}`;

export async function runPriorityAgent(input: string, audit: { meetingId?: string } = {}) {
  return runAgent("PriorityAgent", PRIORITY_SYSTEM, input, PRIORITY_SCHEMA_HINT, PrioritySuggestionSchema, audit);
}

// -----------------------------------------------------------------------------
// C. Action Tracking Agent
// -----------------------------------------------------------------------------

export const ActionUpdateSchema = z.object({
  newActionItems: z
    .array(
      z.object({
        description: z.string(),
        owner: z.string().nullable().optional(),
        urgency: z.enum(["High", "Medium", "Low"]).optional(),
        dueHint: z.string().nullable().optional(),
      }),
    )
    .default([]),
  updates: z
    .array(
      z.object({
        descriptionMatch: z.string(),
        newStatus: z.enum(["Not Started", "In Progress", "Waiting", "Completed", "Blocked"]).optional(),
        note: z.string().nullable().optional(),
      }),
    )
    .default([]),
  overdueWarnings: z.array(z.string()).default([]),
});

const ACTION_SYSTEM = `You are the Action Tracking Agent. Identify new action items, status updates for existing items,
and surface any overdue items mentioned in the input.`;

const ACTION_SCHEMA_HINT = `{
  "newActionItems": [ { "description": "string", "owner": "string|null", "urgency": "High|Medium|Low", "dueHint": "string|null" } ],
  "updates": [ { "descriptionMatch": "string", "newStatus": "Not Started|In Progress|Waiting|Completed|Blocked", "note": "string|null" } ],
  "overdueWarnings": ["string"]
}`;

export async function runActionAgent(input: string, audit: { meetingId?: string } = {}) {
  return runAgent("ActionTrackingAgent", ACTION_SYSTEM, input, ACTION_SCHEMA_HINT, ActionUpdateSchema, audit);
}

// -----------------------------------------------------------------------------
// D. Decision Agent
// -----------------------------------------------------------------------------

export const DecisionExtractionSchema = z.object({
  decisionsMade: z
    .array(z.object({ title: z.string(), rationale: z.string().nullable().optional() }))
    .default([]),
  decisionsNeeded: z
    .array(
      z.object({
        title: z.string(),
        recommendation: z.string().nullable().optional(),
        impactIfDelayed: z.string().nullable().optional(),
      }),
    )
    .default([]),
  unresolvedIssues: z.array(z.string()).default([]),
});

const DECISION_SYSTEM = `You are the Decision Agent. Extract decisions made, decisions needed (escalations),
and unresolved issues from meeting content.`;

const DECISION_SCHEMA_HINT = `{
  "decisionsMade": [ { "title": "string", "rationale": "string|null" } ],
  "decisionsNeeded": [ { "title": "string", "recommendation": "string|null", "impactIfDelayed": "string|null" } ],
  "unresolvedIssues": ["string"]
}`;

export async function runDecisionAgent(input: string, audit: { meetingId?: string } = {}) {
  return runAgent("DecisionAgent", DECISION_SYSTEM, input, DECISION_SCHEMA_HINT, DecisionExtractionSchema, audit);
}

// -----------------------------------------------------------------------------
// E. Risk and Bottleneck Agent
// -----------------------------------------------------------------------------

export const RiskAnalysisSchema = z.object({
  risks: z
    .array(
      z.object({
        description: z.string(),
        severity: z.enum(["High", "Medium", "Low"]).optional(),
      }),
    )
    .default([]),
  blockers: z.array(z.object({ description: z.string(), blockingWhom: z.string().nullable().optional() })).default([]),
  dependencies: z.array(z.string()).default([]),
  escalationSuggestions: z.array(z.string()).default([]),
});

const RISK_SYSTEM = `You are the Risk & Bottleneck Agent. From projects, action items, and meeting notes,
identify risks, blockers, dependencies, and recommend escalations to the CEO when warranted.`;

const RISK_SCHEMA_HINT = `{
  "risks": [ { "description": "string", "severity": "High|Medium|Low" } ],
  "blockers": [ { "description": "string", "blockingWhom": "string|null" } ],
  "dependencies": ["string"],
  "escalationSuggestions": ["string"]
}`;

export async function runRiskAgent(input: string, audit: { meetingId?: string } = {}) {
  return runAgent("RiskBottleneckAgent", RISK_SYSTEM, input, RISK_SCHEMA_HINT, RiskAnalysisSchema, audit);
}

// -----------------------------------------------------------------------------
// F. Weekly Brief Agent  (deterministically composed from data — see weekly-brief.ts)
// -----------------------------------------------------------------------------

// G. Friction Analysis Agent (deterministically composed — see friction-map page)
