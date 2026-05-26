"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { splitIntoTopics } from "@/lib/split-topics";
import { parseBulkMemo, type ParseBulkResult } from "@/lib/parse-bulk-memo";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

// 1on1メモの ## 見出しごとに Topic を自動作成
// ## が無ければ {created: 0} を返す(UI 側で警告表示)
export async function generateTopicsFromMeeting(
  meetingId: string,
): Promise<{ created: number }> {
  const m = await prisma.meetingNote.findUnique({
    where: { id: meetingId },
    select: { id: true, personId: true, rawNotes: true },
  });
  if (!m) throw new Error("1on1 が見つかりません");

  const drafts = splitIntoTopics(m.rawNotes);
  if (drafts.length === 0) return { created: 0 };

  await prisma.$transaction(async (tx) => {
    for (const d of drafts) {
      await tx.topic.create({
        data: {
          meetingNoteId: m.id,
          personId: m.personId,
          title: d.title,
          content: d.content,
          category: d.suggestedCategory,
          sensitivity: d.sensitivity,
          isImportant: d.suggestedImportant,
          needsFollowUp: d.suggestedFollowUp,
        },
      });
    }
    await tx.meetingNote.update({
      where: { id: meetingId },
      data: { processedAt: new Date() },
    });
  });

  revalidatePath(`/oneonones/${meetingId}`);
  revalidatePath("/oneonones");
  revalidatePath("/");
  return { created: drafts.length };
}

// トピックのフラグ・フィールドを更新
export async function updateTopic(
  id: string,
  patch: {
    title?: string;
    content?: string;
    isImportant?: boolean;
    needsFollowUp?: boolean;
    category?: string;
    status?: string;
    owner?: string | null;
    dueDate?: string | null;
    projectId?: string | null;
    visibility?: string;
    sensitivity?: string;
  },
) {
  const due =
    patch.dueDate === undefined
      ? undefined
      : patch.dueDate
        ? new Date(patch.dueDate)
        : null;
  await prisma.topic.update({
    where: { id },
    data: {
      ...patch,
      dueDate: due,
    },
  });
  revalidatePath("/");
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath("/share");
}

export async function deleteTopic(id: string) {
  await prisma.topic.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath("/share");
}

// 単一のフラグだけトグル(チェックボックス用)
export async function toggleTopicFlag(
  id: string,
  flag: "isImportant" | "needsFollowUp" | "done",
) {
  const t = await prisma.topic.findUnique({ where: { id } });
  if (!t) return;
  if (flag === "isImportant") {
    await prisma.topic.update({ where: { id }, data: { isImportant: !t.isImportant } });
  } else if (flag === "needsFollowUp") {
    await prisma.topic.update({ where: { id }, data: { needsFollowUp: !t.needsFollowUp } });
  } else if (flag === "done") {
    await prisma.topic.update({
      where: { id },
      data: { status: t.status === "done" ? "open" : "done" },
    });
  }
  revalidatePath("/");
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath("/share");
}

// 指定の1on1から派生したTopicを全削除(再分割用)
export async function deleteTopicsFromMeeting(meetingId: string): Promise<{ deleted: number }> {
  const r = await prisma.topic.deleteMany({ where: { meetingNoteId: meetingId } });
  await prisma.meetingNote.update({
    where: { id: meetingId },
    data: { processedAt: null },
  });
  revalidatePath(`/oneonones/${meetingId}`);
  revalidatePath("/");
  return { deleted: r.count };
}

// 新規Topic手動作成(FormData 経由)
export async function createTopic(formData: FormData) {
  const title = s(formData.get("title")).trim();
  if (!title) throw new Error("タイトルは必須です");
  await prisma.topic.create({
    data: {
      title,
      content: s(formData.get("content")) || null,
      personId: s(formData.get("personId")) || null,
      isImportant: formData.get("isImportant") === "on",
      needsFollowUp: formData.get("needsFollowUp") === "on",
      category: s(formData.get("category")) || "info",
      owner: s(formData.get("owner")) || null,
      dueDate: s(formData.get("dueDate")) ? new Date(s(formData.get("dueDate"))) : null,
      visibility: s(formData.get("visibility")) || "internal",
      sensitivity: s(formData.get("sensitivity")) || "general",
    },
  });
  revalidatePath("/");
  revalidatePath("/oneonones");
}

