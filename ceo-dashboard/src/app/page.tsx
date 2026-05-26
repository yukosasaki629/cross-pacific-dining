import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { Dot, Pill } from "@/components/Badges";
import { ItemActions } from "@/components/ItemActions";
import { TopicCard } from "@/components/TopicCard";
import { fmtMd, isOverdue, startOfWeek, toInputDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ p?: string; range?: string; cat?: string; strat?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const personFilter = sp?.p ?? "";
  const range = sp?.range ?? "all";
  const catFilter = sp?.cat ?? "";
  const stratFilter = sp?.strat ?? "";

  // 日付範囲フィルタ
  const now = new Date();
  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = thisWeekStart;
  const dateFilter =
    range === "this_week"
      ? { meetingNote: { date: { gte: thisWeekStart } } }
      : range === "last_week"
        ? { meetingNote: { date: { gte: lastWeekStart, lt: lastWeekEnd } } }
        : range === "2weeks"
          ? { meetingNote: { date: { gte: lastWeekStart } } }
          : {};

  const baseTopicFilter: any = {
    status: { not: "done" },
    ...(personFilter ? { personId: personFilter } : {}),
    ...(catFilter ? { category: catFilter } : {}),
    ...(stratFilter
      ? stratFilter === "any"
        ? { strategicCategory: { not: null } }
        : { strategicCategory: stratFilter }
      : {}),
    ...dateFilter,
  };

  // 全担当者(フィルタチップ用)
  const allPeople = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, _count: { select: { topics: true } } },
  });

  const [importantTopics, followUpTopics, keyProjects] = await Promise.all([
    // ⭐ 重要トピック(未完了)
    prisma.topic.findMany({
      where: { ...baseTopicFilter, isImportant: true },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 30,
      include: {
        person: { select: { id: true, name: true, role: true } },
        meetingNote: { select: { id: true, date: true } },
        project: { select: { id: true, name: true } },
      },
    }) /* topic fields incl pnlImpact/strategicCategory auto-included */ ,
    // 📌 フォロー要トピック(⭐ に出ているものは除外)
    prisma.topic.findMany({
      where: { ...baseTopicFilter, needsFollowUp: true, isImportant: false },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 30,
      include: {
        person: { select: { id: true, name: true, role: true } },
        meetingNote: { select: { id: true, date: true } },
        project: { select: { id: true, name: true } },
      },
    }) /* topic fields incl pnlImpact/strategicCategory auto-included */ ,
    prisma.project.findMany({
      where: { status: { not: "完了" }, priority: { in: ["高", "中"] } },
      orderBy: [{ priority: "desc" }, { riskLevel: "desc" }, { updatedAt: "desc" }],
      take: 5,
    }),
  ]);

  // レガシーデータ(旧式抽出由来。データがあれば下に表示)
  const [decisions, risks, followups, overdueTasks, projectIdsNeedingDecision] = await Promise.all([
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

  const RANGE_LABELS: { key: string; label: string }[] = [
    { key: "this_week", label: "今週" },
    { key: "last_week", label: "先週" },
    { key: "2weeks", label: "2週間" },
    { key: "all", label: "全期間" },
  ];

  function paramsWith(patch: Record<string, string | null>): string {
    const params = new URLSearchParams();
    if (personFilter) params.set("p", personFilter);
    if (range && range !== "all") params.set("range", range);
    if (catFilter) params.set("cat", catFilter);
    if (stratFilter) params.set("strat", stratFilter);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  const CAT_LABELS: { key: string; label: string }[] = [
    { key: "action", label: "アクション" },
    { key: "decision", label: "判断" },
    { key: "risk", label: "リスク" },
    { key: "info", label: "情報" },
  ];
  const STRAT_LABELS: { key: string; label: string }[] = [
    { key: "any", label: "戦略系のみ" },
    { key: "aop", label: "📊 AOP" },
    { key: "strategy", label: "🎯 Strategy" },
    { key: "board", label: "🏛 Board" },
  ];

  const activeFilter = personFilter || (range !== "all") || catFilter || stratFilter;

  return (
    <div>
      <AppHeader title="CEOダッシュボード" subtitle="今、見るべきこと" />

      {/* フィルタチップ */}
      <div className="sticky top-[57px] z-10 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
          <Link
            href={`/${paramsWith({ p: null })}`}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
              !personFilter
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100"
            }`}
          >
            全員
          </Link>
          {allPeople.map((p) => (
            <Link
              key={p.id}
              href={`/${paramsWith({ p: p.id })}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${
                personFilter === p.id
                  ? "bg-ink-900 text-white"
                  : "border border-ink-200 bg-white text-ink-700 active:bg-ink-100"
              }`}
            >
              {p.name}
              {p._count.topics > 0 ? (
                <span className="ml-1 text-[10px] opacity-70">({p._count.topics})</span>
              ) : null}
            </Link>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
          {RANGE_LABELS.map((r) => (
            <Link
              key={r.key}
              href={`/${paramsWith({ range: r.key === "all" ? null : r.key })}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                (range === r.key) || (r.key === "all" && range === "all")
                  ? "bg-accent-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600 active:bg-ink-100"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
        {/* 種別 + 戦略カテゴリのチップ */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
          <Link
            href={`/${paramsWith({ cat: null })}`}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
              !catFilter
                ? "bg-ink-700 text-white"
                : "border border-ink-200 bg-white text-ink-600 active:bg-ink-100"
            }`}
          >
            全タイプ
          </Link>
          {CAT_LABELS.map((c) => (
            <Link
              key={c.key}
              href={`/${paramsWith({ cat: c.key })}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                catFilter === c.key
                  ? "bg-ink-700 text-white"
                  : "border border-ink-200 bg-white text-ink-600 active:bg-ink-100"
              }`}
            >
              {c.label}
            </Link>
          ))}
          <span className="mx-1 text-ink-300">|</span>
          {STRAT_LABELS.map((s) => (
            <Link
              key={s.key}
              href={`/${paramsWith({ strat: s.key })}`}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                stratFilter === s.key
                  ? "bg-warn-600 text-white"
                  : "border border-ink-200 bg-white text-ink-600 active:bg-ink-100"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 space-y-1">
        {activeFilter ? (
          <div className="mb-2 text-[11px] text-ink-500">
            フィルタ適用中:
            {personFilter ? ` 担当 = ${allPeople.find((p) => p.id === personFilter)?.name ?? "?"}` : ""}
            {range !== "all" ? ` ・ 期間 = ${RANGE_LABELS.find((r) => r.key === range)?.label}` : ""}
            {catFilter ? ` ・ 種別 = ${CAT_LABELS.find((c) => c.key === catFilter)?.label ?? catFilter}` : ""}
            {stratFilter ? ` ・ 戦略 = ${STRAT_LABELS.find((s) => s.key === stratFilter)?.label ?? stratFilter}` : ""}
            {" "}
            <Link href="/" className="link ml-1">クリア</Link>
          </div>
        ) : null}

        {/* ⭐ 重要トピック */}
        <SectionHeader title="⭐ 重要トピック" count={importantTopics.length} />
        <div className="space-y-2">
          {importantTopics.length === 0 ? (
            <EmptyCard msg="重要マークが付いたトピックはありません。1on1を処理して「⭐」で割り振ってください。" />
          ) : (
            importantTopics.map((t) => <TopicCard key={t.id} topic={t} />)
          )}
        </div>

        {/* 📌 フォロー要トピック(⭐ にすでに出ているものは除外) */}
        <SectionHeader title="📌 フォロー要(重要以外)" count={followUpTopics.length} />
        <div className="space-y-2">
          {followUpTopics.length === 0 ? (
            <EmptyCard msg="重要以外でフォローすべきトピックはありません。" />
          ) : (
            followUpTopics.map((t) => <TopicCard key={t.id} topic={t} />)
          )}
        </div>

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

        {/* 判断が必要な事項(レガシー:旧抽出由来。データがあるときだけ表示) */}
        {decisions.length > 0 ? (
        <>
        <SectionHeader title="判断が必要な事項" hrefAll="/decisions" count={decisions.length} />
        <div className="space-y-2">
          {decisions.map((d) => (
              <div key={d.id} className="card card-pad">
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
                {d.recommendation ? (
                  <div className="mt-2 text-[12px] text-ink-700">
                    <span className="font-medium">推奨案:</span> {d.recommendation}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
        </>
        ) : null}

        {/* リスクあり案件(レガシー) */}
        {risks.length > 0 ? (
        <>
        <SectionHeader title="リスクあり案件" hrefAll="/risks" count={risks.length} />
        <div className="space-y-2">
          {risks.map((r) => (
              <div key={r.id} className="card card-pad">
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
              </div>
            ))}
        </div>
        </>
        ) : null}

        {/* 今週のフォローアップ(レガシー) */}
        {followups.length > 0 ? (
        <>
        <SectionHeader title="今週のフォローアップ" hrefAll="/followups" count={followups.length} />
        <div className="space-y-2">
          {followups.map((f) => (
              <div key={f.id} className="card card-pad">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink-900">{f.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-500">
                      対象: {f.who ?? "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill
                      value={f.dueDate ? (isOverdue(f.dueDate) ? "期限超過" : fmtMd(f.dueDate)) : "期限なし"}
                    />
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
              </div>
            ))}
        </div>
        </>
        ) : null}

        {/* 期限超過タスク(レガシー) */}
        {overdueTasks.length > 0 ? (
        <>
        <SectionHeader title="期限超過タスク" hrefAll="/projects" count={overdueTasks.length} />
        <div className="space-y-2">
          {overdueTasks.map((t) => (
              <div key={t.id} className="card card-pad">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-ink-900">{t.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-500">
                      {t.project?.name} ・ {t.owner ?? "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="pill bg-bad-50 text-bad-700">期限 {fmtMd(t.dueDate)}</span>
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
              </div>
            ))}
        </div>
        </>
        ) : null}

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
