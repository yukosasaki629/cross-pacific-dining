import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Dot, Pill } from "@/components/Badges";
import { fmtDate, isOverdue } from "@/lib/utils";

export const dynamic = "force-dynamic";

// 社長共有ビュー(プロジェクト詳細)— 非公開メモは絶対に表示しない
export default async function ShareProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      decisions: { where: { status: { in: ["未対応", "検討中"] } }, orderBy: { deadline: "asc" } },
      risks: { where: { status: { not: "解消" } }, orderBy: [{ severity: "desc" }] },
      updates: { orderBy: { date: "desc" }, take: 5 },
    },
  });
  if (!p || !p.isSharedWithCEO) notFound();

  return (
    <div className="min-h-screen pb-10">
      <AppHeader
        title={p.name}
        subtitle={`${p.owner ?? "—"}${p.department ? ` ・ ${p.department}` : ""}`}
        backHref="/share"
        shareMode
        rightSlot={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Pill value={p.status} />
            <span className="pill bg-ink-100 text-ink-600">リスク {p.riskLevel}</span>
          </div>
        }
      />

      <div className="px-3 py-4 space-y-3">
        {p.objective ? (
          <Card label="目的">{p.objective}</Card>
        ) : null}
        {p.currentSummary ? (
          <Card label="現在の状況">{p.currentSummary}</Card>
        ) : null}
        {p.nextAction ? (
          <Card label="次のアクション">{p.nextAction}</Card>
        ) : null}
        {p.successMetric ? (
          <Card label="成功指標">{p.successMetric}</Card>
        ) : null}
        {p.dueDate ? (
          <Card label="期限">
            <span className={isOverdue(p.dueDate) ? "font-medium text-bad-700" : ""}>
              {fmtDate(p.dueDate)}{isOverdue(p.dueDate) ? "(超過)" : ""}
            </span>
          </Card>
        ) : null}

        {p.decisions.length > 0 ? (
          <>
            <h2 className="h-section"><span>判断が必要な事項 ({p.decisions.length})</span></h2>
            <ul className="space-y-2">
              {p.decisions.map((d) => (
                <li key={d.id} className="card card-pad">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-medium text-ink-900">{d.topic}</div>
                    <Pill value={`重要度 ${d.importance}`} />
                  </div>
                  {d.recommendation ? (
                    <div className="mt-1.5 text-[12px] text-ink-700"><span className="font-medium">推奨案:</span> {d.recommendation}</div>
                  ) : null}
                  {d.deadline ? (
                    <div className="mt-1 text-[11px] text-ink-500">判断期限: {fmtDate(d.deadline)}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {p.risks.length > 0 ? (
          <>
            <h2 className="h-section"><span>リスク ({p.risks.length})</span></h2>
            <ul className="space-y-2">
              {p.risks.map((r) => (
                <li key={r.id} className="card card-pad">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5"><Dot value={r.severity} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
                      {r.mitigation ? (
                        <div className="mt-1 text-[12px] text-ink-600">対応策: {r.mitigation}</div>
                      ) : null}
                    </div>
                    <Pill value={r.severity} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {p.updates.length > 0 ? (
          <>
            <h2 className="h-section"><span>直近の更新</span></h2>
            <ol className="space-y-3 border-l border-ink-200 pl-4">
              {p.updates.map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-600" />
                  <div className="text-[11px] text-ink-500">{fmtDate(u.date)}</div>
                  <div className="mt-0.5 whitespace-pre-wrap text-[13px] text-ink-900">{u.content}</div>
                  {u.nextAction ? (
                    <div className="mt-1 rounded-md bg-ink-50 px-2.5 py-1.5 text-[12px] text-ink-700">
                      <span className="font-medium">次:</span> {u.nextAction}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        ) : null}

        <div className="pt-4 text-center text-[11px] text-ink-400">
          ※ 社長共有ビューです。優子用の詳細・非公開メモは含まれません。
        </div>
      </div>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-900">{children}</div>
    </div>
  );
}
