import { prisma } from "@/lib/db";
import { endOfWeek, fmtDate, isOverdue, startOfWeek } from "@/lib/utils";

export async function composeReport(): Promise<string> {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  const [keyProjects, decisions, risks, followUps, overdueTasks, nextChecks] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: "完了" }, isSharedWithCEO: true, priority: { in: ["高", "中"] } },
      orderBy: [{ priority: "desc" }, { status: "asc" }],
      take: 6,
    }),
    prisma.decision.findMany({
      where: { status: { in: ["未対応", "検討中"] } },
      orderBy: [{ importance: "desc" }, { deadline: "asc" }],
      include: { project: { select: { name: true } } },
      take: 8,
    }),
    prisma.risk.findMany({
      where: { status: { not: "解消" }, severity: { in: ["高", "中"] } },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { project: { select: { name: true } } },
      take: 8,
    }),
    prisma.followUp.findMany({
      where: { status: { not: "完了" }, dueDate: { gte: weekStart, lt: weekEnd } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["完了"] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true } } },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        status: { not: "完了" },
        isSharedWithCEO: true,
        OR: [
          { dueDate: { gte: new Date(), lt: new Date(Date.now() + 14 * 86400000) } },
          { updatedAt: { lt: new Date(Date.now() - 14 * 86400000) } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
  ]);

  const out: string[] = [];
  out.push(`# 今週のエグゼクティブ・サマリー`);
  out.push(`_${fmtDate(weekStart)} の週_`);
  out.push("");

  out.push(`## 1. 重要プロジェクト`);
  if (keyProjects.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const p of keyProjects) {
      out.push(
        `- **${p.name}** ーー ${p.status}(優先度: ${p.priority} / リスク: ${p.riskLevel})・担当: ${p.owner ?? "—"}${p.nextAction ? `\n  - 次のアクション: ${p.nextAction}` : ""}${p.dueDate ? `\n  - 期限: ${fmtDate(p.dueDate)}${isOverdue(p.dueDate) ? "(超過)" : ""}` : ""}${p.currentSummary ? `\n  - 状況: ${p.currentSummary}` : ""}`,
      );
    }
  }
  out.push("");

  out.push(`## 2. 判断が必要な事項`);
  if (decisions.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const d of decisions) {
      out.push(
        `- **${d.topic}**${d.project ? `(${d.project.name})` : ""} ーー 重要度: ${d.importance}${d.deadline ? `・期限: ${fmtDate(d.deadline)}${isOverdue(d.deadline) ? "(超過)" : ""}` : ""}${d.recommendation ? `\n  - 推奨案: ${d.recommendation}` : ""}${d.impactIfDelayed ? `\n  - 遅れた場合: ${d.impactIfDelayed}` : ""}`,
      );
    }
  }
  out.push("");

  out.push(`## 3. リスク・ブロッカー`);
  if (risks.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const r of risks) {
      out.push(
        `- (${r.severity}) ${r.description}${r.project ? ` ーー ${r.project.name}` : ""}${r.mitigation ? `\n  - 対応策: ${r.mitigation}` : ""}`,
      );
    }
  }
  out.push("");

  out.push(`## 4. 今週のフォローアップ`);
  if (followUps.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const f of followUps) {
      out.push(`- ${f.title}${f.who ? `(対象: ${f.who})` : ""}${f.dueDate ? ` ・ ${fmtDate(f.dueDate)}` : ""}`);
    }
  }
  out.push("");

  out.push(`## 5. 期限超過項目`);
  if (overdueTasks.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const t of overdueTasks) {
      out.push(`- ${t.title}${t.project ? `(${t.project.name})` : ""}・担当: ${t.owner ?? "—"}・期限 ${fmtDate(t.dueDate)}`);
    }
  }
  out.push("");

  out.push(`## 6. 次に確認すべきこと`);
  if (nextChecks.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const p of nextChecks) {
      const stale = p.updatedAt && p.updatedAt < new Date(Date.now() - 14 * 86400000);
      const reason = stale ? "2週間以上 更新なし" : `期限が近い(${fmtDate(p.dueDate)})`;
      out.push(`- ${p.name} ーー ${reason}`);
    }
  }
  out.push("");

  out.push(`---`);
  out.push(`_CEOダッシュボードから生成 — 送信前にレビュー・編集してください。_`);

  return out.join("\n");
}
