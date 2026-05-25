import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { fmtDate, fmtMd, startOfWeek } from "@/lib/utils";
import { ProcessPanel } from "./ProcessPanel";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

function weekLabel(date: Date): { label: string; tone: string } {
  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const d = new Date(date);
  if (d >= thisWeekStart) return { label: "今週", tone: "bg-accent-50 text-accent-700" };
  if (d >= lastWeekStart) return { label: "先週", tone: "bg-warn-50 text-warn-700" };
  // それより前は「N週間前」
  const diffMs = thisWeekStart.getTime() - d.getTime();
  const weeks = Math.floor(diffMs / (7 * 86400000));
  return { label: `${weeks + 1}週間前`, tone: "bg-ink-100 text-ink-600" };
}

export default async function OneOnOneDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await prisma.meetingNote.findUnique({
    where: { id },
    include: {
      person: true,
      tasks: { include: { project: { select: { name: true } } } },
      decisions: { include: { project: { select: { name: true } } } },
      risks: { include: { project: { select: { name: true } } } },
      followUps: true,
      updates: { include: { project: { select: { name: true } } } },
    },
  });
  if (!m) notFound();

  return (
    <div>
      <AppHeader
        title={`${m.person.name} との 1on1`}
        subtitle={`${m.person.role ?? ""} ・ ${fmtDate(m.date)}`}
        backHref="/oneonones"
        rightSlot={<DeleteButton id={m.id} />}
      />

      <div className="px-3 pt-3">
        <span className={`pill ${weekLabel(m.date).tone}`}>{weekLabel(m.date).label}</span>
        <span className="ml-2 text-[12px] text-ink-500">{fmtDate(m.date)}</span>
      </div>

      <div className="px-3 py-4 space-y-3">
        {/* 生メモ */}
        <div className="card card-pad">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-ink-700">生メモ</h2>
            <span className="pill bg-ink-100 text-ink-600">優子のみ</span>
          </div>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-ink-50 p-3 text-[13px] leading-relaxed text-ink-800">
            {m.rawNotes}
          </pre>
          <p className="mt-2 text-[11px] text-ink-500">
            ※ 生メモ本文は社長共有ビューには出ません。抽出された個別項目だけが共有されます。
          </p>
        </div>

        {/* 処理パネル */}
        <ProcessPanel meetingId={m.id} alreadyProcessed={!!m.processedAt} />

        {/* 既に派生したレコード */}
        {m.processedAt ? (
          <>
            <h2 className="h-section">
              <span>このメモから派生したレコード</span>
              <span className="text-[11px] font-normal text-ink-500">
                処理日 {fmtDate(m.processedAt)}
              </span>
            </h2>

            {m.summary ? (
              <div className="card card-pad">
                <div className="text-[11px] font-semibold uppercase text-ink-500">サマリー</div>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-900">{m.summary}</p>
              </div>
            ) : null}

            {m.tasks.length > 0 ? (
              <RecordSection title={`アクション (${m.tasks.length})`}>
                {m.tasks.map((t) => (
                  <li key={t.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-ink-900">{t.title}</div>
                        <div className="mt-0.5 text-[11px] text-ink-500">
                          {t.owner ?? "未割当"}
                          {t.project ? ` ・ ${t.project.name}` : ""}
                          {t.dueDate ? ` ・ 期限 ${fmtMd(t.dueDate)}` : ""}
                        </div>
                      </div>
                      <Pill value={t.status} />
                    </div>
                  </li>
                ))}
              </RecordSection>
            ) : null}

            {m.decisions.length > 0 ? (
              <RecordSection title={`意思決定 (${m.decisions.length})`}>
                {m.decisions.map((d) => (
                  <li key={d.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-ink-900">{d.topic}</div>
                        <div className="mt-0.5 text-[11px] text-ink-500">
                          {d.decisionType === "made" ? "決定済" : "判断待ち"}
                          {d.project ? ` ・ ${d.project.name}` : ""}
                          {d.sensitivity !== "general" ? (
                            <span className="ml-1 text-bad-700">・機密区分: {d.sensitivity}</span>
                          ) : null}
                        </div>
                      </div>
                      <Pill value={`重要度 ${d.importance}`} />
                    </div>
                  </li>
                ))}
              </RecordSection>
            ) : null}

            {m.risks.length > 0 ? (
              <RecordSection title={`リスク (${m.risks.length})`}>
                {m.risks.map((r) => (
                  <li key={r.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
                        {r.project ? (
                          <div className="mt-0.5 text-[11px] text-ink-500">{r.project.name}</div>
                        ) : null}
                      </div>
                      <Pill value={r.severity} />
                    </div>
                  </li>
                ))}
              </RecordSection>
            ) : null}

            {m.followUps.length > 0 ? (
              <RecordSection title={`フォローアップ (${m.followUps.length})`}>
                {m.followUps.map((f) => (
                  <li key={f.id} className="card card-pad">
                    <div className="text-[14px] font-medium text-ink-900">{f.title}</div>
                    <div className="mt-0.5 text-[11px] text-ink-500">
                      対象: {f.who ?? "—"}
                    </div>
                  </li>
                ))}
              </RecordSection>
            ) : null}

            {m.updates.length > 0 ? (
              <RecordSection title={`プロジェクト更新 (${m.updates.length})`}>
                {m.updates.map((u) => (
                  <li key={u.id} className="card card-pad">
                    <div className="text-[14px] font-medium text-ink-900">{u.content}</div>
                    {u.project ? (
                      <div className="mt-0.5 text-[11px] text-ink-500">{u.project.name}</div>
                    ) : null}
                  </li>
                ))}
              </RecordSection>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function RecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 className="h-section"><span>{title}</span></h3>
      <ul className="space-y-2">{children}</ul>
    </>
  );
}
