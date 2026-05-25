import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { ItemCheckbox } from "@/components/ItemCheckbox";
import { ItemActions } from "@/components/ItemActions";
import { fmtDate, fmtMd, isOverdue, daysAgo, toInputDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PersonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) notFound();

  // この人との 1on1 で派生した未完了項目
  const meetings = await prisma.meetingNote.findMany({
    where: { personId: id },
    orderBy: { date: "desc" },
    include: { _count: { select: { tasks: true, decisions: true, risks: true, followUps: true } } },
  });

  const meetingIds = meetings.map((m) => m.id);

  const [openTasks, openFollowUps, openDecisions, openRisks, recentlyDone] = await Promise.all([
    prisma.task.findMany({
      where: { meetingNoteId: { in: meetingIds }, status: { notIn: ["完了"] } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      include: { project: { select: { id: true, name: true } }, meetingNote: { select: { date: true } } },
    }),
    prisma.followUp.findMany({
      where: { meetingNoteId: { in: meetingIds }, status: { notIn: ["完了"] } },
      orderBy: { dueDate: "asc" },
      include: { meetingNote: { select: { date: true } } },
    }),
    prisma.decision.findMany({
      where: { meetingNoteId: { in: meetingIds }, status: { in: ["未対応", "検討中"] } },
      orderBy: [{ importance: "asc" }, { deadline: "asc" }],
      include: { project: { select: { id: true, name: true } }, meetingNote: { select: { date: true } } },
    }),
    prisma.risk.findMany({
      where: { meetingNoteId: { in: meetingIds }, status: { not: "解消" } },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      include: { project: { select: { id: true, name: true } }, meetingNote: { select: { date: true } } },
    }),
    // 最近完了した項目(進捗が見える)
    prisma.task.findMany({
      where: { meetingNoteId: { in: meetingIds }, status: "完了", updatedAt: { gte: daysAgo(30) } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { meetingNote: { select: { date: true } } },
    }),
  ]);

  const openTotal = openTasks.length + openFollowUps.length + openDecisions.length + openRisks.length;
  const lastMeeting = meetings[0];

  return (
    <div>
      <AppHeader
        title={person.name}
        subtitle={`${person.role ?? "—"} ・ 1on1 ${meetings.length}回${lastMeeting ? ` ・ 直近 ${fmtDate(lastMeeting.date)}` : ""}`}
        backHref="/oneonones/people"
        rightSlot={
          <Link
            href={`/oneonones/new?personId=${id}`}
            className="btn-primary text-[12px]"
          >
            + 新規1on1
          </Link>
        }
      />

      <div className="px-3 py-4 space-y-1">
        {/* サマリーカード */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatCard label="未完了" value={openTotal} tone={openTotal > 0 ? "warn" : "ok"} />
          <StatCard label="アクション" value={openTasks.length + openFollowUps.length} />
          <StatCard label="判断待ち" value={openDecisions.length} />
          <StatCard label="リスク" value={openRisks.length} />
        </div>

        {openTotal === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            この人との未完了項目はありません 👍
          </div>
        ) : null}

        {/* 未完了タスク */}
        {openTasks.length > 0 ? (
          <>
            <h2 className="h-section"><span>未完了アクション ({openTasks.length})</span></h2>
            <ul className="space-y-2">
              {openTasks.map((t) => (
                <li key={t.id} className="card card-pad">
                  <div className="flex items-start gap-3">
                    <ItemCheckbox type="task" id={t.id} currentStatus={t.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{t.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
                        <span>担当: {t.owner ?? "—"}</span>
                        {t.project ? (
                          <>
                            <span>·</span>
                            <Link href={`/projects/${t.project.id}`} className="link">{t.project.name}</Link>
                          </>
                        ) : null}
                        {t.dueDate ? (
                          <>
                            <span>·</span>
                            <span className={isOverdue(t.dueDate) ? "text-bad-700 font-medium" : ""}>
                              期限 {fmtMd(t.dueDate)}{isOverdue(t.dueDate) ? "(超過)" : ""}
                            </span>
                          </>
                        ) : null}
                        {t.meetingNote ? (
                          <>
                            <span>·</span>
                            <span>{fmtMd(t.meetingNote.date)} の1on1から</span>
                          </>
                        ) : null}
                      </div>
                      {t.memo ? <div className="mt-1 text-[11px] text-ink-600">{t.memo}</div> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={t.status} />
                      <ItemActions
                        type="task"
                        id={t.id}
                        current={{
                          title: t.title,
                          owner: t.owner,
                          status: t.status,
                          dueDate: toInputDate(t.dueDate),
                          priority: t.priority,
                          memo: t.memo,
                          visibility: t.visibility,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* 未完了フォローアップ */}
        {openFollowUps.length > 0 ? (
          <>
            <h2 className="h-section"><span>未完了フォローアップ ({openFollowUps.length})</span></h2>
            <ul className="space-y-2">
              {openFollowUps.map((f) => (
                <li key={f.id} className="card card-pad">
                  <div className="flex items-start gap-3">
                    <ItemCheckbox type="followup" id={f.id} currentStatus={f.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{f.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
                        <span>対象: {f.who ?? "—"}</span>
                        {f.dueDate ? (
                          <>
                            <span>·</span>
                            <span className={isOverdue(f.dueDate) ? "text-bad-700 font-medium" : ""}>
                              期限 {fmtMd(f.dueDate)}
                            </span>
                          </>
                        ) : null}
                        {f.meetingNote ? (
                          <>
                            <span>·</span>
                            <span>{fmtMd(f.meetingNote.date)} の1on1から</span>
                          </>
                        ) : null}
                      </div>
                      {f.memo ? <div className="mt-1 text-[11px] text-ink-600">{f.memo}</div> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={f.status} />
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
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* 判断待ち */}
        {openDecisions.length > 0 ? (
          <>
            <h2 className="h-section"><span>判断待ち ({openDecisions.length})</span></h2>
            <ul className="space-y-2">
              {openDecisions.map((d) => (
                <li key={d.id} className="card card-pad">
                  <div className="flex items-start gap-3">
                    <ItemCheckbox type="decision" id={d.id} currentStatus={d.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{d.topic}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
                        {d.project ? (
                          <Link href={`/projects/${d.project.id}`} className="link">{d.project.name}</Link>
                        ) : null}
                        {d.deadline ? (
                          <>
                            <span>·</span>
                            <span className={isOverdue(d.deadline) ? "text-bad-700 font-medium" : ""}>
                              期限 {fmtMd(d.deadline)}
                            </span>
                          </>
                        ) : null}
                        {d.meetingNote ? (
                          <>
                            <span>·</span>
                            <span>{fmtMd(d.meetingNote.date)} から</span>
                          </>
                        ) : null}
                        {d.sensitivity !== "general" ? (
                          <>
                            <span>·</span>
                            <span className="text-bad-700">機密: {d.sensitivity}</span>
                          </>
                        ) : null}
                      </div>
                      {d.recommendation ? (
                        <div className="mt-1 text-[12px] text-ink-700">推奨: {d.recommendation}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={`重要度 ${d.importance}`} />
                      <ItemActions
                        type="decision"
                        id={d.id}
                        current={{
                          topic: d.topic,
                          status: d.status,
                          importance: d.importance,
                          dueDate: toInputDate(d.deadline),
                          recommendation: d.recommendation,
                          sensitivity: d.sensitivity,
                          visibility: d.visibility,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* リスク */}
        {openRisks.length > 0 ? (
          <>
            <h2 className="h-section"><span>未解消リスク ({openRisks.length})</span></h2>
            <ul className="space-y-2">
              {openRisks.map((r) => (
                <li key={r.id} className="card card-pad">
                  <div className="flex items-start gap-3">
                    <ItemCheckbox type="risk" id={r.id} currentStatus={r.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
                        {r.project ? (
                          <Link href={`/projects/${r.project.id}`} className="link">{r.project.name}</Link>
                        ) : null}
                        {r.meetingNote ? (
                          <>
                            <span>·</span>
                            <span>{fmtMd(r.meetingNote.date)} から</span>
                          </>
                        ) : null}
                      </div>
                      {r.mitigation ? (
                        <div className="mt-1 text-[12px] text-ink-700">対応策: {r.mitigation}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={r.severity} />
                      <ItemActions
                        type="risk"
                        id={r.id}
                        current={{
                          description: r.description,
                          severity: r.severity,
                          status: r.status,
                          owner: r.owner,
                          mitigation: r.mitigation,
                          visibility: r.visibility,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* 最近完了した項目(進捗が見える) */}
        {recentlyDone.length > 0 ? (
          <>
            <h2 className="h-section"><span>✓ 最近30日で完了 ({recentlyDone.length})</span></h2>
            <ul className="space-y-1">
              {recentlyDone.map((t) => (
                <li key={t.id} className="rounded-md border border-ok-50 bg-ok-50/40 p-2">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-ok-700">✓</span>
                    <span className="text-ink-700 line-through decoration-ink-300">{t.title}</span>
                  </div>
                  <div className="ml-5 text-[10px] text-ink-500">
                    {t.meetingNote ? `${fmtMd(t.meetingNote.date)} の1on1から ・ ` : ""}
                    完了 {fmtMd(t.updatedAt)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* 1on1 履歴 */}
        <h2 className="h-section"><span>1on1 履歴 ({meetings.length})</span></h2>
        {meetings.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            まだ1on1がありません。
            <br />
            <Link href={`/oneonones/new?personId=${id}`} className="link mt-1 inline-block">
              最初の1on1を入力する →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li key={m.id}>
                <Link href={`/oneonones/${m.id}`} className="block">
                  <div className="card card-pad active:bg-ink-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-medium text-ink-900">{fmtDate(m.date)}</div>
                        {m.summary ? (
                          <p className="mt-1 line-clamp-2 text-[12px] text-ink-600">{m.summary}</p>
                        ) : (
                          <p className="mt-1 line-clamp-2 text-[12px] text-ink-500">{m.rawNotes.slice(0, 100)}</p>
                        )}
                      </div>
                      {m.processedAt ? <Pill value="処理済" /> : <span className="pill bg-warn-50 text-warn-700">未処理</span>}
                    </div>
                    {m.processedAt ? (
                      <div className="mt-1 flex gap-2 text-[11px] text-ink-500">
                        {m._count.tasks > 0 ? <span>ア{m._count.tasks}</span> : null}
                        {m._count.decisions > 0 ? <span>・判{m._count.decisions}</span> : null}
                        {m._count.risks > 0 ? <span>・リ{m._count.risks}</span> : null}
                        {m._count.followUps > 0 ? <span>・F{m._count.followUps}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  const cls =
    tone === "warn" && value > 0
      ? "text-warn-700"
      : tone === "ok"
        ? "text-ok-700"
        : "text-ink-900";
  return (
    <div className="card card-pad text-center">
      <div className="text-[10px] font-semibold uppercase text-ink-500">{label}</div>
      <div className={`mt-0.5 text-xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}
