import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";
import { fmtDate } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = sp?.view ?? "all";
  const where: any = {};
  if (view === "at-risk") where.status = { in: ["At Risk", "Blocked"] };
  if (view === "blocked") where.status = "Blocked";
  if (view === "no-owner") where.ownerId = null;
  if (view === "ai") where.OR = [
    { name: { contains: "AI" } },
    { description: { contains: "AI" } },
    { tags: { some: { name: "AI" } } },
  ];

  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ status: "asc" }, { priorityLevel: "asc" }, { lastUpdated: "desc" }],
    include: { owner: true, sponsor: true, _count: { select: { actionItems: true, riskRecords: true } } },
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "at-risk", label: "At risk / blocked" },
    { key: "blocked", label: "Blocked only" },
    { key: "no-owner", label: "No owner" },
    { key: "ai", label: "AI / automation" },
  ];

  return (
    <div>
      <PageHeader
        title="Cross-functional Project Tracker"
        subtitle="Strategic and cross-functional initiatives."
        actions={<Link href="/projects/new" className="btn-primary">+ New Project</Link>}
      />

      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <Link key={t.key} href={`/projects?view=${t.key}`}
            className={`btn ${view === t.key ? "border-accent-600 text-accent-700" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Sponsor</th>
                <th className="px-4 py-2 font-medium">Phase</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-ink-900 hover:underline">{p.name}</Link>
                    {p.blockers ? <div className="mt-0.5 text-[11px] text-risk-high">Blocker: {p.blockers}</div> : null}
                  </td>
                  <td className="px-4 py-2.5 text-ink-700">{p.owner?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{p.sponsor?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{p.currentPhase ?? "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-2.5"><LevelBadge value={p.priorityLevel} /></td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.targetDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
