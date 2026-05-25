import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DecisionsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = sp?.view ?? "all";
  const where: any = {};
  if (view === "follow-up") where.followUpRequired = true;
  if (view === "no-owner") where.ownerId = null;

  const decisions = await prisma.decision.findMany({
    where,
    orderBy: { date: "desc" },
    include: { owner: true, meeting: true, priority: true, project: true },
  });

  const tabs = [
    { key: "all", label: "Recent" },
    { key: "follow-up", label: "Needs follow-up" },
    { key: "no-owner", label: "No clear owner" },
  ];

  return (
    <div>
      <PageHeader
        title="Decision Log"
        subtitle="Why we decided what we decided."
        actions={<Link href="/decisions/new" className="btn-primary">+ New Decision</Link>}
      />

      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <Link key={t.key} href={`/decisions?view=${t.key}`}
            className={`btn ${view === t.key ? "border-accent-600 text-accent-700" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {decisions.length === 0 ? (
        <EmptyState title="No decisions logged in this view." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">Follow-up?</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/decisions/${d.id}`} className="text-ink-900 hover:underline">{d.title}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(d.date)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{d.owner?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">
                    {d.meeting ? <Link className="link" href={`/meetings/${d.meeting.id}`}>{d.meeting.title}</Link> : "—"}
                  </td>
                  <td className="px-4 py-2.5">{d.followUpRequired ? <span className="badge-risk-med">Yes</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
