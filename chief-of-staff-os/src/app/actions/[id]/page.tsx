import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ACTION_STATUS, URGENCY } from "@/lib/vocab";
import { ACTION_STATUS_LABELS, URGENCY_LABELS, labelFor } from "@/lib/labels";
import { deleteAction, updateAction } from "../actions";
import { toInputDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function ActionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.actionItem.findUnique({
    where: { id },
    include: { owner: true, department: true, priority: true, project: true, meeting: true },
  });
  if (!a) notFound();

  return (
    <div>
      <PageHeader
        title="アクションアイテム"
        actions={
          <>
            <Link href="/actions" className="btn">← 戻る</Link>
            <form action={async () => { "use server"; await deleteAction(a.id); }}>
              <button type="submit" className="btn-danger">削除</button>
            </form>
          </>
        }
      />

      <form action={updateAction.bind(null, a.id)} className="card card-pad space-y-3">
        <div>
          <label className="label">内容</label>
          <textarea name="description" defaultValue={a.description} className="textarea font-sans min-h-[80px]" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-3">
            <label className="label">担当者</label>
            <input name="ownerName" defaultValue={a.owner?.name ?? ""} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">期限</label>
            <input name="dueDate" type="date" defaultValue={toInputDate(a.dueDate)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">前回フォロー</label>
            <input name="lastFollowUp" type="date" defaultValue={toInputDate(a.lastFollowUp)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">次回フォロー</label>
            <input name="nextFollowUp" type="date" defaultValue={toInputDate(a.nextFollowUp)} className="input" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">緊急度</label>
            <select name="urgency" defaultValue={a.urgency} className="input">
              {URGENCY.map((x) => <option key={x} value={x}>{labelFor(x, URGENCY_LABELS)}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">ステータス</label>
            <select name="status" defaultValue={a.status} className="input">
              {ACTION_STATUS.map((x) => <option key={x} value={x}>{labelFor(x, ACTION_STATUS_LABELS)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">メモ</label>
          <textarea name="notes" defaultValue={a.notes ?? ""} className="textarea font-sans" />
        </div>

        <div className="rounded border border-ink-100 bg-ink-50/40 p-3 text-xs text-ink-600">
          {a.meeting ? <>会議出典: <Link className="link" href={`/meetings/${a.meeting.id}`}>{a.meeting.title}</Link></> : "単独アクション"}
          {a.priority ? <> · 優先事項: {a.priority.name}</> : null}
          {a.project ? <> · プロジェクト: {a.project.name}</> : null}
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">保存</button>
        </div>
      </form>
    </div>
  );
}
