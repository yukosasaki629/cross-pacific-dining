"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractFromMeetingNote, type Extraction } from "@/lib/extract";
import { splitSectionsByPerson } from "@/lib/split-sections";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

// 1on1 ノートを新規作成(生メモを保存)
export async function createMeetingNote(formData: FormData) {
  const personId = s(formData.get("personId")).trim();
  const rawNotes = s(formData.get("rawNotes")).trim();
  const dateStr = s(formData.get("date")).trim();

  if (!personId) throw new Error("対象者を選択してください");
  if (!rawNotes) throw new Error("メモを貼り付けてください");

  const created = await prisma.meetingNote.create({
    data: {
      personId,
      rawNotes,
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });

  revalidatePath("/oneonones");
  redirect(`/oneonones/${created.id}`);
}

// 抽出だけ実行(まだDBに反映しない、UIで確認するため)
export async function previewExtraction(
  meetingId: string,
): Promise<{ ok: true; extraction: Extraction } | { ok: false; error: string }> {
  const m = await prisma.meetingNote.findUnique({ where: { id: meetingId } });
  if (!m) return { ok: false, error: "メモが見つかりません" };

  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
  });

  try {
    const extraction = extractFromMeetingNote(m.rawNotes, projects);
    return { ok: true, extraction };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// レビュー済みのJSONを実テーブルに反映
export async function applyExtraction(meetingId: string, json: string) {
  const m = await prisma.meetingNote.findUnique({ where: { id: meetingId } });
  if (!m) throw new Error("メモが見つかりません");

  let parsed: Extraction;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("JSON の形式が正しくありません");
  }

  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const projectByName = new Map(projects.map((p) => [p.name, p.id]));

  await prisma.$transaction(async (tx) => {
    // 1. サマリーを更新
    await tx.meetingNote.update({
      where: { id: meetingId },
      data: { summary: parsed.summary || null, processedAt: new Date() },
    });

    // 2. アクション → Task (プロジェクト紐付けあり) or FollowUp (なし)
    for (const a of parsed.actions ?? []) {
      const projectId = a.projectName ? projectByName.get(a.projectName) ?? null : null;
      if (projectId) {
        await tx.task.create({
          data: {
            projectId,
            title: a.title,
            owner: a.owner ?? null,
            priority: a.priority,
            meetingNoteId: meetingId,
            visibility: "ceo_shared", // 1on1由来は社長と共有
            memo: a.dueHint ? `期限ヒント: ${a.dueHint}` : null,
          },
        });
      } else {
        await tx.followUp.create({
          data: {
            title: a.title,
            who: a.owner ?? null,
            meetingNoteId: meetingId,
            visibility: "ceo_shared",
            memo: a.dueHint ? `期限ヒント: ${a.dueHint}` : null,
          },
        });
      }
    }

    // 3. 決定済 → Decision (decisionType="made")
    for (const d of parsed.decisionsMade ?? []) {
      const projectId = d.projectName ? projectByName.get(d.projectName) ?? null : null;
      await tx.decision.create({
        data: {
          topic: d.topic,
          decisionType: "made",
          status: "判断済",
          importance: d.importance,
          projectId,
          meetingNoteId: meetingId,
          visibility: "ceo_shared",
          sensitivity: d.sensitivity ?? "general",
        },
      });
    }

    // 4. 判断待ち → Decision (decisionType="needed")
    for (const d of parsed.decisionsNeeded ?? []) {
      const projectId = d.projectName ? projectByName.get(d.projectName) ?? null : null;
      await tx.decision.create({
        data: {
          topic: d.topic,
          decisionType: "needed",
          status: "未対応",
          importance: d.importance,
          recommendation: d.recommendation ?? null,
          projectId,
          meetingNoteId: meetingId,
          visibility: "ceo_shared",
          sensitivity: d.sensitivity ?? "general",
        },
      });
    }

    // 5. リスク
    for (const r of parsed.risks ?? []) {
      const projectId = r.projectName ? projectByName.get(r.projectName) ?? null : null;
      await tx.risk.create({
        data: {
          description: r.description,
          severity: r.severity,
          projectId,
          meetingNoteId: meetingId,
          visibility: "ceo_shared",
        },
      });
    }

    // 6. フォローアップ
    for (const f of parsed.followUps ?? []) {
      await tx.followUp.create({
        data: {
          title: f.title,
          who: f.who ?? null,
          meetingNoteId: meetingId,
          visibility: "ceo_shared",
          memo: f.dueHint ? `期限ヒント: ${f.dueHint}` : null,
        },
      });
    }

    // 7. プロジェクト優先度・ステータスのサジェスト(承認済みのみ適用)
    // サジェスト UI で applied=true のものだけ JSON に残す前提
    for (const sug of parsed.prioritySuggestions ?? []) {
      const pid = projectByName.get(sug.projectName);
      if (!pid) continue;
      const data: any = { updatedAt: new Date() };
      if (sug.newPriority) data.priority = sug.newPriority;
      if (sug.newStatus) data.status = sug.newStatus;
      if (Object.keys(data).length > 1) {
        await tx.project.update({ where: { id: pid }, data });
        // 更新履歴にも残す
        await tx.update.create({
          data: {
            projectId: pid,
            content: `1on1での発言により ${sug.newPriority ? `優先度を${sug.newPriority}に` : ""}${sug.newStatus ? `ステータスを${sug.newStatus}に` : ""}変更`,
            meetingNoteId: meetingId,
            visibility: "ceo_shared",
          },
        });
      }
    }
  });

  revalidatePath(`/oneonones/${meetingId}`);
  revalidatePath("/oneonones");
  revalidatePath("/");
  revalidatePath("/share");
}

