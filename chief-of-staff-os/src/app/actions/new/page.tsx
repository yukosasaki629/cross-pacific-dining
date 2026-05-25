import { PageHeader } from "@/components/ui/PageHeader";
import { ACTION_STATUS, URGENCY } from "@/lib/vocab";
import { ACTION_STATUS_LABELS, URGENCY_LABELS, labelFor } from "@/lib/labels";
import { createAction } from "../actions";

export default function NewActionPage() {
  return (
    <div>
      <PageHeader title="新規アクションアイテム" />
      <form action={createAction} className="card card-pad space-y-3">
        <div>
          <label className="label">内容</label>
          <textarea name="description" required className="textarea font-sans min-h-[80px]" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-4">
            <label className="label">担当者</label>
            <input name="ownerName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">期限</label>
            <input name="dueDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">緊急度</label>
            <select name="urgency" className="input">{URGENCY.map((x) => <option key={x} value={x}>{labelFor(x, URGENCY_LABELS)}</option>)}</select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">ステータス</label>
            <select name="status" className="input">{ACTION_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, ACTION_STATUS_LABELS)}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="label">メモ</label>
          <textarea name="notes" className="textarea font-sans" />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/actions" className="btn">キャンセル</a>
          <button className="btn-primary">作成</button>
        </div>
      </form>
    </div>
  );
}
