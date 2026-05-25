import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";
import { fmtDate, daysAgo, isOverdue } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    topPriorities,
    atRiskPriorities,
    overdueActions,
    decisionsNeeded,
    atRiskProjects,
    recentMeetings,
    stalePriorities,
  ] = await Promise.all([
    prisma.priority.findMany({
      where: { status: { in: ["On Track", "At Risk", "Delayed"] } },
      orderBy: [{ level: "asc" }, { lastUpdated: "desc" }],
      take: 5,
      include: { owner: true },
    }),
    prisma.priority.findMany({
      where: { status: { in: ["At Risk", "Delayed"] } },
      orderBy: { lastUpdated: "desc" },
      take: 5,
      include: { owner: true },
    }),
    prisma.actionItem.findMany({
      where: {
        status: { notIn: ["Completed", "Blocked"] },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { owner: true },
    }),
    prisma.decisionNeeded.findMany({
      where: { status: { in: ["Open", "Awaiting Info", "Awaiting CEO"] } },
      orderBy: { deadline: "asc" },
      take: 6,
    }),
    prisma.project.findMany({
      where: { status: { in: ["At Risk", "Blocked"] } },
      orderBy: { lastUpdated: "desc" },
      take: 5,
    }),
    prisma.meeting.findMany({
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, title: true, date: true, meetingType: true, summary: true },
    }),
    prisma.priority.findMany({
      where: {
        status: { notIn: ["Completed", "Paused"] },
        lastUpdated: { lt: daysAgo(14) },
      },
      orderBy: { lastUpdated: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="A calm view of what matters this week."
      />

      <div className="grid grid-cols-12 gap-5">
        <Section className="col-span-12 lg:col-span-7" title="Top CEO Priorities" href="/priorities">
          {topPriorities.length === 0 ? (
            <Empty msg="No priorities yet. Add one from the CEO Priorities page." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {topPriorities.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <Link href={`/priorities/${p.id}`} className="link text-sm font-medium text-ink-900">
                      {p.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-ink-500">
                      Owner: {p.owner?.name ?? "—"} · Updated {fmtDate(p.lastUpdated)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <LevelBadge value={p.level} />
                    <StatusBadge value={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12 lg:col-span-5" title="Decisions Needed" href="/decisions-needed">
          {decisionsNeeded.length === 0 ? (
            <Empty msg="Nothing waiting on a decision." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {decisionsNeeded.map((d) => (
                <li key={d.id} className="py-3">
                  <div className="text-sm font-medium text-ink-900">{d.title}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {d.deadline ? `Deadline ${fmtDate(d.deadline)}` : "No deadline"} ·{" "}
                    <StatusBadge value={d.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12 lg:col-span-7" title="Overdue Action Items" href="/actions">
          {overdueActions.length === 0 ? (
            <Empty msg="No overdue actions. Nice." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {overdueActions.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <div className="text-sm text-ink-900">{a.description}</div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {a.owner?.name ?? "Unassigned"} · Due {fmtDate(a.dueDate)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <LevelBadge value={a.urgency} />
                    <StatusBadge value={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12 lg:col-span-5" title="Priorities at Risk" href="/priorities">
          {atRiskPriorities.length === 0 ? (
            <Empty msg="No priorities flagged at risk." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {atRiskPriorities.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/priorities/${p.id}`} className="text-sm font-medium text-ink-900 hover:underline">
                      {p.name}
                    </Link>
                    <StatusBadge value={p.status} />
                  </div>
                  {p.keyRisks ? <div className="mt-1 text-xs text-ink-500">{p.keyRisks}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12 lg:col-span-7" title="Recent Meetings" href="/meetings">
          {recentMeetings.length === 0 ? (
            <Empty msg="No meetings captured yet." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recentMeetings.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/meetings/${m.id}`} className="link text-sm font-medium text-ink-900">
                      {m.title}
                    </Link>
                    <div className="shrink-0 text-xs text-ink-500">
                      {fmtDate(m.date)} · {m.meetingType}
                    </div>
                  </div>
                  {m.summary ? (
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500">{m.summary}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12 lg:col-span-5" title="Projects At Risk / Blocked" href="/projects">
          {atRiskProjects.length === 0 ? (
            <Empty msg="No projects at risk." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {atRiskProjects.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-ink-900">{p.name}</div>
                    <StatusBadge value={p.status} />
                  </div>
                  {p.blockers ? <div className="mt-1 text-xs text-ink-500">Blockers: {p.blockers}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section className="col-span-12" title="Priorities Without Recent Updates (2 weeks+)" href="/priorities">
          {stalePriorities.length === 0 ? (
            <Empty msg="All priorities have recent updates." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {stalePriorities.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/priorities/${p.id}`} className="text-sm font-medium text-ink-900 hover:underline">
                      {p.name}
                    </Link>
                    <div className="mt-0.5 text-xs text-ink-500">
                      Last update {fmtDate(p.lastUpdated)} ·{" "}
                      {isOverdue(p.deadline) ? "deadline passed" : `deadline ${fmtDate(p.deadline)}`}
                    </div>
                  </div>
                  <StatusBadge value={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  className,
  title,
  href,
  children,
}: {
  className?: string;
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`card card-pad ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="h3">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs text-ink-500 hover:text-ink-800">
            View all →
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="py-6 text-center text-sm text-ink-400">{msg}</div>;
}
