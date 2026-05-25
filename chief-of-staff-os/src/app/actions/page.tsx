import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";
import { fmtDate, isOverdue } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

type View = "all" | "overdue" | "by-owner" | "by-dept" | "ceo" | "blocked";

export default async function ActionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = ((sp?.view ?? "all") as View);

  const where: any = {};
  if (view === "overdue") {
    where.status = { notIn: ["Completed"] };
    where.dueDate = { lt: new Date() };
  } else if (view === "ceo") {
    where.priorityId = { not: null };
  } else if (view === "blocked") {
    where.status = "Blocked";
  }

  const actions = await prisma.actionItem.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: { owner: true, department: true, priority: true, project: true, meeting: true },
  });

  // group by owner / dept for those views
  const grouped: Record<string, typeof actions> = {};
  if (view === "by-owner") {
    for (const a of actions) {
      const k = a.owner?.name ?? "Unassigned";
      (grouped[k] ||= []).push(a);
    }
  } else if (view === "by-dept") {
    for (const a of actions) {
      const k = a.department?.name ?? "—";
      (grouped[k] ||= []).push(a);
    }
  }

  const tabs: { key: View; label: string }[] = [
    { key: "all", label: "All" },
    { key: "overdue", label: "Overdue" },
    { key: "by-owner", label: "By owner" },
    { key: "by-dept", label: "By department" },
    { key: "ceo", label: "On CEO priorities" },
    { key: "blocked", label: "Blocked" },
  ];

  return (
    <div>
      <PageHeader
        title="Action Item Tracker"
        subtitle="Follow-ups from meetings and CEO discussions."
        actions={<Link href="/actions/new" className="btn-primary">+ New Action</Link>}
      />

      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/actions?view=${t.key}`}
            className={`btn ${view === t.key ? "border-accent-600 text-accent-700" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {actions.length === 0 ? (
        <EmptyState title="No action items in this view" />
      ) : view === "by-owner" || view === "by-dept" ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([k, list]) => (
            <div key={k} className="card overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-600">
                {k} · {list.length}
              </div>
              <ActionRows actions={list} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ActionRows actions={actions} />
        </div>
      )}
    </div>
  );
}

function ActionRows({ actions }: { actions: any[] }) {
  return (
    <table className="w-full text-sm table-zebra">
      <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
        <tr>
          <th className="px-4 py-2 font-medium">Description</th>
          <th className="px-4 py-2 font-medium">Owner</th>
          <th className="px-4 py-2 font-medium">Due</th>
          <th className="px-4 py-2 font-medium">Urgency</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Linked</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((a) => (
          <tr key={a.id} className="border-b border-ink-100">
            <td className="px-4 py-2.5">
              <Link href={`/actions/${a.id}`} className="text-ink-900 hover:underline">{a.description}</Link>
            </td>
            <td className="px-4 py-2.5 text-ink-700">{a.owner?.name ?? "—"}</td>
            <td className={`px-4 py-2.5 ${a.status !== "Completed" && isOverdue(a.dueDate) ? "text-risk-high font-medium" : "text-ink-700"}`}>
              {fmtDate(a.dueDate)}
            </td>
            <td className="px-4 py-2.5"><LevelBadge value={a.urgency} /></td>
            <td className="px-4 py-2.5"><StatusBadge value={a.status} /></td>
            <td className="px-4 py-2.5 text-[11px] text-ink-500">
              {a.priority ? <>P:{a.priority.name} </> : null}
              {a.project ? <>· Pj:{a.project.name} </> : null}
              {a.meeting ? <>· <Link className="link" href={`/meetings/${a.meeting.id}`}>M:{a.meeting.title}</Link></> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
