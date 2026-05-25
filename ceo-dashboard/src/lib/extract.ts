// =============================================================================
// 1on1 メモからの構造化抽出(ローカル・ルールベース、外部AI不要)
// =============================================================================
//
// 設計:
//  - 出力は常に「提案」。人が /oneonones/[id] でレビューして「適用」したら
//    実テーブル(Task/Decision/Risk/FollowUp)に書き込まれる
//  - 機密キーワード(報酬・取締役会・役員人事 等)を含む項目は
//    自動的に sensitivity を立て、/share から除外される側に倒す
//  - 既存プロジェクト名が本文に出てきたら、その項目をプロジェクトに紐付け
//  - 優先度変更のサジェスト(最優先 / 後回し 等)も出すが、自動適用はしない
// =============================================================================

import type { Sensitivity } from "./share-filters";
import { generateSummary } from "./summary";

export type ExtractedAction = {
  title: string;
  owner: string | null;
  dueHint: string | null;
  priority: "高" | "中" | "低";
  projectName: string | null;
};

export type ExtractedDecision = {
  topic: string;
  decisionType: "made" | "needed";  // 決定済 or 判断待ち
  importance: "高" | "中" | "低";
  recommendation: string | null;
  sensitivity: Sensitivity;
  projectName: string | null;
};

export type ExtractedRisk = {
  description: string;
  severity: "高" | "中" | "低";
  projectName: string | null;
};

export type ExtractedFollowUp = {
  title: string;
  who: string | null;
  dueHint: string | null;
};

export type PrioritySuggestion = {
  projectName: string;
  newPriority?: "高" | "中" | "低";
  newStatus?: "順調" | "注意" | "遅延" | "停止中" | "完了";
  reason: string;
};

export type Extraction = {
  summary: string;
  actions: ExtractedAction[];
  decisionsMade: ExtractedDecision[];
  decisionsNeeded: ExtractedDecision[];
  risks: ExtractedRisk[];
  followUps: ExtractedFollowUp[];
  prioritySuggestions: PrioritySuggestion[];
  detectedSensitiveTopics: string[];  // UIに警告を出すため
};

// ----- キーワード辞書 ----------------------------------------------------

// 機密判定。これらが含まれていたら sensitivity を立てる(/share 除外側)
// 日本語・英語の両方に対応
const SENSITIVITY_KEYWORDS: { keywords: string[]; sensitivity: Sensitivity }[] = [
  {
    keywords: [
      "報酬", "給与", "ボーナス", "コンペンセーション", "ストックオプション", "SO付与",
      "compensation", "salary", "bonus", "stock option", "equity grant", "pay raise",
    ],
    sensitivity: "compensation",
  },
  {
    keywords: [
      "取締役会", "ボード", "監査委員会", "報酬委員会", "指名委員会",
      "board meeting", "board of directors", "audit committee", "comp committee", "nominating committee",
    ],
    sensitivity: "board",
  },
  {
    keywords: [
      "役員人事", "幹部人事", "解任", "更迭", "後任", "極秘",
      "executive only", "exec only", "confidential", "personnel matter", "termination", "successor", "C-suite hiring",
    ],
    sensitivity: "executive_only",
  },
];

// アクションを示すキーワード(日本語・英語両対応)
const ACTION_KEYWORDS = [
  // 日本語
  "アクション:", "TODO:", "todo:", "やる:",
  "次のステップ", "次のアクション", "次は",
  "対応する", "対応してもらう", "対応依頼",
  "確認する", "確認してもらう", "確認依頼",
  "送る", "送付", "提出する",
  "用意する", "準備する", "ドラフトする",
  "依頼する", "依頼を出す",
  "までに",
  // 英語
  "Action:", "ACTION:", "action item:",
  "To do:", "To-do:", "Next step:", "Next steps:", "Follow up:", "Follow-up:",
  "will follow up", "will send", "will draft", "will prepare", "will check",
  "needs to", "need to", "should ", "must ",
  "going to send", "going to draft", "going to confirm",
  "by EOD", "by EOW", "by EOM", "by next week", "by Friday", "by end of",
];

// 決定済(Decision Made)
const DECISION_MADE_KEYWORDS = [
  // 日本語
  "決定:", "決まった", "決めた", "決定済",
  "合意した", "承認した", "承認済",
  "GO判断", "ゴー判断", "進めることに",
  "ストップ", "中止する",
  // 英語
  "Decision:", "Decided:", "Agreed:", "Approved:",
  "we decided", "we agreed", "we approved", "we will go with",
  "approved by", "decided to", "agreed to",
  "go ahead", "moving forward with",
];

