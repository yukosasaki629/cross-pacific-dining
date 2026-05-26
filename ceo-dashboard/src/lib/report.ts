import { prisma } from "@/lib/db";
import { endOfWeek, fmtDate, isOverdue, startOfWeek } from "@/lib/utils";
import { reportTopicWhere } from "@/lib/share-filters";

const SENSITIVITY_MARK: Record<string, string> = {
  board: "🏛 Board",
  compensation: "💴 Comp",
  executive_only: "🔒 Exec-Only",
};

// =============================================================================
// 共有レポート生成
// =============================================================================
//
// 社長に渡す週次サマリー。優子個人ツールから生成 → レビュー・編集 → 社長へ。
// 社長は1on1の当事者なので、機密(報酬/Board/CFO候補/Sharaz等)も含めて
// すべて報告する設計。
//
// 唯一の除外:
//   - Project の privateMemo フィールド(用途が違うため)
// =============================================================================
const REPORT_PROJECT_SELECT = {
  id: true,
  name: true,
  objective: true,
  owner: true,
  department: true,
  status: true,
  riskLevel: true,
  priority: true,
  nextAction: true,
  dueDate: true,
  currentSummary: true,
  successMetric: true,
  updatedAt: true,
  // privateMemo は意図的に除外
} as const;
export async function composeReport(): Promise<string> {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();
  const lookbackDays = 14;
  const lookback = new Date(Date.now() - lookbackDays * 86400000);

  const [
    importantTopics,
    followUpTopics,
    decisionTopics,
    riskTopics,
    keyProjects,
    overdueTasks,
    nextChecks,
    // レガシー(旧抽出データがまだ残っていれば)
    legacyDecisions,
    legacyRisks,
    legacyFollowUps,
  ] = await Promise.all([
    // ⭐ 重要トピック(未完了)
    prisma.topic.findMany({
      where: reportTopicWhere({
        isImportant: true,
        status: { not: "done" },
        createdAt: { gte: lookback },
      }),
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 15,
      select: {
        id: true, title: true, content: true, dueDate: true, owner: true,
        category: true, status: true, sensitivity: true, pnlImpact: true, strategicCategory: true,
        person: { select: { name: true, role: true } },
        meetingNote: { select: { date: true } },
        project: { select: { name: true } },
      },
    }),
    // 📌 フォロー要トピック
    prisma.topic.findMany({
      where: reportTopicWhere({
        needsFollowUp: true,
        status: { not: "done" },
        createdAt: { gte: lookback },
      }),
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 15,
      select: {
        id: true, title: true, content: true, dueDate: true, owner: true,
        category: true, status: true, sensitivity: true, pnlImpact: true, strategicCategory: true,
        person: { select: { name: true, role: true } },
        meetingNote: { select: { date: true } },
        project: { select: { name: true } },
      },
    }),
    // 判断系トピック(category=decision, 未完了)
    prisma.topic.findMany({
      where: reportTopicWhere({
        category: "decision",
        status: { not: "done" },
        createdAt: { gte: lookback },
      }),
      orderBy: [{ dueDate: "asc" }],
      take: 10,
      select: {
        id: true, title: true, content: true, dueDate: true, sensitivity: true,
        person: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    // リスク系トピック
    prisma.topic.findMany({
      where: reportTopicWhere({
        category: "risk",
        status: { not: "done" },
        createdAt: { gte: lookback },
      }),
      take: 10,
      select: {
        id: true, title: true, content: true, sensitivity: true,
        person: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    // 重要プロジェクト(全プロジェクト対象、privateMemo は SELECT で除外)
    prisma.project.findMany({
      where: {
        status: { not: "完了" },
        priority: { in: ["高", "中"] },
      },
      orderBy: [{ priority: "desc" }, { status: "asc" }],
      take: 6,
      select: REPORT_PROJECT_SELECT,
    }),
    // 期限超過タスク
    prisma.task.findMany({
      where: {
        status: { notIn: ["完了"] },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      select: {
        id: true, title: true, owner: true, dueDate: true,
        project: { select: { name: true } },
      },
    }),
    // 次に確認すべきプロジェクト(期限近 or 更新停滞)
    prisma.project.findMany({
      where: {
        status: { not: "完了" },
        OR: [
          { dueDate: { gte: new Date(), lt: new Date(Date.now() + 14 * 86400000) } },
          { updatedAt: { lt: new Date(Date.now() - 14 * 86400000) } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      select: {
        id: true, name: true, dueDate: true, updatedAt: true,
      },
    }),
    // ----- レガシー(旧抽出が残っているとき用、空ならスキップ表示)-----
    prisma.decision.findMany({
      where: { status: { in: ["未対応", "検討中"] } },
      orderBy: [{ importance: "desc" }, { deadline: "asc" }],
      take: 5,
      select: { id: true, topic: true, recommendation: true, deadline: true, importance: true },
    }),
    prisma.risk.findMany({
      where: { status: { not: "解消" }, severity: { in: ["高", "中"] } },
      orderBy: [{ severity: "desc" }],
      take: 5,
      select: { id: true, description: true, severity: true, mitigation: true },
    }),
    prisma.followUp.findMany({
      where: {
        status: { not: "完了" },
        dueDate: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, who: true, dueDate: true },
    }),
  ]);

  const out: string[] = [];
  out.push(`# 今週のエグゼクティブ・サマリー`);
  out.push(`_${fmtDate(weekStart)} の週_`);
  out.push("");

  // ----- ⭐ 重要トピック -----
  out.push(`## 1. ⭐ 今週の重要トピック`);
  if (importantTopics.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const t of importantTopics) {
      const meta: string[] = [];
      if (t.person) meta.push(`${t.person.name}との 1on1`);
      if (t.meetingNote) meta.push(fmtDate(t.meetingNote.date));
      if (t.project) meta.push(`プロジェクト: ${t.project.name}`);
      if (t.owner) meta.push(`担当: ${t.owner}`);
      if (t.dueDate) meta.push(`期限: ${fmtDate(t.dueDate)}${isOverdue(t.dueDate) ? "(超過)" : ""}`);
      const metaStr = meta.length ? `\n  - _${meta.join(" ・ ")}_` : "";
      const contentStr = t.content ? `\n  - ${truncate(t.content, 400)}` : "";
      const mark = t.sensitivity && t.sensitivity !== "general" ? ` ${SENSITIVITY_MARK[t.sensitivity] ?? ""}` : "";
      out.push(`- **${t.title}**${mark}${metaStr}${contentStr}`);
    }
  }
  out.push("");

  // ----- 📌 フォロー要 -----
  out.push(`## 2. 📌 フォロー要トピック`);
  if (followUpTopics.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const t of followUpTopics) {
      const meta: string[] = [];
      if (t.person) meta.push(t.person.name);
      if (t.dueDate) meta.push(`期限 ${fmtDate(t.dueDate)}${isOverdue(t.dueDate) ? "(超過)" : ""}`);
      const mark = t.sensitivity && t.sensitivity !== "general" ? ` ${SENSITIVITY_MARK[t.sensitivity] ?? ""}` : "";
      out.push(`- ${t.title}${mark}${meta.length ? `(${meta.join(" / ")})` : ""}`);
    }
  }
  out.push("");

  // ----- 判断が必要 -----
  out.push(`## 3. 判断が必要な事項`);
  const allDecisions = [
    ...decisionTopics.map((t) => ({
      title: t.title,
      ctx: [t.person?.name, t.project?.name].filter(Boolean).join(" / "),
      deadline: t.dueDate,
      recommendation: null as string | null,
    })),
    ...legacyDecisions.map((d) => ({
      title: d.topic,
      ctx: "",
      deadline: d.deadline,
      recommendation: d.recommendation,
    })),
  ];
  if (allDecisions.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const d of allDecisions) {
      const meta: string[] = [];
      if (d.ctx) meta.push(d.ctx);
      if (d.deadline) meta.push(`期限 ${fmtDate(d.deadline)}${isOverdue(d.deadline) ? "(超過)" : ""}`);
      out.push(
        `- ${d.title}${meta.length ? `(${meta.join(" / ")})` : ""}${d.recommendation ? `\n  - 推奨案: ${d.recommendation}` : ""}`,
      );
    }
  }
  out.push("");

  // ----- リスク -----
  out.push(`## 4. リスク・ブロッカー`);
  const allRisks = [
    ...riskTopics.map((t) => ({
      desc: t.title,
      severity: null as string | null,
      project: t.project?.name ?? null,
      mitigation: null as string | null,
    })),
    ...legacyRisks.map((r) => ({
      desc: r.description,
      severity: r.severity,
      project: null,
      mitigation: r.mitigation,
    })),
  ];
  if (allRisks.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const r of allRisks) {
      out.push(
        `- ${r.severity ? `(${r.severity}) ` : ""}${r.desc}${r.project ? ` ーー ${r.project}` : ""}${r.mitigation ? `\n  - 対応策: ${r.mitigation}` : ""}`,
      );
    }
  }
  out.push("");

  // ----- 重要プロジェクト -----
  out.push(`## 5. 重要プロジェクト`);
  if (keyProjects.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const p of keyProjects) {
      out.push(
        `- **${p.name}** ーー ${p.status}(優先度: ${p.priority} / リスク: ${p.riskLevel})・担当: ${p.owner ?? "—"}${p.nextAction ? `\n  - 次のアクション: ${p.nextAction}` : ""}${p.dueDate ? `\n  - 期限: ${fmtDate(p.dueDate)}${isOverdue(p.dueDate) ? "(超過)" : ""}` : ""}`,
      );
    }
  }
  out.push("");

  // ----- 今週のフォローアップ(レガシーのみ) -----
  if (legacyFollowUps.length > 0) {
    out.push(`## 6. 今週のフォローアップ`);
    for (const f of legacyFollowUps) {
      out.push(`- ${f.title}${f.who ? `(対象: ${f.who})` : ""}${f.dueDate ? ` ・ ${fmtDate(f.dueDate)}` : ""}`);
    }
    out.push("");
  }

  // ----- 期限超過 -----
  out.push(`## 7. 期限超過項目`);
  if (overdueTasks.length === 0) {
    out.push(`- 該当なし`);
  } else {
    for (const t of overdueTasks) {
      out.push(`- ${t.title}${t.project ? `(${t.project.name})` : ""}・担当: ${t.owner ?? "—"}・期限 ${fmtDate(t.dueDate)}`);
    }
  }
  out.push("");

  // ----- 次に確認すべきこと -----
  out.push(`## 8. 次に確認すべきこと`);
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
  out.push(`_社長向け週次サマリー — 送信前にレビュー・編集してください。_`);
  out.push(`_機密項目はマーク付きで表示:🏛 Board / 💴 Comp / 🔒 Exec-Only_`);

  return out.join("\n");
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
