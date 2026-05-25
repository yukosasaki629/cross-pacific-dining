import { PageHeader } from "@/components/ui/PageHeader";
import { PRIORITY_LEVEL, PRIORITY_STATUS } from "@/lib/vocab";
import { PRIORITY_LEVEL_LABELS, PRIORITY_STATUS_LABELS, labelFor } from "@/lib/labels";
import { createPriority } from "../actions";

export default function NewPriorityPage() {
  return (
    <div>
      <PageHeader title="新規 CEO 優先事項" />
      <form action={createPriority} className="card card-pad space-y-4">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">名称</label>
            <input name="name" required className="input" placeholder="例：2026年 米国出店計画" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">レベル</label>
            <select name="level" className="input" defaultValue="High">
              {PRIORITY_LEVEL.map((x) => <option key={x} value={x}>{labelFor(x, PRIORITY_LEVEL_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">ステータス</label>
            <select name="status" className="input" defaultValue="On Track">
              {PRIORITY_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, PRIORITY_STATUS_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">担当者</label>
            <input name="ownerName" className="input" placeholder="例：CFO" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">期限</label>
            <input name="deadline" type="date" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">概要</label>
            <textarea name="description" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">主なリスク</label>
            <textarea name="keyRisks" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">次のアクション</label>
            <input name="nextAction" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">メモ</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/priorities" className="btn">キャンセル</a>
          <button type="submit" className="btn-primary">優先事項を作成</button>
        </div>
      </form>
    </div>
  );
}
