import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { ItemActions } from "@/components/ItemActions";
import { endOfWeek, fmtDate, fmtMd, isOverdue, startOfWeek, toInputDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FollowupsPage() {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  const [thisWeek, later, noDate, completed] = await Promise.all([
    prisma.followUp.findMany({
      where: { status: { not: "完了" }, dueDate: { gte: weekStart, lt: weekEnd } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.followUp.findMany({
      where: { status: { not: "完了" }, dueDate: { gte: weekEnd } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.followUp.findMany({
      where: { status: { not: "完了" }, dueDate: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.followUp.findMany({
      where: { status: "完了" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <AppHeader
        title="今週のフォローアップ"
        subtitle={`${fmtDate(weekStart)} 〜`}
      />
      <div className="px-3 py-4 space-y-1">
        {thisWeek.length > 0 ? (
          <>
            <h2 className="h-section"><span>今週中 ({thisWeek.length})</span></h2>
            <div className="space-y-2">
              {thisWeek.map((f) => <FollowCard key={f.id} f={f} />)}
            </div>
          </>
        ) : null}

        {noDate.length > 0 ? (
          <>
            <h2 className="h-section"><span>期限未設定 ({noDate.length})</span></h2>
            <div className="space-y-2">
              {noDate.map((f) => <FollowCard key={f.id} f={f} />)}
            </div>
          </>
        ) : null}

        {later.length > 0 ? (
          <>
            <h2 className="h-section"><span>来週以降 ({later.length})</span></h2>
            <div className="space-y-2">
              {later.map((f) => <FollowCard key={f.id} f={f} />)}
            </div>
          </>
        ) : null}

        {thisWeek.length === 0 && noDate.length === 0 && later.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            フォロー項目はありません。
          </div>
        ) : null}

        {completed.length > 0 ? (
          <>
            <h2 className="h-section"><span>最近完了 ({completed.length})</span></h2>
            <div className="space-y-2">
              {completed.map((f) => (
                <div key={f.id} className="card card-pad opacity-60">
                  <div className="text-[14px] line-through decoration-ink-400 text-ink-700">{f.title}</div>
                  <div className="mt-0.5 text-[11px] text-ink-500">対象: {f.who ?? "—"}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function FollowCard({ f }: { f: any }) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-ink-900">{f.title}</div>
          <div className="mt-0.5 text-[12px] text-ink-500">対象: {f.who ?? "—"}</div>
          {f.memo ? <div className="mt-1 text-[12px] text-ink-600">{f.memo}</div> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill value={f.status} />
          {f.dueDate ? (
            <span className={`pill ${isOverdue(f.dueDate) ? "bg-bad-50 text-bad-700" : "bg-ink-100 text-ink-600"}`}>
              {fmtMd(f.dueDate)}
            </span>
          ) : null}
          <ItemActions
            type="followup"
            id={f.id}
            current={{
              title: f.title,
              who: f.who,
              status: f.status,
              dueDate: toInputDate(f.dueDate),
              memo: f.memo,
              visibility: f.visibility,
            }}
          />
        </div>
      </div>
    </div>
  );
}
