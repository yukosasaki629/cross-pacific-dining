"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null) { return typeof v === "string" ? v : ""; }

export async function createProject(formData: FormData) {
  const name = s(formData.get("name")).trim();
  if (!name) throw new Error("Name required");
  const ownerName = s(formData.get("ownerName")).trim();
  const sponsorName = s(formData.get("sponsorName")).trim();
  const created = await prisma.project.create({
    data: {
      name,
      description: s(formData.get("description")) || null,
      status: s(formData.get("status")) || "Active",
      priorityLevel: s(formData.get("priorityLevel")) || "Medium",
      startDate: s(formData.get("startDate")) ? new Date(s(formData.get("startDate"))) : null,
      targetDate: s(formData.get("targetDate")) ? new Date(s(formData.get("targetDate"))) : null,
      currentPhase: s(formData.get("currentPhase")) || null,
      milestones: s(formData.get("milestones")) || null,
      dependencies: s(formData.get("dependencies")) || null,
      risks: s(formData.get("risks")) || null,
      blockers: s(formData.get("blockers")) || null,
      notes: s(formData.get("notes")) || null,
      ownerId: ownerName ? await ensurePerson(ownerName) : null,
      sponsorId: sponsorName ? await ensurePerson(sponsorName) : null,
    },
  });
  revalidatePath("/projects");
  redirect(`/projects/${created.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const data: any = { lastUpdated: new Date() };
  for (const k of ["name", "description", "status", "priorityLevel", "currentPhase", "milestones", "dependencies", "risks", "blockers", "notes"]) {
    const v = formData.get(k);
    if (typeof v === "string") data[k] = v || null;
  }
  const sd = s(formData.get("startDate")); if (sd) data.startDate = new Date(sd);
  const td = s(formData.get("targetDate")); if (td) data.targetDate = new Date(td);
  const ownerName = s(formData.get("ownerName")).trim();
  const sponsorName = s(formData.get("sponsorName")).trim();
  if (ownerName) data.ownerId = await ensurePerson(ownerName);
  if (sponsorName) data.sponsorId = await ensurePerson(sponsorName);
  await prisma.project.update({ where: { id }, data });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  redirect("/projects");
}

async function ensurePerson(name: string): Promise<string> {
  const existing = await prisma.person.findFirst({ where: { name } });
  if (existing) return existing.id;
  return (await prisma.person.create({ data: { name } })).id;
}
