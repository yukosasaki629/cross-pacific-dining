import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/lib/utils/date";
import { Pill } from "@/components/ui/Badges";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    include: { tags: true, _count: { select: { actionItems: true, decisions: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Meeting Notes Inbox"
        subtitle="Paste raw notes, then run Process Notes to extract action items, decisions, and risks."
        actions={
          <Link href="/meetings/new" className="btn-primary">
            + New Meeting
          </Link>
        }
      />

      {meetings.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Start by creating a new meeting and pasting in raw notes from your last CEO 1:1 or executive meeting."
          action={
            <Link href="/meetings/new" className="btn-primary">
              + New Meeting
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Conf.</th>
                <th className="px-4 py-2 font-medium">Actions</th>
                <th className="px-4 py-2 font-medium">Decisions</th>
                <th className="px-4 py-2 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/meetings/${m.id}`} className="font-medium text-ink-900 hover:underline">
                      {m.title}
                    </Link>
                    {m.processedAt ? (
                      <span className="ml-2 text-[10px] text-risk-low">processed</span>
                    ) : (
                      <span className="ml-2 text-[10px] text-ink-400">unprocessed</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-700">{m.meetingType}</td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(m.date)}</td>
                  <td className="px-4 py-2.5 text-ink-700">{m.confidentiality}</td>
                  <td className="px-4 py-2.5 text-ink-700">{m._count.actionItems}</td>
                  <td className="px-4 py-2.5 text-ink-700">{m._count.decisions}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 4).map((t) => (
                        <Pill key={t.id}>{t.name}</Pill>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
