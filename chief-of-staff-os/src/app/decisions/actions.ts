"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createDecision(formData: FormData) {
  const title = s(formData.get("title")).trim();
  if (!title) throw new Error("Title required");
  const ownerName = s(formData.get("ownerName")).trim();
  const ownerId = ownerName ? await ensurePerson(ownerName) : null;
  const d = await prisma.decision.create({
    data: {
      title,
      date: s(formData.get("date")) ? new Date(s(formData.get("date"))) : new Date(),
      context: s(formData.get("context")) || null,
      options: s(formData.get("options")) || null,
      finalDecision: s(formData.get("finalDecision")) || null,
      rationale: s(formData.get("rationale")) || null,
      expectedImpact: s(formData.get("expectedImpact")) || null,
      participants: s(formData.get("participants")) || null,
      followUpRequired: s(formData.get("followUpRequired")) === "on",
      reviewDate: s(formData.get("reviewDate")) ? new Date(s(formData.get("reviewDate"))) : null,
      notes: s(formData.get("notes")) || null,
      ownerId,
    },
  });
  revalidatePath("/decisions");
  redirect(`/decisions/${d.id}`);
}

export async function updateDecision(id: string, formData: FormData) {
  const data: any = {};
  for (const k of ["title", "context", "options", "finalDecision", "rationale", "expectedImpact", "participants", "notes"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v || null;
  }
  data.followUpRequired = s(formData.get("followUpRequired")) === "on";
  const dd = s(formData.get("date")); if (dd) data.date = new Date(dd);
  const rd = s(formData.get("reviewDate")); if (rd) data.reviewDate = new Date(rd);
  const ownerName = s(formData.get("ownerName")).trim();
  if (ownerName) data.ownerId = await ensurePerson(ownerName);
  await prisma.decision.update({ where: { id }, data });
  revalidatePath(`/decisions/${id}`);
  revalidatePath("/decisions");
}

export async function deleteDecision(id: string) {
  await prisma.decision.delete({ where: { id } });
  revalidatePath("/decisions");
  redirect("/decisions");
}

async function ensurePerson(name: string): Promise<string> {
  const existing = await prisma.person.findFirst({ where: { name } });
  if (existing) return existing.id;
  return (await prisma.person.create({ data: { name } })).id;
}
