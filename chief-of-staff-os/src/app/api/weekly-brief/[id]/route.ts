import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const brief = await prisma.weeklyBrief.findUnique({ where: { id } });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ markdown: brief.markdown, weekOf: brief.weekOf });
}
