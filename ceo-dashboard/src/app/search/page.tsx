import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { fmtMd, fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  action: "アクション",
  decision: "判断",
  risk: "リスク",
  info: "情報",
  other: "その他",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();

  if (!q) {
    return (
      <div>
        <AppHeader title="検索" subtitle="トピック・1on1メモ・プロジェクトを横断検索" />
        <div className="px-3 py-4">
          <form className="card card-pad">
            <input
              type="text"
              name="q"
              placeholder="検索キーワード(例:Vena, CFO候補, Tucson)"
              autoFocus
              className="input"
            />
            <button type="submit" className="btn-primary mt-3 w-full">検索</button>
          </form>
          <div className="mt-4 text-[12px] text-ink-500">
            <div className="mb-2 font-semibold text-ink-700">検索対象:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>トピック(タイトル・本文)</li>
              <li>1on1 メモ(生メモ全文)</li>
              <li>プロジェクト(名前・概要・現在の状況・次のアクション)</li>
              <li>担当者の名前</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const contains = { contains: q };
  const [topics, meetings, projects, people] = await Promise.all([
    prisma.topic.findMany({
      where: { OR: [{ title: contains }, { content: contains }, { owner: contains }] },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true, title: true, content: true, category: true, status: true,
        isImportant: true, needsFollowUp: true,
        person: { select: { name: true } },
        meetingNote: { select: { id: true, date: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.meetingNote.findMany({
      where: { OR: [{ rawNotes: contains }, { summary: contains }] },
      orderBy: { date: "desc" },
      take: 20,
      select: {
        id: true, date: true, rawNotes: true, summary: true,
        person: { select: { name: true, role: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: contains },
          { objective: contains },
          { currentSummary: contains },
          { nextAction: contains },
          { owner: contains },
        ],
      },
      take: 20,
      select: {
        id: true, name: true, owner: true, department: true,
        status: true, priority: true, currentSummary: true,
      },
    }),
    prisma.person.findMany({
      where: { OR: [{ name: contains }, { role: contains }] },
      take: 10,
      select: { id: true, name: true, role: true, _count: { select: { meetings: true } } },
    }),
  ]);

  const total = topics.length + meetings.length + projects.length + people.length;

  return (
    <div>
      <AppHeader title="検索結果" subtitle={`"${q}" — ${total} 件`} backHref="/search" />

      <form className="sticky top-[57px] z-10 border-b border-ink-200 bg-white/95 px-3 py-2 backdrop-blur">
        <input
          type="text"
          name="q"
          defaultValue={q}
          className="input"
        />
      </form>

      <div className="px-3 py-4 space-y-3">
        {total === 0 ? (
          <div className="card card-pad text-center text-[13px] text-ink-400">
            「{q}」に一致する項目はありません。
          </div>
        ) : null}

        {topics.length > 0 ? (
          <>
            <h2 className="h-section">
              <span>📋 トピック ({topics.length})</span>
            </h2>
            <ul className="space-y-2">
              {topics.map((t) => (
                <li key={t.id} className="card card-pad">
                  <Link
                    href={t.meetingNote ? `/oneonones/${t.meetingNote.id}` : "/"}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium text-ink-900">
                          {highlight(t.title, q)}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-500">
                          <span className="pill bg-ink-100 text-ink-600">
                            {CATEGORY_LABEL[t.category] ?? t.category}
                          </span>
                          {t.isImportant ? <span className="text-warn-700">⭐ 重要</span> : null}
                          {t.needsFollowUp ? <span className="text-accent-700">📌 フォロー要</span> : null}
                          {t.person ? <span>· {t.person.name}</span> : null}
                          {t.meetingNote ? <span>· {fmtMd(t.meetingNote.date)}</span> : null}
                          {t.project ? <span>· {t.project.name}</span> : null}
                          {t.status === "done" ? <span className="text-ok-700">· 完了</span> : null}
                        </div>
                        {t.content ? (
                          <p className="mt-1 line-clamp-2 text-[12px] text-ink-600">
                            {highlight(snippetAround(t.content, q, 120), q)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {meetings.length > 0 ? (
          <>
            <h2 className="h-section">
              <span>📝 1on1 メモ ({meetings.length})</span>
            </h2>
            <ul className="space-y-2">
              {meetings.map((m) => (
                <li key={m.id} className="card card-pad">
                  <Link href={`/oneonones/${m.id}`} className="block">
                    <div className="text-[14px] font-medium text-ink-900">
                      {m.person.name}
                      {m.person.role ? <span className="ml-1 text-[12px] font-normal text-ink-500">/ {m.person.role}</span> : null}
                      <span className="ml-2 text-[12px] text-ink-500">{fmtDate(m.date)}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-ink-600">
                      {highlight(snippetAround(m.rawNotes, q, 150), q)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {projects.length > 0 ? (
          <>
            <h2 className="h-section">
              <span>📁 プロジェクト ({projects.length})</span>
            </h2>
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="card card-pad">
                  <Link href={`/projects/${p.id}`} className="block">
                    <div className="text-[14px] font-medium text-ink-900">{highlight(p.name, q)}</div>
                    <div className="mt-0.5 text-[11px] text-ink-500">
                      {p.owner ?? "—"} · {p.department ?? "—"} · {p.status} ({p.priority})
                    </div>
                    {p.currentSummary ? (
                      <p className="mt-1 line-clamp-2 text-[12px] text-ink-600">
                        {highlight(snippetAround(p.currentSummary, q, 120), q)}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {people.length > 0 ? (
          <>
            <h2 className="h-section">
              <span>👤 担当者 ({people.length})</span>
            </h2>
            <ul className="space-y-2">
              {people.map((p) => (
                <li key={p.id} className="card card-pad">
                  <Link href={`/oneonones/people/${p.id}`} className="block">
                    <div className="text-[14px] font-medium text-ink-900">{highlight(p.name, q)}</div>
                    <div className="text-[11px] text-ink-500">
                      {p.role ?? "—"} · 1on1 {p._count.meetings} 回
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function snippetAround(text: string, query: string, len: number): string {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, len);
  const start = Math.max(0, idx - len / 4);
  const end = Math.min(text.length, idx + query.length + (len * 3) / 4);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

// クエリ部分を <mark> で囲んで強調(React node を返す)
function highlight(text: string, query: string): React.ReactNode {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark className="rounded bg-warn-50 px-0.5 text-warn-700">{match}</mark>
      {after}
    </>
  );
}
