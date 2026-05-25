import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { daysAgo, fmtDate } from "@/lib/utils/date";
import { LevelBadge, Pill, StatusBadge } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

export default async function FrictionMapPage() {
  const [
    actionsByOwner,
    actionsByDept,
    blockedActions,
    stalePriorities,
    repeatedDecisionsNeeded,
    topTags,
    repeatedThemes,
    blockedProjects,
  ] = await Promise.all([
    prisma.actionItem.groupBy({
      by: ["ownerId"],
      where: { status: { notIn: ["Completed"] } },
      _count: { _all: true },
      orderBy: { _count: { ownerId: "desc" } },
      take: 10,
    }),
    prisma.actionItem.groupBy({
      by: ["departmentId"],
      where: { status: { notIn: ["Completed"] } },
      _count: { _all: true },
      orderBy: { _count: { departmentId: "desc" } },
      take: 10,
    }),
    prisma.actionItem.findMany({
      where: { status: "Blocked" },
      include: { owner: true, department: true, project: true },
    }),
    prisma.priority.findMany({
      where: { status: { notIn: ["Completed", "Paused"] }, lastUpdated: { lt: daysAgo(14) } },
      orderBy: { lastUpdated: "asc" },
    }),
    prisma.decisionNeeded.findMany({
      where: { status: { notIn: ["Decided", "Cancelled"] }, createdAt: { lt: daysAgo(14) } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tag.findMany({
      include: { _count: { select: { meetings: true, projects: true, actionItems: true, decisions: true } } },
    }),
    prisma.theme.findMany({ orderBy: [{ occurrences: "desc" }, { lastSeenAt: "desc" }], take: 10 }),
    prisma.project.findMany({ where: { status: "Blocked" } }),
  ]);

  const ownerIds = actionsByOwner.map((g) => g.ownerId).filter((x): x is string => !!x);
  const owners = ownerIds.length ? await prisma.person.findMany({ where: { id: { in: ownerIds } } }) : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const deptIds = actionsByDept.map((g) => g.departmentId).filter((x): x is string => !!x);
  const depts = deptIds.length ? await prisma.department.findMany({ where: { id: { in: deptIds } } }) : [];
  const deptMap = new Map(depts.map((d) => [d.id, d]));

  const sortedTags = topTags
    .map((t) => ({
      ...t,
      total:
        t._count.meetings + t._count.projects + t._count.actionItems + t._count.decisions,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <div>
      <PageHeader
        title="Organizational Friction Map"
        subtitle="Repeated delays, unclear ownership, recurring topics, and stuck dependencies."
      />

      <div className="grid grid-cols-12 gap-5">
        <Card title="Owners with most open action items" className="col-span-12 md:col-span-6">
          {actionsByOwner.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5 text-sm">
              {actionsByOwner.map((g) => (
                <li key={String(g.ownerId)} className="flex items-center justify-between">
                  <span>{g.ownerId ? ownerMap.get(g.ownerId)?.name ?? "—" : "Unassigned"}</span>
                  <span className="badge">{g._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Departments with most open action items" className="col-span-12 md:col-span-6">
          {actionsByDept.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1.5 text-sm">
              {actionsByDept.map((g) => (
                <li key={String(g.departmentId)} className="flex items-center justify-between">
                  <span>{g.departmentId ? deptMap.get(g.departmentId)?.name ?? "—" : "Unassigned"}</span>
                  <span className="badge">{g._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Blocked action items (${blockedActions.length})`} className="col-span-12 md:col-span-6">
          {blockedActions.length === 0 ? <Empty /> : (
            <ul className="space-y-2 text-sm">
              {blockedActions.map((a) => (
                <li key={a.id}>
                  <div className="text-ink-900">{a.description}</div>
                  <div className="text-[11px] text-ink-500">
                    {a.owner?.name ?? "Unassigned"} · {a.department?.name ?? "—"} · {a.project?.name ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Projects blocked (${blockedProjects.length})`} className="col-span-12 md:col-span-6">
          {blockedProjects.length === 0 ? <Empty /> : (
            <ul className="space-y-2 text-sm">
              {blockedProjects.map((p) => (
                <li key={p.id}>
                  <div className="text-ink-900">{p.name}</div>
                  {p.blockers ? <div className="text-[11px] text-risk-high">{p.blockers}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Priorities without recent updates (2 weeks+)`} className="col-span-12">
          {stalePriorities.length === 0 ? <Empty /> : (
            <ul className="space-y-1.5 text-sm">
              {stalePriorities.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>
                    {p.name} <span className="text-[11px] text-ink-500">— last update {fmtDate(p.lastUpdated)}</span>
                  </span>
                  <div className="flex gap-1.5"><LevelBadge value={p.level} /><StatusBadge value={p.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Decisions repeatedly postponed (open 2 weeks+)" className="col-span-12 md:col-span-6">
          {repeatedDecisionsNeeded.length === 0 ? <Empty /> : (
            <ul className="space-y-1.5 text-sm">
              {repeatedDecisionsNeeded.map((d) => (
                <li key={d.id} className="flex items-center justify-between">
                  <span>{d.title}</span>
                  <span className="badge-risk-med">open since {fmtDate(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Most frequent tags" className="col-span-12 md:col-span-6">
          {sortedTags.length === 0 ? <Empty /> : (
            <div className="flex flex-wrap gap-1.5">
              {sortedTags.map((t) => (
                <Pill key={t.id}>#{t.name} · {t.total}</Pill>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recurring themes" className="col-span-12">
          {repeatedThemes.length === 0 ? <Empty /> : (
            <ul className="space-y-1.5 text-sm">
              {repeatedThemes.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="badge">{t.occurrences}× · last {fmtDate(t.lastSeenAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`card card-pad ${className ?? ""}`}>
      <h2 className="h3 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-400">Nothing here yet.</p>;
}
