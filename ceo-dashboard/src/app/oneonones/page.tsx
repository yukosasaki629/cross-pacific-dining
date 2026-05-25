import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OneOnOnesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const personFilter = sp?.p ?? "";

  const [people, meetings] = await Promise.all([
    prisma.person.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { meetings: true } } },
    }),
    prisma.meetingNote.findMany({
      where: personFilter ? { personId: personFilter } : {},
      orderBy: { date: "desc" },
      take: 50,
      include: {
        person: { select: { name: true, role: true } },
        _count: { select: { tasks: true, decisions: true, risks: true, followUps: true } },
      },
    }),
  ]);

  return (
    <div>
      <AppHeader
        title="1on1 受信箱"
        subtitle={`${meetings.length} 件 / ${people.length} 名`}
        rightSlot={
          <Link href="/oneonones/new" className="btn-primary text-[12px]">
            + 新規1on1
          </Link>
        }
      />

      {/* 人別フィルタ */}
      <div className="sticky top-[57px] z-10 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          <Link
            href="/oneonones"
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
              !personFilter
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100"
            }`}
          >
            全員
          </Link>
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/oneonones?p=${p.id}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
                personFilter === p.id
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100"
              }`}
            >
              {p.name}
              <span className="ml-1 text-[10px] opacity-70">({p._count.meetings})</span>
            </Link>
          ))}
          <Link
            href="/oneonones/people"
            className="shrink-0 rounded-full border border-dashed border-ink-300 px-3 py-1 text-[12px] font-medium text-ink-600"
          >
            + 人を追加
          </Link>
        </div>
      </div>

      <div className="space-y-2 px-3 py-4">
        {meetings.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            まだ1on1がありません。<br />
            <Link href="/oneonones/new" className="link mt-2 inline-block">
              最初の1on1メモを貼り付ける →
            </Link>
          </div>
        ) : (
          meetings.map((m) => (
            <Link key={m.id} href={`/oneonones/${m.id}`} className="block">
              <div className="card card-pad active:bg-ink-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-ink-900">
                      {m.person.name}
                      {m.person.role ? (
                        <span className="ml-1.5 text-[12px] font-normal text-ink-500">
                          / {m.person.role}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-500">{fmtDate(m.date)}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {m.processedAt ? (
                      <Pill value="処理済" />
                    ) : (
                      <span className="pill bg-warn-50 text-warn-700">未処理</span>
                    )}
                  </div>
                </div>
                {m.summary ? (
                  <p className="mt-2 line-clamp-2 text-[12px] text-ink-700">{m.summary}</p>
                ) : (
                  <p className="mt-2 line-clamp-2 text-[12px] text-ink-500">{m.rawNotes.slice(0, 120)}</p>
                )}
                {m.processedAt ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-500">
                    {m._count.tasks > 0 ? <span>アクション {m._count.tasks}</span> : null}
                    {m._count.decisions > 0 ? <span>・判断 {m._count.decisions}</span> : null}
                    {m._count.risks > 0 ? <span>・リスク {m._count.risks}</span> : null}
                    {m._count.followUps > 0 ? <span>・フォロー {m._count.followUps}</span> : null}
                  </div>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
