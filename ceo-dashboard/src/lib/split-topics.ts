// =============================================================================
// ChatGPT が「## 見出し」付きの Markdown でまとめた1on1 メモを
// トピック単位に厳密分割し、ラベルに応じて ⭐/📌 フラグも自動で付ける。
//
// 設計:
//   - 必ず `##`(または `###`)の行を境界とする
//   - 段落分割やパラグラフ抽出などのフォールバックは持たない
//   - `##` が無い場合は空配列を返す
//   - 各トピックには sensitivity を自動判定(機密キーワード検知)
//   - ChatGPT 出力に含まれるラベル(Risk: / Action: / 要判断: / TBD:)を
//     検知して、⭐重要 / 📌フォロー要 フラグも自動で立てる

export type TopicDraft = {
  title: string;
  content: string;
  suggestedCategory: "action" | "decision" | "risk" | "info" | "other";
  sensitivity: "general" | "board" | "compensation" | "executive_only";
  // ChatGPT 出力からの自動判定フラグ
  suggestedImportant: boolean;     // ⭐ 重要(リスク・判断系)
  suggestedFollowUp: boolean;      // 📌 フォロー要(アクション・判断系)
};

const SENSITIVITY_PATTERNS: { pat: RegExp; sensitivity: "board" | "compensation" | "executive_only" }[] = [
  { pat: /(報酬|給与|ボーナス|compensation|salary|bonus|Pearl Meyer|stock option|equity grant|STIC|STIP|LTIP)/i, sensitivity: "compensation" },
  { pat: /(取締役会|監査委員会|報酬委員会|指名委員会|Board\b|audit committee|comp committee|nominating committee|proxy)/i, sensitivity: "board" },
  { pat: /(役員人事|幹部人事|解任|更迭|後任|termination|executive only|exec only|CFO候補|CFO search|successor|C-suite hiring|reconsideration|Sharaz|Martin Fagget|kickback)/i, sensitivity: "executive_only" },
];

export function splitIntoTopics(rawNotes: string): TopicDraft[] {
  const lines = rawNotes.split(/\r?\n/);

  // ## または ### の行を境界として収集
  const boundaries: { line: number; heading: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (m) boundaries.push({ line: i, heading: m[2].trim() });
  }

  if (boundaries.length === 0) return [];

  const topics: TopicDraft[] = [];
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].line + 1;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
    const heading = cleanHeading(boundaries[i].heading);
    const body = lines.slice(start, end).join("\n").trim();
    if (!heading && !body) continue;
    topics.push(buildDraft(heading || "(無題)", body));
  }

  return topics;
}

function cleanHeading(h: string): string {
  return h
    .replace(/^\d+(-\d+)?\.\s*/, "") // "1-2. " 削除
    .replace(/\*\*/g, "")
    .trim();
}

function buildDraft(title: string, content: string): TopicDraft {
  const fullText = `${title}\n${content}`;

  // ChatGPT 出力のラベル検知
  const hasActionLabel = /(^|\n|\s)Action\s*[:::]/i.test(content);
  const hasRiskLabel = /(^|\n|\s)Risk\s*[:::]/i.test(content);
  const hasDecisionNeededLabel = /(^|\n|\s)(要判断|TBD|Pending)\s*[:::]/i.test(content);
  const hasDecisionMadeLabel = /(^|\n|\s)(Decision|決定)\s*[:::]/i.test(content);
  const hasFollowUpLabel = /(^|\n|\s)(Follow[ -]?up|フォロー)\s*[:::]/i.test(content);

  // カテゴリ自動判定(優先順位:risk → decision → action → info)
  let suggestedCategory: TopicDraft["suggestedCategory"] = "info";
  if (hasRiskLabel) suggestedCategory = "risk";
  else if (hasDecisionNeededLabel || hasDecisionMadeLabel) suggestedCategory = "decision";
  else if (hasActionLabel || hasFollowUpLabel) suggestedCategory = "action";

  // ⭐重要フラグ:リスク or 判断系
  const suggestedImportant = hasRiskLabel || hasDecisionNeededLabel;

  // 📌フォロー要フラグ:アクション or 判断待ち(誰かを追う必要がある)
  const suggestedFollowUp = hasActionLabel || hasDecisionNeededLabel || hasFollowUpLabel;

  // 機密判定
  let sensitivity: TopicDraft["sensitivity"] = "general";
  for (const { pat, sensitivity: s } of SENSITIVITY_PATTERNS) {
    if (pat.test(fullText)) {
      sensitivity = s;
      break;
    }
  }

  return {
    title,
    content,
    suggestedCategory,
    sensitivity,
    suggestedImportant,
    suggestedFollowUp,
  };
}
