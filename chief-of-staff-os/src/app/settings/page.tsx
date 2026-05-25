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
      <PageHeader title="Settings" subtitle="Privacy, AI provider, and data management." />

      <div className="grid grid-cols-12 gap-5">
        <div className="card card-pad col-span-12 lg:col-span-7 space-y-4">
          <h2 className="h2">AI provider</h2>
          <div className={`rounded border p-3 text-sm ${info.selected === "anthropic" ? "border-risk-high/30 bg-risk-high/5 text-risk-high" : "border-risk-low/30 bg-risk-low/5 text-risk-low"}`}>
            <div className="font-medium">{info.notice}</div>
            <div className="mt-1 text-xs">
              Provider: <code className="font-mono">{info.selected}</code> · Model:{" "}
              <code className="font-mono">{info.model}</code> · Anthropic key configured:{" "}
              <code className="font-mono">{String(info.available.anthropic)}</code>
            </div>
          </div>
          <div className="rounded border border-ink-200 bg-ink-50 p-3 text-xs text-ink-700">
            <p className="font-medium text-ink-800">How to change the provider</p>
            <p className="mt-1">
              Edit the <code>.env</code> file in the project root and restart the dev server:
            </p>
            <pre className="mt-1 whitespace-pre-wrap font-mono">{`AI_PROVIDER="mock"           # default — fully local
# or:
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-opus-4-7"`}</pre>
            <p className="mt-2 text-risk-high">
              ⚠ Enabling Anthropic will send the full content of meeting notes and transcripts you process
              to Anthropic's API. Confirm your company policy permits this before enabling.
            </p>
          </div>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-5 space-y-3">
          <h2 className="h2">Privacy &amp; storage</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="label">Storage type</dt>
              <dd className="text-ink-800">Local SQLite database</dd>
            </div>
            <div>
              <dt className="label">Database file</dt>
              <dd className="break-all font-mono text-[12px] text-ink-800">{dbPath}</dd>
            </div>
            <div>
              <dt className="label">Outbound traffic</dt>
              <dd className="text-ink-800">
                {info.selected === "anthropic" ? "Anthropic API only (opt-in)" : "None"}
              </dd>
            </div>
          </dl>
          <div className="rounded border border-ink-100 bg-ink-50 p-3 text-[11px] text-ink-600">
            Back up by copying the SQLite file. Restore by replacing it. To wipe everything: stop the
            app and run <code>npm run db:reset</code>.
          </div>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-7 space-y-3">
          <h2 className="h2">Data export</h2>
          <p className="text-sm text-ink-600">Download a JSON snapshot of all records.</p>
          <a href="/api/export" className="btn-primary inline-flex w-fit">Download JSON snapshot</a>
        </div>

        <div className="card card-pad col-span-12 lg:col-span-5">
          <h2 className="h2">Database snapshot</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-700">
            <li>Meetings: <strong>{meetings}</strong></li>
            <li>Transcripts: <strong>{transcripts}</strong></li>
            <li>Priorities: <strong>{priorities}</strong></li>
            <li>Action items: <strong>{actionsCount}</strong></li>
            <li>Decisions: <strong>{decisions}</strong></li>
            <li>Decisions needed: <strong>{dn}</strong></li>
            <li>Projects: <strong>{projects}</strong></li>
            <li>Agent outputs (audit log): <strong>{agentOutputs}</strong></li>
          </ul>
        </div>

        <div className="card card-pad col-span-12">
          <h2 className="h2 mb-2">Suggested tag vocabulary</h2>
          <p className="text-xs text-ink-500">
            Use these as a starting point when tagging meetings, priorities, projects, and decisions.
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
