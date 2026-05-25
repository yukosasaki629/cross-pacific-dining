import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { createProject } from "../actions";
import { PROJECT_STATUS, RISK_LEVEL, PRIORITY } from "@/lib/vocab";

export default function NewProjectPage() {
  return (
    <div>
      <AppHeader title="新規プロジェクト" backHref="/projects" />

      <form action={createProject} className="px-3 py-4 space-y-3">
        <div className="card card-pad space-y-3">
          <Field label="プロジェクト名" required>
            <input name="name" required className="input" placeholder="例:FY27 Vision 策定" />
          </Field>
          <Field label="目的">
            <textarea name="objective" className="textarea" placeholder="このプロジェクトで達成したいこと" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="オーナー">
              <input name="owner" className="input" placeholder="例:Yuko" />
            </Field>
            <Field label="部署">
              <input name="department" className="input" placeholder="例:RSC" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="ステータス">
              <select name="status" className="input" defaultValue="順調">
                {PROJECT_STATUS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="リスクレベル">
              <select name="riskLevel" className="input" defaultValue="低">
                {RISK_LEVEL.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="優先度">
              <select name="priority" className="input" defaultValue="中">
                {PRIORITY.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="次のアクション">
            <input name="nextAction" className="input" />
          </Field>
          <Field label="期限">
            <input name="dueDate" type="date" className="input" />
          </Field>
          <Field label="現在の状況">
            <textarea name="currentSummary" className="textarea" />
          </Field>
          <Field label="成功指標">
            <textarea name="successMetric" className="textarea" />
          </Field>
        </div>

        <div className="card card-pad space-y-3">
          <h3 className="text-[13px] font-semibold text-ink-700">公開設定</h3>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="isSharedWithCEO"
              defaultChecked
              className="mt-1"
            />
            <div>
              <div className="text-[13px] text-ink-900">社長共有ビューに表示する</div>
              <div className="text-[11px] text-ink-500">
                チェックを外すと <code>/share</code> から完全に除外されます。
              </div>
            </div>
          </label>
          <Field label="非公開メモ(社長共有ビューには絶対に出ません)">
            <textarea name="privateMemo" className="textarea" placeholder="優子さんだけが見るメモ" />
          </Field>
        </div>

        <div className="flex gap-2">
          <Link href="/projects" className="btn flex-1">キャンセル</Link>
          <button type="submit" className="btn-primary flex-1">作成</button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
        {label}
        {required ? <span className="ml-1 text-bad-700">*</span> : null}
      </label>
      {children}
    </div>
  );
}
