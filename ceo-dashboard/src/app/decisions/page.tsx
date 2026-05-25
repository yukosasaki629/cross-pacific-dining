import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { fmtDate, fmtMd, isOverdue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const decisions = await prisma.decision.findMany({
    where: { status: { in: ["未対応", "検討中"] } },
    orderBy: [{ deadline: "asc" }, { importance: "desc" }],
    include: { project: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <AppHeader title="判断が必要な事項" subtitle={`${decisions.length} 件`} />
      <div className="space-y-2 px-3 py-4">
        {decisions.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">判断待ちはありません。</div>
        ) : (
          decisions.map((d) => (
            <div key={d.id} className="card card-pad">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-ink-900">{d.topic}</div>
                  {d.project ? (
                    <Link href={`/projects/${d.project.id}`} className="mt-0.5 inline-block text-[12px] text-accent-700 hover:underline">
                      {d.project.name}
                    </Link>
                  ) : null}
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
                <div className="mt-2 rounded-md bg-ink-50 px-3 py-2 text-[13px] text-ink-800">
                  <span className="font-medium text-ink-700">推奨案:</span> {d.recommendation}
                </div>
              ) : null}
              {d.impactIfDelayed ? (
                <div className="mt-2 text-[12px] text-ink-600">
                  <span className="font-medium">遅れた場合:</span> {d.impactIfDelayed}
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
                <span>状況: {d.status}</span>
                {d.deadline ? <span>判断期限 {fmtDate(d.deadline)}</span> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
