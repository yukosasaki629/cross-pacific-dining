import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { searchAll } from "@/lib/search";
import { fmtDate } from "@/lib/utils/date";
import { Pill } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  meeting: "Meeting",
  transcript: "Transcript",
  priority: "Priority",
  project: "Project",
  action: "Action",
  decision: "Decision",
  "decision-needed": "Decision Needed",
  risk: "Risk",
  theme: "Theme",
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
        title="Executive Knowledge Base"
        subtitle="Search across meetings, transcripts, priorities, decisions, projects, actions, risks, and themes."
      />

      <form className="card card-pad mb-5">
        <label className="label">Query</label>
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder='e.g. labor cost, AI delays, compensation, blocked by IT'
            className="input"
            autoFocus
          />
          <button className="btn-primary">Search</button>
        </div>
        <div className="mt-2 text-[11px] text-ink-500">
          Keyword search (case-sensitive in SQLite default). Future versions can plug in a local
          embedding model for semantic search via the same interface.
        </div>
      </form>

      {q ? (
        hits.length === 0 ? (
          <div className="card card-pad text-center text-sm text-ink-400">
            No results for <span className="font-medium text-ink-700">"{q}"</span>.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-ink-500">{hits.length} results</div>
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
          <p className="font-medium text-ink-800">Useful queries</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>"labor cost" — what the CEO has said about labor cost</li>
            <li>"AI" — AI/automation projects, delays, decisions</li>
            <li>"compensation" — decisions about pay or comp committee items</li>
            <li>"blocked by IT" — projects waiting on IT</li>
            <li>"audit" — anything mentioning the audit committee</li>
          </ul>
        </div>
      )}
    </div>
  );
}
