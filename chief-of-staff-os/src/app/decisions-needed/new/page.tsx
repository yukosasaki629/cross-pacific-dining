import { PageHeader } from "@/components/ui/PageHeader";
import { DECISION_NEEDED_STATUS } from "@/lib/vocab";
import { DECISION_NEEDED_STATUS_LABELS, labelFor } from "@/lib/labels";
import { createDecisionNeeded } from "../actions";

export default function NewDecisionNeededPage() {
  return (
    <div>
      <PageHeader title="新規 判断待ち事項" />
      <form action={createDecisionNeeded} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">タイトル / 必要な判断</label>
            <input name="title" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">ステータス</label>
            <select name="status" defaultValue="Open" className="input">
              {DECISION_NEEDED_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, DECISION_NEEDED_STATUS_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">期限</label>
            <input name="deadline" type="date" className="input" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">背景</label>
            <textarea name="background" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">選択肢</label>
            <textarea name="options" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">推奨案</label>
            <textarea name="recommendation" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">遅延時の影響</label>
            <textarea name="impactIfDelayed" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">メモ</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/decisions-needed" className="btn">キャンセル</a>
          <button className="btn-primary">作成</button>
        </div>
      </form>
    </div>
  );
}
