"use client";

import { useState, useTransition } from "react";
import { CONFIDENTIALITY, MEETING_TYPES } from "@/lib/vocab";
import { CONFIDENTIALITY_LABELS, MEETING_TYPE_LABELS, labelFor } from "@/lib/labels";
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
        <h3 className="h3">会議情報</h3>
        <div className="text-xs">
          {saved === "ok" ? <span className="text-risk-low">保存しました。</span> : null}
          {saved === "err" ? <span className="text-risk-high">保存に失敗しました。</span> : null}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-7">
          <label className="label">タイトル</label>
          <input name="title" defaultValue={meeting.title} className="input" required />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="label">日付</label>
          <input
            name="date"
            type="date"
            className="input"
            defaultValue={toInputDate(meeting.date)}
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="label">機密度</label>
          <select name="confidentiality" defaultValue={meeting.confidentiality} className="input">
            {CONFIDENTIALITY.map((c) => (
              <option key={c} value={c}>{labelFor(c, CONFIDENTIALITY_LABELS)}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 md:col-span-5">
          <label className="label">種別</label>
          <select name="meetingType" defaultValue={meeting.meetingType} className="input">
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{labelFor(t, MEETING_TYPE_LABELS)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">生メモ</label>
        <textarea
          name="rawNotes"
          defaultValue={meeting.rawNotes}
          className="textarea min-h-[260px]"
        />
      </div>

      <div>
        <label className="label">サマリー(編集可)</label>
        <textarea
          name="summary"
          defaultValue={meeting.summary ?? ""}
          className="textarea min-h-[100px] font-sans"
          placeholder="エグゼクティブ向けの簡潔なサマリー。「メモを処理」で生成され、自由に編集できます。"
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "保存中…" : "変更を保存"}
        </button>
      </div>
    </form>
  );
}