export async function deleteMeetingNote(id: string) {
  await prisma.meetingNote.delete({ where: { id } });
  revalidatePath("/oneonones");
  redirect("/oneonones");
}

// 派生項目のステータスをクイック更新するためのサーバーアクション
// 人別ダッシュボードで「完了にチェック」を押したときに呼ばれる
export type ItemType = "task" | "followup" | "decision" | "risk";

export async function markItemStatus(type: ItemType, id: string, newStatus: string) {
  switch (type) {
    case "task":
      await prisma.task.update({ where: { id }, data: { status: newStatus } });
      break;
    case "followup":
      await prisma.followUp.update({ where: { id }, data: { status: newStatus } });
      break;
    case "decision":
      await prisma.decision.update({ where: { id }, data: { status: newStatus } });
      break;
    case "risk":
      await prisma.risk.update({ where: { id }, data: { status: newStatus } });
      break;
  }
  revalidatePath("/oneonones");
  revalidatePath(`/oneonones/people`);
  revalidatePath("/");
  revalidatePath("/share");
}

// =============================================================================
// 一括ペースト → セクション自動分割 → まとめて1on1作成
// =============================================================================

export type BulkPreview = {
  sections: {
    index: number;
    heading: string;
    body: string;
    matchedPersonId: string | null;
    matchReason: string;
  }[];
  people: { id: string; name: string; role: string | null }[];
};

export async function previewBulk(text: string): Promise<BulkPreview> {
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  const sections = splitSectionsByPerson(text, people);
  return { sections, people };
}

export async function createBulkMeetings(
  sections: { personId: string; body: string }[],
  date: string,
): Promise<{ created: number }> {
  const d = date ? new Date(date) : new Date();
  let created = 0;
  await prisma.$transaction(
    async (tx) => {
      for (const sec of sections) {
        if (!sec.personId || !sec.body.trim()) continue;
        await tx.meetingNote.create({
          data: {
            personId: sec.personId,
            date: d,
            rawNotes: sec.body,
          },
        });
        created++;
      }
    },
    { timeout: 30_000 },
  );
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
  revalidatePath("/");
  return { created };
}

// 新しい相手を追加(バルクUI内から)
export async function quickAddPerson(
  name: string,
  role: string | null,
): Promise<{ id: string; name: string; role: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("名前を入力してください");
  const existing = await prisma.person.findFirst({ where: { name: trimmed } });
  if (existing) return { id: existing.id, name: existing.name, role: existing.role };
  const created = await prisma.person.create({ data: { name: trimmed, role: role?.trim() || null } });
  revalidatePath("/oneonones/people");
  return { id: created.id, name: created.name, role: created.role };
}

export async function upsertPerson(formData: FormData) {
  const name = s(formData.get("name")).trim();
  if (!name) throw new Error("名前は必須");
  const role = s(formData.get("role")) || null;
  const id = s(formData.get("id")) || null;

  if (id) {
    await prisma.person.update({ where: { id }, data: { name, role } });
  } else {
    await prisma.person.create({ data: { name, role } });
  }
  revalidatePath("/oneonones");
  revalidatePath("/oneonones/people");
}
