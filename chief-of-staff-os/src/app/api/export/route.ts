import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Returns a JSON snapshot of every table. Designed for local backup; do not
// expose this endpoint over a network without authentication.
export async function GET() {
  const [
    departments, people, meetings, transcripts, priorities, projects,
    actionItems, decisions, decisionsNeeded, risks, tags, themes,
    agentOutputs, weeklyBriefs,
  ] = await Promise.all([
    prisma.department.findMany(),
    prisma.person.findMany(),
    prisma.meeting.findMany({ include: { tags: true, attendees: true } }),
    prisma.transcript.findMany({ include: { tags: true } }),
    prisma.priority.findMany({ include: { departments: true, tags: true } }),
    prisma.project.findMany({ include: { departments: true, tags: true } }),
    prisma.actionItem.findMany({ include: { tags: true } }),
    prisma.decision.findMany({ include: { tags: true } }),
    prisma.decisionNeeded.findMany({ include: { tags: true } }),
    prisma.risk.findMany(),
    prisma.tag.findMany(),
    prisma.theme.findMany(),
    prisma.agentOutput.findMany(),
    prisma.weeklyBrief.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    note: "Chief of Staff OS — full JSON export. Contains sensitive content; store securely.",
    data: {
      departments, people, meetings, transcripts, priorities, projects,
      actionItems, decisions, decisionsNeeded, risks, tags, themes,
      agentOutputs, weeklyBriefs,
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="cos-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
