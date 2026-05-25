"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runMeetingNoteAgent, MeetingExtraction } from "@/lib/ai/agents";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createTranscriptFromPaste(formData: FormData) {
  const text = s(formData.get("transcriptText")).trim();
  if (!text) throw new Error("Empty transcript");
  const created = await prisma.transcript.create({
    data: {
      transcriptText: text,
      source: "paste",
      filename: s(formData.get("filename")) || null,
      meetingId: s(formData.get("meetingId")) || null,
      confidentiality: s(formData.get("confidentiality")) || "Confidential",
      notes: s(formData.get("notes")) || null,
    },
  });
  revalidatePath("/transcripts");
  redirect(`/transcripts/${created.id}`);
}

export async function uploadTranscript(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name;
  const lower = name.toLowerCase();

  let text = "";
  let source = "upload-txt";

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    text = buffer.toString("utf-8");
    source = lower.endsWith(".md") ? "upload-md" : "upload-txt";
  } else if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
    source = "upload-docx";
  } else {
    throw new Error("Unsupported file type. Use .txt, .md, or .docx.");
  }

  if (!text.trim()) throw new Error("Extracted text is empty.");

  const created = await prisma.transcript.create({
    data: {
      transcriptText: text,
      filename: name,
      source,
      meetingId: s(formData.get("meetingId")) || null,
      confidentiality: s(formData.get("confidentiality")) || "Confidential",
    },
  });
  revalidatePath("/transcripts");
  redirect(`/transcripts/${created.id}`);
}

export async function deleteTranscript(id: string) {
  await prisma.transcript.delete({ where: { id } });
  revalidatePath("/transcripts");
  redirect("/transcripts");
}

export async function processTranscript(
  transcriptId: string,
): Promise<{ ok: true; extraction: MeetingExtraction } | { ok: false; error: string }> {
  const t = await prisma.transcript.findUnique({ where: { id: transcriptId } });
  if (!t) return { ok: false, error: "Transcript not found" };
  try {
    const result = await runMeetingNoteAgent(t.transcriptText, { transcriptId });
    return { ok: true, extraction: result.data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function applyTranscriptExtraction(transcriptId: string, extractionJson: string) {
  const t = await prisma.transcript.findUnique({ where: { id: transcriptId } });
  if (!t) throw new Error("Transcript not found");
  let parsed: MeetingExtraction;
  try {
    parsed = JSON.parse(extractionJson);
  } catch {
    throw new Error("Could not parse extraction JSON");
  }

  await prisma.$transaction(async (tx) => {
    // Either link to existing meeting or create a new one for this transcript.
    let meetingId = t.meetingId;
    if (!meetingId) {
      const m = await tx.meeting.create({
        data: {
          title: t.filename ?? `Transcript from ${t.uploadDate.toISOString().slice(0, 10)}`,
          meetingType: "Other",
          date: t.uploadDate,
          summary: parsed.summary || null,
          rawNotes: t.transcriptText.slice(0, 50000),
          confidentiality: t.confidentiality,
          processedAt: new Date(),
        },
      });
      meetingId = m.id;
      await tx.transcript.update({ where: { id: transcriptId }, data: { meetingId, processedStatus: "processed" } });
    } else {
      await tx.meeting.update({
        where: { id: meetingId },
        data: { summary: parsed.summary || undefined, processedAt: new Date() },
      });
      await tx.transcript.update({ where: { id: transcriptId }, data: { processedStatus: "processed" } });
    }

    for (const a of parsed.actionItems ?? []) {
      const ownerId = a.owner ? await ensurePerson(tx, a.owner) : null;
      await tx.actionItem.create({
        data: {
          description: a.description,
          urgency: a.urgency ?? "Medium",
          ownerId,
          meetingId,
          transcriptId,
          notes: a.dueHint ?? null,
        },
      });
    }
    for (const d of parsed.decisions ?? []) {
      await tx.decision.create({
        data: { title: d.title, rationale: d.rationale ?? null, date: new Date(), meetingId, transcriptId },
      });
    }
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
    for (const r of parsed.risks ?? []) {
      await tx.risk.create({ data: { description: r.description, severity: r.severity ?? "Medium", meetingId } });
    }
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
  });

  revalidatePath(`/transcripts/${transcriptId}`);
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
