"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

export async function createProject(formData: FormData) {
  const name = s(formData.get("name")).trim();
  if (!name) throw new Error("プロジェクト名を入力してください");
  const dueStr = s(formData.get("dueDate"));
  const created = await prisma.project.create({
    data: {
      name,
      objective: s(formData.get("objective")) || null,
      owner: s(formData.get("owner")) || null,
      department: s(formData.get("department")) || null,
      status: s(formData.get("status")) || "順調",
      riskLevel: s(formData.get("riskLevel")) || "低",
      priority: s(formData.get("priority")) || "中",
      nextAction: s(formData.get("nextAction")) || null,
      dueDate: dueStr ? new Date(dueStr) : null,
      currentSummary: s(formData.get("currentSummary")) || null,
      successMetric: s(formData.get("successMetric")) || null,
      isSharedWithCEO: formData.get("isSharedWithCEO") === "on",
      privateMemo: s(formData.get("privateMemo")) || null,
    },
  });
  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${created.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const dueStr = s(formData.get("dueDate"));
  await prisma.project.update({
    where: { id },
    data: {
      name: s(formData.get("name")).trim(),
      objective: s(formData.get("objective")) || null,
      owner: s(formData.get("owner")) || null,
      department: s(formData.get("department")) || null,
      status: s(formData.get("status")) || "順調",
      riskLevel: s(formData.get("riskLevel")) || "低",
      priority: s(formData.get("priority")) || "中",
      nextAction: s(formData.get("nextAction")) || null,
      dueDate: dueStr ? new Date(dueStr) : null,
      currentSummary: s(formData.get("currentSummary")) || null,
      successMetric: s(formData.get("successMetric")) || null,
      isSharedWithCEO: formData.get("isSharedWithCEO") === "on",
      privateMemo: s(formData.get("privateMemo")) || null,
    },
  });
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/share");
  revalidatePath("/");
  redirect(`/projects/${id}`);
}

// プロジェクトを削除(関連するタスク・更新は Cascade で消える / 判断・リスクは
// projectId が SetNull になるだけ:アイテム自体は残る)
export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/share");
  revalidatePath("/");
  redirect("/projects");
}
