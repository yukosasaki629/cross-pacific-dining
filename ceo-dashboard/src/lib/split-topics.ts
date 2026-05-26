// =============================================================================
// ChatGPT が「## 見出し」付きの Markdown でまとめた1on1 メモを
// トピック単位に厳密分割する。
//
// 設計:
//   - 必ず `##`(または `###`)の行を境界とする
//   - 段落分割やパラグラフ抽出などのフォールバックは持たない
//     (細かすぎる分割の暴走を防ぐため)
//   - `##` が無い場合は空配列を返す(UI 側でエラー表示)
//   - 各トピックには sensitivity を自動判定(機密キーワード検知)

export type TopicDraft = {
  title: string;
  content: string;
  suggestedCategory: "action" | "decision" | "risk" | "info" | "other";
  sensitivity: "general" | "board" | "compensation" | "executive_only";
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

  // ## が一つもなければ空配列(フォールバックなし)
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

  // カテゴリ自動提案(明示的ラベル優先)
  let suggestedCategory: TopicDraft["suggestedCategory"] = "info";
  if (/(action[:::]|アクション[:::])/i.test(fullText)) suggestedCategory = "action";
  else if (/(要判断|TBD|pending|判断待ち|要相談)/i.test(fullText)) suggestedCategory = "decision";
  else if (/(risk[:::]|リスク[:::]|懸念|blocker)/i.test(fullText)) suggestedCategory = "risk";
  else if (/(decision[:::]|決定[:::]|決定済|合意した|承認した)/i.test(fullText)) suggestedCategory = "decision";

  // 機密判定
  let sensitivity: TopicDraft["sensitivity"] = "general";
  for (const { pat, sensitivity: s } of SENSITIVITY_PATTERNS) {
    if (pat.test(fullText)) {
      sensitivity = s;
      break;
    }
  }

  return { title, content, suggestedCategory, sensitivity };
}
