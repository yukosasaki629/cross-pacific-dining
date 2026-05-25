import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PRIORITY_LEVEL, PRIORITY_STATUS } from "@/lib/vocab";
import { updatePriority, deletePriority } from "../actions";
import { fmtDate, toInputDate } from "@/lib/utils/date";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

export default async function PriorityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.priority.findUnique({
    where: { id },
    include: {
      owner: true,
      actionItems: { include: { owner: true }, orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { date: "desc" } },
      decisionsNeeded: { orderBy: { createdAt: "desc" } },
      meetings: { orderBy: { date: "desc" } },
      projects: true,
    },
  });
  if (!p) notFound();

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`Owner: ${p.owner?.name ?? "—"} · Updated ${fmtDate(p.lastUpdated)}`}
        actions={
          <>
            <Link href="/priorities" className="btn">← Back</Link>
            <form action={async () => { "use server"; await deletePriority(p.id); }}>
              <button className="btn-danger" type="submit">Delete</button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={updatePriority.bind(null, p.id)} className="card card-pad col-span-12 lg:col-span-7 space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-8">
              <label className="label">Name</label>
              <input name="name" defaultValue={p.name} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Level</label>
              <select name="level" defaultValue={p.level} className="input">
                {PRIORITY_LEVEL.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Status</label>
              <select name="status" defaultValue={p.status} className="input">
                {PRIORITY_STATUS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Owner</label>
              <input name="ownerName" defaultValue={p.owner?.name ?? ""} className="input" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Deadline</label>
              <input name="deadline" type="date" defaultValue={toInputDate(p.deadline)} className="input" />
            </div>
            <div className="col-span-12">
              <label className="label">Description</label>
              <textarea name="description" defaultValue={p.description ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Key risks</label>
              <textarea name="keyRisks" defaultValue={p.keyRisks ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Next action</label>
              <input name="nextAction" defaultValue={p.nextAction ?? ""} className="input" />
            </div>
            <div className="col-span-12">
              <label className="label">Notes</label>
              <textarea name="notes" defaultValue={p.notes ?? ""} className="textarea font-sans" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" type="submit">Save</button>
          </div>
        </form>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">Snapshot</h3>
            <div className="flex gap-2">
              <LevelBadge value={p.level} />
              <StatusBadge value={p.status} />
            </div>
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Action items ({p.actionItems.length})</h3>
            {p.actionItems.length === 0 ? (
              <p className="text-sm text-ink-400">None linked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {p.actionItems.map((a) => (
                  <li key={a.id} className="border-b border-ink-100 pb-1.5">
                    <div>{a.description}</div>
                    <div className="text-[11px] text-ink-500">
                      {a.owner?.name ?? "Unassigned"} · {a.status}{a.dueDate ? ` · due ${fmtDate(a.dueDate)}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Decisions made ({p.decisions.length})</h3>
            {p.decisions.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">{p.decisions.map((d) => <li key={d.id}>{d.title}</li>)}</ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Decisions needed ({p.decisionsNeeded.length})</h3>
            {p.decisionsNeeded.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">{p.decisionsNeeded.map((d) => <li key={d.id}>{d.title}</li>)}</ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Related meetings ({p.meetings.length})</h3>
            {p.meetings.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">
                {p.meetings.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <Link href={`/meetings/${m.id}`} className="link">{m.title}</Link>{" "}
                    <span className="text-[11px] text-ink-500">{fmtDate(m.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
