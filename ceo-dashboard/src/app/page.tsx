import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { Dot, Pill } from "@/components/Badges";
import { fmtMd, isOverdue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [keyProjects, decisions, risks, followups, overdueTasks, projectIdsNeedingDecision] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: "完了" }, priority: { in: ["高", "中"] } },
      orderBy: [{ priority: "desc" }, { riskLevel: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    prisma.decision.findMany({
      where: { status: { in: ["未対応", "検討中"] } },
      orderBy: [{ deadline: "asc" }, { importance: "desc" }],
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.risk.findMany({
      where: { status: { not: "解消" }, severity: { in: ["高", "中"] } },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.followUp.findMany({
      where: {
        status: { not: "完了" },
        OR: [
          { dueDate: { lte: new Date(Date.now() + 7 * 86400000) } },
          { dueDate: null },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["完了"] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.decision.findMany({
      where: { status: { in: ["未対応", "検討中"] }, projectId: { not: null } },
      select: { projectId: true },
    }),
  ]);

  const projectsWithDecision = new Set(projectIdsNeedingDecision.map((d) => d.projectId));

  return (
    <div>
      <AppHeader title="CEOダッシュボード" subtitle="今、見るべきこと" />

      <div className="px-3 py-4 space-y-1">
        {/* 重要プロジェクト */}
        <SectionHeader title="重要プロジェクト" hrefAll="/projects" count={keyProjects.length} />
        <div className="space-y-2">
          {keyProjects.length === 0 ? (
            <EmptyCard msg="重要プロジェクトはありません。" />
          ) : (
            keyProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                href={`/projects/${p.id}`}
                needsDecision={projectsWithDecision.has(p.id)}
              />
            ))
          )}
        </div>

        {/* 判断が必要な事項 */}
        <SectionHeader title="判断が必要な事項" hrefAll="/decisions" count={decisions.length} />
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <EmptyCard msg="判断待ちはありません。" />
          ) : (
            decisions.map((d) => (
              <Link key={d.id} href={`/decisions`} className="block">
                <div className="card card-pad active:bg-ink-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-ink-900">{d.topic}</div>
                      {d.project ? (
                        <div className="mt-0.5 text-[12px] text-ink-500">{d.project.name}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill value={`重要度 ${d.importance}`} />
                      {d.deadline ? (
                        <span className={`pill ${isOverdue(d.deadline) ? "bg-bad-50 text-bad-700" : "bg-ink-100 text-ink-600"}`}>
                          {isOverdue(d.deadline) ? "期限超過" : `期限 ${fmtMd(d.deadline)}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {d.recommendation ? (
                    <div className="mt-2 text-[12px] text-ink-700">
                      <span className="font-medium">推奨案:</span> {d.recommendation}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* リスクあり案件 */}
        <SectionHeader title="リスクあり案件" hrefAll="/risks" count={risks.length} />
        <div className="space-y-2">
          {risks.length === 0 ? (
            <EmptyCard msg="高・中リスクはありません。" />
          ) : (
            risks.map((r) => (
              <Link key={r.id} href={r.project ? `/projects/${r.project.id}` : "/risks"} className="block">
                <div className="card card-pad active:bg-ink-50">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5"><Dot value={r.severity} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-ink-900">{r.description}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-500">
                        <span>{r.project?.name ?? "—"}</span>
                        <span>·</span>
                        <span>{r.owner ?? "—"}</span>
                      </div>
                    </div>
                    <Pill value={r.severity} />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 今週のフォローアップ */}
        <SectionHeader title="今週のフォローアップ" hrefAll="/followups" count={followups.length} />
        <div className="space-y-2">
          {followups.length === 0 ? (
            <EmptyCard msg="今週フォローすべき項目はありません。" />
          ) : (
            followups.map((f) => (
              <div key={f.id} className="card card-pad">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink-900">{f.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-500">
                      対象: {f.who ?? "—"}
                    </div>
                  </div>
                  <Pill
                    value={f.dueDate ? (isOverdue(f.dueDate) ? "期限超過" : fmtMd(f.dueDate)) : "期限なし"}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* 期限超過タスク */}
        <SectionHeader title="期限超過タスク" hrefAll="/projects" count={overdueTasks.length} />
        <div className="space-y-2">
          {overdueTasks.length === 0 ? (
            <EmptyCard msg="期限超過のタスクはありません。" />
          ) : (
            overdueTasks.map((t) => (
              <Link key={t.id} href={t.projectId ? `/projects/${t.projectId}` : "/projects"} className="block">
                <div className="card card-pad active:bg-ink-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-ink-900">{t.title}</div>
                      <div className="mt-0.5 text-[12px] text-ink-500">
                        {t.project?.name} ・ {t.owner ?? "—"}
                      </div>
                    </div>
                    <span className="pill bg-bad-50 text-bad-700">期限 {fmtMd(t.dueDate)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="pt-6 text-center text-[11px] text-ink-400">
          社長と共有するビューは
          <Link href="/share" className="link ml-1">こちら</Link>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, hrefAll, count }: { title: string; hrefAll?: string; count?: number }) {
  return (
    <div className="h-section">
      <span>
        {title}
        {typeof count === "number" ? <span className="ml-1.5 text-ink-400">({count})</span> : null}
      </span>
      {hrefAll ? (
        <Link href={hrefAll} className="text-[12px] font-normal text-ink-500 active:text-ink-800">
          すべて →
        </Link>
      ) : null}
    </div>
  );
}

function EmptyCard({ msg }: { msg: string }) {
  return <div className="card card-pad text-center text-[13px] text-ink-400">{msg}</div>;
}
