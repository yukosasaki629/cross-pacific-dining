import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Dot, Pill } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function RisksPage() {
  const risks = await prisma.risk.findMany({
    where: { status: { not: "解消" }, severity: { in: ["高", "中"] } },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: { project: { select: { id: true, name: true } } },
  });

  const high = risks.filter((r) => r.severity === "高");
  const med = risks.filter((r) => r.severity === "中");

  return (
    <div>
      <AppHeader title="リスクあり案件" subtitle={`高 ${high.length} 件 ・ 中 ${med.length} 件`} />

      <div className="px-3 py-4 space-y-1">
        {high.length > 0 ? (
          <>
            <h2 className="h-section"><span>高リスク ({high.length})</span></h2>
            <div className="space-y-2">
              {high.map((r) => <RiskCard key={r.id} risk={r} />)}
            </div>
          </>
        ) : null}

        {med.length > 0 ? (
          <>
            <h2 className="h-section"><span>中リスク ({med.length})</span></h2>
            <div className="space-y-2">
              {med.map((r) => <RiskCard key={r.id} risk={r} />)}
            </div>
          </>
        ) : null}

        {risks.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            中・高リスクはありません。
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: any }) {
  return (
    <Link href={risk.project ? `/projects/${risk.project.id}` : "#"} className="block">
      <div className="card card-pad active:bg-ink-50">
        <div className="flex items-start gap-2.5">
          <div className="mt-1.5"><Dot value={risk.severity} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-ink-900">{risk.description}</div>
            {risk.mitigation ? (
              <div className="mt-1 text-[12px] text-ink-600">
                <span className="font-medium">対応策:</span> {risk.mitigation}
              </div>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
              <span>{risk.project?.name ?? "プロジェクト未紐付け"}</span>
              <span>·</span>
              <span>担当: {risk.owner ?? "—"}</span>
              <span>·</span>
              <span>状況: {risk.status}</span>
            </div>
          </div>
          <Pill value={risk.severity} />
        </div>
      </div>
    </Link>
  );
}
