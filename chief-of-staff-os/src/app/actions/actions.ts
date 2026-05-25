"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createAction(formData: FormData) {
  const description = s(formData.get("description")).trim();
  if (!description) throw new Error("Description required");
  const ownerName = s(formData.get("ownerName")).trim();
  const ownerId = ownerName ? await ensurePerson(ownerName) : null;
  const a = await prisma.actionItem.create({
    data: {
      description,
      status: s(formData.get("status")) || "Not Started",
      urgency: s(formData.get("urgency")) || "Medium",
      dueDate: s(formData.get("dueDate")) ? new Date(s(formData.get("dueDate"))) : null,
      notes: s(formData.get("notes")) || null,
      ownerId,
    },
  });
  revalidatePath("/actions");
  redirect(`/actions/${a.id}`);
}

export async function updateAction(id: string, formData: FormData) {
  const data: any = {};
  for (const k of ["description", "status", "urgency", "notes"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v || null;
  }
  const d = s(formData.get("dueDate"));
  if (d) data.dueDate = new Date(d);
  const nf = s(formData.get("nextFollowUp"));
  if (nf) data.nextFollowUp = new Date(nf);
  const lf = s(formData.get("lastFollowUp"));
  if (lf) data.lastFollowUp = new Date(lf);
  const ownerName = s(formData.get("ownerName")).trim();
  if (ownerName) data.ownerId = await ensurePerson(ownerName);
  await prisma.actionItem.update({ where: { id }, data });
  revalidatePath(`/actions/${id}`);
  revalidatePath("/actions");
  revalidatePath("/");
}

export async function deleteAction(id: string) {
  await prisma.actionItem.delete({ where: { id } });
  revalidatePath("/actions");
  redirect("/actions");
}

export async function quickToggleStatus(id: string, status: string) {
  await prisma.actionItem.update({ where: { id }, data: { status } });
  revalidatePath("/actions");
  revalidatePath("/");
}

async function ensurePerson(name: string): Promise<string> {
  const existing = await prisma.person.findFirst({ where: { name } });
  if (existing) return existing.id;
  const created = await prisma.person.create({ data: { name } });
  return created.id;
}
