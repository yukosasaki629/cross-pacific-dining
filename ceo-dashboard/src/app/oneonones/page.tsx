import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { fmtDate, startOfWeek } from "@/lib/utils";
import { CleanupAllButton } from "./CleanupAllButton";

export const dynamic = "force-dynamic";

type MeetingWithMeta = {
  id: string;
  date: Date;
  rawNotes: string;
  summary: string | null;
  processedAt: Date | null;
  person: { name: string; role: string | null };
  _count: { tasks: number; decisions: number; risks: number; followUps: number };
};

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
      take: 200,
      include: {
        person: { select: { name: true, role: true } },
        _count: { select: { tasks: true, decisions: true, risks: true, followUps: true } },
      },
    }),
  ]);

  // 週でグルーピング
  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeek: MeetingWithMeta[] = [];
  const lastWeek: MeetingWithMeta[] = [];
  const olderByMonth: Map<string, MeetingWithMeta[]> = new Map();

  for (const m of meetings) {
    const d = new Date(m.date);
    if (d >= thisWeekStart) {
      thisWeek.push(m);
    } else if (d >= lastWeekStart) {
      lastWeek.push(m);
    } else {
      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      (olderByMonth.get(key) ?? olderByMonth.set(key, []).get(key)!).push(m);
    }
  }

  return (
    <div>
      <AppHeader
        title="1on1 受信箱"
        subtitle={`${meetings.length} 件 / ${people.length} 名`}
        rightSlot={
          <Link href="/oneonones/new" className="btn-primary text-[12px]">
            + 新規
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
            + 人を編集
          </Link>
        </div>
      </div>

      <div className="px-3 py-4">
        <CleanupAllButton />
        {personFilter ? (
          (() => {
            const selectedPerson = people.find((p) => p.id === personFilter);
            if (!selectedPerson) return null;
            return (
              <div className="mb-3 rounded-lg border border-accent-200 bg-accent-50/40 px-3 py-2.5 text-[13px]">
                <Link
                  href={`/oneonones/people/${personFilter}`}
                  className="font-medium text-accent-700"
                >
                  → {selectedPerson.name} のダッシュボードを開く(未完了・進捗を確認)
                </Link>
              </div>
            );
          })()
        ) : null}
        {meetings.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            まだ1on1がありません。<br />
            <Link href="/oneonones/new" className="link mt-2 inline-block">
              最初の1on1メモを貼り付ける →
            </Link>
          </div>
        ) : (
          <>
            <WeekSection title="今週" tone="now" meetings={thisWeek} />
            <WeekSection title="先週" tone="recent" meetings={lastWeek} />
            {Array.from(olderByMonth.entries()).map(([month, list]) => (
              <WeekSection key={month} title={month} tone="past" meetings={list} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function WeekSection({
  title,
  tone,
  meetings,
}: {
  title: string;
  tone: "now" | "recent" | "past";
  meetings: MeetingWithMeta[];
}) {
  if (meetings.length === 0) {
    if (tone === "now") {
      return (
        <>
          <h2 className="h-section">
            <span>{title} (0)</span>
          </h2>
          <div className="card card-pad text-center text-[12px] text-ink-400">
            今週はまだ入力されていません
          </div>
        </>
      );
    }
    return null;
  }
  const pill =
    tone === "now"
      ? "bg-accent-50 text-accent-700"
      : tone === "recent"
        ? "bg-warn-50 text-warn-700"
        : "bg-ink-100 text-ink-600";

  return (
    <>
      <h2 className="h-section">
        <span>
          {title} <span className="ml-1 text-ink-400">({meetings.length})</span>
        </span>
      </h2>
      <ul className="space-y-2 pb-3">
        {meetings.map((m) => (
          <li key={m.id}>
            <Link href={`/oneonones/${m.id}`} className="block">
              <div className="card card-pad active:bg-ink-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`pill ${pill}`}>{title}</span>
                      <span className="text-[12px] text-ink-500">{fmtDate(m.date)}</span>
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-ink-900">
                      {m.person.name}
                      {m.person.role ? (
                        <span className="ml-1.5 text-[12px] font-normal text-ink-500">
                          / {m.person.role}
                        </span>
                      ) : null}
                    </div>
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
                  <p className="mt-2 line-clamp-2 text-[12px] text-ink-500">
                    {m.rawNotes.slice(0, 120)}
                  </p>
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
          </li>
        ))}
      </ul>
    </>
  );
}
