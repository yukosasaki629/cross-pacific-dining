"use client";

import { useState, useTransition } from "react";
import { CONFIDENTIALITY, MEETING_TYPES } from "@/lib/vocab";
import { updateMeeting } from "../actions";
import { toInputDate } from "@/lib/utils/date";

type Meeting = {
  id: string;
  title: string;
  date: Date | string;
  meetingType: string;
  confidentiality: string;
  rawNotes: string;
  summary: string | null;
};

export function MeetingEditor({ meeting }: { meeting: Meeting }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  function onSubmit(formData: FormData) {
    setSaved(null);
    startTransition(async () => {
      try {
        await updateMeeting(meeting.id, formData);
        setSaved("ok");
        setTimeout(() => setSaved(null), 2500);
      } catch {
        setSaved("err");
      }
    });
  }

  return (
    <form action={onSubmit} className="card card-pad space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="h3">Meeting details</h3>
        <div className="text-xs">
          {saved === "ok" ? <span className="text-risk-low">Saved.</span> : null}
          {saved === "err" ? <span className="text-risk-high">Save failed.</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7">
          <label className="label">Title</label>
          <input name="title" defaultValue={meeting.title} className="input" required />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="label">Date</label>
          <input
            name="date"
            type="date"
            className="input"
            defaultValue={toInputDate(meeting.date)}
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="label">Conf.</label>
          <select name="confidentiality" defaultValue={meeting.confidentiality} className="input">
            {CONFIDENTIALITY.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 md:col-span-5">
          <label className="label">Type</label>
          <select name="meetingType" defaultValue={meeting.meetingType} className="input">
            {MEETING_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Raw notes</label>
        <textarea
          name="rawNotes"
          defaultValue={meeting.rawNotes}
          className="textarea min-h-[260px]"
        />
      </div>

      <div>
        <label className="label">Summary (editable)</label>
        <textarea
          name="summary"
          defaultValue={meeting.summary ?? ""}
          className="textarea min-h-[100px] font-sans"
          placeholder="A clean executive summary. Populated by Process Notes; you can edit anything."
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
