"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runMeetingNoteAgent, type MeetingExtraction } from "@/lib/ai/agents";
import { CONFIDENTIALITY, MEETING_TYPES } from "@/lib/vocab";

function strOr(value: FormDataEntryValue | null, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function createMeeting(formData: FormData) {
  const title = strOr(formData.get("title")).trim();
  if (!title) throw new Error("Title is required");
  const meetingType = strOr(formData.get("meetingType"), "Other");
  const dateStr = strOr(formData.get("date"));
  const confidentiality = strOr(
    formData.get("confidentiality"),
    process.env.DEFAULT_CONFIDENTIALITY || "Confidential",
  );
  const rawNotes = strOr(formData.get("rawNotes"));
  const tagsRaw = strOr(formData.get("tags"));
  const attendeesRaw = strOr(formData.get("attendees"));

  const meeting = await prisma.meeting.create({
    data: {
      title,
      meetingType: (MEETING_TYPES as readonly string[]).includes(meetingType)
        ? meetingType
        : "Other",
      date: dateStr ? new Date(dateStr) : new Date(),
      confidentiality: (CONFIDENTIALITY as readonly string[]).includes(confidentiality)
        ? confidentiality
        : "Confidential",
      rawNotes,
      tags: tagsRaw
        ? {
            connectOrCreate: tagsRaw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((name) => ({ where: { name }, create: { name } })),
          }
        : undefined,
      attendees: attendeesRaw
        ? {
            connectOrCreate: attendeesRaw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((name) => ({ where: { id: `seed-${name}` }, create: { id: `manual-${name}-${Date.now()}`, name } })),
          }
        : undefined,
    },
  });

  revalidatePath("/meetings");
  redirect(`/meetings/${meeting.id}`);
}

export async function updateMeeting(id: string, formData: FormData) {
  const data: any = {};
  for (const k of ["title", "meetingType", "summary", "rawNotes", "confidentiality"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v;
  }
  const dateStr = strOr(formData.get("date"));
  if (dateStr) data.date = new Date(dateStr);

  await prisma.meeting.update({ where: { id }, data });
  revalidatePath(`/meetings/${id}`);
  revalidatePath("/meetings");
}

export async function deleteMeeting(id: string) {
  await prisma.meeting.delete({ where: { id } });
  revalidatePath("/meetings");
  redirect("/meetings");
}

// -- AI processing ----------------------------------------------------------

export async function processMeetingNotes(
  meetingId: string,
): Promise<{ ok: true; extraction: MeetingExtraction } | { ok: false; error: string }> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) return { ok: false, error: "Meeting not found" };
  if (!meeting.rawNotes.trim()) {
    return { ok: false, error: "No notes to process. Paste raw notes first." };
  }
  try {
    const result = await runMeetingNoteAgent(meeting.rawNotes, { meetingId });
    return { ok: true, extraction: result.data as MeetingExtraction };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Persist reviewed extraction. The user has already edited the JSON in the UI.
export async function applyExtraction(meetingId: string, extractionJson: string) {
  let parsed: MeetingExtraction;
  try {
    parsed = JSON.parse(extractionJson);
  } catch (e) {
    throw new Error("Could not parse the extraction JSON. Check the formatting.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update meeting summary
    await tx.meeting.update({
      where: { id: meetingId },
      data: { summary: parsed.summary || null, processedAt: new Date() },
    });

    // 2. Action items
    for (const a of parsed.actionItems ?? []) {
      const ownerId = a.owner ? await ensurePerson(tx, a.owner) : null;
      await tx.actionItem.create({
        data: {
          description: a.description,
          urgency: a.urgency ?? "Medium",
          ownerId: ownerId,
          meetingId,
          notes: a.dueHint ?? null,
        },
      });
    }

    // 3. Decisions made
    for (const d of parsed.decisions ?? []) {
      await tx.decision.create({
        data: {
          title: d.title,
          rationale: d.rationale ?? null,
          date: new Date(),
          meetingId,
        },
      });
    }

    // 4. Decisions needed
    for (const dn of parsed.decisionsNeeded ?? []) {
      await tx.decisionNeeded.create({
        data: {
          title: dn.title,
          recommendation: dn.recommendation ?? null,
          impactIfDelayed: dn.impactIfDelayed ?? null,
          meetingId,
        },
      });
    }

    // 5. Risks
    for (const r of parsed.risks ?? []) {
      await tx.risk.create({
        data: {
          description: r.description,
          severity: r.severity ?? "Medium",
          meetingId,
        },
      });
    }

    // 6. Themes — track frequency
    for (const themeName of parsed.recurringThemes ?? []) {
      const existing = await tx.theme.findUnique({ where: { name: themeName } });
      if (existing) {
        await tx.theme.update({
          where: { name: themeName },
          data: { lastSeenAt: new Date(), occurrences: existing.occurrences + 1 },
        });
      } else {
        await tx.theme.create({ data: { name: themeName } });
      }
    }

    // 7. Mark latest AgentOutput as approved
    const latest = await tx.agentOutput.findFirst({
      where: { meetingId, agent: "MeetingNoteAgent" },
      orderBy: { createdAt: "desc" },
    });
    if (latest && !latest.approvedAt) {
      await tx.agentOutput.update({
        where: { id: latest.id },
        data: { approvedAt: new Date(), approvedBy: "human-reviewer" },
      });
    }
  });

  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/actions");
  revalidatePath("/decisions");
  revalidatePath("/decisions-needed");
  revalidatePath("/");
}

async function ensurePerson(tx: any, name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const existing = await tx.person.findFirst({ where: { name: trimmed } });
  if (existing) return existing.id;
  const created = await tx.person.create({ data: { name: trimmed } });
  return created.id;
}
