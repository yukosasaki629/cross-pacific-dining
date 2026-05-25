import { prisma } from "@/lib/db";

export type SearchHit = {
  type: "meeting" | "transcript" | "priority" | "project" | "action" | "decision" | "decision-needed" | "risk" | "theme";
  id: string;
  title: string;
  snippet: string;
  href: string;
  date?: Date | string | null;
};

// Keyword search. Designed so a future vector / semantic search can plug in
// behind the same shape — see comments in src/lib/ai/index.ts.
export async function searchAll(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const c = { contains: q };

  const [meetings, transcripts, priorities, projects, actions, decisions, dn, risks, themes] = await Promise.all([
    prisma.meeting.findMany({
      where: { OR: [{ title: c }, { summary: c }, { rawNotes: c }] },
      take: 20,
      orderBy: { date: "desc" },
    }),
    prisma.transcript.findMany({
      where: { OR: [{ transcriptText: c }, { notes: c }, { filename: c }] },
      take: 20,
      orderBy: { uploadDate: "desc" },
    }),
    prisma.priority.findMany({
      where: { OR: [{ name: c }, { description: c }, { notes: c }, { keyRisks: c }, { nextAction: c }] },
      take: 20,
    }),
    prisma.project.findMany({
      where: { OR: [{ name: c }, { description: c }, { notes: c }, { milestones: c }, { dependencies: c }, { risks: c }, { blockers: c }] },
      take: 20,
    }),
    prisma.actionItem.findMany({
      where: { OR: [{ description: c }, { notes: c }] },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.decision.findMany({
      where: { OR: [{ title: c }, { context: c }, { rationale: c }, { finalDecision: c }, { options: c }, { expectedImpact: c }] },
      take: 20,
      orderBy: { date: "desc" },
    }),
    prisma.decisionNeeded.findMany({
      where: { OR: [{ title: c }, { background: c }, { recommendation: c }, { options: c }, { notes: c }] },
      take: 20,
    }),
    prisma.risk.findMany({
      where: { OR: [{ description: c }, { mitigation: c }] },
      take: 20,
    }),
    prisma.theme.findMany({
      where: { OR: [{ name: c }, { description: c }, { notes: c }] },
      take: 10,
    }),
  ]);

  const snippet = (s: string | null | undefined) => (s ? s.replace(/\s+/g, " ").slice(0, 220) : "");
  const hits: SearchHit[] = [];

  for (const m of meetings) hits.push({ type: "meeting", id: m.id, title: m.title, snippet: snippet(m.summary || m.rawNotes), href: `/meetings/${m.id}`, date: m.date });
  for (const t of transcripts) hits.push({ type: "transcript", id: t.id, title: t.filename ?? "Transcript", snippet: snippet(t.transcriptText), href: `/transcripts/${t.id}`, date: t.uploadDate });
  for (const p of priorities) hits.push({ type: "priority", id: p.id, title: p.name, snippet: snippet(p.description || p.notes), href: `/priorities/${p.id}`, date: p.lastUpdated });
  for (const p of projects) hits.push({ type: "project", id: p.id, title: p.name, snippet: snippet(p.description || p.notes), href: `/projects/${p.id}`, date: p.lastUpdated });
  for (const a of actions) hits.push({ type: "action", id: a.id, title: a.description.slice(0, 80), snippet: snippet(a.notes), href: `/actions/${a.id}`, date: a.createdAt });
  for (const d of decisions) hits.push({ type: "decision", id: d.id, title: d.title, snippet: snippet(d.rationale || d.finalDecision), href: `/decisions/${d.id}`, date: d.date });
  for (const d of dn) hits.push({ type: "decision-needed", id: d.id, title: d.title, snippet: snippet(d.recommendation || d.background), href: `/decisions-needed/${d.id}`, date: d.createdAt });
  for (const r of risks) hits.push({ type: "risk", id: r.id, title: r.description.slice(0, 80), snippet: snippet(r.mitigation), href: `/projects`, date: r.createdAt });
  for (const t of themes) hits.push({ type: "theme", id: t.id, title: t.name, snippet: snippet(t.description), href: `/timeline`, date: t.lastSeenAt });

  return hits;
}
