import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { PROJECT_STATUS, PRIORITY_LEVEL } from "@/lib/vocab";
import { updateProject, deleteProject } from "../actions";
import { toInputDate, fmtDate } from "@/lib/utils/date";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true, sponsor: true,
      actionItems: { include: { owner: true } },
      decisions: true,
      decisionsNeeded: true,
      meetings: { take: 10, orderBy: { date: "desc" } },
      priorities: true,
    },
  });
  if (!p) notFound();

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`Owner: ${p.owner?.name ?? "—"} · Sponsor: ${p.sponsor?.name ?? "—"} · Updated ${fmtDate(p.lastUpdated)}`}
        actions={
          <>
            <Link href="/projects" className="btn">← Back</Link>
            <form action={async () => { "use server"; await deleteProject(p.id); }}>
              <button className="btn-danger" type="submit">Delete</button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={updateProject.bind(null, p.id)} className="card card-pad col-span-12 lg:col-span-8 space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-8">
              <label className="label">Name</label>
              <input name="name" defaultValue={p.name} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Status</label>
              <select name="status" defaultValue={p.status} className="input">
                {PROJECT_STATUS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Priority</label>
              <select name="priorityLevel" defaultValue={p.priorityLevel} className="input">
                {PRIORITY_LEVEL.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="col-span-6 md:col-span-4">
              <label className="label">Owner</label>
              <input name="ownerName" defaultValue={p.owner?.name ?? ""} className="input" />
            </div>
            <div className="col-span-6 md:col-span-4">
              <label className="label">Sponsor</label>
              <input name="sponsorName" defaultValue={p.sponsor?.name ?? ""} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Start</label>
              <input name="startDate" type="date" defaultValue={toInputDate(p.startDate)} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Target</label>
              <input name="targetDate" type="date" defaultValue={toInputDate(p.targetDate)} className="input" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Current phase</label>
              <input name="currentPhase" defaultValue={p.currentPhase ?? ""} className="input" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Milestones</label>
              <textarea name="milestones" defaultValue={p.milestones ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Dependencies</label>
              <textarea name="dependencies" defaultValue={p.dependencies ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Risks</label>
              <textarea name="risks" defaultValue={p.risks ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Blockers</label>
              <textarea name="blockers" defaultValue={p.blockers ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Description</label>
              <textarea name="description" defaultValue={p.description ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Notes</label>
              <textarea name="notes" defaultValue={p.notes ?? ""} className="textarea font-sans" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Save</button>
          </div>
        </form>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">Snapshot</h3>
            <div className="flex gap-2"><StatusBadge value={p.status} /><LevelBadge value={p.priorityLevel} /></div>
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Linked actions ({p.actionItems.length})</h3>
            {p.actionItems.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">{p.actionItems.map((a) => (
                <li key={a.id}>{a.description} <span className="text-[11px] text-ink-500">— {a.status}</span></li>
              ))}</ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Decisions needed ({p.decisionsNeeded.length})</h3>
            {p.decisionsNeeded.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">{p.decisionsNeeded.map((d) => <li key={d.id}>{d.title}</li>)}</ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Recent meetings ({p.meetings.length})</h3>
            {p.meetings.length === 0 ? <p className="text-sm text-ink-400">None.</p> : (
              <ul className="space-y-1 text-sm">
                {p.meetings.map((m) => (
                  <li key={m.id}><Link href={`/meetings/${m.id}`} className="link">{m.title}</Link></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
