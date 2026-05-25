"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createDecisionNeeded(formData: FormData) {
  const title = s(formData.get("title")).trim();
  if (!title) throw new Error("Title required");
  const created = await prisma.decisionNeeded.create({
    data: {
      title,
      background: s(formData.get("background")) || null,
      options: s(formData.get("options")) || null,
      recommendation: s(formData.get("recommendation")) || null,
      impactIfDelayed: s(formData.get("impactIfDelayed")) || null,
      status: s(formData.get("status")) || "Open",
      deadline: s(formData.get("deadline")) ? new Date(s(formData.get("deadline"))) : null,
      notes: s(formData.get("notes")) || null,
    },
  });
  revalidatePath("/decisions-needed");
  redirect(`/decisions-needed/${created.id}`);
}

export async function updateDecisionNeeded(id: string, formData: FormData) {
  const data: any = {};
  for (const k of ["title", "background", "options", "recommendation", "impactIfDelayed", "status", "notes"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v || null;
  }
  const dl = s(formData.get("deadline"));
  if (dl) data.deadline = new Date(dl);
  await prisma.decisionNeeded.update({ where: { id }, data });
  revalidatePath(`/decisions-needed/${id}`);
  revalidatePath("/decisions-needed");
}

export async function deleteDecisionNeeded(id: string) {
  await prisma.decisionNeeded.delete({ where: { id } });
  revalidatePath("/decisions-needed");
  redirect("/decisions-needed");
}

export async function promoteToDecision(id: string, formData: FormData) {
  const dn = await prisma.decisionNeeded.findUnique({ where: { id } });
  if (!dn) throw new Error("Not found");
  const finalDecision = s(formData.get("finalDecision"));
  const decision = await prisma.decision.create({
    data: {
      title: dn.title,
      date: new Date(),
      context: dn.background,
      options: dn.options,
      finalDecision: finalDecision || dn.recommendation,
      rationale: s(formData.get("rationale")) || null,
      priorityId: dn.priorityId,
      projectId: dn.projectId,
      meetingId: dn.meetingId,
      ownerId: dn.ownerId,
    },
  });
  await prisma.decisionNeeded.update({ where: { id }, data: { status: "Decided" } });
  revalidatePath("/decisions-needed");
  revalidatePath("/decisions");
  redirect(`/decisions/${decision.id}`);
}
