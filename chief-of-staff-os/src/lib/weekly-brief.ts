// Deterministic Weekly Brief composer.
// We don't rely on an LLM here — the brief is built from structured data
// already approved by the human. Predictable output is more useful for the
// executive context, and the user always edits before sending.

import { prisma } from "@/lib/db";
import { daysAgo, fmtDate, startOfWeek } from "@/lib/utils/date";

export async function composeWeeklyBrief(weekStart = startOfWeek()): Promise<string> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const lookback = daysAgo(7);

  const [
    topPriorities,
    keyUpdatesPriorities,
    decisionsNeeded,
    risks,
    overdueActions,
    blockedActions,
    blockedProjects,
    themes,
    recentlyCompleted,
    upcomingDeadlines,
    recentDecisions,
  ] = await Promise.all([
    prisma.priority.findMany({
      where: { status: { in: ["On Track", "At Risk", "Delayed"] } },
      orderBy: [{ level: "asc" }, { lastUpdated: "desc" }],
      take: 5,
      include: { owner: true },
    }),
    prisma.priority.findMany({
      where: { lastUpdated: { gte: lookback } },
      orderBy: { lastUpdated: "desc" },
      take: 10,
      include: { owner: true },
    }),
    prisma.decisionNeeded.findMany({
      where: { status: { notIn: ["Decided", "Cancelled"] } },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.risk.findMany({
      where: { status: { in: ["Open", "Mitigating"] } },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 10,
      include: { project: true },
    }),
    prisma.actionItem.findMany({
      where: { status: { notIn: ["Completed"] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: "asc" },
      include: { owner: true },
    }),
    prisma.actionItem.findMany({
      where: { status: "Blocked" },
      include: { owner: true, project: true },
    }),
    prisma.project.findMany({
      where: { status: { in: ["At Risk", "Blocked"] } },
      orderBy: { lastUpdated: "desc" },
      take: 8,
    }),
    prisma.theme.findMany({
      where: { lastSeenAt: { gte: daysAgo(30) } },
      orderBy: [{ occurrences: "desc" }, { lastSeenAt: "desc" }],
      take: 8,
    }),
    prisma.actionItem.findMany({
      where: { status: "Completed", updatedAt: { gte: lookback } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { owner: true },
    }),
    prisma.priority.findMany({
      where: { deadline: { gte: new Date(), lt: new Date(Date.now() + 21 * 86400000) } },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.decision.findMany({
      where: { date: { gte: lookback } },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const sections: string[] = [];
  sections.push(`# Weekly Executive Brief`);
  sections.push(`_Week of ${fmtDate(weekStart)}_`);
  sections.push("");

  sections.push(`## 1. Top Priorities`);
  if (topPriorities.length === 0) sections.push("_None tracked._");
  for (const p of topPriorities) {
    sections.push(`- **${p.name}** — ${p.status} (${p.level}) · Owner: ${p.owner?.name ?? "—"}${p.nextAction ? ` · Next: ${p.nextAction}` : ""}`);
  }
  sections.push("");

  sections.push(`## 2. Key Updates`);
  if (keyUpdatesPriorities.length === 0) sections.push("_No priority updates this week._");
  for (const p of keyUpdatesPriorities) {
    sections.push(`- ${p.name}: ${p.status}${p.notes ? ` — ${p.notes.slice(0, 200)}` : ""}`);
  }
  if (recentDecisions.length > 0) {
    sections.push("");
    sections.push(`**Decisions this week:**`);
    for (const d of recentDecisions) sections.push(`- ${d.title} (${fmtDate(d.date)})`);
  }
  sections.push("");

  sections.push(`## 3. Decisions Needed`);
  if (decisionsNeeded.length === 0) sections.push("_None outstanding._");
  for (const d of decisionsNeeded) {
    sections.push(
      `- **${d.title}**${d.deadline ? ` _(deadline ${fmtDate(d.deadline)})_` : ""}${d.recommendation ? `\n  - Recommendation: ${d.recommendation}` : ""}${d.impactIfDelayed ? `\n  - Impact if delayed: ${d.impactIfDelayed}` : ""}`,
    );
  }
  sections.push("");

  sections.push(`## 4. Risks / Bottlenecks`);
  if (risks.length === 0 && blockedProjects.length === 0) sections.push("_No flagged risks._");
  for (const r of risks) {
    sections.push(`- (${r.severity}) ${r.description}${r.project ? ` — ${r.project.name}` : ""}`);
  }
  for (const p of blockedProjects) {
    sections.push(`- (Project) ${p.name} — ${p.status}${p.blockers ? `: ${p.blockers}` : ""}`);
  }
  sections.push("");

  sections.push(`## 5. Overdue or Blocked Action Items`);
  if (overdueActions.length === 0 && blockedActions.length === 0) sections.push("_None._");
  for (const a of overdueActions) {
    sections.push(`- ⏰ ${a.description} — ${a.owner?.name ?? "Unassigned"} (due ${fmtDate(a.dueDate)})`);
  }
  for (const a of blockedActions) {
    sections.push(`- 🛑 ${a.description} — ${a.owner?.name ?? "Unassigned"}${a.project ? ` · ${a.project.name}` : ""}`);
  }
  sections.push("");

  sections.push(`## 6. Cross-functional Dependencies`);
  const deps = blockedProjects.filter((p) => p.dependencies);
  if (deps.length === 0) sections.push("_None flagged._");
  for (const p of deps) sections.push(`- ${p.name}: ${p.dependencies}`);
  sections.push("");

  sections.push(`## 7. Recurring Themes`);
  if (themes.length === 0) {
    sections.push("_No recurring themes detected yet._");
  } else {
    for (const t of themes) sections.push(`- ${t.name} (${t.occurrences}× · last ${fmtDate(t.lastSeenAt)})`);
  }
  sections.push("");

  sections.push(`## 8. Recommended Follow-ups`);
  const followUps: string[] = [];
  for (const d of decisionsNeeded.slice(0, 3)) followUps.push(`Push for resolution: **${d.title}**`);
  for (const a of overdueActions.slice(0, 3)) followUps.push(`Chase: ${a.description} (${a.owner?.name ?? "Unassigned"})`);
  for (const p of blockedProjects.slice(0, 2)) followUps.push(`Unblock: ${p.name}`);
  if (followUps.length === 0) sections.push("_Nothing to flag._");
  for (const f of followUps) sections.push(`- ${f}`);
  sections.push("");

  sections.push(`## 9. Upcoming Deadlines (next 3 weeks)`);
  if (upcomingDeadlines.length === 0) sections.push("_No priority deadlines in window._");
  for (const p of upcomingDeadlines) sections.push(`- ${fmtDate(p.deadline)} — ${p.name}`);
  sections.push("");

  if (recentlyCompleted.length > 0) {
    sections.push(`## ✔ Completed this week`);
    for (const a of recentlyCompleted) sections.push(`- ${a.description}`);
    sections.push("");
  }

  sections.push("---");
  sections.push(`_Generated by Chief of Staff OS — review and edit before sending._`);

  return sections.join("\n");
}
