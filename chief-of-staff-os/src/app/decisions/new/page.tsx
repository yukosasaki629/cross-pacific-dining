import { PageHeader } from "@/components/ui/PageHeader";
import { createDecision } from "../actions";

export default function NewDecisionPage() {
  return (
    <div>
      <PageHeader title="新規 意思決定" />
      <form action={createDecision} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">タイトル</label>
            <input name="title" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">日付</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">担当</label>
            <input name="ownerName" className="input" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="label">背景</label>
            <textarea name="context" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">検討した選択肢</label>
            <textarea name="options" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">最終決定</label>
            <textarea name="finalDecision" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">決定理由</label>
            <textarea name="rationale" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">期待される影響</label>
            <textarea name="expectedImpact" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">参加者</label>
            <input name="participants" className="input" placeholder="CEO, CFO, ..." />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">レビュー日</label>
            <input name="reviewDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-3 flex items-end">
            <label className="text-sm text-ink-700"><input type="checkbox" name="followUpRequired" className="mr-2 align-middle" />フォローアップが必要</label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/decisions" className="btn">キャンセル</a>
          <button className="btn-primary">意思決定を保存</button>
        </div>
      </form>
    </div>
  );
}
