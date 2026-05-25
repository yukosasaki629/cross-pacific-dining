"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { splitIntoTopics } from "@/lib/split-topics";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

// 1on1メモを分割してTopic候補をDBに保存
export async function generateTopicsFromMeeting(
  meetingId: string,
): Promise<{ created: number }> {
  const m = await prisma.meetingNote.findUnique({
    where: { id: meetingId },
    select: { id: true, personId: true, rawNotes: true },
  });
  if (!m) throw new Error("1on1 が見つかりません");

  const drafts = splitIntoTopics(m.rawNotes);

  await prisma.$transaction(async (tx) => {
    for (const d of drafts) {
      await tx.topic.create({
        data: {
          meetingNoteId: m.id,
          personId: m.personId,
          title: d.title,
          content: d.content,
          category: d.suggestedCategory,
          sensitivity: d.hints.sensitivity,
          // 全て open / not important / not follow-up — ユーザーが手で割り振る
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

// 新規Topic手動作成
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
