"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createPriority(formData: FormData) {
  const name = s(formData.get("name")).trim();
  if (!name) throw new Error("Name required");
  const ownerName = s(formData.get("ownerName")).trim();
  const ownerId = ownerName ? await ensurePerson(ownerName) : null;
  const created = await prisma.priority.create({
    data: {
      name,
      description: s(formData.get("description")) || null,
      level: s(formData.get("level")) || "Medium",
      status: s(formData.get("status")) || "On Track",
      keyRisks: s(formData.get("keyRisks")) || null,
      nextAction: s(formData.get("nextAction")) || null,
      notes: s(formData.get("notes")) || null,
      deadline: s(formData.get("deadline")) ? new Date(s(formData.get("deadline"))) : null,
      ownerId,
    },
  });
  revalidatePath("/priorities");
  redirect(`/priorities/${created.id}`);
}

export async function updatePriority(id: string, formData: FormData) {
  const data: any = { lastUpdated: new Date() };
  for (const k of ["name", "description", "level", "status", "keyRisks", "nextAction", "notes"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v || null;
  }
  const dl = s(formData.get("deadline"));
  if (dl) data.deadline = new Date(dl);
  const ownerName = s(formData.get("ownerName")).trim();
  if (ownerName) data.ownerId = await ensurePerson(ownerName);
  await prisma.priority.update({ where: { id }, data });
  revalidatePath(`/priorities/${id}`);
  revalidatePath("/priorities");
  revalidatePath("/");
}

export async function deletePriority(id: string) {
  await prisma.priority.delete({ where: { id } });
  revalidatePath("/priorities");
  redirect("/priorities");
}

async function ensurePerson(name: string): Promise<string> {
  const existing = await prisma.person.findFirst({ where: { name } });
  if (existing) return existing.id;
  const created = await prisma.person.create({ data: { name } });
  return created.id;
}
