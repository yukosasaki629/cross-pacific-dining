import { PageHeader } from "@/components/ui/PageHeader";
import { providerInfo } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { SUGGESTED_TAGS } from "@/lib/vocab";
import path from "path";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const info = providerInfo();
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const dbPath = dbUrl.startsWith("file:") ? path.resolve(process.cwd(), "prisma", dbUrl.slice(5)) : dbUrl;

  const [
    meetings, transcripts, priorities, actionsCount, decisions, dn, projects, agentOutputs,
  ] = await Promise.all([
    prisma.meeting.count(),
    prisma.transcript.count(),
    prisma.priority.count(),
    prisma.actionItem.count(),
    prisma.decision.count(),
    prisma.decisionNeeded.count(),
    prisma.project.count(),
    prisma.agentOutput.count(),
  ]);

  return (
    <div>
      <PageHeader title="設定" subtitle="プライバシー、AIプロバイダ、データ管理。" />

      <div className="grid grid-cols-12 gap-5">
        <div className="card card-pad col-span-12 lg:col-span-7 space-y-4">
          <h2 className="h2">AIプロバイダ</h2>
          <div className={`rounded border p-3 text-sm ${info.selected === "anthropic" ? "border-risk-high/30 bg-risk-high/5 text-risk-high" : "border-risk-low/30 bg-risk-low/5 text-risk-low"}`}>
            <div className="font-medium">{info.selected === "anthropic" ? "外部AIが有効です。会議の内容は Anthropic に送信されます。" : "ローカルモード。会議の内容はこのパソコンの外には出ません。"}</div>
            <div className="mt-1 text-xs">
              プロバイダ: <code className="font-mono">{info.selected}</code> · モデル:{" "}
              <code className="font-mono">{info.model}</code> · Anthropic APIキー設定:{" "}
              <code className="font-mono">{info.available.anthropic ? "あり" : "なし"}</code>
            </div>
          </div>
          <div className="rounded border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700">
            <p className="font-medium text-ink-800">プロバイダの変更方法</p>
            <p className="mt-1">
              プロジェクトルートの <code>.env</code> を編集し、開発サーバーを再起動してください:
            </p>
            <pre className="mt-1 whitespace-pre-wrap font-mono">{`AI_PROVIDER="mock"           # デフォルト — 完全ローカル
# または:
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-opus-4-7"`}</pre>
            <p className="mt-2 text-risk-high">
              ⚠ Anthropic を有効化すると、処理する会議メモ・文字起こしの全文が Anthropic API に送信されます。
              社内ポリシーで第三者AIへの送信が許可されているか必ず確認してから有効化してください。
            </p>
          </div>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-5 space-y-3">
          <h2 className="h2">プライバシー・保存先</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="label">保存方式</dt>
              <dd className="text-ink-800">ローカル SQLite データベース</dd>
            </div>
            <div>
              <dt className="label">DBファイルの場所</dt>
              <dd className="break-all font-mono text-[12px] text-ink-800">{dbPath}</dd>
            </div>
            <div>
              <dt className="label">外部送信</dt>
              <dd className="text-ink-800">
                {info.selected === "anthropic" ? "Anthropic API のみ (オプトイン)" : "なし"}
              </dd>
            </div>
          </dl>
          <div className="rounded border border-ink-100 bg-ink-50 p-3 text-[11px] text-ink-600">
            バックアップは SQLite ファイルをコピーするだけ。復元はファイルを置き換えるだけ。
            完全リセットはアプリ停止後に <code>npm run db:reset</code>。
          </div>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-7 space-y-3">
          <h2 className="h2">データエクスポート</h2>
          <p className="text-sm text-ink-600">全レコードのJSONスナップショットをダウンロードします。</p>
          <a href="/api/export" className="btn-primary inline-flex w-fit">JSONスナップショットを保存</a>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-5">
          <h2 className="h2">データ件数</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            <li>会議: <strong>{meetings}</strong></li>
            <li>文字起こし: <strong>{transcripts}</strong></li>
            <li>優先事項: <strong>{priorities}</strong></li>
            <li>アクション: <strong>{actionsCount}</strong></li>
            <li>意思決定: <strong>{decisions}</strong></li>
            <li>判断待ち: <strong>{dn}</strong></li>
            <li>プロジェクト: <strong>{projects}</strong></li>
            <li>AI抽出履歴(監査ログ): <strong>{agentOutputs}</strong></li>
          </ul>
        </div>

        <div className="card card-pad col-span-12">
          <h2 className="h2 mb-2">推奨タグ</h2>
          <p className="text-xs text-ink-500">
            会議・優先事項・プロジェクト・意思決定にタグ付けする際の出発点としてご利用ください。
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.map((t) => (
              <span key={t} className="badge">#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