// 判断待ち(Decision Needed)
const DECISION_NEEDED_KEYWORDS = [
  // 日本語
  "判断が必要", "判断待ち", "決めて欲しい", "決めて頂きたい",
  "確認したい", "確認お願い",
  "CEO判断", "上長判断", "経営判断",
  "保留", "未定", "ペンディング",
  // 英語
  "TBD", "tbd", "Pending", "PENDING", "pending",
  "Open question:", "Question:",
  "need to decide", "need a decision", "needs your call",
  "awaiting decision", "awaiting CEO", "for your approval", "for CEO approval",
  "on hold",
];

// リスク・障害(日英)
const RISK_KEYWORDS = [
  // 日本語
  "リスク", "懸念", "心配",
  "問題", "課題",
  "ブロッカー", "ブロック",
  "遅延", "遅れ",
  "障害", "止まっている",
  "失敗", "うまくいかない",
  // 英語
  "Risk:", "RISK:", "risk that",
  "Concern:", "concerned about",
  "Issue:", "issue with",
  "Blocker:", "blocker", "blocked by", "blocking",
  "Delay", "delayed", "behind schedule", "slipping",
  "at risk",
];

// 優先度上昇(日英)
const PRIORITY_UP_KEYWORDS = [
  "最優先", "最重要", "緊急", "急ぐ", "今すぐ", "最も大事",
  "top priority", "highest priority", "urgent", "ASAP", "asap", "critical",
];

// 優先度低下(日英)
const PRIORITY_DOWN_KEYWORDS = [
  "後回し", "急がない", "保留にする", "優先度下げ", "ペンディング",
  "deprioritize", "low priority", "deferred", "on hold", "back burner",
];

// 完了キーワード(日英)
const STATUS_DONE_KEYWORDS = [
  "完了した", "終わった", "クローズ", "完結",
  "completed", "done", "closed", "wrapped up", "shipped",
];

// 担当者ヒント(日英)
const OWNER_PATTERNS = [
  /担当[:：]\s*([^\s、。,]+)/,
  /Owner[:：]\s*([A-Za-z一-龥ぁ-んァ-ヶー]+(?:\s[A-Z][a-z]+)?)/i,
  /Assigned to[:：]\s*([A-Za-z一-龥ぁ-んァ-ヶー]+(?:\s[A-Z][a-z]+)?)/i,
  // 「(名前) will / to」形式 (英語)
  /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:will|to|is going to|needs? to|should)\b/,
  // 日本語の役職パターン
  /(?:を|に)\s*([A-Z]{2,5}|[一-龥ぁ-んァ-ヶー]+(?:部長|室長|本部長|マネージャー|さん|社長|CEO|CFO|COO|CMO|CTO))(?:に)?(?:依頼|お願い|送付|送る|確認|対応)/,
];

// 期限ヒント(日英)
const DUE_PATTERNS = [
  /(\d{1,2}\/\d{1,2})/,
  /(\d{1,2}月\d{1,2}日)/,
  /(今週中|来週中|今月中|来月中|今日中|明日まで|今週金曜|月末|週末)/,
  /(by\s+(?:EOD|EOW|EOM|end of (?:day|week|month)|next (?:week|Monday|Tuesday|Wednesday|Thursday|Friday)|(?:Monday|Tuesday|Wednesday|Thursday|Friday)|tomorrow|today))/i,
  /(?:by|until|due)\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})/i,
  /\b(ASAP|EOD|EOW|EOM)\b/,
];

// ----- メイン抽出関数 --------------------------------------------------------

// 抽出時の上限
const MAX_ITEM_LENGTH = 150; // この文字数を超える行はアクション/判断/リスクの候補にしない(説明文)
const MIN_ITEM_LENGTH = 8;   // 短すぎても無視