// =============================================================================
// 自然フォーマット(人名・話題名・本文)の一括取り込み
// =============================================================================

export type BulkParsePreview = {
  parse: ParseBulkResult;
  knownPeople: { id: string; name: string; role: string | null }[];
};

// プレビュー(まだDBに書き込まない)
export async function previewBulkParse(text: string): Promise<BulkParsePreview> {
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  const parse = parseBulkMemo(text, people);
  return { parse, knownPeople: people };
}

// プレビュー結果を確定 → 人ごとに MeetingNote 作成 + 話題ごとに Topic 作成
export async function applyBulkParse(
  sections: {
    personId: string;
    topics: { title: string; content: string }[];
  }[],
  date: string,
): Promise<{ meetings: number; topics: number }> {
  const d = date ? new Date(date) : new Date();
  let meetings = 0;
  let topics = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const section of sections) {
        if (!section.personId || section.topics.length === 0) continue;
        // 生メモは話題タイトル + 本文を ## 付きで再構成して保存
        const rawNotes = section.topics
          .map((t) => `## ${t.title}\n${t.content}`.trim())
          .join("\n\n");

        const meeting = await tx.meetingNote.create({
          data: {
            personId: section.personId,
            date: d,
            rawNotes,
            processedAt: new Date(),
          },
        });
        meetings++;

        for (const t of section.topics) {
          if (!t.title.trim()) continue;
          // 自動カテゴリ・機密判定(splitIntoTopics の buildDraft と同じロジックを inline)
          const fullText = `${t.title}\n${t.content}`;
          const labels = detectLabels(t.content);
          const sensitivity = detectSensitivity(fullText);
          await tx.topic.create({
            data: {
              meetingNoteId: meeting.id,
              personId: section.personId,
              title: t.title,
              content: t.content || null,
              category: labels.category,
              sensitivity,
              isImportant: labels.important,
              needsFollowUp: labels.followUp,
            },
          });
          topics++;
        }
      }
    },
    { timeout: 60_000 },
  );

  revalidatePath("/");
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath("/share");
  return { meetings, topics };
}

function detectLabels(content: string): { category: string; important: boolean; followUp: boolean } {
  const hasAction = /(^|\n|\s)Action\s*[:::]/i.test(content);
  const hasRisk = /(^|\n|\s)Risk\s*[:::]/i.test(content);
  const hasDecisionNeeded = /(^|\n|\s)(要判断|TBD|Pending)\s*[:::]/i.test(content);
  const hasDecisionMade = /(^|\n|\s)(Decision|決定)\s*[:::]/i.test(content);

  let category = "info";
  if (hasRisk) category = "risk";
  else if (hasDecisionNeeded || hasDecisionMade) category = "decision";
  else if (hasAction) category = "action";

  return {
    category,
    important: hasRisk || hasDecisionNeeded,
    followUp: hasAction || hasDecisionNeeded,
  };
}

function detectSensitivity(text: string): "general" | "board" | "compensation" | "executive_only" {
  if (/(報酬|給与|ボーナス|compensation|salary|bonus|Pearl Meyer|stock option|equity grant|STIC|STIP|LTIP)/i.test(text)) return "compensation";
  if (/(取締役会|監査委員会|報酬委員会|指名委員会|Board\b|audit committee|comp committee|nominating committee|proxy)/i.test(text)) return "board";
  if (/(役員人事|幹部人事|解任|更迭|後任|termination|executive only|exec only|CFO候補|CFO search|successor|C-suite hiring|reconsideration|Sharaz|Martin Fagget|kickback)/i.test(text)) return "executive_only";
  return "general";
}

// クライアント側からのオブジェクト引数受け取り用
export async function createTopicFromObject(data: {
  meetingId?: string | null;
  personId?: string | null;
  title: string;
  content?: string;
  category?: string;
  isImportant?: boolean;
  needsFollowUp?: boolean;
  owner?: string | null;
  dueDate?: string | null;
}) {
  if (!data.title.trim()) throw new Error("タイトルは必須です");
  await prisma.topic.create({
    data: {
      meetingNoteId: data.meetingId || null,
      personId: data.personId || null,
      title: data.title.trim(),
      content: data.content?.trim() || null,
      category: data.category || "info",
      isImportant: data.isImportant === true,
      needsFollowUp: data.needsFollowUp === true,
      owner: data.owner || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  revalidatePath("/");
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath(`/oneonones/${data.meetingId}`);
}
