import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { upsertPerson } from "../actions";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { meetings: true } } },
  });

  return (
    <div>
      <AppHeader title="1on1 相手の管理" backHref="/oneonones" />

      <div className="space-y-3 px-3 py-4">
        <form action={upsertPerson} className="card card-pad space-y-3">
          <h2 className="text-[13px] font-semibold text-ink-700">新しく追加</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">名前</label>
              <input name="name" required className="input" placeholder="例:山田太郎" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">役職</label>
              <input name="role" className="input" placeholder="例:CFO" />
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
            {people.map((p) => (
              <li key={p.id} className="card card-pad">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium text-ink-900">{p.name}</div>
                    <div className="text-[12px] text-ink-500">
                      {p.role ?? "—"} ・ 1on1 {p._count.meetings} 件 ・ 登録 {fmtDate(p.createdAt)}
                    </div>
                  </div>
                  <Link
                    href={`/oneonones?p=${p.id}`}
                    className="btn text-[12px]"
                  >
                    履歴を見る
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