// 「明示的なマーカー」: これらが行頭にあれば、その分類は確実
const EXPLICIT_ACTION_PREFIXES = [
  /^Action[:：]/i, /^ACTION[:：]/, /^TODO[:：]/i, /^To[ -]?do[:：]/i,
  /^アクション[:：]/, /^やる[:：]/, /^宿題[:：]/, /^依頼[:：]/,
  /^次のアクション[:：]/, /^次のステップ[:：]/,
  /^Follow[ -]?up[:：]/i, /^フォロー(?:アップ)?[:：]/,
];
const EXPLICIT_DECISION_MADE_PREFIXES = [
  /^Decision[:：]/i, /^Decided[:：]/i, /^Approved[:：]/i, /^Agreed[:：]/i,
  /^決定[:：]/, /^合意[:：]/, /^承認[:：]/,
];
const EXPLICIT_DECISION_NEEDED_PREFIXES = [
  /^TBD\b/i, /^Pending\b/i, /^Open Question[:：]/i, /^Question[:：]/i,
  /^判断待ち[:：]?/, /^未定[:：]?/, /^ペンディング[:：]?/,
  /^要(?:確認|判断|決定|相談)[:：]?/, /^CEO判断[:：]?/, /^経営判断[:：]?/,
];
const EXPLICIT_RISK_PREFIXES = [
  /^Risk[:：]/i, /^Concern[:：]/i, /^Blocker[:：]/i, /^Issue[:：]/i,
  /^リスク[:：]/, /^懸念[:：]/, /^課題[:：]/, /^障害[:：]/, /^ブロッカー[:：]/,
];

// 行頭の箇条書き記号や番号を除いた本体を取得
function lineBody(line: string): string {
  return line.replace(/^[-*•・▪︎]\s+/, "").replace(/^\d+[\.\)]\s+/, "").trim();
}

// 行が長すぎる(=説明文)か?
function isTooLong(line: string): boolean {
  return lineBody(line).length > MAX_ITEM_LENGTH;
}

// 抽出に値する「明示的に書かれた」行か?
//   1. 行頭マーカー(Action: / TODO: / Decision: / ...)がある
//   2. ?? で終わる短い行(open question)
//   3. 短い箇条書き(`- 〜する。`)で命令形末尾
function hasExplicitMarker(line: string, prefixes: RegExp[]): boolean {
  const body = lineBody(line);
  return prefixes.some((p) => p.test(body));
}

