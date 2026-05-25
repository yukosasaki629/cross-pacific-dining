import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Pill } from "@/components/Badges";
import { Tabs } from "@/components/Tabs";
import { fmtDate, fmtMd, isOverdue } from "@/lib/utils";
import { DeleteProjectButton } from "./DeleteProjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      decisions: { orderBy: { deadline: "asc" } },
      risks: { orderBy: [{ severity: "desc" }, { createdAt: "desc" }] },
      updates: { orderBy: { date: "desc" } },
    },
  });
  if (!p) notFound();

  const openDecisions = p.decisions.filter((d) => d.status === "未対応" || d.status === "検討中");
  const openRisks = p.risks.filter((r) => r.status !== "解消");

  return (
    <div>
      <AppHeader
        title={p.name}
        subtitle={`${p.owner ?? "—"}${p.department ? ` ・ ${p.department}` : ""}`}
        backHref="/projects"
        rightSlot={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Pill value={p.status} />
            <span className="pill bg-ink-100 text-ink-600">リスク {p.riskLevel}</span>
          </div>
        }
      />

      <div className="px-3 pt-3 flex gap-2">
        <Link href={`/projects/${id}/edit`} className="btn flex-1 text-[13px]">
          ✎ 編集
        </Link>
        <DeleteProjectButton id={id} name={p.name} />
      </div>

      <div className="px-3">
        <Tabs
          tabs={[
            { key: "overview", label: "概要", content: <Overview p={p} /> },
            { key: "tasks", label: "タスク", badge: p.tasks.length, content: <TasksTab tasks={p.tasks} /> },
            { key: "decisions", label: "判断", badge: openDecisions.length, content: <DecisionsTab decisions={p.decisions} /> },
            { key: "risks", label: "リスク", badge: openRisks.length, content: <RisksTab risks={p.risks} /> },
            { key: "updates", label: "更新", badge: p.updates.length, content: <UpdatesTab updates={p.updates} /> },
            { key: "memo", label: "非公開メモ", content: <PrivateMemoTab memo={p.privateMemo} /> },
          ]}
        />
      </div>
    </div>
  );
}

// ---------- 概要タブ ----------

function Overview({ p }: { p: any }) {
  return (
    <div className="space-y-3">
      <Field label="目的">{p.objective}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="オーナー">{p.owner}</Field>
        <Field label="関係部署">{p.department}</Field>
        <Field label="ステータス"><Pill value={p.status} /></Field>
        <Field label="リスクレベル"><Pill value={p.riskLevel} /></Field>
        <Field label="優先度"><Pill value={p.priority} /></Field>
        <Field label="期限">
          {p.dueDate ? (
            <span className={isOverdue(p.dueDate) ? "font-medium text-bad-700" : ""}>
              {fmtDate(p.dueDate)}{isOverdue(p.dueDate) ? " (超過)" : ""}
            </span>
          ) : "—"}
        </Field>
      </div>
      <Field label="現在の状況">{p.currentSummary}</Field>
      <Field label="成功指標">{p.successMetric}</Field>
      <Field label="次のマイルストーン / アクション">{p.nextAction}</Field>
      <div className="pt-2 text-[11px] text-ink-500">
        最終更新: {fmtDate(p.updatedAt)} ・ 社長と共有: {p.isSharedWithCEO ? "あり" : "なし"}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className="card card-pad">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-[14px] leading-relaxed text-ink-900 whitespace-pre-wrap">
        {empty ? <span className="text-ink-400">未設定</span> : children}
      </div>
    </div>
  );
}

// ---------- タスクタブ ----------

function TasksTab({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) {
    return <div className="card card-pad text-center text-[13px] text-ink-400">タスクはまだありません。</div>;
  }
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="card card-pad">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-ink-900">{t.title}</div>
              <div className="mt-0.5 text-[12px] text-ink-500">
                担当: {t.owner ?? "—"}
              </div>
              {t.memo ? <div className="mt-1 text-[12px] text-ink-600">{t.memo}</div> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Pill value={t.status} />
              {t.dueDate ? (
                <span className={`pill ${isOverdue(t.dueDate) && t.status !== "完了" ? "bg-bad-50 text-bad-700" : "bg-ink-100 text-ink-600"}`}>
                  {fmtMd(t.dueDate)}
                </span>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------- 判断タブ ----------

function DecisionsTab({ decisions }: { decisions: any[] }) {
  if (decisions.length === 0) {
    return <div className="card card-pad text-center text-[13px] text-ink-400">判断事項はありません。</div>;
  }
  return (
    <ul className="space-y-3">
      {decisions.map((d) => (
        <li key={d.id} className="card card-pad">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[15px] font-semibold text-ink-900">{d.topic}</div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Pill value={d.status} />
              <Pill value={`重要度 ${d.importance}`} />
            </div>
          </div>
          {d.background ? <Section label="背景">{d.background}</Section> : null}
          {d.options ? <Section label="選択肢">{d.options}</Section> : null}
          {d.recommendation ? <Section label="推奨案">{d.recommendation}</Section> : null}
          {d.impactIfDelayed ? <Section label="遅れた場合の影響">{d.impactIfDelayed}</Section> : null}
          <div className="mt-2 text-[11px] text-ink-500">
            判断期限: {d.deadline ? fmtDate(d.deadline) : "—"}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-[13px] text-ink-800 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

// ---------- リスクタブ ----------

function RisksTab({ risks }: { risks: any[] }) {
  if (risks.length === 0) {
    return <div className="card card-pad text-center text-[13px] text-ink-400">リスクはありません。</div>;
  }
  return (
    <ul className="space-y-2">
      {risks.map((r) => (
        <li key={r.id} className="card card-pad">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
            <Pill value={r.severity} />
          </div>
          {r.mitigation ? <Section label="対応策">{r.mitigation}</Section> : null}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-500">
            <span>担当: {r.owner ?? "—"}</span>
            <span>·</span>
            <span>状況: {r.status}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------- 更新タブ ----------

function UpdatesTab({ updates }: { updates: any[] }) {
  if (updates.length === 0) {
    return <div className="card card-pad text-center text-[13px] text-ink-400">更新はまだありません。</div>;
  }
  return (
    <ol className="space-y-3 border-l border-ink-200 pl-4">
      {updates.map((u) => (
        <li key={u.id} className="relative">
          <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent-600" />
          <div className="text-[11px] text-ink-500">{fmtDate(u.date)}</div>
          <div className="mt-0.5 whitespace-pre-wrap text-[14px] text-ink-900">{u.content}</div>
          {u.nextAction ? (
            <div className="mt-1 rounded-md bg-ink-50 px-2.5 py-1.5 text-[12px] text-ink-700">
              <span className="font-medium">次のアクション:</span> {u.nextAction}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

// ---------- 非公開メモタブ ----------

function PrivateMemoTab({ memo }: { memo: string | null }) {
  return (
    <div className="card card-pad">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-warn-700">
        <span className="pill bg-warn-50 text-warn-700">優子のみ</span>
        <span>このメモは社長共有ビューには表示されません。</span>
      </div>
      <div className="whitespace-pre-wrap text-[14px] text-ink-900">
        {memo ? memo : <span className="text-ink-400">非公開メモは未入力です。</span>}
      </div>
      <p className="mt-3 text-[11px] text-ink-400">
        ※ 将来的にユーザー認証を追加すれば、ロール別のアクセス制御に発展可能です。
      </p>
    </div>
  );
}
