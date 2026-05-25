# Chief of Staff OS

A **local-first**, private executive operating system. Built for someone working with the CEO and C-suite of a NASDAQ-listed company who wants to evolve from "taking notes and following up" to **tracking CEO priorities, surfacing risks, supporting decisions, and improving organizational execution**.

> This is not a generic task manager. This is an AI-enabled executive operating system designed for the Chief of Staff workflow.

## Privacy posture

- All data lives in a local SQLite file at `prisma/dev.db`.
- The default AI provider is `mock` — a deterministic rule-based extractor that **never makes a network call**. The product is fully usable offline.
- The optional `anthropic` provider sends meeting content to Anthropic's API. It's gated by an env var, marked with a red banner in the UI, and requires an explicit API key. Do not enable unless your company policy permits sending executive content to a third-party AI vendor.
- Every AI extraction is **reviewed by a human** in editable JSON before any structured record is created (`AgentOutput` table is the audit log).
- No analytics, no telemetry, no logging of note bodies.

## Getting started

```bash
cd chief-of-staff-os
cp .env.example .env       # local mode is the default; no edits needed
npm install
npm run db:push            # create the SQLite schema
npm run db:seed            # add non-confidential sample data (optional)
npm run dev                # http://localhost:3000
```

One-shot setup:

```bash
npm run setup
```

## Daily workflow

After each CEO 1:1 or executive meeting:

1. Open **Meetings → + New Meeting**
2. Paste raw notes, save
3. On the meeting detail page click **Process Notes**
4. Review the JSON output, edit anything that looks off
5. Click **Apply to records** — this creates action items, decisions, risks, and updates themes
6. Open the **Dashboard** to see what now requires follow-up

If you record meetings and have transcripts, use **Transcripts** instead: paste or upload `.txt` / `.md` / `.docx`. Processing creates a linked Meeting automatically.

## Friday workflow

1. **Weekly Brief → Generate this week**
2. Review the markdown draft (composed deterministically from your data — no LLM by default)
3. Edit anything you want to add
4. **Copy** or **Download .md** and send / paste into email / Slack / Notion

## Monthly workflow

1. Open **Friction Map**
2. Look for owners or departments stacking blocked items, stale priorities, repeated decisions, recurring themes
3. Use those signals to prepare recommendations for the CEO

## Architecture

```
Next.js 15 (App Router) ── React 19 ── Tailwind 3
                │
        Server Actions / RSC
                │
            Prisma ORM
                │
         SQLite (local file)
                │
   AI service layer (provider seam)
        ├── mock         ← default, no network
        └── anthropic    ← opt-in
```

### AI agents

All agent prompts and JSON schemas live in `src/lib/ai/agents/index.ts`. Each agent:

| Agent                  | Input                          | Output                                                    |
| ---------------------- | ------------------------------ | --------------------------------------------------------- |
| `MeetingNoteAgent`     | raw notes / transcript         | summary, action items, decisions, risks, themes, etc.     |
| `PriorityAgent`        | notes + existing priorities    | suggested priority updates / shifts / emerging priorities |
| `ActionTrackingAgent`  | notes + existing actions       | new actions, status updates, overdue warnings             |
| `DecisionAgent`        | notes                          | decisions made, decisions needed, unresolved issues       |
| `RiskBottleneckAgent`  | projects + actions + notes     | risks, blockers, dependencies, escalation suggestions     |
| `WeeklyBriefAgent`     | this week's data               | the weekly brief (composed deterministically — `src/lib/weekly-brief.ts`) |
| `FrictionAnalysisAgent`| historical data                | recurring patterns (composed deterministically — `/friction-map`) |

The weekly brief and friction analysis are intentionally **deterministic** (no LLM call). They draw from the same approved, human-reviewed structured records and produce predictable output — which is what an executive context needs.

### Data model (high level)

