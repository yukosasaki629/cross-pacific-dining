import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { Pill } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

type Event = {
  date: Date;
  kind: "meeting" | "transcript" | "decision" | "decision-needed" | "priority" | "risk";
  title: string;
  detail?: string;
  href: string;
  meta?: string;
};

export default async function TimelinePage() {
  const [meetings, transcripts, decisions, dn, priorities, risks, themes] = await Promise.all([
    prisma.meeting.findMany({ orderBy: { date: "desc" }, take: 50 }),
    prisma.transcript.findMany({ orderBy: { uploadDate: "desc" }, take: 50 }),
    prisma.decision.findMany({ orderBy: { date: "desc" }, take: 50 }),
    prisma.decisionNeeded.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.priority.findMany({ orderBy: { lastUpdated: "desc" }, take: 50 }),
    prisma.risk.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.theme.findMany({ orderBy: { occurrences: "desc" }, take: 15 }),
  ]);

  const events: Event[] = [];
  for (const m of meetings) events.push({ date: m.date, kind: "meeting", title: m.title, detail: m.summary ?? undefined, href: `/meetings/${m.id}`, meta: m.meetingType });
  for (const t of transcripts) events.push({ date: t.uploadDate, kind: "transcript", title: t.filename ?? "Transcript uploaded", detail: t.transcriptText.slice(0, 200), href: `/transcripts/${t.id}` });
  for (const d of decisions) events.push({ date: d.date, kind: "decision", title: d.title, detail: d.rationale ?? d.finalDecision ?? undefined, href: `/decisions/${d.id}` });
  for (const d of dn) events.push({ date: d.createdAt, kind: "decision-needed", title: `Decision needed: ${d.title}`, detail: d.recommendation ?? undefined, href: `/decisions-needed/${d.id}` });
  for (const p of priorities) events.push({ date: p.lastUpdated, kind: "priority", title: `Priority update: ${p.name}`, detail: `${p.status} · ${p.level}`, href: `/priorities/${p.id}` });
  for (const r of risks) events.push({ date: r.createdAt, kind: "risk", title: `Risk flagged: ${r.description.slice(0, 80)}`, detail: r.mitigation ?? undefined, href: `/friction-map` });

  events.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // group by month
  const byMonth = new Map<string, Event[]>();
  for (const e of events) {
    const key = new Date(e.date).toLocaleString("en-US", { year: "numeric", month: "long" });
    (byMonth.get(key) ?? byMonth.set(key, []).get(key)!).push(e);
  }

  return (
    <div>
      <PageHeader
        title="Executive Intelligence Timeline"
        subtitle="A chronological view of meetings, decisions, risks, priority shifts, and recurring themes."
      />

      {themes.length > 0 ? (
        <div className="card card-pad mb-6">
          <h3 className="h3 mb-2">Recurring themes</h3>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => (
              <Pill key={t.id} className="border-accent-100 bg-accent-50 text-accent-700">
                {t.name} · {t.occurrences}×
              </Pill>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-7">
        {Array.from(byMonth.entries()).map(([month, list]) => (
          <section key={month}>
            <h2 className="h3 mb-2">{month}</h2>
            <ol className="border-l border-ink-200 pl-5">
              {list.map((e, i) => (
                <li key={i} className="relative mb-4 pb-1">
                  <span className="absolute -left-[24px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-500" />
                  <div className="text-[11px] uppercase tracking-wide text-ink-500">
                    {fmtDate(e.date)} · {e.kind}{e.meta ? ` · ${e.meta}` : ""}
                  </div>
                  <Link href={e.href} className="link font-medium text-ink-900">{e.title}</Link>
                  {e.detail ? <p className="mt-0.5 text-sm text-ink-600">{e.detail}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ))}
        {events.length === 0 ? (
          <div className="card card-pad text-center text-ink-400">
            Timeline is empty. Start adding meetings to see events here.
          </div>
        ) : null}
      </div>
    </div>
  );
}
