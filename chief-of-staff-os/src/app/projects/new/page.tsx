import { PageHeader } from "@/components/ui/PageHeader";
import { PROJECT_STATUS, PRIORITY_LEVEL } from "@/lib/vocab";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader title="New Project" />
      <form action={createProject} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">Name</label>
            <input name="name" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Status</label>
            <select name="status" defaultValue="Active" className="input">
              {PROJECT_STATUS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Priority</label>
            <select name="priorityLevel" defaultValue="Medium" className="input">
              {PRIORITY_LEVEL.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">Owner</label>
            <input name="ownerName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">Sponsor</label>
            <input name="sponsorName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Start</label>
            <input name="startDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Target</label>
            <input name="targetDate" type="date" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">Description</label>
            <textarea name="description" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Current phase</label>
            <input name="currentPhase" className="input" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Milestones</label>
            <textarea name="milestones" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Dependencies</label>
            <textarea name="dependencies" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">Risks</label>
            <textarea name="risks" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">Blockers</label>
            <textarea name="blockers" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">Notes</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/projects" className="btn">Cancel</a>
          <button className="btn-primary">Create project</button>
        </div>
      </form>
    </div>
  );
}
