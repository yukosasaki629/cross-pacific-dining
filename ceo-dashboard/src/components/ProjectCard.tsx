import Link from "next/link";
import { Pill } from "./Badges";
import { fmtMd, isOverdue } from "@/lib/utils";

type CardProject = {
  id: string;
  name: string;
  owner: string | null;
  department: string | null;
  status: string;
  riskLevel: string;
  nextAction: string | null;
  dueDate: Date | null;
};

export function ProjectCard({
  project,
  href,
  needsDecision = false,
}: {
  project: CardProject;
  href: string;
  needsDecision?: boolean;
}) {
  const overdue = isOverdue(project.dueDate);
  return (
    <Link href={href} className="block">
      <div className="card card-pad active:bg-ink-50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-[15px] font-semibold text-ink-900">
              {project.name}
            </div>
            <div className="mt-0.5 text-[12px] text-ink-500">
              {project.owner ?? "—"}
              {project.department ? ` ・ ${project.department}` : ""}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Pill value={project.status} />
            <span className="pill bg-ink-100 text-ink-600">リスク {project.riskLevel}</span>
          </div>
        </div>
        {project.nextAction ? (
          <div className="mt-3 rounded-md bg-ink-50 px-3 py-2 text-[12px] text-ink-700">
            <span className="font-medium text-ink-800">次:</span> {project.nextAction}
          </div>
        ) : null}
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className={overdue ? "font-semibold text-bad-700" : "text-ink-500"}>
            {project.dueDate ? `期限 ${fmtMd(project.dueDate)}` : "期限未設定"}
            {overdue ? "(超過)" : ""}
          </span>
          {needsDecision ? (
            <span className="pill bg-warn-50 text-warn-700">判断必要</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
