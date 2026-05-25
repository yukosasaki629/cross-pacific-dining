import { PageHeader } from "@/components/ui/PageHeader";
import { CONFIDENTIALITY, MEETING_TYPES } from "@/lib/vocab";
import { createMeeting } from "../actions";

export default function NewMeetingPage() {
  return (
    <div>
      <PageHeader title="New Meeting" subtitle="Capture raw notes now; refine and process later." />

      <form action={createMeeting} className="card card-pad space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            <label className="label" htmlFor="title">Meeting title</label>
            <input id="title" name="title" required className="input" placeholder="CEO 1:1 — May 24" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label" htmlFor="date">Date</label>
            <input id="date" name="date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label" htmlFor="confidentiality">Confidentiality</label>
            <select id="confidentiality" name="confidentiality" className="input" defaultValue="Confidential">
              {CONFIDENTIALITY.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="meetingType">Meeting type</label>
            <select id="meetingType" name="meetingType" className="input">
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="attendees">Attendees (comma-separated)</label>
            <input id="attendees" name="attendees" className="input" placeholder="CEO, CFO, COO" />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="tags">Tags (comma-separated)</label>
            <input id="tags" name="tags" className="input" placeholder="Labor Cost, Store Openings" />
          </div>

          <div className="col-span-12">
            <label className="label" htmlFor="rawNotes">Raw notes</label>
            <textarea
              id="rawNotes"
              name="rawNotes"
              className="textarea min-h-[260px]"
              placeholder={`Paste raw notes here.\n\nTips:\n- Lines starting with "Action:" or with an "Owner:" hint become action items\n- Lines starting with "Decision:" become decisions\n- Lines ending with "?" become open questions\n- Lines with "risk", "blocker", or "delay" become risks`}
            />
            <p className="mt-1 text-[11px] text-ink-400">
              Notes are saved locally to <code>prisma/dev.db</code>. AI processing happens after you save.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <a href="/meetings" className="btn">Cancel</a>
          <button type="submit" className="btn-primary">Save meeting</button>
        </div>
      </form>
    </div>
  );
}
