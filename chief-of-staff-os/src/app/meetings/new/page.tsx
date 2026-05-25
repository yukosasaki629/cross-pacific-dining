import { PageHeader } from "@/components/ui/PageHeader";
import { CONFIDENTIALITY, MEETING_TYPES } from "@/lib/vocab";
import { CONFIDENTIALITY_LABELS, MEETING_TYPE_LABELS, labelFor } from "@/lib/labels";
import { createMeeting } from "../actions";

export default function NewMeetingPage() {
  return (
    <div>
      <PageHeader title="新規会議" subtitle="まずは生メモを保存。整形と処理は後からでOK。" />

      <form action={createMeeting} className="card card-pad space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            <label className="label" htmlFor="title">会議タイトル</label>
            <input id="title" name="title" required className="input" placeholder="CEO 1on1 — 5月24日" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label" htmlFor="date">日付</label>
            <input id="date" name="date" type="date" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label" htmlFor="confidentiality">機密度</label>
            <select id="confidentiality" name="confidentiality" className="input" defaultValue="Confidential">
              {CONFIDENTIALITY.map((c) => (
                <option key={c} value={c}>
                  {labelFor(c, CONFIDENTIALITY_LABELS)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="meetingType">会議種別</label>
            <select id="meetingType" name="meetingType" className="input">
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labelFor(t, MEETING_TYPE_LABELS)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="attendees">出席者（カンマ区切り)</label>
            <input id="attendees" name="attendees" className="input" placeholder="CEO, CFO, COO" />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="label" htmlFor="tags">タグ（カンマ区切り)</label>
            <input id="tags" name="tags" className="input" placeholder="人件費, 新店舗" />
          </div>

          <div className="col-span-12">
            <label className="label" htmlFor="rawNotes">生メモ</label>
            <textarea
              id="rawNotes"
              name="rawNotes"
              className="textarea min-h-[260px]"
              placeholder={`ここに生メモを貼り付けてください。\n\nコツ：\n- 「Action:」や担当者表記（Owner:）のある行はアクションとして抽出されます\n- 「Decision:」で始まる行は意思決定として抽出されます\n- 「?」で終わる行は未解決の論点として抽出されます\n- 「リスク」「ブロック」「遅延」を含む行はリスクとして抽出されます`}
            />
            <p className="mt-1 text-[11px] text-ink-400">
              メモはローカルの <code>prisma/dev.db</code> に保存されます。AI処理は保存後に実行できます。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <a href="/meetings" className="btn">キャンセル</a>
          <button type="submit" className="btn-primary">会議を保存</button>
        </div>
      </form>
    </div>
  );
}
