import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate, isOverdue } from "@/lib/utils/date";
import { StatusBadge } from "@/components/ui/Badges";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DecisionsNeededPage() {
  const items = await prisma.decisionNeeded.findMany({
    where: { status: { notIn: ["Decided", "Cancelled"] } },
    orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    include: { project: true, priority: true, meeting: true, owner: true },
  });
  const dueThisWeek = items.filter(
    (d) => d.deadline && new Date(d.deadline) <= new Date(Date.now() + 7 * 86400000),
  );
  const overdue = items.filter((d) => isOverdue(d.deadline));

  return (
    <div>
      <PageHeader
        title="判断待ち事項"
        subtitle="CEO / 経営陣の判断を待っている未解決事項。"
        actions={<Link href="/decisions-needed/new" className="btn-primary">+ 新規</Link>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="未対応件数" value={items.length} />
        <Stat label="今週中に期限" value={dueThisWeek.length} accent={dueThisWeek.length > 0 ? "med" : undefined} />
        <Stat label="期限超過" value={overdue.length} accent={overdue.length > 0 ? "high" : undefined} />
      </div>

      {items.length === 0 ? (
        <EmptyState title="待機中の判断はありません" description="未対応の判断待ち事項はゼロです。" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">判断事項</th>
                <th className="px-4 py-2 font-medium">期限</th>
                <th className="px-4 py-2 font-medium">ステータス</th>
                <th className="px-4 py-2 font-medium">遅延時の影響</th>
                <th className="px-4 py-2 font-medium">関連</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/decisions-needed/${d.id}`} className="text-ink-900 hover:underline">{d.title}</Link>
                    {d.recommendation ? (
                      <div className="mt-0.5 text-[11px] text-ink-500">推奨案: {d.recommendation}</div>
                    ) : null}
                  </td>
                  <td className={`px-4 py-2.5 ${isOverdue(d.deadline) ? "text-risk-high font-medium" : "text-ink-700"}`}>
                    {fmtDate(d.deadline)}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge value={d.status} /></td>
                  <td className="px-4 py-2.5 text-xs text-ink-600">{d.impactIfDelayed ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[11px] text-ink-500">
                    {d.priority ? <>優: {d.priority.name} </> : null}
                    {d.project ? <>· P: {d.project.name} </> : null}
                    {d.meeting ? <>· 会: {d.meeting.title}</> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "med" | "high" }) {
  const cls = accent === "high" ? "text-risk-high" : accent === "med" ? "text-risk-med" : "text-ink-900";
  return (
    <div className="card card-pad">
      <div className="text-[11px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
