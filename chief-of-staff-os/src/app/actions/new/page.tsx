import { PageHeader } from "@/components/ui/PageHeader";
import { ACTION_STATUS, URGENCY } from "@/lib/vocab";
import { createAction } from "../actions";

export default function NewActionPage() {
  return (
    <div>
      <PageHeader title="New Action Item" />
      <form action={createAction} className="card card-pad space-y-3">
        <div>
          <label className="label">Description</label>
          <textarea name="description" required className="textarea font-sans min-h-[80px]" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-4">
            <label className="label">Owner</label>
            <input name="ownerName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">Due date</label>
            <input name="dueDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Urgency</label>
            <select name="urgency" className="input">{URGENCY.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Status</label>
            <select name="status" className="input">{ACTION_STATUS.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" className="textarea font-sans" />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/actions" className="btn">Cancel</a>
          <button className="btn-primary">Create</button>
        </div>
      </form>
    </div>
  );
}
