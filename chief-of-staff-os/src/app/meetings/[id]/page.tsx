import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { LevelBadge, Pill, StatusBadge } from "@/components/ui/Badges";
import { ProcessNotesPanel } from "./ProcessNotesPanel";
import { MeetingEditor } from "./MeetingEditor";
import { DeleteMeetingButton } from "./DeleteMeetingButton";
import { CONFIDENTIALITY_LABELS, MEETING_TYPE_LABELS, labelFor } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      attendees: true,
      tags: true,
      actionItems: { include: { owner: true }, orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { date: "desc" } },
      decisionsNeeded: { orderBy: { createdAt: "desc" } },
      risks: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!meeting) notFound();

  return (
    <div>
      <PageHeader
        title={meeting.title}
        subtitle={`${labelFor(meeting.meetingType, MEETING_TYPE_LABELS)} · ${fmtDate(meeting.date)} · ${labelFor(meeting.confidentiality, CONFIDENTIALITY_LABELS)}`}
        actions={
          <>
            <Link href="/meetings" className="btn">← 戻る</Link>
            <DeleteMeetingButton id={meeting.id} />
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <MeetingEditor meeting={meeting} />
          <ProcessNotesPanel meetingId={meeting.id} />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card title="サマリー">
            {meeting.summary ? (
              <p className="whitespace-pre-wrap text-sm text-ink-800">{meeting.summary}</p>
            ) : (
              <p className="text-sm text-ink-400">サマリー未作成。「メモを処理」を実行してください。</p>
            )}
          </Card>

          <Card title={`アクションアイテム (${meeting.actionItems.length})`}>
            {meeting.actionItems.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2">
                {meeting.actionItems.map((a) => (
                  <li key={a.id} className="rounded border border-ink-100 bg-ink-50/40 p-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-ink-900">{a.description}</span>
                      <LevelBadge value={a.urgency} />
                    </div>
                    <div className="mt-1 text-[11px] text-ink-500">
                      {a.owner?.name ?? "未割当"} · <StatusBadge value={a.status} />
                      {a.dueDate ? ` · 期限 ${fmtDate(a.dueDate)}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`意思決定 (${meeting.decisions.length})`}>
            {meeting.decisions.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2">
                {meeting.decisions.map((d) => (
                  <li key={d.id} className="text-sm">
                    <div className="text-ink-900">{d.title}</div>
                    {d.rationale ? <div className="text-[11px] text-ink-500">{d.rationale}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`判断待ち事項 (${meeting.decisionsNeeded.length})`}>
            {meeting.decisionsNeeded.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2">
                {meeting.decisionsNeeded.map((d) => (
                  <li key={d.id} className="text-sm">
                    <div className="text-ink-900">{d.title}</div>
                    {d.recommendation ? (
                      <div className="text-[11px] text-ink-500">推奨案: {d.recommendation}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`リスク (${meeting.risks.length})`}>
            {meeting.risks.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-2">
                {meeting.risks.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-ink-900">{r.description}</span>
                      <LevelBadge value={r.severity} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="出席者・タグ">
            <div className="mb-2 flex flex-wrap gap-1">
              {meeting.attendees.map((p) => (
                <Pill key={p.id}>{p.name}</Pill>
              ))}
              {meeting.attendees.length === 0 ? (
                <span className="text-xs text-ink-400">出席者未登録。</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1">
              {meeting.tags.map((t) => (
                <Pill key={t.id} className="border-accent-100 bg-accent-50 text-accent-700">
                  #{t.name}
                </Pill>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <h3 className="h3 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-400">まだありません。</p>;
}
