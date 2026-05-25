// Seed with non-confidential fake data so the UI has something to show on first run.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // Wipe in dependency-safe order.
  await prisma.agentOutput.deleteMany();
  await prisma.weeklyBrief.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.decisionNeeded.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.project.deleteMany();
  await prisma.priority.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.person.deleteMany();
  await prisma.department.deleteMany();

  const dept = {
    finance: await prisma.department.create({ data: { name: "Finance" } }),
    hr: await prisma.department.create({ data: { name: "HR" } }),
    it: await prisma.department.create({ data: { name: "IT" } }),
    ops: await prisma.department.create({ data: { name: "Operations" } }),
    marketing: await prisma.department.create({ data: { name: "Marketing" } }),
    legal: await prisma.department.create({ data: { name: "Legal" } }),
    jpHQ: await prisma.department.create({ data: { name: "Japan HQ" } }),
    construction: await prisma.department.create({ data: { name: "Construction" } }),
  };

  const p = {
    ceo: await prisma.person.create({ data: { name: "Sample CEO", title: "CEO", isExecutive: true, departmentId: dept.ops.id } }),
    cfo: await prisma.person.create({ data: { name: "Sample CFO", title: "CFO", isExecutive: true, departmentId: dept.finance.id } }),
    coo: await prisma.person.create({ data: { name: "Sample COO", title: "COO", isExecutive: true, departmentId: dept.ops.id } }),
    cmo: await prisma.person.create({ data: { name: "Sample CMO", title: "CMO", isExecutive: true, departmentId: dept.marketing.id } }),
    me:  await prisma.person.create({ data: { name: "Chief of Staff", title: "Chief of Staff", isExecutive: false, departmentId: dept.ops.id } }),
    it:  await prisma.person.create({ data: { name: "IT Lead", title: "Director of IT", departmentId: dept.it.id } }),
    hr:  await prisma.person.create({ data: { name: "HR Director", title: "HR Director", departmentId: dept.hr.id } }),
  };

  for (const name of [
    "AI", "Labor Cost", "Compensation", "Board", "Audit Committee",
    "Store Openings", "Construction", "IT", "HR", "Finance",
    "Japan HQ", "Governance", "Strategy",
  ]) {
    await prisma.tag.create({ data: { name } });
  }

  // Priorities
  const priCustExp = await prisma.priority.create({
    data: {
      name: "2026 US store expansion plan",
      description: "Open 12 new locations across CA/TX/NY, on budget, on schedule.",
      level: "High",
      status: "On Track",
      keyRisks: "Construction delays; lease negotiation; labor pipeline",
      nextAction: "Confirm final site list with Construction by month-end",
      ownerId: p.coo.id,
      deadline: new Date(Date.now() + 90 * 86400000),
    },
  });
  const priLabor = await prisma.priority.create({
    data: {
      name: "Labor cost containment",
      description: "Bring labor as % of revenue back to FY25 target without hurting service quality.",
      level: "High",
      status: "At Risk",
      keyRisks: "Minimum wage increases; staffing shortage in two markets",
      nextAction: "Review proposed scheduling pilot with HR",
      ownerId: p.cfo.id,
      lastUpdated: new Date(Date.now() - 20 * 86400000),
      deadline: new Date(Date.now() + 30 * 86400000),
    },
  });
  const priAI = await prisma.priority.create({
    data: {
      name: "AI / automation roadmap",
      description: "Identify and implement two high-ROI AI initiatives in operations and finance.",
      level: "Medium",
      status: "Delayed",
      keyRisks: "IT bandwidth; vendor selection",
      nextAction: "Lock vendor shortlist for forecasting tool",
      ownerId: p.cmo.id,
      lastUpdated: new Date(Date.now() - 21 * 86400000),
    },
  });
  const priBoard = await prisma.priority.create({
    data: {
      name: "Q3 board prep & governance",
      description: "Deliver board materials 10 days ahead; align audit & comp committee asks.",
      level: "High",
      status: "On Track",
      ownerId: p.me.id,
      deadline: new Date(Date.now() + 45 * 86400000),
    },
  });

  // Projects
  const projAI = await prisma.project.create({
    data: {
      name: "Demand forecasting pilot",
      description: "Pilot ML-based demand forecasting in 2 stores",
      status: "Blocked",
      priorityLevel: "High",
      currentPhase: "Vendor selection",
      blockers: "Waiting on IT security review of vendor's SOC2",
      dependencies: "IT, Finance",
      ownerId: p.cmo.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.it.id }, { id: dept.ops.id }] },
      priorities: { connect: [{ id: priAI.id }] },
    },
  });
  await prisma.project.create({
    data: {
      name: "Texas market opening — Austin store #1",
      description: "First Texas location, signature flagship",
      status: "At Risk",
      priorityLevel: "High",
      currentPhase: "Construction",
      blockers: "Permit review delayed 3 weeks",
      ownerId: p.coo.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.construction.id }, { id: dept.legal.id }] },
      priorities: { connect: [{ id: priCustExp.id }] },
    },
  });
  await prisma.project.create({
    data: {
      name: "Compensation framework refresh",
      description: "Update exec & manager comp framework with Comp Committee",
      status: "Active",
      priorityLevel: "Medium",
      currentPhase: "Benchmarking",
      ownerId: p.hr.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.hr.id }] },
    },
  });

  // Meetings
  const m1 = await prisma.meeting.create({
    data: {
      title: "CEO 1:1 — sample week",
      date: new Date(Date.now() - 2 * 86400000),
      meetingType: "CEO 1:1",
      confidentiality: "Confidential",
      summary: "CEO emphasized labor cost; wants weekly tracking. AI pilot must move; IT is the blocker.",
      rawNotes: `CEO 1:1 notes (sample)
- Labor cost trending up; CEO wants a weekly view by region. Action: CFO to send by Friday.
- AI forecasting pilot delayed. CEO frustrated. Decision: escalate to IT to unblock SOC2 review by EOW.
- Texas store #1: permit review delay. Risk to opening date. CEO will not push back the launch.
- Open question: how are we tracking the comp committee asks? Need a summary by next 1:1.
- Decision: weekly executive brief will start this Friday.`,
      attendees: { connect: [{ id: p.ceo.id }, { id: p.me.id }] },
      tags: { connect: [{ name: "Labor Cost" }, { name: "AI" }, { name: "Store Openings" }] },
      priorities: { connect: [{ id: priLabor.id }, { id: priAI.id }, { id: priCustExp.id }] },
      projects: { connect: [{ id: projAI.id }] },
    },
  });
  await prisma.meeting.create({
    data: {
      title: "Executive staff meeting",
      date: new Date(Date.now() - 5 * 86400000),
      meetingType: "Executive Meeting",
      summary: "Reviewed Q3 priorities; comp committee discussion deferred.",
      rawNotes: `Exec staff (sample)
- COO: construction permits still slow in TX. Risk: 3 week slip.
- CFO: labor cost +1.2pp vs target. Will pilot scheduling change.
- CMO: vendor for AI forecasting selected, awaiting IT.
- Decision: deferred comp framework discussion to next exec.
- Action: HR to draft scheduling pilot scope by Wednesday.`,
      attendees: { connect: [{ id: p.ceo.id }, { id: p.cfo.id }, { id: p.coo.id }, { id: p.cmo.id }] },
      tags: { connect: [{ name: "Labor Cost" }, { name: "AI" }] },
    },
  });

  // Existing action items
  await prisma.actionItem.create({
    data: {
      description: "Send weekly labor cost view by region",
      status: "In Progress",
      urgency: "High",
      ownerId: p.cfo.id,
      dueDate: new Date(Date.now() + 1 * 86400000),
      meetingId: m1.id,
      priorityId: priLabor.id,
    },
  });
  await prisma.actionItem.create({
    data: {
      description: "Escalate IT to unblock SOC2 review for AI vendor",
      status: "Blocked",
      urgency: "High",
      ownerId: p.it.id,
      dueDate: new Date(Date.now() - 3 * 86400000),
      meetingId: m1.id,
      priorityId: priAI.id,
      projectId: projAI.id,
    },
  });
  await prisma.actionItem.create({
    data: {
      description: "Draft scheduling pilot scope",
      status: "Not Started",
      urgency: "Medium",
      ownerId: p.hr.id,
      dueDate: new Date(Date.now() + 4 * 86400000),
      priorityId: priLabor.id,
    },
  });
  await prisma.actionItem.create({
    data: {
      description: "Summarize comp committee outstanding asks",
      status: "Not Started",
      urgency: "Medium",
      ownerId: p.me.id,
      dueDate: new Date(Date.now() + 2 * 86400000),
      priorityId: priBoard.id,
    },
  });

  // Decisions
  await prisma.decision.create({
    data: {
      title: "Weekly executive brief starts Friday",
      date: new Date(Date.now() - 2 * 86400000),
      finalDecision: "Yuko will deliver a weekly brief every Friday",
      rationale: "CEO wants tighter visibility into priorities and risks.",
      meetingId: m1.id,
      ownerId: p.me.id,
    },
  });

  // Decisions needed
  await prisma.decisionNeeded.create({
    data: {
      title: "Approve AI vendor selection for forecasting pilot",
      background: "IT SOC2 review delayed. CEO wants to move.",
      options: "1) Wait for IT review · 2) Move with conditional approval · 3) Pick alternate vendor",
      recommendation: "Option 2 — conditional approval with IT sign-off due in 2 weeks",
      impactIfDelayed: "Pilot pushed another quarter; AI roadmap slips",
      status: "Awaiting CEO",
      deadline: new Date(Date.now() + 5 * 86400000),
      priorityId: priAI.id,
      projectId: projAI.id,
    },
  });
  await prisma.decisionNeeded.create({
    data: {
      title: "Final TX site list for 2026",
      background: "Construction needs final list to lock contractors",
      recommendation: "Approve top 4 sites; defer two until lease terms close",
      status: "Open",
      deadline: new Date(Date.now() + 10 * 86400000),
      priorityId: priCustExp.id,
    },
  });

  // Themes
  await prisma.theme.create({ data: { name: "IT bottleneck", occurrences: 4 } });
  await prisma.theme.create({ data: { name: "Labor cost pressure", occurrences: 6 } });
  await prisma.theme.create({ data: { name: "Comp committee follow-through", occurrences: 3 } });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
