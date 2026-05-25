import { PageHeader } from "@/components/ui/PageHeader";
import { createDecision } from "../actions";

export default function NewDecisionPage() {
  return (
    <div>
      <PageHeader title="New Decision" />
      <form action={createDecision} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">Title</label>
            <input name="title" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Date</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Owner</label>
            <input name="ownerName" className="input" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="label">Context</label>
            <textarea name="context" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Options considered</label>
            <textarea name="options" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Final decision</label>
            <textarea name="finalDecision" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Rationale</label>
            <textarea name="rationale" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Expected impact</label>
            <textarea name="expectedImpact" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Participants</label>
            <input name="participants" className="input" placeholder="CEO, CFO, Yuko" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Review date</label>
            <input name="reviewDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-3 flex items-end">
            <label className="text-sm text-ink-700"><input type="checkbox" name="followUpRequired" className="mr-2 align-middle" />Follow-up required</label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/decisions" className="btn">Cancel</a>
          <button className="btn-primary">Save decision</button>
        </div>
      </form>
    </div>
  );
}
