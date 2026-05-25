import { PageHeader } from "@/components/ui/PageHeader";
import { DECISION_NEEDED_STATUS } from "@/lib/vocab";
import { createDecisionNeeded } from "../actions";

export default function NewDecisionNeededPage() {
  return (
    <div>
      <PageHeader title="New Decision Needed" />
      <form action={createDecisionNeeded} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">Title / decision needed</label>
            <input name="title" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Status</label>
            <select name="status" defaultValue="Open" className="input">
              {DECISION_NEEDED_STATUS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Deadline</label>
            <input name="deadline" type="date" className="input" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Background</label>
            <textarea name="background" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Options</label>
            <textarea name="options" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Recommendation</label>
            <textarea name="recommendation" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Impact if delayed</label>
            <textarea name="impactIfDelayed" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">Notes</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/decisions-needed" className="btn">Cancel</a>
          <button className="btn-primary">Create</button>
        </div>
      </form>
    </div>
  );
}
