import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtDate } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONFIDENTIALITY } from "@/lib/vocab";
import { CONFIDENTIALITY_LABELS, labelFor } from "@/lib/labels";
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
        title="文字起こし"
        subtitle="会議の文字起こしを貼り付けまたはアップロード。デフォルトはローカル処理 — 設定で外部AIプロバイダを有効にしない限り、内容はこのパソコンから出ません。"
      />

      <div className="grid grid-cols-12 gap-5">
        <form action={createTranscriptFromPaste} className="card card-pad col-span-12 lg:col-span-7 space-y-3">
          <h3 className="h3">文字起こしを貼り付け</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-7">
              <label className="label">ファイル名 / ラベル(任意)</label>
              <input name="filename" className="input" placeholder="CEO 1on1 — 5月24日(Otter)" />
            </div>
            <div className="col-span-12 md:col-span-5">
              <label className="label">機密度</label>
              <select name="confidentiality" defaultValue="Confidential" className="input">
                {CONFIDENTIALITY.map((c) => <option key={c} value={c}>{labelFor(c, CONFIDENTIALITY_LABELS)}</option>)}
              </select>
            </div>
            <div className="col-span-12">
              <label className="label">文字起こし本文</label>
              <textarea name="transcriptText" required className="textarea min-h-[260px]" />
            </div>
            <div className="col-span-12">
              <label className="label">メモ</label>
              <input name="notes" className="input" placeholder="この文字起こしについての覚え書き" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">保存</button>
          </div>
        </form>

        <form action={uploadTranscript} encType="multipart/form-data" className="card card-pad col-span-12 lg:col-span-5 space-y-3">
          <h3 className="h3">ファイルをアップロード</h3>
          <p className="text-xs text-ink-500"><code>.txt</code> / <code>.md</code> / <code>.docx</code> に対応。
            ファイルはローカルで解析され、ローカルSQLite DBに保存されます。</p>
          <div>
            <label className="label">ファイル</label>
            <input type="file" name="file" accept=".txt,.md,.docx" required className="input" />
          </div>
          <div>
            <label className="label">機密度</label>
            <select name="confidentiality" defaultValue="Confidential" className="input">
              {CONFIDENTIALITY.map((c) => <option key={c} value={c}>{labelFor(c, CONFIDENTIALITY_LABELS)}</option>)}
            </select>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">アップロード</button>
          </div>
          <div className="rounded border border-ink-100 bg-ink-50/60 p-3 text-[11px] text-ink-600">
            <strong>将来拡張:</strong> スキーマには <code>whisper-local</code>、<code>otter</code>、
            <code>fathom</code>、<code>assemblyai</code> のソース値を予約済みです。連携を追加して
            該当ソースで行を作成すれば、既存ページがそのまま表示します。
          </div>
        </form>

        <div className="col-span-12">
          <h2 className="h2 mb-3 mt-4">保存済み文字起こし ({transcripts.length})</h2>
          {transcripts.length === 0 ? (
            <EmptyState title="まだ文字起こしがありません" description="上のフォームから最初の文字起こしを保存してください。" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm table-zebra">
                <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">名称</th>
                    <th className="px-4 py-2 font-medium">取得元</th>
                    <th className="px-4 py-2 font-medium">登録</th>
                    <th className="px-4 py-2 font-medium">処理状態</th>
                    <th className="px-4 py-2 font-medium">紐づく会議</th>
                  </tr>
                </thead>
                <tbody>
                  {transcripts.map((t) => (
                    <tr key={t.id} className="border-b border-ink-100">
                      <td className="px-4 py-2.5">
                        <Link href={`/transcripts/${t.id}`} className="text-ink-900 hover:underline">
                          {t.filename ?? `文字起こし ${fmtDate(t.uploadDate)}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-ink-700">{t.source}</td>
                      <td className="px-4 py-2.5 text-ink-700">{fmtDate(t.uploadDate)}</td>
                      <td className="px-4 py-2.5 text-ink-700">{t.processedStatus === "processed" ? "処理済み" : "未処理"}</td>
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
