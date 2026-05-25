import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ItemCheckbox } from "@/components/ItemCheckbox";
import { Pill } from "@/components/Badges";
import { createMeetingNote } from "../actions";
import { fmtDate, fmtMd, isOverdue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewOneOnOne({
  searchParams,
}: {
  searchParams: Promise<{ personId?: string }>;
}) {
  const sp = await searchParams;
  const preselectedPersonId = sp?.personId ?? "";

  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  if (people.length === 0) {
    return (
      <div>
        <AppHeader title="新規1on1" backHref="/oneonones" />
        <div className="px-3 py-6">
          <div className="card card-pad text-center">
            <p className="text-[14px] text-ink-700">最初に1on1の相手を登録してください。</p>
            <Link href="/oneonones/people" className="btn-primary mt-3 inline-flex">
              + 相手を登録する
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 事前選択された相手の過去 1on1 から未完了項目を取得(リマインダー表示)
  let pendingItems: {
    tasks: any[];
    followUps: any[];
    decisions: any[];
    risks: any[];
    person: { name: string; role: string | null };
    lastMeetingDate: Date | null;
  } | null = null;

  if (preselectedPersonId) {
    const person = people.find((p) => p.id === preselectedPersonId);
    if (person) {
      const meetings = await prisma.meetingNote.findMany({
        where: { personId: preselectedPersonId },
        select: { id: true, date: true },
        orderBy: { date: "desc" },
      });
      const meetingIds = meetings.map((m) => m.id);
      const [tasks, followUps, decisions, risks] = await Promise.all([
        prisma.task.findMany({
          where: { meetingNoteId: { in: meetingIds }, status: { notIn: ["完了"] } },
          orderBy: [{ dueDate: "asc" }],
          take: 20,
          include: { project: { select: { name: true } }, meetingNote: { select: { date: true } } },
        }),
        prisma.followUp.findMany({
          where: { meetingNoteId: { in: meetingIds }, status: { notIn: ["完了"] } },
          orderBy: { dueDate: "asc" },
          take: 20,
          include: { meetingNote: { select: { date: true } } },
        }),
        prisma.decision.findMany({
          where: { meetingNoteId: { in: meetingIds }, status: { in: ["未対応", "検討中"] } },
          orderBy: { deadline: "asc" },
          take: 20,
          include: { meetingNote: { select: { date: true } } },
        }),
        prisma.risk.findMany({
          where: { meetingNoteId: { in: meetingIds }, status: { not: "解消" } },
          orderBy: [{ severity: "desc" }],
          take: 20,
          include: { meetingNote: { select: { date: true } } },
        }),
      ]);
      pendingItems = {
        tasks,
        followUps,
        decisions,
        risks,
        person: { name: person.name, role: person.role },
        lastMeetingDate: meetings[0]?.date ?? null,
      };
    }
  }

  const totalPending = pendingItems
    ? pendingItems.tasks.length + pendingItems.followUps.length + pendingItems.decisions.length + pendingItems.risks.length
    : 0;

  return (
    <div>
      <AppHeader
        title="新規1on1"
        subtitle={pendingItems ? `${pendingItems.person.name} との 1on1` : "メモを貼り付けて保存"}
        backHref={preselectedPersonId ? `/oneonones/people/${preselectedPersonId}` : "/oneonones"}
      />

      <div className="px-3 py-4 space-y-4">
        {/* 過去からの未完了項目リマインダー */}
        {pendingItems && totalPending > 0 ? (
          <div className="card card-pad border-warn-600/30 bg-warn-50/40">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-warn-700">
                💡 前回までの未完了({totalPending}件)— 1on1中に確認してね
              </h2>
              <Link
                href={`/oneonones/people/${preselectedPersonId}`}
                className="text-[11px] text-ink-500 underline"
              >
                全て見る
              </Link>
            </div>
            <p className="mb-3 text-[11px] text-ink-600">
              チェックで完了マーク。「やった?」を1on1で確認しながら更新してください。
            </p>
            <ul className="space-y-1.5">
              {pendingItems.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2 rounded-md bg-white p-2">
                  <ItemCheckbox type="task" id={t.id} currentStatus={t.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink-900">{t.title}</div>
                    <div className="text-[10px] text-ink-500">
                      {t.project ? `${t.project.name} ・ ` : ""}
                      {t.meetingNote ? `${fmtMd(t.meetingNote.date)} ` : ""}
                      {t.dueDate ? (
                        <span className={isOverdue(t.dueDate) ? "text-bad-700 font-medium" : ""}>
                          ・期限 {fmtMd(t.dueDate)}
                        </span>
                      ) : ""}
                    </div>
                  </div>
                  <Pill value={t.status} />
                </li>
              ))}
              {pendingItems.followUps.map((f) => (
                <li key={f.id} className="flex items-start gap-2 rounded-md bg-white p-2">
                  <ItemCheckbox type="followup" id={f.id} currentStatus={f.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink-900">{f.title}</div>
                    <div className="text-[10px] text-ink-500">
                      {f.who ? `対象: ${f.who} ・ ` : ""}
                      {f.meetingNote ? `${fmtMd(f.meetingNote.date)}` : ""}
                    </div>
                  </div>
                  <Pill value={f.status} />
                </li>
              ))}
              {pendingItems.decisions.map((d) => (
                <li key={d.id} className="flex items-start gap-2 rounded-md bg-white p-2">
                  <ItemCheckbox type="decision" id={d.id} currentStatus={d.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink-900">{d.topic}</div>
                    <div className="text-[10px] text-ink-500">
                      判断待ち ・ {d.meetingNote ? fmtMd(d.meetingNote.date) : ""}
                    </div>
                  </div>
                  <Pill value={`重要度 ${d.importance}`} />
                </li>
              ))}
              {pendingItems.risks.map((r) => (
                <li key={r.id} className="flex items-start gap-2 rounded-md bg-white p-2">
                  <ItemCheckbox type="risk" id={r.id} currentStatus={r.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink-900">{r.description}</div>
                    <div className="text-[10px] text-ink-500">
                      リスク ・ {r.meetingNote ? fmtMd(r.meetingNote.date) : ""}
                    </div>
                  </div>
                  <Pill value={r.severity} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 入力フォーム */}
        <form action={createMeetingNote} className="card card-pad space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">対象者</label>
            <select name="personId" required className="input" defaultValue={preselectedPersonId}>
              <option value="" disabled>— 選択 —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.role ? ` / ${p.role}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">日付</label>
            <input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              1on1 の生メモ
            </label>
            <textarea
              name="rawNotes"
              required
              className="textarea min-h-[260px]"
              placeholder={`ここに 1on1 メモをそのまま貼り付けてください(日本語・英語どちらでもOK)。\n\n抽出のヒント:\n・「Action: 〜する」「TODO: 〜」 / 「Action:」「TODO:」「will / needs to」\n・「決定:」「合意した」 / 「Decision:」「Agreed」「Approved」\n・「判断待ち」「決めて欲しい」 / 「TBD」「Pending」「awaiting CEO」\n・「リスク」「ブロック」「遅延」 / 「Risk:」「Blocker」「Delay」「at risk」\n・「最優先」「後回し」 / 「top priority」「ASAP」「on hold」\n・既存プロジェクト名が出てきたら自動で紐付け\n・「報酬」「取締役会」「役員人事」/「compensation」「board」「executive only」 → 自動で機密フラグ`}
            />
          </div>

          <div className="flex gap-2">
            <Link
              href={preselectedPersonId ? `/oneonones/people/${preselectedPersonId}` : "/oneonones"}
              className="btn flex-1"
            >
              キャンセル
            </Link>
            <button type="submit" className="btn-primary flex-1">保存する</button>
          </div>
        </form>
      </div>
    </div>
  );
}
