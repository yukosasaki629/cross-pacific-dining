import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { PROJECT_STATUS } from "@/lib/vocab";

export const dynamic = "force-dynamic";

type Filter = "全件" | (typeof PROJECT_STATUS)[number];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  const filter = (sp?.s as Filter) ?? "全件";

  const where = filter === "全件" ? {} : { status: filter };
  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ priority: "desc" }, { status: "asc" }, { dueDate: "asc" }],
  });

  const decisions = await prisma.decision.findMany({
    where: { status: { in: ["未対応", "検討中"] }, projectId: { not: null } },
    select: { projectId: true },
  });
  const projectsNeedingDecision = new Set(decisions.map((d) => d.projectId));

  const filters: Filter[] = ["全件", ...PROJECT_STATUS];

  return (
    <div>
      <AppHeader title="プロジェクト一覧" subtitle={`${projects.length} 件`} />

      <div className="sticky top-[57px] z-10 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          {filters.map((f) => (
            <Link
              key={f}
              href={f === "全件" ? "/projects" : `/projects?s=${encodeURIComponent(f)}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
                filter === f
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2 px-3 py-4">
        {projects.length === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            該当するプロジェクトがありません。
          </div>
        ) : (
          projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              href={`/projects/${p.id}`}
              needsDecision={projectsNeedingDecision.has(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
