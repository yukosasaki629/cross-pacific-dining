import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { TranscriptProcessor } from "./TranscriptProcessor";
import { DeleteTranscriptButton } from "./DeleteTranscriptButton";

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
        title={t.filename ?? `Transcript ${fmtDate(t.uploadDate)}`}
        subtitle={`Source: ${t.source} · Uploaded ${fmtDate(t.uploadDate)} · ${t.confidentiality}`}
        actions={
          <>
            <Link href="/transcripts" className="btn">← Back</Link>
            <DeleteTranscriptButton id={t.id} />
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">Transcript text</h3>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-800">
              {t.transcriptText}
            </pre>
          </div>
          <TranscriptProcessor transcriptId={t.id} />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="card card-pad">
            <h3 className="h3 mb-2">Linked meeting</h3>
            {t.meeting ? (
              <Link className="link" href={`/meetings/${t.meeting.id}`}>{t.meeting.title}</Link>
            ) : (
              <p className="text-sm text-ink-400">
                Not linked. Applying the extraction will create a meeting and link it.
              </p>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Action items from this transcript ({t.actionItems.length})</h3>
            {t.actionItems.length === 0 ? (
              <p className="text-sm text-ink-400">None yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {t.actionItems.map((a) => (
                  <li key={a.id}>{a.description} <span className="text-[11px] text-ink-500">— {a.owner?.name ?? "Unassigned"}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="card card-pad">
            <h3 className="h3 mb-2">Decisions from this transcript ({t.decisions.length})</h3>
            {t.decisions.length === 0 ? (
              <p className="text-sm text-ink-400">None yet.</p>
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
