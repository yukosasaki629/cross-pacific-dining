import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateDecision, deleteDecision } from "../actions";
import { toInputDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function DecisionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.decision.findUnique({
    where: { id },
    include: { owner: true, meeting: true, priority: true, project: true },
  });
  if (!d) notFound();

  return (
    <div>
      <PageHeader
        title={d.title}
        actions={
          <>
            <Link href="/decisions" className="btn">← Back</Link>
            <form action={async () => { "use server"; await deleteDecision(d.id); }}>
              <button type="submit" className="btn-danger">Delete</button>
            </form>
          </>
        }
      />
      <form action={updateDecision.bind(null, d.id)} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">Title</label>
            <input name="title" defaultValue={d.title} className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Date</label>
            <input name="date" type="date" defaultValue={toInputDate(d.date)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Owner</label>
            <input name="ownerName" defaultValue={d.owner?.name ?? ""} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="label">Context</label>
            <textarea name="context" defaultValue={d.context ?? ""} className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Options</label>
            <textarea name="options" defaultValue={d.options ?? ""} className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Final decision</label>
            <textarea name="finalDecision" defaultValue={d.finalDecision ?? ""} className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Rationale</label>
            <textarea name="rationale" defaultValue={d.rationale ?? ""} className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Expected impact</label>
            <textarea name="expectedImpact" defaultValue={d.expectedImpact ?? ""} className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Participants</label>
            <input name="participants" defaultValue={d.participants ?? ""} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Review date</label>
            <input name="reviewDate" type="date" defaultValue={toInputDate(d.reviewDate)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3 flex items-end">
            <label className="text-sm text-ink-700">
              <input type="checkbox" name="followUpRequired" defaultChecked={d.followUpRequired} className="mr-2 align-middle" />
              Follow-up required
            </label>
          </div>
          <div className="col-span-12">
            <label className="label">Notes</label>
            <textarea name="notes" defaultValue={d.notes ?? ""} className="textarea font-sans" />
          </div>
        </div>

        {d.meeting ? (
          <div className="rounded border border-ink-100 bg-ink-50/40 p-3 text-xs text-ink-600">
            From meeting: <Link className="link" href={`/meetings/${d.meeting.id}`}>{d.meeting.title}</Link>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
