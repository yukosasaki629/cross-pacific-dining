import { PageHeader } from "@/components/ui/PageHeader";
import { PROJECT_STATUS, PRIORITY_LEVEL } from "@/lib/vocab";
import { PROJECT_STATUS_LABELS, PRIORITY_LEVEL_LABELS, labelFor } from "@/lib/labels";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader title="新規プロジェクト" />
      <form action={createProject} className="card card-pad space-y-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8">
            <label className="label">名称</label>
            <input name="name" required className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">ステータス</label>
            <select name="status" defaultValue="Active" className="input">
              {PROJECT_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, PROJECT_STATUS_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">優先度</label>
            <select name="priorityLevel" defaultValue="Medium" className="input">
              {PRIORITY_LEVEL.map((x) => <option key={x} value={x}>{labelFor(x, PRIORITY_LEVEL_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">担当</label>
            <input name="ownerName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">スポンサー</label>
            <input name="sponsorName" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">開始</label>
            <input name="startDate" type="date" className="input" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">目標</label>
            <input name="targetDate" type="date" className="input" />
          </div>
          <div className="col-span-12">
            <label className="label">概要</label>
            <textarea name="description" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">現在フェーズ</label>
            <input name="currentPhase" className="input" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">マイルストーン</label>
            <textarea name="milestones" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">依存関係</label>
            <textarea name="dependencies" className="textarea font-sans" />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="label">リスク</label>
            <textarea name="risks" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">障害(ブロッカー)</label>
            <textarea name="blockers" className="textarea font-sans" />
          </div>
          <div className="col-span-12">
            <label className="label">メモ</label>
            <textarea name="notes" className="textarea font-sans" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/projects" className="btn">キャンセル</a>
          <button className="btn-primary">プロジェクトを作成</button>
        </div>
      </form>
    </div>
  );
}
