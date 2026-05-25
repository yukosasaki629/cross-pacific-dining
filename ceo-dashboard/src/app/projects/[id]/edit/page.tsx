import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { updateProject } from "../../actions";
import { toInputDate } from "@/lib/utils";
import { PROJECT_STATUS, RISK_LEVEL, PRIORITY } from "@/lib/vocab";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <div>
      <AppHeader
        title="プロジェクト編集"
        subtitle={p.name}
        backHref={`/projects/${id}`}
      />

      <form action={updateProject.bind(null, id)} className="px-3 py-4 space-y-3">
        <div className="card card-pad space-y-3">
          <Field label="プロジェクト名" required>
            <input name="name" required className="input" defaultValue={p.name} />
          </Field>
          <Field label="目的">
            <textarea name="objective" className="textarea" defaultValue={p.objective ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="オーナー">
              <input name="owner" className="input" defaultValue={p.owner ?? ""} />
            </Field>
            <Field label="部署">
              <input name="department" className="input" defaultValue={p.department ?? ""} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="ステータス">
              <select name="status" className="input" defaultValue={p.status}>
                {PROJECT_STATUS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="リスクレベル">
              <select name="riskLevel" className="input" defaultValue={p.riskLevel}>
                {RISK_LEVEL.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="優先度">
              <select name="priority" className="input" defaultValue={p.priority}>
                {PRIORITY.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="次のアクション">
            <input name="nextAction" className="input" defaultValue={p.nextAction ?? ""} />
          </Field>
          <Field label="期限">
            <input
              name="dueDate"
              type="date"
              className="input"
              defaultValue={toInputDate(p.dueDate)}
            />
          </Field>
          <Field label="現在の状況">
            <textarea name="currentSummary" className="textarea" defaultValue={p.currentSummary ?? ""} />
          </Field>
          <Field label="成功指標">
            <textarea name="successMetric" className="textarea" defaultValue={p.successMetric ?? ""} />
          </Field>
        </div>

        <div className="card card-pad space-y-3">
          <h3 className="text-[13px] font-semibold text-ink-700">公開設定</h3>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="isSharedWithCEO"
              defaultChecked={p.isSharedWithCEO}
              className="mt-1"
            />
            <div>
              <div className="text-[13px] text-ink-900">社長共有ビューに表示する</div>
              <div className="text-[11px] text-ink-500">
                チェックを外すと、このプロジェクトは <code>/share</code> から完全に除外されます。
              </div>
            </div>
          </label>

          <Field label="非公開メモ(社長共有ビューには絶対に出ません)">
            <textarea
              name="privateMemo"
              className="textarea"
              defaultValue={p.privateMemo ?? ""}
              placeholder="優子さんだけが見るメモ"
            />
          </Field>
        </div>

        <div className="sticky bottom-20 z-10 -mx-3 border-t border-ink-200 bg-white/95 px-3 py-3 backdrop-blur md:bottom-0">
          <div className="flex gap-2">
            <Link href={`/projects/${id}`} className="btn flex-1">キャンセル</Link>
            <button type="submit" className="btn-primary flex-1">変更を保存</button>
          </div>
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
