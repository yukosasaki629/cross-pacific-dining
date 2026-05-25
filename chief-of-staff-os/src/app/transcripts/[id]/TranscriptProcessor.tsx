"use client";

import { useState, useTransition } from "react";
import { applyTranscriptExtraction, processTranscript } from "../actions";

export function TranscriptProcessor({ transcriptId }: { transcriptId: string }) {
  const [pending, start] = useTransition();
  const [applying, startApply] = useTransition();
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function process() {
    setError(null);
    setDone(false);
    start(async () => {
      const r = await processTranscript(transcriptId);
      if (!r.ok) setError(r.error);
      else setJson(JSON.stringify(r.extraction, null, 2));
    });
  }

  function apply() {
    setError(null);
    startApply(async () => {
      try {
        await applyTranscriptExtraction(transcriptId, json);
        setDone(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="card card-pad">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="h3">Process transcript</h3>
          <p className="mt-1 text-xs text-ink-500">
            Run the Meeting Note Agent over the transcript. Review the JSON, then Apply to create the meeting,
            action items, decisions, and risks.
          </p>
        </div>
        <button onClick={process} disabled={pending} className="btn-primary">
          {pending ? "Processing…" : "Process transcript"}
        </button>
      </div>

      {error ? <div className="mb-2 rounded border border-risk-high/30 bg-risk-high/5 p-2 text-xs text-risk-high">{error}</div> : null}

      {json ? (
        <>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="textarea min-h-[300px]"
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={process} disabled={pending} className="btn">Re-process</button>
            <button onClick={apply} disabled={applying} className="btn-primary">
              {applying ? "Applying…" : "Apply to records"}
            </button>
          </div>
          {done ? (
            <div className="mt-3 rounded border border-risk-low/30 bg-risk-low/5 p-3 text-xs text-risk-low">
              Applied. A linked meeting was created (or updated) and structured records were saved.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
