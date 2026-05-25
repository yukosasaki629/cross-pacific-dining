"use client";

import { useTransition, useState } from "react";
import { deleteAllDerivedItems } from "./actions";

export function CleanupAllButton() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function onClick() {
    if (
      !confirm(
        "全ての1on1から派生したアクション・判断・リスク・フォローアップを削除します。\n" +
          "(1on1メモ本体・プロジェクトは残ります)\n\n" +
          "改善された抽出器でやり直す場合に使ってください。よろしいですか?",
      )
    )
      return;
    setDone(null);
    start(async () => {
      const { deleted } = await deleteAllDerivedItems();
      setDone(`${deleted}件 の派生アイテムを削除しました。各1on1の「処理する」を再実行してください。`);
    });
  }

  return (
    <div className="mb-3 rounded-lg border border-warn-600/30 bg-warn-50/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] text-ink-700">
          <div className="font-semibold">抽出結果が変な場合のクリーンアップ</div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            既存の派生アイテムを全て消して、改善された抽出器で再処理できます
          </div>
        </div>
        <button onClick={onClick} disabled={pending} className="btn-danger text-[11px] shrink-0">
          {pending ? "削除中…" : "全派生アイテム削除"}
        </button>
      </div>
      {done ? (
        <div className="mt-2 rounded border border-ok-600/40 bg-ok-50 p-2 text-[11px] text-ok-700">
          {done}
        </div>
      ) : null}
    </div>
  );
}
