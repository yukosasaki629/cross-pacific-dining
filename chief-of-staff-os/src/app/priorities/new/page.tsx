import { PageHeader } from "@/components/ui/PageHeader";
import { PRIORITY_LEVEL, PRIORITY_STATUS } from "@/lib/vocab";
import { createPriority } from "../actions";

export default function NewPriorityPage() {
  return (
    <div>
      <PageHeader title="New CEO Priority" />
      <form action={createPriority} className="card card-pad space-y-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">Name</label>
            <input name="name" required className="input" placeholder="e.g. US 2026 expansion plan" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Level</label>
            <select name="level" className="input" defaultValue="High">
              {PRIORITY_LEVEL.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue="On Track">
              {PRIORITY_STATUS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Owner (name)</label>
            <input name="ownerName" className="input" placeholder="e.g. CFO" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Deadline</label>
            <input name="deadline" type="date" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">Description</label>
            <textarea name="description" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">Key risks</label>
            <textarea name="keyRisks" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">Next action</label>
            <input name="nextAction" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">Notes</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/priorities" className="btn">Cancel</a>
          <button type="submit" className="btn-primary">Create priority</button>
        </div>
      </form>
    </div>
  );
}
