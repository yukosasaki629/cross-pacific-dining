import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { DECISION_NEEDED_STATUS } from "@/lib/vocab";
import { updateDecisionNeeded, deleteDecisionNeeded, promoteToDecision } from "../actions";
import { toInputDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function DnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.decisionNeeded.findUnique({
    where: { id },
    include: { meeting: true, priority: true, project: true, owner: true },
  });
  if (!d) notFound();
  return (
    <div>
      <PageHeader
        title={d.title}
        actions={
          <>
            <Link href="/decisions-needed" className="btn">← Back</Link>
            <form action={async () => { "use server"; await deleteDecisionNeeded(d.id); }}>
              <button className="btn-danger" type="submit">Delete</button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={updateDecisionNeeded.bind(null, d.id)} className="card card-pad col-span-12 lg:col-span-8 space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-8">
              <label className="label">Title</label>
              <input name="title" defaultValue={d.title} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Status</label>
              <select name="status" defaultValue={d.status} className="input">
                {DECISION_NEEDED_STATUS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">Deadline</label>
              <input name="deadline" type="date" defaultValue={toInputDate(d.deadline)} className="input" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Background</label>
              <textarea name="background" defaultValue={d.background ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Options</label>
              <textarea name="options" defaultValue={d.options ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Recommendation</label>
              <textarea name="recommendation" defaultValue={d.recommendation ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">Impact if delayed</label>
              <textarea name="impactIfDelayed" defaultValue={d.impactIfDelayed ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">Notes</label>
              <textarea name="notes" defaultValue={d.notes ?? ""} className="textarea font-sans" />
            </div>
          </div>
          <div className="flex justify-end"><button className="btn-primary">Save</button></div>
        </form>

        <form action={promoteToDecision.bind(null, d.id)} className="card card-pad col-span-12 lg:col-span-4 space-y-3">
          <h3 className="h3">Promote to Decision Log</h3>
          <p className="text-xs text-ink-500">When this is decided, copy it to the Decision Log with rationale.</p>
          <div>
            <label className="label">Final decision (overrides recommendation if set)</label>
            <textarea name="finalDecision" className="textarea font-sans" />
          </div>
          <div>
            <label className="label">Rationale</label>
            <textarea name="rationale" className="textarea font-sans" />
          </div>
          <button className="btn-primary w-full" type="submit">Promote &amp; close</button>
        </form>
      </div>
    </div>
  );
}
