import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LevelBadge, StatusBadge } from "@/components/ui/Badges";
import { fmtDate } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const sp = await searchParams;
  const view = sp?.view ?? "all";
  const where: any = {};
  if (view === "at-risk") where.status = { in: ["At Risk", "Blocked"] };
  if (view === "blocked") where.status = "Blocked";
  if (view === "no-owner") where.ownerId = null;
  if (view === "ai") where.OR = [
    { name: { contains: "AI" } },
    { description: { contains: "AI" } },
    { tags: { some: { name: "AI" } } },
  ];

  const projects = await prisma.project.findMany({
    where,
    orderBy: [{ status: "asc" }, { priorityLevel: "asc" }, { lastUpdated: "desc" }],
    include: { owner: true, sponsor: true, _count: { select: { actionItems: true, riskRecords: true } } },
  });

  const tabs = [
    { key: "all", label: "すべて" },
    { key: "at-risk", label: "要注意 / ブロック中" },
    { key: "blocked", label: "ブロック中のみ" },
    { key: "no-owner", label: "担当者未設定" },
    { key: "ai", label: "AI / 自動化" },
  ];

  return (
    <div>
      <PageHeader
        title="部門横断プロジェクト"
        subtitle="戦略・部門横断のイニシアチブを一覧。"
        actions={<Link href="/projects/new" className="btn-primary">+ 新規プロジェクト</Link>}
      />

      <div className="mb-4 flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <Link key={t.key} href={`/projects?view=${t.key}`}
            className={`btn ${view === t.key ? "border-accent-600 text-accent-700" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState title="プロジェクト未登録" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-zebra">
            <thead className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2 font-medium">プロジェクト</th>
                <th className="px-4 py-2 font-medium">担当</th>
                <th className="px-4 py-2 font-medium">スポンサー</th>
                <th className="px-4 py-2 font-medium">フェーズ</th>
                <th className="px-4 py-2 font-medium">ステータス</th>
                <th className="px-4 py-2 font-medium">優先度</th>
                <th className="px-4 py-2 font-medium">目標日</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-ink-900 hover:underline">{p.name}</Link>
                    {p.blockers ? <div className="mt-0.5 text-[11px] text-risk-high">障害: {p.blockers}</div> : null}
                  </td>
                  <td className="px-4 py-2.5 text-ink-700">{p.owner?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{p.sponsor?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-700">{p.currentPhase ?? "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={p.status} /></td>
                  <td className="px-4 py-2.5"><LevelBadge value={p.priorityLevel} /></td>
                  <td className="px-4 py-2.5 text-ink-700">{fmtDate(p.targetDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
