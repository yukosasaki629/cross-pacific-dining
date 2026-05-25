import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { searchAll } from "@/lib/search";
import { fmtDate } from "@/lib/utils/date";
import { Pill } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  meeting: "会議",
  transcript: "文字起こし",
  priority: "優先事項",
  project: "プロジェクト",
  action: "アクション",
  decision: "意思決定",
  "decision-needed": "判断待ち",
  risk: "リスク",
  theme: "テーマ",
};

export default async function KnowledgeBasePage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();
  const hits = q ? await searchAll(q) : [];

  return (
    <div>
      <PageHeader
        title="エグゼクティブ・ナレッジベース"
        subtitle="会議メモ・文字起こし・優先事項・意思決定・プロジェクト・アクション・リスク・テーマを横断検索。"
      />

      <form className="card card-pad mb-5">
        <label className="label">検索キーワード</label>
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder='例: 人件費、AIの遅延、報酬、ITによるブロック'
            className="input"
            autoFocus
          />
          <button className="btn-primary">検索</button>
        </div>
        <div className="mt-2 text-[11px] text-ink-500">
          キーワード検索(SQLiteの仕様で大文字小文字を区別)。将来的にローカル埋め込みモデルで
          セマンティック検索を追加できる構成です。
        </div>
      </form>

      {q ? (
        hits.length === 0 ? (
          <div className="card card-pad text-center text-sm text-ink-400">
            <span className="font-medium text-ink-700">「{q}」</span>の検索結果はありません。
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-ink-500">{hits.length} 件</div>
            {hits.map((h) => (
              <Link
                key={`${h.type}-${h.id}`}
                href={h.href}
                className="block rounded-md border border-ink-200 bg-white p-4 transition hover:border-accent-500"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-ink-900">{h.title}</div>
                  <Pill>{TYPE_LABEL[h.type]}</Pill>
                </div>
                {h.snippet ? <p className="mt-1 text-xs text-ink-500">{h.snippet}…</p> : null}
                {h.date ? <div className="mt-1 text-[11px] text-ink-400">{fmtDate(h.date)}</div> : null}
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="card card-pad text-sm text-ink-500">
          <p className="font-medium text-ink-800">よく使う検索例</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>「人件費」 — CEOが人件費について発言した内容</li>
            <li>「AI」 — AI/自動化プロジェクト、遅延、意思決定</li>
            <li>「報酬」 — 報酬委員会関連の意思決定</li>
            <li>「IT」 — ITに依存して止まっているプロジェクト</li>
            <li>「監査」 — 監査委員会で言及された内容</li>
          </ul>
        </div>
      )}
    </div>
  );
}