```
Meeting ─┬─ ActionItem ─── Person (owner)
         ├─ Decision      └── Department
         ├─ DecisionNeeded
         ├─ Risk
         ├─ Tag
         └─ Transcript

Priority ── many-to-many ── Meeting / Project / Action / Decision
Project  ── many-to-many ── Meeting / Department / Priority
Theme    ── frequency-tracked recurring topic
WeeklyBrief, AgentOutput (audit log)
```

Full schema: [`prisma/schema.prisma`](./prisma/schema.prisma).

## File locations

| Thing                       | Where                                                 |
| --------------------------- | ----------------------------------------------------- |
| Local database              | `prisma/dev.db` (gitignored)                          |
| Schema                      | `prisma/schema.prisma`                                |
| Seed data                   | `prisma/seed.ts`                                      |
| AI service layer            | `src/lib/ai/`                                         |
| Agent prompts + schemas     | `src/lib/ai/agents/index.ts`                          |
| Weekly brief composition    | `src/lib/weekly-brief.ts`                             |
| Search                      | `src/lib/search.ts`                                   |
| Pages                       | `src/app/<module>/page.tsx`                           |
| JSON snapshot endpoint      | `src/app/api/export/route.ts`                         |

## Backup & restore

- **Backup**: stop the app, copy `prisma/dev.db` to a safe location, or use **Settings → Download JSON snapshot**.
- **Restore**: stop the app, replace `prisma/dev.db` with your backup, restart.
- **Wipe everything**: `npm run db:reset` (force-resets the schema and re-runs seed).

## Extending later

- **Add an AI provider** (OpenAI, local Ollama, llama.cpp, etc.): implement the `AIProvider` interface in `src/lib/ai/provider.ts` and register it in `src/lib/ai/index.ts`.
- **Semantic / vector search**: replace `searchAll` in `src/lib/search.ts` with an embedding-backed implementation; the hit shape stays the same.
- **Notion / Drive / Gmail / Calendar / Slack / Teams sync**: add integration modules that write rows into the existing tables. The schema already supports `source` on transcripts (`whisper-local`, `otter`, `fathom`, `assemblyai`).
- **More agents**: add to `src/lib/ai/agents/` following the existing pattern (tagged system prompt + zod schema + `runAgent` helper).

## What this MVP includes

- ✅ Database schema for meetings, transcripts, priorities, projects, actions, decisions, decisions-needed, risks, tags, themes, agent outputs, weekly briefs
- ✅ Meeting Notes Inbox with paste, save, edit, AI process, apply
- ✅ Transcript ingestion (paste + `.txt` / `.md` / `.docx` upload) with the same processing pipeline
- ✅ CEO Priority Dashboard with stale / at-risk views
- ✅ Action Item Tracker with views: all, overdue, by owner, by department, on CEO priorities, blocked
- ✅ Decision Log + Decisions Needed (with "promote to decision" workflow)
- ✅ Cross-functional Project Tracker
- ✅ Weekly Executive Brief Generator (deterministic, markdown, edit + copy + download)
- ✅ Knowledge Base keyword search across all entities
- ✅ Friction Map dashboard
- ✅ Executive Intelligence Timeline
- ✅ Settings with provider toggle info, data location, JSON export
- ✅ AI service layer with `MockProvider` (default) and `AnthropicProvider` (opt-in)
- ✅ Audit log of every AI extraction

## What's intentionally not in the MVP

- No multi-user / auth (this is a single-user local app)
- No realtime sync to Notion / Slack / Gmail / Calendar (designed-for, not built)
- No semantic / vector search (keyword only; interface is ready for it)
- No PDF export (markdown export covers the same content; use any md→PDF tool)
- No mobile UI (desktop-first; works fine on a tablet)
- No local Whisper transcription (schema supports it; integration is yours to add)

## Tone

The UI is intentionally calm, neutral, and minimal. This product holds material non-public information about a public company. It should feel like a quiet executive workspace, not a SaaS dashboard.
