// 非機密のサンプルデータをシード。初回起動時にUIが空にならないようにします。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("シード投入中…");

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
    finance: await prisma.department.create({ data: { name: "財務" } }),
    hr: await prisma.department.create({ data: { name: "人事" } }),
    it: await prisma.department.create({ data: { name: "IT" } }),
    ops: await prisma.department.create({ data: { name: "オペレーション" } }),
    marketing: await prisma.department.create({ data: { name: "マーケティング" } }),
    legal: await prisma.department.create({ data: { name: "法務" } }),
    jpHQ: await prisma.department.create({ data: { name: "日本本社" } }),
    construction: await prisma.department.create({ data: { name: "店舗工事" } }),
  };

  const p = {
    ceo: await prisma.person.create({ data: { name: "サンプルCEO", title: "CEO", isExecutive: true, departmentId: dept.ops.id } }),
    cfo: await prisma.person.create({ data: { name: "サンプルCFO", title: "CFO", isExecutive: true, departmentId: dept.finance.id } }),
    coo: await prisma.person.create({ data: { name: "サンプルCOO", title: "COO", isExecutive: true, departmentId: dept.ops.id } }),
    cmo: await prisma.person.create({ data: { name: "サンプルCMO", title: "CMO", isExecutive: true, departmentId: dept.marketing.id } }),
    me:  await prisma.person.create({ data: { name: "Chief of Staff", title: "Chief of Staff", isExecutive: false, departmentId: dept.ops.id } }),
    it:  await prisma.person.create({ data: { name: "IT 部長", title: "IT 部長", departmentId: dept.it.id } }),
    hr:  await prisma.person.create({ data: { name: "人事部長", title: "人事部長", departmentId: dept.hr.id } }),
  };

  for (const name of [
    "AI", "人件費", "報酬", "取締役会", "監査委員会",
    "新店舗", "店舗工事", "IT", "人事", "財務",
    "日本本社", "ガバナンス", "戦略",
  ]) {
    await prisma.tag.create({ data: { name } });
  }

  const priCustExp = await prisma.priority.create({
    data: {
      name: "2026年 米国出店計画",
      description: "カリフォルニア・テキサス・ニューヨークで12店舗を新規開業。予算・スケジュール厳守。",
      level: "High",
      status: "On Track",
      keyRisks: "工事の遅延、賃貸交渉、人材パイプライン",
      nextAction: "月末までに店舗工事チームと最終立地リストを確定",
      ownerId: p.coo.id,
      deadline: new Date(Date.now() + 90 * 86400000),
    },
  });
  const priLabor = await prisma.priority.create({
    data: {
      name: "人件費コントロール",
      description: "サービス品質を落とさず、人件費比率をFY25目標まで戻す。",
      level: "High",
      status: "At Risk",
      keyRisks: "最低賃金引き上げ、2市場での人手不足",
      nextAction: "シフト管理パイロット案を人事とレビュー",
      ownerId: p.cfo.id,
      lastUpdated: new Date(Date.now() - 20 * 86400000),
      deadline: new Date(Date.now() + 30 * 86400000),
    },
  });
  const priAI = await prisma.priority.create({
    data: {
      name: "AI / 自動化ロードマップ",
      description: "オペレーションと財務でROIの高いAI施策を2件実装する。",
      level: "Medium",
      status: "Delayed",
      keyRisks: "IT工数、ベンダー選定",
      nextAction: "需要予測ツールのベンダー最終候補を確定",
      ownerId: p.cmo.id,
      lastUpdated: new Date(Date.now() - 21 * 86400000),
    },
  });
  const priBoard = await prisma.priority.create({
    data: {
      name: "Q3 取締役会準備・ガバナンス",
      description: "取締役会資料を10日前に提出。監査委員会・報酬委員会の論点を整合。",
      level: "High",
      status: "On Track",
      ownerId: p.me.id,
      deadline: new Date(Date.now() + 45 * 86400000),
    },
  });

  const projAI = await prisma.project.create({
    data: {
      name: "需要予測パイロット",
      description: "2店舗で機械学習ベースの需要予測をパイロット導入",
      status: "Blocked",
      priorityLevel: "High",
      currentPhase: "ベンダー選定",
      blockers: "ベンダーのSOC2レビュー(IT)待ち",
      dependencies: "IT、財務",
      ownerId: p.cmo.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.it.id }, { id: dept.ops.id }] },
      priorities: { connect: [{ id: priAI.id }] },
    },
  });
  await prisma.project.create({
    data: {
      name: "テキサス展開 — オースティン1号店",
      description: "テキサス州初の旗艦店オープン",
      status: "At Risk",
      priorityLevel: "High",
      currentPhase: "工事中",
      blockers: "建設許可の審査が3週間遅延",
      ownerId: p.coo.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.construction.id }, { id: dept.legal.id }] },
      priorities: { connect: [{ id: priCustExp.id }] },
    },
  });
  await prisma.project.create({
    data: {
      name: "報酬フレームワーク更新",
      description: "報酬委員会と幹部・マネジメント層の報酬フレームワークを刷新",
      status: "Active",
      priorityLevel: "Medium",
      currentPhase: "ベンチマーキング",
      ownerId: p.hr.id,
      sponsorId: p.ceo.id,
      departments: { connect: [{ id: dept.hr.id }] },
    },
  });

  const m1 = await prisma.meeting.create({
    data: {
      title: "CEO 1on1 — サンプル週",
      date: new Date(Date.now() - 2 * 86400000),
      meetingType: "CEO 1:1",
      confidentiality: "Confidential",
      summary: "CEOは人件費を強調。週次トラッキングを希望。AIパイロットは進めたいが、ITがボトルネック。",
      rawNotes: `CEO 1on1 メモ(サンプル)
- 人件費が上振れ。CEOは地域別の週次レポートを希望。Action: CFOが金曜までに送付。
- AI需要予測パイロットが遅延。CEOはフラストレーション。Decision: ITにエスカレ、SOC2レビューを今週中に解除させる。
- テキサス1号店:建設許可レビューが遅延。オープン日への影響懸念。CEOはオープン日を後ろ倒ししない方針。
- 未解決の論点:報酬委員会の宿題はどう追えているか? 次回1on1までにサマリーが欲しい。
- Decision: 週次エグゼクティブブリーフを今週金曜から開始。`,
      attendees: { connect: [{ id: p.ceo.id }, { id: p.me.id }] },
      tags: { connect: [{ name: "人件費" }, { name: "AI" }, { name: "新店舗" }] },
      priorities: { connect: [{ id: priLabor.id }, { id: priAI.id }, { id: priCustExp.id }] },
      projects: { connect: [{ id: projAI.id }] },
    },
  });
  await prisma.meeting.create({
    data: {
      title: "経営会議",
      date: new Date(Date.now() - 5 * 86400000),
      meetingType: "Executive Meeting",
      summary: "Q3の優先事項をレビュー。報酬委員会の議論は次回に持ち越し。",
      rawNotes: `経営会議メモ(サンプル)
- COO:テキサスの建設許可が依然として遅い。リスク:3週間スリップ。
- CFO:人件費は目標比+1.2pp。シフト管理パイロットを実施予定。
- CMO:AI需要予測のベンダー選定済、IT待ち。
- Decision: 報酬フレームワーク議論は次回に持ち越し。
- Action: 人事が水曜までにシフト管理パイロットのスコープをドラフト。`,
      attendees: { connect: [{ id: p.ceo.id }, { id: p.cfo.id }, { id: p.coo.id }, { id: p.cmo.id }] },
      tags: { connect: [{ name: "人件費" }, { name: "AI" }] },
    },
  });

  await prisma.actionItem.create({
    data: {
      description: "地域別の人件費 週次レポートを送付",
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
      description: "AIベンダーのSOC2レビューをITにエスカレ",
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
      description: "シフト管理パイロットのスコープをドラフト",
      status: "Not Started",
      urgency: "Medium",
      ownerId: p.hr.id,
      dueDate: new Date(Date.now() + 4 * 86400000),
      priorityId: priLabor.id,
    },
  });
  await prisma.actionItem.create({
    data: {
      description: "報酬委員会の未対応タスクをサマライズ",
      status: "Not Started",
      urgency: "Medium",
      ownerId: p.me.id,
      dueDate: new Date(Date.now() + 2 * 86400000),
      priorityId: priBoard.id,
    },
  });

  await prisma.decision.create({
    data: {
      title: "週次エグゼクティブブリーフを今週金曜から開始",
      date: new Date(Date.now() - 2 * 86400000),
      finalDecision: "Chief of Staffが毎週金曜にブリーフを配信",
      rationale: "CEOが優先事項とリスクをより詳しく把握したいと希望。",
      meetingId: m1.id,
      ownerId: p.me.id,
    },
  });

  await prisma.decisionNeeded.create({
    data: {
      title: "AI需要予測パイロットのベンダー承認",
      background: "IT SOC2レビューが遅延中。CEOは進めたい意向。",
      options: "1) ITレビュー完了を待つ · 2) 条件付き承認で先行 · 3) 代替ベンダーを選定",
      recommendation: "オプション2 — 2週間以内のIT承認を条件に先行",
      impactIfDelayed: "パイロットがさらに1四半期スリップ、AIロードマップに影響",
      status: "Awaiting CEO",
      deadline: new Date(Date.now() + 5 * 86400000),
      priorityId: priAI.id,
      projectId: projAI.id,
    },
  });
  await prisma.decisionNeeded.create({
    data: {
      title: "2026年テキサス州の最終立地リスト",
      background: "店舗工事チームが最終リストを必要としている(契約確定のため)",
      recommendation: "トップ4立地を承認、賃貸条件未確定の2件は保留",
      status: "Open",
      deadline: new Date(Date.now() + 10 * 86400000),
      priorityId: priCustExp.id,
    },
  });

  await prisma.theme.create({ data: { name: "ITのボトルネック", occurrences: 4 } });
  await prisma.theme.create({ data: { name: "人件費プレッシャー", occurrences: 6 } });
  await prisma.theme.create({ data: { name: "報酬委員会のフォロー", occurrences: 3 } });

  console.log("シード完了。");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
