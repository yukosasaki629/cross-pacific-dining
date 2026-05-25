// 仮データのシード。すべて非機密のサンプル内容。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const day = (n: number) => new Date(Date.now() + n * 86400000);

async function main() {
  console.log("シード投入中…");

  await prisma.followUp.deleteMany();
  await prisma.update.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  // --- プロジェクト ---
  const p1 = await prisma.project.create({
    data: {
      name: "2026年 米国出店計画",
      objective: "カリフォルニア・テキサス・ニューヨークで12店舗を新規開業。予算とスケジュールを守る。",
      owner: "サンプルCOO",
      department: "オペレーション",
      status: "注意",
      riskLevel: "中",
      priority: "高",
      nextAction: "月末までに最終立地リストを店舗工事チームと確定する",
      dueDate: day(60),
      currentSummary: "12店舗中4店舗で賃貸交渉中、2店舗で建設許可レビュー遅延。スケジュールにバッファあり。",
      successMetric: "2026年Q1までに12店舗オープン、予算超過率5%以内",
      isSharedWithCEO: true,
      privateMemo: "テキサスの代理人とは関係再構築が必要。CFOが個別ミーティングを希望していたが、まだ実現していない。",
    },
  });
  const p2 = await prisma.project.create({
    data: {
      name: "需要予測AIパイロット",
      objective: "2店舗で機械学習ベースの需要予測を導入し、人件費2%削減を実証",
      owner: "サンプルCMO",
      department: "マーケティング",
      status: "遅延",
      riskLevel: "高",
      priority: "高",
      nextAction: "IT部とSOC2レビューのスケジュールを今週中に合意",
      dueDate: day(30),
      currentSummary: "ベンダー選定完了。IT部のSOC2レビューが3週間遅延。CEOへエスカレーション済み。",
      successMetric: "人件費比率を2pp改善、予測精度85%以上",
      isSharedWithCEO: true,
      privateMemo: "IT部長との関係調整が必要。次のCEO 1on1で別案として代替ベンダー(社内承認済リスト)も提示する想定。",
    },
  });
  const p3 = await prisma.project.create({
    data: {
      name: "報酬フレームワーク刷新",
      objective: "報酬委員会と連携し、エグゼクティブ・マネージャー層の報酬体系を更新",
      owner: "人事部長",
      department: "人事",
      status: "順調",
      riskLevel: "低",
      priority: "中",
      nextAction: "ベンチマーキング結果を6/15までに報酬委員会に提出",
      dueDate: day(45),
      currentSummary: "外部コンサルとのベンチマーキング完了、ドラフト作成中",
      successMetric: "Q3取締役会で承認、新フレームワークを2026年1月から適用",
      isSharedWithCEO: true,
      privateMemo: null,
    },
  });
  const p4 = await prisma.project.create({
    data: {
      name: "日本本社との週次アラインメント仕組み化",
      objective: "日米間の意思決定リードタイムを2週間→3日に短縮",
      owner: "Chief of Staff",
      department: "オペレーション",
      status: "順調",
      riskLevel: "低",
      priority: "中",
      nextAction: "週次アジェンダのテンプレートを来週月曜までに展開",
      dueDate: day(20),
      currentSummary: "テンプレート設計完了。日本側との運用合意済み。",
      successMetric: "日本本社からの応答時間 中央値 3営業日以内",
      isSharedWithCEO: true,
      privateMemo: "本社CFOからの返信が依然として遅い。CEO同席のミーティングを2週間後に設定済み。",
    },
  });
  const p5 = await prisma.project.create({
    data: {
      name: "店舗オペレーション・ガイドライン整備",
      objective: "全店舗で共通の運営マニュアルを整備し、新店舗オープン時の立ち上げ期間を短縮",
      owner: "オペレーション部長",
      department: "オペレーション",
      status: "停止中",
      riskLevel: "中",
      priority: "低",
      nextAction: "再開時期と担当者を決める(優先度判断待ち)",
      dueDate: null,
      currentSummary: "他プロジェクト優先のため一時停止中。新店舗オープン前に再開予定。",
      successMetric: "新店舗の立ち上げ期間を6週間→3週間に短縮",
      isSharedWithCEO: false,  // 共有ビューには出さない例
      privateMemo: "リソース不足で再開時期が見えない。CEOから優先度の判断が欲しい。",
    },
  });

  // --- タスク ---
  await prisma.task.createMany({
    data: [
      { projectId: p1.id, title: "テキサス4店舗の最終立地リスト作成", owner: "店舗開発", status: "進行中", priority: "高", dueDate: day(7) },
      { projectId: p1.id, title: "ニューヨーク賃貸交渉の進捗共有", owner: "サンプルCOO", status: "未着手", priority: "中", dueDate: day(14) },
      { projectId: p1.id, title: "建設許可遅延の根本原因分析", owner: "建設チーム", status: "未着手", priority: "高", dueDate: day(-2) },
      { projectId: p2.id, title: "IT部にSOC2レビュー再依頼", owner: "サンプルCMO", status: "ブロック", priority: "高", dueDate: day(-5) },
      { projectId: p2.id, title: "代替ベンダーの社内承認確認", owner: "Chief of Staff", status: "進行中", priority: "中", dueDate: day(3) },
      { projectId: p2.id, title: "パイロット店舗の選定とKPI合意", owner: "サンプルCMO", status: "完了", priority: "中", dueDate: day(-14) },
      { projectId: p3.id, title: "報酬ベンチマーク資料ドラフト", owner: "人事部長", status: "進行中", priority: "中", dueDate: day(10) },
      { projectId: p3.id, title: "報酬委員会への事前説明", owner: "Chief of Staff", status: "未着手", priority: "中", dueDate: day(25) },
      { projectId: p4.id, title: "週次アジェンダのテンプレ作成", owner: "Chief of Staff", status: "進行中", priority: "中", dueDate: day(5) },
      { projectId: p4.id, title: "日本本社CFOとの個別ミーティング設定", owner: "Chief of Staff", status: "進行中", priority: "高", dueDate: day(14) },
    ],
  });

  // --- 判断が必要な事項 ---
  await prisma.decision.createMany({
    data: [
      {
        projectId: p2.id,
        topic: "AIベンダーの承認(条件付き先行)",
        background: "IT部のSOC2レビューが3週間遅延中。CEOは前進を希望。",
        options: "1) ITレビュー完了を待つ\n2) 2週間以内にIT承認を取る条件付きで先行\n3) 社内承認済の代替ベンダーに切り替え",
        recommendation: "オプション2 — 条件付き承認で先行。ITに期限を明確化。",
        deadline: day(5),
        impactIfDelayed: "パイロットがさらに1四半期スリップ。AIロードマップ全体に影響。",
        importance: "高",
        status: "未対応",
      },
      {
        projectId: p1.id,
        topic: "2026年テキサス州の最終立地リスト",
        background: "店舗工事チームが契約確定のため最終リストを要求。",
        options: "1) トップ6立地を全承認\n2) トップ4立地を承認、賃貸条件未確定の2件は保留",
        recommendation: "オプション2 — 確実な4件を先行、残り2件は来月確定。",
        deadline: day(10),
        importance: "高",
        status: "検討中",
      },
      {
        projectId: p3.id,
        topic: "報酬フレームワーク適用範囲",
        background: "ディレクター層まで含めるかマネージャー層までかで意見が分かれている。",
        options: "1) マネージャー層まで\n2) ディレクター層まで含める",
        recommendation: "オプション2 — 一貫性のため全層に適用。",
        deadline: day(20),
        importance: "中",
        status: "未対応",
      },
      {
        projectId: p5.id,
        topic: "店舗ガイドライン整備の優先度判断",
        background: "リソース不足で停止中。新店舗オープン前に再開が必要だが、いつまでに?",
        recommendation: "新店舗オープン3ヶ月前(=10月)までに再開。",
        importance: "中",
        status: "未対応",
        deadline: day(40),
        impactIfDelayed: "新店舗の立ち上げ品質にばらつきが出るリスク。",
      },
    ],
  });

  // --- リスク ---
  await prisma.risk.createMany({
    data: [
      { projectId: p1.id, description: "テキサス州の建設許可が3週間遅延、オープン日への影響懸念", severity: "中", mitigation: "建設チームと週次で進捗確認、代替日程をスタンバイ", owner: "サンプルCOO", status: "対応中" },
      { projectId: p2.id, description: "IT部のSOC2レビュー遅延が継続、AIパイロット全体がブロック", severity: "高", mitigation: "CEOにエスカレ済、代替ベンダーも準備", owner: "サンプルCMO", status: "対応中" },
      { projectId: p2.id, description: "現場オペレーターのAIツール受容性が未検証", severity: "中", mitigation: "パイロット店舗で導入前ワークショップを実施", owner: "オペレーション部長", status: "未対応" },
      { projectId: p1.id, description: "ニューヨーク市場の家賃が想定より20%高く、予算超過リスク", severity: "高", mitigation: "立地を一部変更、テナント条件を再交渉", owner: "サンプルCFO", status: "対応中" },
      { projectId: p4.id, description: "日本本社からの返信が遅く、意思決定が滞る", severity: "中", mitigation: "本社CFOと2週間後に個別ミーティング設定", owner: "Chief of Staff", status: "対応中" },
    ],
  });

  // --- 更新履歴 ---
  await prisma.update.createMany({
    data: [
      { projectId: p1.id, date: day(-2), content: "建設許可レビューが3週間遅延と判明。代替日程を検討中。", nextAction: "建設チームと週次で進捗確認" },
      { projectId: p1.id, date: day(-9), content: "テキサス4店舗のうち3店舗で賃貸合意。1店舗は条件交渉継続。", nextAction: "残り1店舗の交渉を月末までに完了" },
      { projectId: p2.id, date: day(-1), content: "CEO 1on1でIT部レビュー遅延をエスカレーション済。条件付き承認の議論を依頼。", nextAction: "今週中にIT部と期限合意" },
      { projectId: p2.id, date: day(-7), content: "ベンダー選定完了。SOC2レビュー依頼を提出。", nextAction: "IT部の対応待ち" },
      { projectId: p3.id, date: day(-5), content: "外部コンサルとのベンチマーキング完了。ドラフト作成開始。", nextAction: "6/15までに報酬委員会に提出" },
      { projectId: p4.id, date: day(-3), content: "週次アジェンダのテンプレ設計完了。日本側と運用合意。", nextAction: "来週月曜から本格運用開始" },
    ],
  });

  // --- フォローアップ ---
  await prisma.followUp.createMany({
    data: [
      { title: "IT部長と SOC2 レビュースケジュール確認", who: "IT部長", dueDate: day(1), status: "未対応", memo: "CEO 1on1での合意事項。今週中に合意必要。" },
      { title: "CFOにテキサス代理人ミーティングのリマインド", who: "サンプルCFO", dueDate: day(2), status: "未対応" },
      { title: "報酬委員会の事前説明資料を確認", who: "人事部長", dueDate: day(4), status: "進行中" },
      { title: "本社CFOとの個別ミーティング日程確定", who: "日本本社CFO", dueDate: day(3), status: "進行中", memo: "CEO同席が望ましい" },
      { title: "店舗ガイドライン再開時期について経営層の判断確認", who: "サンプルCEO", dueDate: day(5), status: "未対応" },
      { title: "AI代替ベンダーの社内承認状況確認", who: "コンプライアンス部", dueDate: day(0), status: "進行中" },
      { title: "テキサス建設許可の根本原因確認", who: "建設チーム", dueDate: day(-1), status: "未対応", memo: "期限超過。今日中に確認。" },
    ],
  });

  console.log("シード完了。");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
