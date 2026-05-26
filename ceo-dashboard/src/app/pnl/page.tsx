import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { TopicCard } from "@/components/TopicCard";
import { startOfWeek } from "@/lib/utils";
import { PNL_IMPACT_LONG_LABEL, STRATEGIC_LABEL } from "@/lib/pnl-impact";

export const dynamic = "force-dynamic";

const PNL_KEYS = ["sales", "food_cost", "labor_cost", "ga"] as const;

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const range = sp?.range ?? "all";
  const statusFilter = sp?.status ?? "open"; // open | all

  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const dateFilter =
    range === "this_week"
      ? { meetingNote: { date: { gte: thisWeekStart } } }
      : range === "last_week"
        ? { meetingNote: { date: { gte: lastWeekStart, lt: thisWeekStart } } }
        : range === "2weeks"
          ? { meetingNote: { date: { gte: lastWeekStart } } }
          : {};

  const baseFilter: any = {
    ...(statusFilter === "open" ? { status: { not: "done" } } : {}),
    ...dateFilter,
  };

  // 各 P&L 区分のトピックを並列取得 + 戦略カテゴリも取得
  const [salesTopics, foodCostTopics, laborCostTopics, gaTopics, unassignedTopics, aopTopics, strategyTopics, boardTopics] = await Promise.all([
    prisma.topic.findMany({
      where: { ...baseFilter, pnlImpact: "sales" },
      orderBy: [{ isImportant: "desc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, pnlImpact: "food_cost" },
      orderBy: [{ isImportant: "desc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, pnlImpact: "labor_cost" },
      orderBy: [{ isImportant: "desc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, pnlImpact: "ga" },
      orderBy: [{ isImportant: "desc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, pnlImpact: null },
      orderBy: [{ updatedAt: "desc" }],
      take: 30,
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, strategicCategory: "aop" },
      orderBy: [{ isImportant: "desc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, strategicCategory: "strategy" },
      orderBy: [{ isImportant: "desc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
    prisma.topic.findMany({
      where: { ...baseFilter, strategicCategory: "board" },
      orderBy: [{ isImportant: "desc" }, { updatedAt: "desc" }],
      include: { person: { select: { id: true, name: true, role: true } }, meetingNote: { select: { id: true, date: true } }, project: { select: { id: true, name: true } } },
    }),
  ]);

  const byPnl = {
    sales: salesTopics,
    food_cost: foodCostTopics,
    labor_cost: laborCostTopics,
    ga: gaTopics,
  };
  const totalPnl = salesTopics.length + foodCostTopics.length + laborCostTopics.length + gaTopics.length;
  const totalAll = totalPnl + unassignedTopics.length;

  return (
    <div>
      <AppHeader
        title="P&L 影響別ビュー"
        subtitle="議題がどの P&L ラインに効くか"
      />

      {/* フィルタチップ */}
      <div className="sticky top-[57px] z-10 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          {[
            { key: "this_week", label: "今週" },
            { key: "last_week", label: "先週" },
            { key: "2weeks", label: "2週間" },
            { key: "all", label: "全期間" },
          ].map((r) => (
            <Link
              key={r.key}
              href={`/pnl${r.key === "all" ? "" : `?range=${r.key}`}${statusFilter === "all" ? "&status=all" : ""}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
                range === r.key
                  ? "bg-accent-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600"
              }`}
            >
              {r.label}
            </Link>
          ))}
          <span className="mx-1 text-ink-300">·</span>
          <Link
            href={`/pnl${range !== "all" ? `?range=${range}` : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
              statusFilter === "open"
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-white text-ink-600"
            }`}
          >
            未完了のみ
          </Link>
          <Link
            href={`/pnl?status=all${range !== "all" ? `&range=${range}` : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
              statusFilter === "all"
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-white text-ink-600"
            }`}
          >
            全て
          </Link>
        </div>
      </div>

      <div className="px-3 py-4 space-y-2">
        {/* P&L サマリー */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PNL_KEYS.map((k) => (
            <StatCard key={k} label={PNL_IMPACT_LONG_LABEL[k]} value={byPnl[k].length} />
          ))}
        </div>

        {totalAll === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            対象のトピックがありません。
          </div>
        ) : null}

        {/* 各 P&L セクション */}
        {PNL_KEYS.map((k) =>
          byPnl[k].length > 0 ? (
            <div key={k}>
              <h2 className="h-section">
                <span>{PNL_IMPACT_LONG_LABEL[k]} ({byPnl[k].length})</span>
              </h2>
              <ul className="space-y-2 pb-2">
                {byPnl[k].map((t) => (
                  <li key={t.id}>
                    <TopicCard topic={t} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null,
        )}

        {/* 戦略カテゴリ別ビュー */}
        {(aopTopics.length > 0 || strategyTopics.length > 0 || boardTopics.length > 0) ? (
          <div className="pt-4">
            <div className="mb-2 text-[12px] font-semibold text-ink-700">— 戦略カテゴリ別 —</div>
            {aopTopics.length > 0 ? (
              <>
                <h2 className="h-section"><span>{STRATEGIC_LABEL.aop} ({aopTopics.length})</span></h2>
                <ul className="space-y-2 pb-2">
                  {aopTopics.map((t) => <li key={t.id}><TopicCard topic={t} /></li>)}
                </ul>
              </>
            ) : null}
            {strategyTopics.length > 0 ? (
              <>
                <h2 className="h-section"><span>{STRATEGIC_LABEL.strategy} ({strategyTopics.length})</span></h2>
                <ul className="space-y-2 pb-2">
                  {strategyTopics.map((t) => <li key={t.id}><TopicCard topic={t} /></li>)}
                </ul>
              </>
            ) : null}
            {boardTopics.length > 0 ? (
              <>
                <h2 className="h-section"><span>{STRATEGIC_LABEL.board} ({boardTopics.length})</span></h2>
                <ul className="space-y-2 pb-2">
                  {boardTopics.map((t) => <li key={t.id}><TopicCard topic={t} /></li>)}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}

        {/* 未分類 */}
        {unassignedTopics.length > 0 ? (
          <div className="pt-4">
            <h2 className="h-section">
              <span>⚪ P&L 未分類 ({unassignedTopics.length})</span>
              <span className="text-[11px] font-normal text-ink-500">
                編集ボタンで P&L 影響を設定してください
              </span>
            </h2>
            <ul className="space-y-2 pb-2">
              {unassignedTopics.map((t) => <li key={t.id}><TopicCard topic={t} /></li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card card-pad text-center">
      <div className="text-[10px] font-semibold text-ink-500 line-clamp-1">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-ink-900">{value}</div>
    </div>
  );
}
