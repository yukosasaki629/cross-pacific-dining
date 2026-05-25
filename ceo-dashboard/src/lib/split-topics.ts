// =============================================================================
// 1on1 メモを「トピック単位」に分割する
// =============================================================================
//
// 戦略:
//   ## または ### の見出しで分割し、各セクションを 1 つのトピック候補に。
//   - 見出しがあれば見出しを title、本文を content に
//   - 見出しがない場合は段落分割
//   - ユーザーはこのリストを見て、それぞれを ⭐重要 / 📌フォロー要 にトグルできる

export type TopicDraft = {
  title: string;
  content: string;
  suggestedCategory: "action" | "decision" | "risk" | "info" | "other";
  // 自動判定の参考としてキーワードのヒット情報
  hints: {
    hasDecisionKeyword: boolean;
    hasRiskKeyword: boolean;
    hasActionKeyword: boolean;
    hasQuestion: boolean;
    sensitivity: "general" | "board" | "compensation" | "executive_only";
  };
};

const SENSITIVITY_PATTERNS: { pat: RegExp; sensitivity: "board" | "compensation" | "executive_only" }[] = [
  { pat: /(報酬|給与|ボーナス|compensation|salary|bonus|Pearl Meyer|stock option|equity grant|STIC|STIP|LTIP)/i, sensitivity: "compensation" },
  { pat: /(取締役会|監査委員会|報酬委員会|指名委員会|Board\b|audit committee|comp committee|nominating committee|proxy)/i, sensitivity: "board" },
  { pat: /(役員人事|幹部人事|解任|更迭|後任|termination|executive only|exec only|CFO候補|CFO search|successor|C-suite hiring|reconsideration)/i, sensitivity: "executive_only" },
];

export function splitIntoTopics(rawNotes: string): TopicDraft[] {
  const lines = rawNotes.split(/\r?\n/);

  // 見出し位置を集める(H2, H3 を境界に。H1 はセクション全体のタイトル扱い)
  const boundaries: { line: number; heading: string; depth: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (m) boundaries.push({ line: i, heading: m[2].trim(), depth: m[1].length });
  }

  // H2/H3 がない場合は段落で分割
  if (boundaries.length === 0) {
    return splitByParagraph(rawNotes);
  }

  const topics: TopicDraft[] = [];
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].line + 1;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
    const heading = boundaries[i].heading;
    const body = lines.slice(start, end).join("\n").trim();
    if (!heading.trim() && !body.trim()) continue;

    topics.push(buildDraft(cleanHeading(heading), body));
  }

  return topics;
}

function splitByParagraph(text: string): TopicDraft[] {
  // 空行で段落分割
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith("|"));

  return paragraphs.map((p, idx) => {
    // 最初の1文を見出しに
    const firstSentence = p.split(/[。.!?]/)[0].trim().slice(0, 80);
    const rest = p.slice(firstSentence.length).replace(/^[。.!?]\s*/, "").trim();
    return buildDraft(firstSentence || `トピック${idx + 1}`, rest || p);
  });
}

function cleanHeading(h: string): string {
  return h
    .replace(/^\d+(-\d+)?\.\s*/, "") // "1-2. " 削除
    .replace(/\*\*/g, "")
    .trim();
}

function buildDraft(title: string, content: string): TopicDraft {
  const fullText = `${title}\n${content}`;
  const lower = fullText.toLowerCase();

  const hasDecision = /(decision[:：]|decided[:：]|agreed[:：]|approved[:：]|決定[:：]|合意した|承認した)/i.test(fullText);
  const hasRisk = /(risk[:：]|concern[:：]|blocker[:：]|issue[:：]|リスク[:::]?|懸念[:::]?|障害|ブロッカー|遅延|delay|behind schedule)/i.test(fullText);
  const hasAction = /(action[:：]|todo[:：]|next step|follow[ -]?up[:：]|アクション[:：]|TODO[:：]|やる[:::]?)/i.test(fullText);
  const hasQuestion = /[??]\s*$/m.test(content) || /(判断待ち|tbd|pending|要(?:確認|判断|決定|相談)|CEO判断|経営判断)/i.test(fullText);

  let sensitivity: "general" | "board" | "compensation" | "executive_only" = "general";
  for (const { pat, sensitivity: s } of SENSITIVITY_PATTERNS) {
    if (pat.test(fullText)) {
      sensitivity = s;
      break;
    }
  }

  // 自動カテゴリ提案(あくまで参考。ユーザーが確定)
  let suggestedCategory: TopicDraft["suggestedCategory"] = "info";
  if (hasQuestion) suggestedCategory = "decision";
  else if (hasRisk) suggestedCategory = "risk";
  else if (hasAction) suggestedCategory = "action";
  else if (hasDecision) suggestedCategory = "decision";

  return {
    title,
    content,
    suggestedCategory,
    hints: {
      hasDecisionKeyword: hasDecision,
      hasRiskKeyword: hasRisk,
      hasActionKeyword: hasAction,
      hasQuestion,
      sensitivity,
    },
  };
}
