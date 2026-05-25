import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { DECISION_NEEDED_STATUS } from "@/lib/vocab";
import { DECISION_NEEDED_STATUS_LABELS, labelFor } from "@/lib/labels";
import { updateDecisionNeeded, deleteDecisionNeeded, promoteToDecision } from "../actions";
import { toInputDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function DnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.decisionNeeded.findUnique({
    where: { id },
    include: { meeting: true, priority: true, project: true, owner: true },
  });
  if (!d) notFound();
  return (
    <div>
      <PageHeader
        title={d.title}
        actions={
          <>
            <Link href="/decisions-needed" className="btn">← 戻る</Link>
            <form action={async () => { "use server"; await deleteDecisionNeeded(d.id); }}>
              <button className="btn-danger" type="submit">削除</button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={updateDecisionNeeded.bind(null, d.id)} className="card card-pad col-span-12 lg:col-span-8 space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-8">
              <label className="label">タイトル</label>
              <input name="title" defaultValue={d.title} className="input" />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">ステータス</label>
              <select name="status" defaultValue={d.status} className="input">
                {DECISION_NEEDED_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, DECISION_NEEDED_STATUS_LABELS)}</option>)}
              </select>
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="label">期限</label>
              <input name="deadline" type="date" defaultValue={toInputDate(d.deadline)} className="input" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">背景</label>
              <textarea name="background" defaultValue={d.background ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">選択肢</label>
              <textarea name="options" defaultValue={d.options ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">推奨案</label>
              <textarea name="recommendation" defaultValue={d.recommendation ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className="label">遅延時の影響</label>
              <textarea name="impactIfDelayed" defaultValue={d.impactIfDelayed ?? ""} className="textarea font-sans" />
            </div>
            <div className="col-span-12">
              <label className="label">メモ</label>
              <textarea name="notes" defaultValue={d.notes ?? ""} className="textarea font-sans" />
            </div>
          </div>
          <div className="flex justify-end"><button className="btn-primary">保存</button></div>
        </form>

        <form action={promoteToDecision.bind(null, d.id)} className="card card-pad col-span-12 lg:col-span-4 space-y-3">
          <h3 className="h3">意思決定ログへ昇格</h3>
          <p className="text-xs text-ink-500">判断が下ったら、決定理由とともに意思決定ログへコピーします。</p>
          <div>
            <label className="label">最終決定(推奨案を上書きする場合に入力)</label>
            <textarea name="finalDecision" className="textarea font-sans" />
          </div>
          <div>
            <label className="label">決定理由</label>
            <textarea name="rationale" className="textarea font-sans" />
          </div>
          <button className="btn-primary w-full" type="submit">昇格してクローズ</button>
        </form>
      </div>
    </div>
  );
}
