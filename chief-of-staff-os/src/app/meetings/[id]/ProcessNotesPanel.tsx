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
          <h3 className="h3">AI Note Processor</h3>
          <p className="mt-1 text-xs text-ink-500">
            Step 1 — Process Notes runs the Meeting Note Agent and shows you JSON output.
            Step 2 — Review/edit the JSON. Step 3 — Apply to create action items, decisions, risks.
          </p>
        </div>
        <button onClick={onProcess} disabled={isProcessing} className="btn-primary">
          {isProcessing ? "Processing…" : "Process Notes"}
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded border border-risk-high/30 bg-risk-high/5 p-3 text-xs text-risk-high">
          {error}
        </div>
      ) : null}

      {extractionJson ? (
        <>
          <label className="label mt-1">Extraction (editable — review before applying)</label>
          <textarea
            value={extractionJson}
            onChange={(e) => setExtractionJson(e.target.value)}
            className="textarea min-h-[320px]"
            spellCheck={false}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-[11px] text-ink-500">
              Nothing is saved until you click Apply. You can re-process if the output is off.
            </div>
            <div className="flex gap-2">
              <button onClick={onProcess} disabled={isProcessing} className="btn">
                Re-process
              </button>
              <button onClick={onApply} disabled={isApplying} className="btn-primary">
                {isApplying ? "Applying…" : "Apply to records"}
              </button>
            </div>
          </div>
          {applied ? (
            <div className="mt-3 rounded border border-risk-low/30 bg-risk-low/5 p-3 text-xs text-risk-low">
              Applied. Action items, decisions, and risks have been created from this meeting.
              Scroll the right column to review.
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded border border-dashed border-ink-200 p-6 text-center text-xs text-ink-400">
          Click <span className="font-medium text-ink-600">Process Notes</span> to extract structured data.
          Output is always editable before saving.
        </div>
      )}
    </div>
  );
}
