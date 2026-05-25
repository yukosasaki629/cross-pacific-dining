import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";
import { fmtDate, daysAgo } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function PrioritiesPage() {
  const priorities = await prisma.priority.findMany({
    orderBy: [{ status: "asc" }, { level: "asc" }, { lastUpdated: "desc" }],
    include: {
      owner: true,
      _count: { select: { actionItems: true, decisionsNeeded: true, projects: true } },
    },
  });

  const overdueByPriority = await prisma.actionItem.groupBy({
    by: ["priorityId"],
    where: { status: { notIn: ["Completed"] }, dueDate: { lt: new Date() } },
    _count: { _all: true },
  });
  const overdueMap = new Map(overdueByPriority.map((g) => [g.priorityId, g._count._all]));

  const stale = new Set(priorities.filter((p) => p.lastUpdated < daysAgo(14)).map((p) => p.id));

  return (
    <div>
      <PageHeader
        title="CEO 優先事項"
        subtitle="CEOが今フォーカスしていること、進捗、要注意点を一覧。"
        actions={<Link href="/priorities/new" className="btn-primary">+ 新規優先事項</Link>}
      />

      {priorities.length === 0 ? (
        <EmptyState title="優先事項が未登録です" description="まずはCEOのトップ3〜5を登録しましょう。" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">優先事項</th>
                <th className="px-4 py-2 font-medium">レベル</th>
                <th className="px-4 py-2 font-medium">ステータス</th>
                <th className="px-4 py-2 font-medium">担当</th>
                <th className="px-4 py-2 font-medium">期限</th>
                <th className="px-4 py-2 font-medium">更新</th>
                <th className="px-4 py-2 font-medium">未対応</th>
              </tr>
            </thead>
            <tbody>
              {priorities.map((p) => (
                <tr key={p.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/priorities/${p.id}`} className="font-medium text-ink-900 hover:underline">
                      {p.name}
                    </Link>
                    {stale.has(p.id) ? (
                      <span className="ml-2 text-[10px] text-risk-med">2週間以上 更新なし</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5"><LevelBadge value={p.level} /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-2.5 text-ink-700">{p.owner?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.deadline)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.lastUpdated)}</td>
                  <td className="px-4 py-2.5 text-ink-700">
                    {p._count.decisionsNeeded > 0 ? (
                      <span className="badge-risk-med">判断待ち {p._count.decisionsNeeded}件</span>
                    ) : null}
                    {(overdueMap.get(p.id) ?? 0) > 0 ? (
                      <span className="ml-1 badge-risk-high">期限超過 {overdueMap.get(p.id)}件</span>
                    ) : null}
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
