"use server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { composeWeeklyBrief } from "@/lib/weekly-brief";
import { startOfWeek } from "@/lib/utils/date";

export async function generateBrief() {
  const weekStart = startOfWeek();
  const markdown = await composeWeeklyBrief(weekStart);
  const existing = await prisma.weeklyBrief.findFirst({ where: { weekOf: weekStart } });
  if (existing) {
    await prisma.weeklyBrief.update({ where: { id: existing.id }, data: { markdown } });
  } else {
    await prisma.weeklyBrief.create({ data: { weekOf: weekStart, markdown } });
  }
  revalidatePath("/weekly-brief");
  return { markdown };
}

export async function saveBriefEdits(id: string, markdown: string) {
  await prisma.weeklyBrief.update({ where: { id }, data: { markdown } });
  revalidatePath("/weekly-brief");
}
