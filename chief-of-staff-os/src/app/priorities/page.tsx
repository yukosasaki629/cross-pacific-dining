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
        title="CEO Priority Dashboard"
        subtitle="What the CEO is focused on, what's slipping, and what needs attention."
        actions={<Link href="/priorities/new" className="btn-primary">+ New Priority</Link>}
      />

      {priorities.length === 0 ? (
        <EmptyState title="No priorities tracked yet" description="Start by adding the CEO's top 3–5 priorities." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Level</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Deadline</th>
                <th className="px-4 py-2 font-medium">Updated</th>
                <th className="px-4 py-2 font-medium">Open?</th>
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
                      <span className="ml-2 text-[10px] text-risk-med">stale (2w+)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5"><LevelBadge value={p.level} /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-2.5 text-ink-700">{p.owner?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.deadline)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.lastUpdated)}</td>
                  <td className="px-4 py-2.5 text-ink-700">
                    {p._count.decisionsNeeded > 0 ? (
                      <span className="badge-risk-med">{p._count.decisionsNeeded} decision needed</span>
                    ) : null}
                    {(overdueMap.get(p.id) ?? 0) > 0 ? (
                      <span className="ml-1 badge-risk-high">{overdueMap.get(p.id)} overdue</span>
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
