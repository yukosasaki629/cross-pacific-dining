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
const SENSITIVITY_KEYWORDS: { keywords: string[]; sensitivity: Sensitivity }[] = [
  {
    keywords: ["報酬", "給与", "ボーナス", "コンペンセーション", "compensation", "ストックオプション", "SO付与"],
    sensitivity: "compensation",
  },
  {
    keywords: ["取締役会", "ボード", "board meeting", "監査委員会"],
    sensitivity: "board",
  },
  {
    keywords: ["役員人事", "幹部人事", "解任", "更迭", "後任", "executive only", "極秘"],
    sensitivity: "executive_only",
  },
];

// アクションを示すキーワード(本文行に含まれていればアクション候補)
const ACTION_KEYWORDS = [
  "アクション:", "Action:", "ACTION:",
  "TODO:", "todo:", "やる:",
  "次のステップ", "次のアクション", "次は",
  "対応する", "対応してもらう", "対応依頼",
  "確認する", "確認してもらう", "確認依頼",
  "送る", "送付", "提出する",
  "用意する", "準備する", "ドラフトする",
  "依頼する", "依頼を出す",
  "〜まで", "までに",
];

// 決定済を示すキーワード
const DECISION_MADE_KEYWORDS = [
  "決定:", "決まった", "決めた", "決定済",
  "合意した", "承認した", "承認済",
  "GO", "ゴー判断", "進めることに",
  "ストップ", "中止する",
];

// 判断待ちを示すキーワード
const DECISION_NEEDED_KEYWORDS = [
  "判断が必要", "判断待ち", "決めて欲しい", "決めて頂きたい",
  "確認したい", "確認お願い",
  "CEO判断", "上長判断", "経営判断",
  "保留", "TBD", "未定", "ペンディング", "pending",
];

// リスク・障害を示すキーワード
const RISK_KEYWORDS = [
  "リスク", "懸念", "心配",
  "問題", "課題", "issue",
  "ブロッカー", "ブロック", "blocker",
  "遅延", "遅れ", "delay",
  "障害", "止まっている",
  "失敗", "うまくいかない",
];

// 優先度上昇キーワード
const PRIORITY_UP_KEYWORDS = ["最優先", "最重要", "緊急", "急ぐ", "今すぐ", "最も大事"];

// 優先度低下キーワード
const PRIORITY_DOWN_KEYWORDS = ["後回し", "急がない", "保留にする", "優先度下げ", "ペンディング"];

// 完了キーワード
const STATUS_DONE_KEYWORDS = ["完了した", "終わった", "クローズ", "完結"];

// 担当者ヒント
const OWNER_PATTERNS = [
  /担当[:：]\s*([^\s、。,]+)/,
  /Owner[:：]\s*([^\s、。,]+)/i,
  /(?:を|に)\s*([A-Z]{2,5}|[一-龥ぁ-んァ-ヶー]+(?:部長|室長|本部長|マネージャー|さん|社長|CEO|CFO|COO|CMO))(?:に)?(?:依頼|お願い|送付|送る|確認|対応)/,
];

// 期限ヒント
const DUE_PATTERNS = [
  /(\d{1,2}\/\d{1,2})/,
  /(\d{1,2}月\d{1,2}日)/,
  /(今週中|来週中|今月中|来月中|今日中|明日まで|今週金曜|月末|週末|EOW|EOM|ASAP)/,
];

// ----- メイン抽出関数 --------------------------------------------------------

export function extractFromMeetingNote(
  rawNotes: string,
  knownProjects: { id: string; name: string }[] = [],
): Extraction {
  const lines = rawNotes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // サマリー: 最初の2-3行を要約として取り出す
  const summary = lines.slice(0, 3).join(" ").slice(0, 240);

  const actions: ExtractedAction[] = [];
  const decisionsMade: ExtractedDecision[] = [];
  const decisionsNeeded: ExtractedDecision[] = [];
  const risks: ExtractedRisk[] = [];
  const followUps: ExtractedFollowUp[] = [];
  const prioritySuggestions: PrioritySuggestion[] = [];
  const detectedSensitiveTopics = new Set<string>();

  for (const line of lines) {
    // 機密キーワード検出
    for (const { keywords, sensitivity } of SENSITIVITY_KEYWORDS) {
      for (const kw of keywords) {
        if (line.includes(kw)) {
          detectedSensitiveTopics.add(`${kw} (${sensitivity})`);
        }
      }
    }

    // 行ごとに分類
    const matchedProject = matchProject(line, knownProjects);
    const owner = detectOwner(line);
    const dueHint = detectDueHint(line);
    const lineSensitivity = detectSensitivity(line);
    const importance = detectImportance(line);

    // 1. 決定済?
    if (DECISION_MADE_KEYWORDS.some((kw) => line.includes(kw))) {
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

    // 2. 判断待ち?
    if (DECISION_NEEDED_KEYWORDS.some((kw) => line.includes(kw)) || /[??]$/.test(line)) {
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

    // 3. リスク?
    if (RISK_KEYWORDS.some((kw) => line.includes(kw))) {
      risks.push({
        description: cleanLine(line),
        severity: importance,
        projectName: matchedProject,
      });
      continue;
    }

    // 4. アクション?
    if (ACTION_KEYWORDS.some((kw) => line.includes(kw)) || isImperative(line)) {
      const task: ExtractedAction = {
        title: cleanLine(line),
        owner,
        dueHint,
        priority: importance,
        projectName: matchedProject,
      };
      // CEOに関する依頼は FollowUp に振る
      if (owner && /CEO|社長/i.test(owner)) {
        followUps.push({ title: task.title, who: owner, dueHint });
      } else {
        actions.push(task);
      }
      continue;
    }

    // 5. 優先度・ステータス変更のサジェスト
    if (matchedProject) {
      if (PRIORITY_UP_KEYWORDS.some((kw) => line.includes(kw))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newPriority: "高",
          reason: `「${truncate(line, 60)}」より、優先度を「高」に上げることを提案`,
        });
      } else if (PRIORITY_DOWN_KEYWORDS.some((kw) => line.includes(kw))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newPriority: "低",
          reason: `「${truncate(line, 60)}」より、優先度を「低」に下げることを提案`,
        });
      } else if (STATUS_DONE_KEYWORDS.some((kw) => line.includes(kw))) {
        prioritySuggestions.push({
          projectName: matchedProject,
          newStatus: "完了",
          reason: `「${truncate(line, 60)}」より、ステータスを「完了」にすることを提案`,
        });
      } else if (line.includes("遅延") || line.includes("遅れ")) {
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
  for (const { keywords, sensitivity } of SENSITIVITY_KEYWORDS) {
    if (keywords.some((kw) => line.includes(kw))) return sensitivity;
  }
  return "general";
}

function detectImportance(line: string): "高" | "中" | "低" {
  if (PRIORITY_UP_KEYWORDS.some((kw) => line.includes(kw))) return "高";
  if (PRIORITY_DOWN_KEYWORDS.some((kw) => line.includes(kw))) return "低";
  if (line.includes("ASAP") || line.includes("緊急") || line.includes("今日中")) return "高";
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
