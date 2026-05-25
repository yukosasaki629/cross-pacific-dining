"use client";

import { useState, useTransition } from "react";
import { generateBrief, saveBriefEdits } from "./actions";
import { fmtDate } from "@/lib/utils/date";

type Existing = { id: string; markdown: string } | null;

export function BriefEditor({
  existing,
  history,
}: {
  existing: Existing;
  history: { id: string; weekOf: string }[];
}) {
  const [markdown, setMarkdown] = useState<string>(existing?.markdown ?? "");
  const [currentId, setCurrentId] = useState<string | null>(existing?.id ?? null);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  function regenerate() {
    setSaved(null);
    start(async () => {
      const result = await generateBrief();
      setMarkdown(result.markdown);
      // server action created/updated brief — refresh id by reading from history if needed (kept simple here)
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setSaved("ok");
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setSaved("err");
    }
  }

  function downloadMd() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-brief-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function persist() {
    if (!currentId) return;
    start(async () => {
      await saveBriefEdits(currentId, markdown);
      setSaved("ok");
      setTimeout(() => setSaved(null), 1500);
    });
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="card card-pad col-span-12 lg:col-span-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h3">Draft (editable)</h2>
          <div className="flex gap-2">
            <button onClick={regenerate} disabled={pending} className="btn">
              {pending ? "Generating…" : markdown ? "Regenerate" : "Generate this week"}
            </button>
            <button onClick={persist} disabled={!currentId || pending} className="btn">Save edits</button>
            <button onClick={copy} className="btn">Copy</button>
            <button onClick={downloadMd} className="btn">Download .md</button>
          </div>
        </div>

        {saved === "ok" ? <div className="mb-2 text-xs text-risk-low">Copied / saved.</div> : null}
        {saved === "err" ? <div className="mb-2 text-xs text-risk-high">Clipboard not available.</div> : null}

        {markdown ? (
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="textarea min-h-[600px] font-mono text-[13px] leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="rounded border border-dashed border-ink-200 p-8 text-center text-sm text-ink-400">
            No brief generated yet. Click <span className="font-medium text-ink-600">Generate this week</span> to compose
            from your current data.
          </div>
        )}
      </div>

      <div className="card card-pad col-span-12 lg:col-span-4">
        <h2 className="h3 mb-2">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-400">No saved briefs yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  className="link"
                  onClick={async () => {
                    const res = await fetch(`/api/weekly-brief/${h.id}`);
                    if (res.ok) {
                      const data = await res.json();
                      setMarkdown(data.markdown);
                      setCurrentId(h.id);
                    }
                  }}
                >
                  Week of {fmtDate(h.weekOf)}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 rounded border border-ink-100 bg-ink-50/40 p-3 text-xs text-ink-600">
          Friday workflow → Generate → Review → Edit → Copy → Paste into email / Slack / Notion.
        </div>
      </div>
    </div>
  );
}
