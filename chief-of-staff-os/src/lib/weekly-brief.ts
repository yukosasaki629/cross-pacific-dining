// 週次ブリーフのデータ駆動生成。
// LLMには依存せず、人が承認した構造化データから決定論的にMarkdownを組み立てます。

import { prisma } from "@/lib/db";
import { daysAgo, fmtDate, startOfWeek } from "@/lib/utils/date";
import {
  labelFor,
  PRIORITY_LEVEL_LABELS,
  PRIORITY_STATUS_LABELS,
} from "@/lib/labels";

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
  sections.push(`# 週次エグゼクティブ・ブリーフ`);
  sections.push(`_${fmtDate(weekStart)} の週_`);
  sections.push("");

  sections.push(`## 1. 今週のトップ優先事項`);
  if (topPriorities.length === 0) sections.push("_未登録。_");
  for (const p of topPriorities) {
    sections.push(
      `- **${p.name}** — ${labelFor(p.status, PRIORITY_STATUS_LABELS)} (${labelFor(p.level, PRIORITY_LEVEL_LABELS)}) · 担当: ${p.owner?.name ?? "—"}${p.nextAction ? ` · 次のアクション: ${p.nextAction}` : ""}`,
    );
  }
  sections.push("");

  sections.push(`## 2. 主な進捗・アップデート`);
  if (keyUpdatesPriorities.length === 0) sections.push("_今週の優先事項アップデートなし。_");
  for (const p of keyUpdatesPriorities) {
    sections.push(`- ${p.name}: ${labelFor(p.status, PRIORITY_STATUS_LABELS)}${p.notes ? ` — ${p.notes.slice(0, 200)}` : ""}`);
  }
  if (recentDecisions.length > 0) {
    sections.push("");
    sections.push(`**今週の意思決定:**`);
    for (const d of recentDecisions) sections.push(`- ${d.title}(${fmtDate(d.date)})`);
  }
  sections.push("");

  sections.push(`## 3. 判断待ち事項`);
  if (decisionsNeeded.length === 0) sections.push("_未対応の判断待ちなし。_");
  for (const d of decisionsNeeded) {
    sections.push(
      `- **${d.title}**${d.deadline ? ` _(期限 ${fmtDate(d.deadline)})_` : ""}${d.recommendation ? `\n  - 推奨案: ${d.recommendation}` : ""}${d.impactIfDelayed ? `\n  - 遅延時の影響: ${d.impactIfDelayed}` : ""}`,
    );
  }
  sections.push("");

  sections.push(`## 4. リスク・ボトルネック`);
  if (risks.length === 0 && blockedProjects.length === 0) sections.push("_リスクなし。_");
  for (const r of risks) {
    sections.push(`- (${r.severity}) ${r.description}${r.project ? ` — ${r.project.name}` : ""}`);
  }
  for (const p of blockedProjects) {
    sections.push(`- (プロジェクト) ${p.name} — ${labelFor(p.status, PRIORITY_STATUS_LABELS)}${p.blockers ? `: ${p.blockers}` : ""}`);
  }
  sections.push("");

  sections.push(`## 5. 期限超過 / ブロック中のアクション`);
  if (overdueActions.length === 0 && blockedActions.length === 0) sections.push("_なし。_");
  for (const a of overdueActions) {
    sections.push(`- ⏰ ${a.description} — ${a.owner?.name ?? "未割当"}(期限 ${fmtDate(a.dueDate)})`);
  }
  for (const a of blockedActions) {
    sections.push(`- 🛑 ${a.description} — ${a.owner?.name ?? "未割当"}${a.project ? ` · ${a.project.name}` : ""}`);
  }
  sections.push("");

  sections.push(`## 6. 部門横断の依存関係`);
  const deps = blockedProjects.filter((p) => p.dependencies);
  if (deps.length === 0) sections.push("_該当なし。_");
  for (const p of deps) sections.push(`- ${p.name}: ${p.dependencies}`);
  sections.push("");

  sections.push(`## 7. 繰り返し現れているテーマ`);
  if (themes.length === 0) {
    sections.push("_検出されたテーマなし。_");
  } else {
    for (const t of themes) sections.push(`- ${t.name}(${t.occurrences}回 · 直近 ${fmtDate(t.lastSeenAt)})`);
  }
  sections.push("");

  sections.push(`## 8. 推奨フォローアップ`);
  const followUps: string[] = [];
  for (const d of decisionsNeeded.slice(0, 3)) followUps.push(`判断を促す: **${d.title}**`);
  for (const a of overdueActions.slice(0, 3)) followUps.push(`催促: ${a.description}(${a.owner?.name ?? "未割当"})`);
  for (const p of blockedProjects.slice(0, 2)) followUps.push(`ブロック解除: ${p.name}`);
  if (followUps.length === 0) sections.push("_該当なし。_");
  for (const f of followUps) sections.push(`- ${f}`);
  sections.push("");

  sections.push(`## 9. 直近の期限(今後3週間)`);
  if (upcomingDeadlines.length === 0) sections.push("_3週間以内の期限なし。_");
  for (const p of upcomingDeadlines) sections.push(`- ${fmtDate(p.deadline)} — ${p.name}`);
  sections.push("");

  if (recentlyCompleted.length > 0) {
    sections.push(`## ✔ 今週 完了したアクション`);
    for (const a of recentlyCompleted) sections.push(`- ${a.description}`);
    sections.push("");
  }

  sections.push("---");
  sections.push(`_Chief of Staff OS による自動生成 — 送信前に必ずレビュー・編集してください。_`);

  return sections.join("\n");
}
