import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Dot, Pill } from "@/components/Badges";
import { fmtMd, isOverdue } from "@/lib/utils";
import {
  SHARE_PROJECT_SELECT,
  shareProjectWhere,
  shareDecisionWhere,
  shareRiskWhere,
} from "@/lib/share-filters";

export const dynamic = "force-dynamic";

// 社長共有ビュー(トップ)
//
// セキュリティ境界:
//  - すべてのクエリは src/lib/share-filters.ts のヘルパー経由
//  - Project は SHARE_PROJECT_SELECT で許可フィールドのみ SELECT (privateMemo は含まない)
//  - 意思決定は visibility=ceo_shared & sensitivity=general のみ
//  - リスクは visibility=ceo_shared のみ
//  - board / compensation / executive_only タグは自動除外
export default async function SharePage() {
  const [projects, decisions, risks] = await Promise.all([
    prisma.project.findMany({
      where: shareProjectWhere({ status: { not: "完了" } }),
      orderBy: [{ priority: "desc" }, { riskLevel: "desc" }, { updatedAt: "desc" }],
      take: 8,
      select: SHARE_PROJECT_SELECT,
    }),
    prisma.decision.findMany({
      where: shareDecisionWhere({ status: { in: ["未対応", "検討中"] } }),
      orderBy: [{ importance: "desc" }, { deadline: "asc" }],
      take: 6,
      select: {
        id: true,
        topic: true,
        recommendation: true,
        importance: true,
        deadline: true,
        status: true,
        // ↓ 紐づくプロジェクトは name のみ。privateMemo は含めない。
        project: { select: { id: true, name: true } },
        // background / options / impactIfDelayed も意図的に省略 — 必要なら個別に許可
      },
    }),
    prisma.risk.findMany({
      where: shareRiskWhere({
        status: { not: "解消" },
        severity: { in: ["高", "中"] },
      }),
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        description: true,
        severity: true,
        status: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen pb-10">
      <AppHeader title="CEOダッシュボード" subtitle="重要事項のサマリー" shareMode />

      <div className="px-3 py-4 space-y-1">
        <h2 className="h-section"><span>重要プロジェクト ({projects.length})</span></h2>
        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="card card-pad text-center text-[13px] text-ink-400">該当なし</div>
          ) : (
            projects.map((p) => (
              <Link key={p.id} href={`/share/projects/${p.id}`} className="block">
                <div className="card card-pad active:bg-ink-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-ink-900">{p.name}</div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {p.owner ?? "—"}{p.department ? ` ・ ${p.department}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={p.status} />
                      <span className="pill bg-ink-100 text-ink-600">リスク {p.riskLevel}</span>
                    </div>
                  </div>
                  {p.currentSummary ? (
                    <p className="mt-2 line-clamp-3 text-[13px] text-ink-700">{p.currentSummary}</p>
                  ) : null}
                  {p.nextAction ? (
                    <div className="mt-2 rounded-md bg-ink-50 px-3 py-2 text-[12px] text-ink-700">
                      <span className="font-medium text-ink-800">次:</span> {p.nextAction}
                    </div>
                  ) : null}
                  {p.dueDate ? (
                    <div className={`mt-2 text-[11px] ${isOverdue(p.dueDate) ? "font-semibold text-bad-700" : "text-ink-500"}`}>
                      期限 {fmtMd(p.dueDate)}{isOverdue(p.dueDate) ? "(超過)" : ""}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </div>

        <h2 className="h-section"><span>判断が必要な事項 ({decisions.length})</span></h2>
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <div className="card card-pad text-center text-[13px] text-ink-400">なし</div>
          ) : (
            decisions.map((d) => (
              <div key={d.id} className="card card-pad">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-ink-900">{d.topic}</div>
                    {d.project ? <div className="mt-0.5 text-[12px] text-ink-500">{d.project.name}</div> : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill value={`重要度 ${d.importance}`} />
                    {d.deadline ? (
                      <span className={`pill ${isOverdue(d.deadline) ? "bg-bad-50 text-bad-700" : "bg-ink-100 text-ink-600"}`}>
                        {isOverdue(d.deadline) ? "期限超過" : `期限 ${fmtMd(d.deadline)}`}
                      </span>
                    ) : null}
                  </div>
                </div>
                {d.recommendation ? (
                  <div className="mt-2 text-[13px] text-ink-800">
                    <span className="font-medium text-ink-700">推奨案:</span> {d.recommendation}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <h2 className="h-section"><span>リスク・ブロッカー ({risks.length})</span></h2>
        <div className="space-y-2">
          {risks.length === 0 ? (
            <div className="card card-pad text-center text-[13px] text-ink-400">なし</div>
          ) : (
            risks.map((r) => (
              <div key={r.id} className="card card-pad">
                <div className="flex items-start gap-2.5">
                  <div className="mt-1.5"><Dot value={r.severity} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
                    {r.project ? (
                      <div className="mt-0.5 text-[12px] text-ink-500">{r.project.name}</div>
                    ) : null}
                  </div>
                  <Pill value={r.severity} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 text-center text-[11px] text-ink-400">
          ※ 共有ビューには「優子のみ」のメモ、Board / Compensation / Executive Only に
          分類された情報は含まれません。
        </div>
      </div>
    </div>
  );
}
