import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { TranscriptProcessor } from "./TranscriptProcessor";
import { DeleteTranscriptButton } from "./DeleteTranscriptButton";
import { CONFIDENTIALITY_LABELS, labelFor } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function TranscriptDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.transcript.findUnique({
    where: { id },
    include: {
      meeting: true,
      actionItems: { include: { owner: true } },
      decisions: true,
    },
  });
  if (!t) notFound();

  return (
    <div>
      <PageHeader
        title={t.filename ?? `文字起こし ${fmtDate(t.uploadDate)}`}
        subtitle={`取得元: ${t.source} · 登録 ${fmtDate(t.uploadDate)} · ${labelFor(t.confidentiality, CONFIDENTIALITY_LABELS)}`}
        actions={
          <>
            <Link href="/transcripts" className="btn">← 戻る</Link>
            <DeleteTranscriptButton id={t.id} />
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">本文</h3>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-800">
              {t.transcriptText}
            </pre>
          </div>
          <TranscriptProcessor transcriptId={t.id} />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">紐づく会議</h3>
            {t.meeting ? (
              <Link className="link" href={`/meetings/${t.meeting.id}`}>{t.meeting.title}</Link>
            ) : (
              <p className="text-sm text-ink-400">
                未紐付け。抽出を反映すると、会議が新規作成され紐付けされます。
              </p>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">この文字起こしから抽出されたアクション ({t.actionItems.length})</h3>
            {t.actionItems.length === 0 ? (
              <p className="text-sm text-ink-400">まだありません。</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {t.actionItems.map((a) => (
                  <li key={a.id}>{a.description} <span className="text-[11px] text-ink-500">— {a.owner?.name ?? "未割当"}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">この文字起こしからの意思決定 ({t.decisions.length})</h3>
            {t.decisions.length === 0 ? (
              <p className="text-sm text-ink-400">まだありません。</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {t.decisions.map((d) => <li key={d.id}>{d.title}</li>)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
