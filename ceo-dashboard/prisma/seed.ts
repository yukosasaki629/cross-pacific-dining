// 仮データのシード。
// visibility / sensitivity の運用例も含む:
//  - 大半のレコードは visibility="internal"(優子のみ)
//  - 共有対象は明示的に visibility="ceo_shared" を立てる
//  - Board / Compensation / Executive Only 系は sensitivity を立てて、
//    visibility が ceo_shared でも自動除外されることを示す
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const day = (n: number) => new Date(Date.now() + n * 86400000);

// 漏れたら明確に分かるよう、機密データには「[漏洩検知]」を入れておく。
// /share および /report に「[漏洩検知]」が出てきたらバグ。
const LEAK_CANARY = "[漏洩検知]";

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
      privateMemo: `${LEAK_CANARY} テキサスの代理人とは関係再構築が必要。CFOが個別ミーティングを希望していたが、まだ実現していない。`,
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
      privateMemo: `${LEAK_CANARY} IT部長との関係調整が必要。次のCEO 1on1で別案として代替ベンダー(社内承認済リスト)も提示する想定。`,
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
      privateMemo: `${LEAK_CANARY} 本社CFOからの返信が依然として遅い。CEO同席のミーティングを2週間後に設定済み。`,
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
      isSharedWithCEO: false,  // ← プロジェクト全体を共有しない例
      privateMemo: `${LEAK_CANARY} リソース不足で再開時期が見えない。CEOから優先度の判断が欲しい。`,
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

  // --- 意思決定 ---
  // visibility と sensitivity を意図的に多様にしてフィルタの効きを示す
  await prisma.decision.createMany({
    data: [
      {
        // ✓ 共有対象。CEOの判断が必要なので ceo_shared、機密区分は general
        projectId: p2.id,
        topic: "AIベンダーの承認(条件付き先行)",
        background: "IT部のSOC2レビューが3週間遅延中。CEOは前進を希望。",
        options: "1) ITレビュー完了を待つ\n2) 2週間以内にIT承認を取る条件付きで先行\n3) 社内承認済の代替ベンダーに切り替え",
        recommendation: "オプション2 — 条件付き承認で先行。ITに期限を明確化。",
        deadline: day(5),
        impactIfDelayed: "パイロットがさらに1四半期スリップ。AIロードマップ全体に影響。",
        importance: "高",
        status: "未対応",
        visibility: "ceo_shared",
        sensitivity: "general",
      },
      {
        // ✓ 共有対象
        projectId: p1.id,
        topic: "2026年テキサス州の最終立地リスト",
        background: "店舗工事チームが契約確定のため最終リストを要求。",
        options: "1) トップ6立地を全承認\n2) トップ4立地を承認、賃貸条件未確定の2件は保留",
        recommendation: "オプション2 — 確実な4件を先行、残り2件は来月確定。",
        deadline: day(10),
        importance: "高",
        status: "検討中",
        visibility: "ceo_shared",
        sensitivity: "general",
      },
      {
        // ✗ 共有除外 — sensitivity="compensation" のため、visibility 関係なく除外される
        projectId: p3.id,
        topic: `${LEAK_CANARY} 報酬フレームワーク適用範囲(取締役会向け検討)`,
        background: `${LEAK_CANARY} ディレクター層まで含めるかマネージャー層までかで意見が分かれている。具体的な金額レンジ・ベンダー試算結果あり。`,
        options: `${LEAK_CANARY} 機密金額レンジを含む詳細`,
        recommendation: `${LEAK_CANARY} 内部用推奨案`,
        deadline: day(20),
        importance: "中",
        status: "未対応",
        visibility: "ceo_shared",   // ← フラグは立っているが
        sensitivity: "compensation", // ← compensation は自動除外
      },
      {
        // ✗ 共有除外 — visibility="internal"
        projectId: p5.id,
        topic: "店舗ガイドライン整備の優先度判断(内部メモ)",
        background: "リソース不足で停止中。新店舗オープン前に再開が必要だが、いつまでに?",
        recommendation: "新店舗オープン3ヶ月前(=10月)までに再開。",
        importance: "中",
        status: "未対応",
        deadline: day(40),
        impactIfDelayed: "新店舗の立ち上げ品質にばらつきが出るリスク。",
        visibility: "internal",
        sensitivity: "general",
      },
      {
        // ✗ 共有除外 — sensitivity="board"
        projectId: null,
        topic: `${LEAK_CANARY} 取締役会への事前合意事項(機密)`,
        background: `${LEAK_CANARY} 内部用の取締役会調整メモ`,
        recommendation: `${LEAK_CANARY} 公開不可の推奨案`,
        importance: "高",
        status: "未対応",
        visibility: "ceo_shared",
        sensitivity: "board",  // ← board は自動除外
      },
      {
        // ✗ 共有除外 — sensitivity="executive_only"
        projectId: null,
        topic: `${LEAK_CANARY} エグゼクティブ限定の人事案件`,
        background: `${LEAK_CANARY} 特定エグゼクティブの異動を検討中`,
        recommendation: `${LEAK_CANARY} 機密推奨案`,
        importance: "高",
        status: "検討中",
        visibility: "ceo_shared",
        sensitivity: "executive_only",  // ← executive_only も除外
      },
    ],
  });

  // --- リスク ---
  await prisma.risk.createMany({
    data: [
      {
        projectId: p1.id,
        description: "テキサス州の建設許可が3週間遅延、オープン日への影響懸念",
        severity: "中",
        mitigation: "建設チームと週次で進捗確認、代替日程をスタンバイ",
        owner: "サンプルCOO",
        status: "対応中",
        visibility: "ceo_shared",
      },
      {
        projectId: p2.id,
        description: "IT部のSOC2レビュー遅延が継続、AIパイロット全体がブロック",
        severity: "高",
        mitigation: "CEOにエスカレ済、代替ベンダーも準備",
        owner: "サンプルCMO",
        status: "対応中",
        visibility: "ceo_shared",
      },
      {
        projectId: p2.id,
        description: `${LEAK_CANARY} 現場オペレーターのAIツール受容性が未検証(内部評価)`,
        severity: "中",
        mitigation: `${LEAK_CANARY} パイロット店舗で導入前ワークショップを実施`,
        owner: "オペレーション部長",
        status: "未対応",
        visibility: "internal",   // ← 内部のみ
      },
      {
        projectId: p1.id,
        description: "ニューヨーク市場の家賃が想定より20%高く、予算超過リスク",
        severity: "高",
        mitigation: "立地を一部変更、テナント条件を再交渉",
        owner: "サンプルCFO",
        status: "対応中",
        visibility: "ceo_shared",
      },
      {
        projectId: p4.id,
        description: `${LEAK_CANARY} 日本本社からの返信が遅く、意思決定が滞る(内部観察)`,
        severity: "中",
        mitigation: `${LEAK_CANARY} 本社CFOと2週間後に個別ミーティング設定`,
        owner: "Chief of Staff",
        status: "対応中",
        visibility: "internal",   // ← 内部のみ
      },
    ],
  });

  // --- 更新履歴 ---
  await prisma.update.createMany({
    data: [
      { projectId: p1.id, date: day(-2), content: "建設許可レビューが3週間遅延と判明。代替日程を検討中。", nextAction: "建設チームと週次で進捗確認", visibility: "ceo_shared" },
      { projectId: p1.id, date: day(-9), content: "テキサス4店舗のうち3店舗で賃貸合意。1店舗は条件交渉継続。", nextAction: "残り1店舗の交渉を月末までに完了", visibility: "ceo_shared" },
      { projectId: p2.id, date: day(-1), content: "CEO 1on1でIT部レビュー遅延をエスカレーション済。条件付き承認の議論を依頼。", nextAction: "今週中にIT部と期限合意", visibility: "ceo_shared" },
      { projectId: p2.id, date: day(-7), content: "ベンダー選定完了。SOC2レビュー依頼を提出。", nextAction: "IT部の対応待ち", visibility: "ceo_shared" },
      { projectId: p3.id, date: day(-5), content: `${LEAK_CANARY} 外部コンサルとのベンチマーキング完了、機密金額あり`, nextAction: `${LEAK_CANARY} 6/15までに報酬委員会に提出`, visibility: "internal" }, // ← 内部のみ
      { projectId: p4.id, date: day(-3), content: "週次アジェンダのテンプレ設計完了。日本側と運用合意。", nextAction: "来週月曜から本格運用開始", visibility: "ceo_shared" },
    ],
  });

  // --- フォローアップ ---
  await prisma.followUp.createMany({
    data: [
      { title: "IT部長と SOC2 レビュースケジュール確認", who: "IT部長", dueDate: day(1), status: "未対応", memo: "CEO 1on1での合意事項。今週中に合意必要。", visibility: "ceo_shared" },
      { title: "CFOにテキサス代理人ミーティングのリマインド", who: "サンプルCFO", dueDate: day(2), status: "未対応", visibility: "ceo_shared" },
      { title: `${LEAK_CANARY} 報酬委員会の事前説明資料を確認(機密)`, who: "人事部長", dueDate: day(4), status: "進行中", visibility: "internal" },
      { title: "本社CFOとの個別ミーティング日程確定", who: "日本本社CFO", dueDate: day(3), status: "進行中", memo: "CEO同席が望ましい", visibility: "ceo_shared" },
      { title: `${LEAK_CANARY} 店舗ガイドライン再開時期について経営層の判断確認(内部)`, who: "サンプルCEO", dueDate: day(5), status: "未対応", visibility: "internal" },
      { title: "AI代替ベンダーの社内承認状況確認", who: "コンプライアンス部", dueDate: day(0), status: "進行中", visibility: "ceo_shared" },
      { title: "テキサス建設許可の根本原因確認", who: "建設チーム", dueDate: day(-1), status: "未対応", memo: "期限超過。今日中に確認。", visibility: "ceo_shared" },
    ],
  });

  console.log("シード完了。");
  console.log("漏洩検知マーカー:[漏洩検知] — /share と /report に出てきたらバグ。");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
