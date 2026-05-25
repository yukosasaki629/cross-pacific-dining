"use client";

import { useState, useTransition } from "react";
import { applyExtraction, processMeetingNotes } from "../actions";

export function ProcessNotesPanel({ meetingId }: { meetingId: string }) {
  const [isProcessing, startProcessing] = useTransition();
  const [isApplying, startApplying] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [extractionJson, setExtractionJson] = useState<string>("");
  const [applied, setApplied] = useState(false);

  function onProcess() {
    setError(null);
    setApplied(false);
    startProcessing(async () => {
      const result = await processMeetingNotes(meetingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExtractionJson(JSON.stringify(result.extraction, null, 2));
    });
  }

  function onApply() {
    setError(null);
    startApplying(async () => {
      try {
        await applyExtraction(meetingId, extractionJson);
        setApplied(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="h3">AI メモ処理</h3>
          <p className="mt-1 text-xs text-ink-500">
            ① 「メモを処理」で Meeting Note Agent を実行し JSON を表示
            → ② 内容を確認・編集
            → ③ 「レコードに反映」でアクション・意思決定・リスクを登録
          </p>
        </div>
        <button onClick={onProcess} disabled={isProcessing} className="btn-primary">
          {isProcessing ? "処理中…" : "メモを処理"}
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded border border-risk-high/30 bg-risk-high/5 p-3 text-xs text-risk-high">
          {error}
        </div>
      ) : null}

      {extractionJson ? (
        <>
          <label className="label mt-1">抽出結果(編集可・反映前に必ず確認)</label>
          <textarea
            value={extractionJson}
            onChange={(e) => setExtractionJson(e.target.value)}
            className="textarea min-h-[320px]"
            spellCheck={false}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] text-ink-500">
              「レコードに反映」を押すまでDBには保存されません。結果が不適切なら再処理してください。
            </div>
            <div className="flex gap-2">
              <button onClick={onProcess} disabled={isProcessing} className="btn">
                再処理
              </button>
              <button onClick={onApply} disabled={isApplying} className="btn-primary">
                {isApplying ? "反映中…" : "レコードに反映"}
              </button>
            </div>
          </div>
          {applied ? (
            <div className="mt-3 rounded border border-risk-low/30 bg-risk-low/5 p-3 text-xs text-risk-low">
              反映しました。アクション・意思決定・リスクが本会議から作成されました。右側のカードでご確認ください。
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400">
          <span className="font-medium text-ink-600">「メモを処理」</span>を押すと構造化データを抽出します。
          出力は反映前に必ず編集できます。
        </div>
      )}
    </div>
  );
}
