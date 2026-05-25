import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/lib/utils/date";
import { Pill } from "@/components/ui/Badges";
import { labelFor, MEETING_TYPE_LABELS, CONFIDENTIALITY_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    include: { tags: true, _count: { select: { actionItems: true, decisions: true } } },
  });

  return (
    <div>
      <PageHeader
        title="会議メモ"
        subtitle="生メモを貼り付けて「メモを処理」を実行すると、アクション・意思決定・リスクを抽出します。"
        actions={
          <Link href="/meetings/new" className="btn-primary">
            + 新規会議
          </Link>
        }
      />

      {meetings.length === 0 ? (
        <EmptyState
          title="まだ会議がありません"
          description="まずは新規会議を作成し、直近のCEO 1on1または経営会議の生メモを貼り付けてみましょう。"
          action={
            <Link href="/meetings/new" className="btn-primary">
              + 新規会議
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">タイトル</th>
                <th className="px-4 py-2 font-medium">種別</th>
                <th className="px-4 py-2 font-medium">日付</th>
                <th className="px-4 py-2 font-medium">機密度</th>
                <th className="px-4 py-2 font-medium">アクション</th>
                <th className="px-4 py-2 font-medium">意思決定</th>
                <th className="px-4 py-2 font-medium">タグ</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/meetings/${m.id}`} className="font-medium text-ink-900 hover:underline">
                      {m.title}
                    </Link>
                    {m.processedAt ? (
                      <span className="ml-2 text-[10px] text-risk-low">処理済み</span>
                    ) : (
                      <span className="ml-2 text-[10px] text-ink-400">未処理</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-700">{labelFor(m.meetingType, MEETING_TYPE_LABELS)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(m.date)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{labelFor(m.confidentiality, CONFIDENTIALITY_LABELS)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{m._count.actionItems}</td>
                  <td className="px-4 py-2.5 text-ink-700">{m._count.decisions}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 4).map((t) => (
                        <Pill key={t.id}>{t.name}</Pill>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