export function extractFromMeetingNote(
  rawNotes: string,
  knownProjects: { id: string; name: string }[] = [],
): Extraction {
  const lines = rawNotes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 構造化要約(サブセクション + 各リードセンテンス)
  const summary = generateSummary(rawNotes, 600);

  const actions: ExtractedAction[] = [];
  const decisionsMade: ExtractedDecision[] = [];
  const decisionsNeeded: ExtractedDecision[] = [];
  const risks: ExtractedRisk[] = [];
  const followUps: ExtractedFollowUp[] = [];
  const prioritySuggestions: PrioritySuggestion[] = [];
  const detectedSensitiveTopics = new Set<string>();

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    // 機密キーワード検出は全行で(警告表示のため)
    for (const { keywords, sensitivity } of SENSITIVITY_KEYWORDS) {
      for (const kw of keywords) {
        if (lineLower.includes(kw.toLowerCase())) {
          detectedSensitiveTopics.add(`${kw} (${sensitivity})`);
        }
      }
    }

    // 見出し行(#, ##, ###) はスキップ
    if (/^#+\s+/.test(line)) continue;
    // テーブル / 区切り線スキップ
    if (line.startsWith("|") || line.startsWith("---")) continue;

    // 行ごとに分類
    const matchedProject = matchProject(line, knownProjects);
    const owner = detectOwner(line);
    const dueHint = detectDueHint(line);
    const lineSensitivity = detectSensitivity(line);
    const importance = detectImportance(line);
    const body = lineBody(line);
    const tooLong = isTooLong(line);
    const tooShort = body.length < MIN_ITEM_LENGTH;

    if (tooShort) continue;

    // 1. 決定済? — 明示的マーカー必須
    if (hasExplicitMarker(line, EXPLICIT_DECISION_MADE_PREFIXES)) {
      decisionsMade.push({
        topic: cleanLine(line),
        decisionType: "made",
        importance,
        recommendation: null,
        sensitivity: lineSensitivity,
        projectName: matchedProject,
      });
      continue;
    }

    // 2. 判断待ち? — 明示的マーカー、または短い ? で終わる行
    if (
      hasExplicitMarker(line, EXPLICIT_DECISION_NEEDED_PREFIXES) ||
      (!tooLong && /[??]\s*$/.test(body))
    ) {
      decisionsNeeded.push({
        topic: cleanLine(line),
        decisionType: "needed",
        importance,
        recommendation: null,
        sensitivity: lineSensitivity,
        projectName: matchedProject,
      });
      continue;
    }

    // 3. リスク? — 明示的マーカー必須(「懸念」「リスク」が地の文に含まれるだけでは取らない)
    if (hasExplicitMarker(line, EXPLICIT_RISK_PREFIXES)) {
      if (tooLong) continue; // 長過ぎる場合はスキップ
      risks.push({
        description: cleanLine(line),
        severity: importance,
        projectName: matchedProject,
      });
      continue;
    }

    // 4. アクション? — 明示的マーカー必須
    if (hasExplicitMarker(line, EXPLICIT_ACTION_PREFIXES)) {
      if (tooLong) continue;
      const task: ExtractedAction = {
        title: cleanLine(line),
        owner,
        dueHint,
        priority: importance,
        projectName: matchedProject,
      };
      if (owner && /CEO|社長/i.test(owner)) {
        followUps.push({ title: task.title, who: owner, dueHint });
      } else {
        actions.push(task);
      }
      continue;
    }

    // 5. 優先度・ステータス変更のサジェスト(短い行のみ)
    if (matchedProject && !tooLong) {
      if (PRIORITY_UP_KEYWORDS.some((kw) => lineLower.includes(kw.toLowerCase()))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newPriority: "高",
          reason: `「${truncate(line, 60)}」より、優先度を「高」に上げることを提案`,
        });
      } else if (PRIORITY_DOWN_KEYWORDS.some((kw) => lineLower.includes(kw.toLowerCase()))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newPriority: "低",
          reason: `「${truncate(line, 60)}」より、優先度を「低」に下げることを提案`,
        });
      } else if (STATUS_DONE_KEYWORDS.some((kw) => lineLower.includes(kw.toLowerCase()))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newStatus: "完了",
          reason: `「${truncate(line, 60)}」より、ステータスを「完了」にすることを提案`,
        });
      } else if (line.includes("遅延") || line.includes("遅れ") || lineLower.includes("delay") || lineLower.includes("behind schedule")) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newStatus: "遅延",
          reason: `「${truncate(line, 60)}」より、ステータスを「遅延」にすることを提案`,
        });
      }
    }
  }

  return {
    summary,
    actions,
    decisionsMade,
    decisionsNeeded,
    risks,
    followUps,
    prioritySuggestions,
    detectedSensitiveTopics: Array.from(detectedSensitiveTopics),
  };
}

// ----- ヘルパー --------------------------------------------------------------

function matchProject(line: string, projects: { id: string; name: string }[]): string | null {
  // プロジェクト名の主要トークンが含まれていればマッチ
  for (const p of projects) {
    if (line.includes(p.name)) return p.name;
    // プロジェクト名の主要キーワードでも判定
    const keywords = p.name.split(/[ 　・]/).filter((w) => w.length >= 3);
    for (const kw of keywords) {
      if (line.includes(kw)) return p.name;
    }
  }
  return null;
}

function detectOwner(line: string): string | null {
  for (const pat of OWNER_PATTERNS) {
    const m = line.match(pat);
    if (m && m[1]) return m[1];
  }
  return null;
}

function detectDueHint(line: string): string | null {
  for (const pat of DUE_PATTERNS) {
    const m = line.match(pat);
    if (m && m[1]) return m[1];
  }
  return null;
}

function detectSensitivity(line: string): Sensitivity {
  const lower = line.toLowerCase();
  for (const { keywords, sensitivity } of SENSITIVITY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return sensitivity;
  }
  return "general";
}

function detectImportance(line: string): "高" | "中" | "低" {
  const lower = line.toLowerCase();
  if (PRIORITY_UP_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "高";
  if (PRIORITY_DOWN_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return "低";
  if (lower.includes("asap") || line.includes("緊急") || line.includes("今日中") || lower.includes("urgent") || lower.includes("critical")) return "高";
  return "中";
}

function isImperative(line: string): boolean {
  return /(?:する|してください|してほしい|お願いします|やる|完了させる|提出する|送る)。?$/.test(line);
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-・▪︎*•]\s*/, "")
    .replace(/^(?:アクション|Action|TODO|todo|決定|判断|リスク|懸念)[:：]\s*/i, "")
    .trim();
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
