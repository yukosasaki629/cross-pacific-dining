"use client";

import { useState, useTransition } from "react";
import { generateReport } from "./actions";

export function ReportEditor({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState<null | "copied" | "regenerated" | "error">(null);

  function regenerate() {
    setFlash(null);
    start(async () => {
      const fresh = await generateReport();
      setText(fresh);
      setFlash("regenerated");
      setTimeout(() => setFlash(null), 1800);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFlash("copied");
      setTimeout(() => setFlash(null), 1800);
    } catch {
      setFlash("error");
    }
  }

  function download() {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `executive-summary-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Action buttons - sticky on mobile */}
      <div className="sticky top-[57px] z-10 -mx-3 border-b border-ink-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button onClick={copy} className="btn-primary flex-1 min-w-[120px]">
            <CopyIcon className="h-4 w-4" />
            コピー
          </button>
          <button onClick={regenerate} disabled={pending} className="btn flex-1 min-w-[120px]">
            {pending ? "更新中…" : "最新データで更新"}
          </button>
          <button onClick={download} className="btn flex-1 min-w-[120px]">
            ダウンロード(.md)
          </button>
        </div>
        {flash === "copied" ? (
          <div className="mt-2 text-[12px] text-ok-700">クリップボードにコピーしました。</div>
        ) : null}
        {flash === "regenerated" ? (
          <div className="mt-2 text-[12px] text-ok-700">最新データで更新しました。</div>
        ) : null}
        {flash === "error" ? (
          <div className="mt-2 text-[12px] text-bad-700">コピーに失敗しました。</div>
        ) : null}
      </div>

      <div className="card card-pad">
        <p className="mb-3 text-[12px] text-ink-500">
          ※ このサマリーは登録済みデータから自動生成されます。送信前に必ずレビュー・編集してください。
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="textarea min-h-[480px] font-mono text-[13px] leading-relaxed"
          spellCheck={false}
        />
      </div>

      <div className="card card-pad">
        <h3 className="text-[13px] font-semibold text-ink-700">プレビュー</h3>
        <div className="prose-sm mt-2 whitespace-pre-wrap rounded-md bg-ink-50 p-3 text-[13px] leading-relaxed text-ink-800">
          {text}
        </div>
      </div>
    </div>
  );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
