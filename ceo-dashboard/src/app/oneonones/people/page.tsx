import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { upsertPerson } from "../actions";
import { fmtDate } from "@/lib/utils";
import { DeletePersonButton } from "./DeletePersonButton";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { meetings: true } },
      meetings: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
    },
  });

  // 各人の未完了項目数を集計
  const personIds = people.map((p) => p.id);
  const meetingsByPerson = await prisma.meetingNote.findMany({
    where: { personId: { in: personIds } },
    select: { id: true, personId: true },
  });
  const meetingIdsByPerson = new Map<string, string[]>();
  for (const m of meetingsByPerson) {
    if (!meetingIdsByPerson.has(m.personId)) meetingIdsByPerson.set(m.personId, []);
    meetingIdsByPerson.get(m.personId)!.push(m.id);
  }

  const openCounts = new Map<string, number>();
  for (const [personId, mIds] of meetingIdsByPerson) {
    if (mIds.length === 0) continue;
    const [t, f, d, r] = await Promise.all([
      prisma.task.count({ where: { meetingNoteId: { in: mIds }, status: { notIn: ["完了"] } } }),
      prisma.followUp.count({ where: { meetingNoteId: { in: mIds }, status: { notIn: ["完了"] } } }),
      prisma.decision.count({ where: { meetingNoteId: { in: mIds }, status: { in: ["未対応", "検討中"] } } }),
      prisma.risk.count({ where: { meetingNoteId: { in: mIds }, status: { not: "解消" } } }),
    ]);
    openCounts.set(personId, t + f + d + r);
  }

  return (
    <div>
      <AppHeader title="1on1 相手の管理" backHref="/oneonones" />

      <div className="space-y-3 px-3 py-4">
        <form action={upsertPerson} className="card card-pad space-y-3">
          <h2 className="text-[13px] font-semibold text-ink-700">新しく追加</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">名前</label>
              <input name="name" required className="input" placeholder="例:Arlene" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">役職</label>
              <input name="role" className="input" placeholder="例:CPO" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">追加</button>
        </form>

        <h2 className="h-section"><span>登録済み ({people.length} 名)</span></h2>
        {people.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            まだ登録された相手がいません。
          </div>
        ) : (
          <ul className="space-y-2">
            {people.map((p) => {
              const openCount = openCounts.get(p.id) ?? 0;
              return (
                <li key={p.id} className="card card-pad">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/oneonones/people/${p.id}`} className="min-w-0 flex-1 active:opacity-70">
                      <div className="text-[14px] font-medium text-ink-900">{p.name}</div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {p.role ?? "—"} ・ 1on1 {p._count.meetings} 回
                        {p.meetings[0] ? ` ・ 直近 ${fmtDate(p.meetings[0].date)}` : ""}
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      {openCount > 0 ? (
                        <div className="rounded-full bg-warn-50 px-3 py-1 text-[12px] font-medium text-warn-700">
                          未完了 {openCount}
                        </div>
                      ) : p._count.meetings > 0 ? (
                        <div className="rounded-full bg-ok-50 px-3 py-1 text-[12px] font-medium text-ok-700">
                          完了
                        </div>
                      ) : (
                        <div className="text-[11px] text-ink-400">未実施</div>
                      )}
                      <DeletePersonButton
                        id={p.id}
                        name={p.name}
                        meetingCount={p._count.meetings}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
