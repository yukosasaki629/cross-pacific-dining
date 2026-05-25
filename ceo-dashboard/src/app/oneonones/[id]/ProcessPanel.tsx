"use client";

import { useState, useTransition } from "react";
import { previewExtraction, applyExtraction } from "../actions";

export function ProcessPanel({
  meetingId,
  alreadyProcessed,
}: {
  meetingId: string;
  alreadyProcessed: boolean;
}) {
  const [pending, start] = useTransition();
  const [applying, startApply] = useTransition();
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sensitiveTopics, setSensitiveTopics] = useState<string[]>([]);

  function process() {
    setError(null);
    setDone(false);
    start(async () => {
      const r = await previewExtraction(meetingId);
      if (!r.ok) {
        setError(r.error);
      } else {
        setJson(JSON.stringify(r.extraction, null, 2));
        setSensitiveTopics(r.extraction.detectedSensitiveTopics ?? []);
      }
    });
  }

  function apply() {
    setError(null);
    startApply(async () => {
      try {
        await applyExtraction(meetingId, json);
        setDone(true);
        setJson("");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-700">
            {alreadyProcessed ? "再処理" : "自動抽出"}
          </h3>
          <p className="mt-1 text-[11px] text-ink-500">
            ① 処理 → ② JSONを確認・編集 → ③ 適用 でアクション・判断・リスクが作成されます。
            {alreadyProcessed
              ? "(既に1度処理済み。再処理すると新規レコードが追加されます)"
              : ""}
          </p>
        </div>
        <button onClick={process} disabled={pending} className="btn-primary text-[12px]">
          {pending ? "処理中…" : "処理する"}
        </button>
      </div>

      {error ? (
        <div className="mb-2 rounded border border-bad-600/40 bg-bad-50 p-2 text-[12px] text-bad-700">
          {error}
        </div>
      ) : null}

      {sensitiveTopics.length > 0 ? (
        <div className="mb-2 rounded border border-warn-600/40 bg-warn-50 p-2 text-[12px] text-warn-700">
          <div className="font-semibold">機密キーワードを検出しました:</div>
          <ul className="mt-1 list-disc pl-5">
            {sensitiveTopics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-1 text-[11px]">
            該当項目は <code>sensitivity</code> が自動でセットされ、<strong>/share には出ません</strong>。
            JSON を確認して、誤検知があれば適用前に削除してください。
          </p>
        </div>
      ) : null}

      {json ? (
        <>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="textarea min-h-[320px] font-mono text-[12px]"
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={process} disabled={pending} className="btn text-[12px]">
              再抽出
            </button>
            <button onClick={apply} disabled={applying} className="btn-primary text-[12px]">
              {applying ? "適用中…" : "レコードに適用する"}
            </button>
          </div>
        </>
      ) : null}

      {done ? (
        <div className="mt-2 rounded border border-ok-600/40 bg-ok-50 p-2 text-[12px] text-ok-700">
          適用しました。下にレコードが追加されました。
        </div>
      ) : null}
    </div>
  );
}
