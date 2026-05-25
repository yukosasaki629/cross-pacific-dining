import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONFIDENTIALITY } from "@/lib/vocab";
import { createTranscriptFromPaste, uploadTranscript } from "./actions";

export const dynamic = "force-dynamic";

export default async function TranscriptsPage() {
  const transcripts = await prisma.transcript.findMany({
    orderBy: { uploadDate: "desc" },
    take: 50,
    include: { meeting: true },
  });

  return (
    <div>
      <PageHeader
        title="Transcripts"
        subtitle="Upload or paste meeting transcripts. Local-first by default — nothing leaves your machine unless an external AI provider is enabled in Settings."
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={createTranscriptFromPaste} className="card card-pad col-span-12 lg:col-span-7 space-y-3">
          <h3 className="h3">Paste a transcript</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-7">
              <label className="label">Filename / label (optional)</label>
              <input name="filename" className="input" placeholder="CEO 1:1 — May 24 (Otter)" />
            </div>
            <div className="col-span-12 md:col-span-5">
              <label className="label">Confidentiality</label>
              <select name="confidentiality" defaultValue="Confidential" className="input">
                {CONFIDENTIALITY.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-12">
              <label className="label">Transcript text</label>
              <textarea name="transcriptText" required className="textarea min-h-[260px]" />
            </div>
            <div className="col-span-12">
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="Anything to remember about this transcript" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Save transcript</button>
          </div>
        </form>

        <form action={uploadTranscript} encType="multipart/form-data" className="card card-pad col-span-12 lg:col-span-5 space-y-3">
          <h3 className="h3">Upload a transcript file</h3>
          <p className="text-xs text-ink-500">Supports <code>.txt</code>, <code>.md</code>, <code>.docx</code>. The file is parsed locally and stored in the local SQLite database.</p>
          <div>
            <label className="label">File</label>
            <input type="file" name="file" accept=".txt,.md,.docx" required className="input" />
          </div>
          <div>
            <label className="label">Confidentiality</label>
            <select name="confidentiality" defaultValue="Confidential" className="input">
              {CONFIDENTIALITY.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Upload</button>
          </div>
          <div className="rounded border border-ink-100 bg-ink-50/60 p-3 text-[11px] text-ink-600">
            <strong>Future-ready:</strong> the schema includes <code>source</code> values for{" "}
            <code>whisper-local</code>, <code>otter</code>, <code>fathom</code>, and <code>assemblyai</code>.
            Add an integration that writes a row with the appropriate source and existing pages will pick it up.
          </div>
        </form>

        <div className="col-span-12">
          <h2 className="h2 mb-3 mt-4">Saved transcripts ({transcripts.length})</h2>
          {transcripts.length === 0 ? (
            <EmptyState title="No transcripts yet" description="Paste or upload your first transcript above." />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm table-zebra">
                <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Source</th>
                    <th className="px-4 py-2 font-medium">Uploaded</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Linked meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {transcripts.map((t) => (
                    <tr key={t.id} className="border-b border-ink-100">
                      <td className="px-4 py-2.5">
                        <Link href={`/transcripts/${t.id}`} className="text-ink-900 hover:underline">
                          {t.filename ?? `Transcript ${fmtDate(t.uploadDate)}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-ink-700">{t.source}</td>
                      <td className="px-4 py-2.5 text-ink-700">{fmtDate(t.uploadDate)}</td>
                      <td className="px-4 py-2.5 text-ink-700">{t.processedStatus}</td>
                      <td className="px-4 py-2.5 text-ink-700">
                        {t.meeting ? (
                          <Link className="link" href={`/meetings/${t.meeting.id}`}>{t.meeting.title}</Link>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
