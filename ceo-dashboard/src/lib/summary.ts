// =============================================================================
// 1on1 メモから「読む価値のあるサマリー」を生成
// =============================================================================
//
// シンプルな先頭N行ではなく、構造化メモから:
//  - サブセクション見出し(##/###)を抽出
//  - 各サブセクションの最初の実質的な文を抽出
//  - 太字 + 番号付き要点
//  - 結論パラグラフ
// を組み合わせる
//
// 出力例:
//   主な論点:
//   ① 5月売上は想定より弱い — Seanとの会話では、5月の売上について…
//   ② Kura Reserveの実行品質に強い懸念 — 今週、CEOがかなり問題視…
//   ③ Kura Reserveは毎月実施、ただし期間は短縮
//   ④ ...

export function generateSummary(text: string, maxLen = 600): string {
  const lines = text.split(/\r?\n/);

  // セクション全体のタイトル(H1)
  const h1 = lines.find((l) => /^#\s+/.test(l));
  const titleStr = h1 ? cleanHeading(h1.replace(/^#+\s+/, "")) : null;

  // サブセクション(##, ###)とその直後の最初の意味ある文を集める
  type Pt = { topic: string; lead: string };
  const points: Pt[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^##\s+/.test(line) || /^###\s+/.test(line)) {
      const topic = cleanHeading(line.replace(/^#+\s+/, ""));
      const lead = firstContentSentence(lines, i + 1);
      if (topic) points.push({ topic, lead });
    }
  }

  // サブセクションが取れなかった場合は、本文を要約
  if (points.length === 0) {
    return summarizeFlatText(text, maxLen);
  }

  // サマリーを構築
  const out: string[] = [];
  if (titleStr) out.push(titleStr);

  const bullets: string[] = [];
  const max = Math.min(points.length, 8);
  for (let i = 0; i < max; i++) {
    const p = points[i];
    const num = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"][i];
    const lead = p.lead ? ` — ${p.lead}` : "";
    bullets.push(`${num} ${p.topic}${lead}`);
  }
  out.push(...bullets);

  let result = out.join("\n");
  if (result.length > maxLen) result = result.slice(0, maxLen - 1) + "…";
  return result;
}

// 見出しから番号などのノイズを除去
function cleanHeading(s: string): string {
  return s
    .replace(/^\d+(-\d+)?\.\s*/, "") // "1-2. " のような番号を削除
    .replace(/^第\d+章\s*/, "")
    .replace(/:.*$/, (m) => {
      // "Sean:売上、Kura Reserve" のような場合、コロン前の主語だけ残すか
      // 残すか迷うが、両方残した方が情報量多いのでそのまま
      return m;
    })
    .trim();
}

// 行 i 以降で「実質的な内容のある文」の最初を見つける
function firstContentSentence(lines: string[], startIdx: number): string {
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 30); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#")) break; // 次のセクションに到達
    if (line.startsWith("|")) continue; // テーブル行スキップ
    if (line.startsWith("---")) continue; // 区切り線スキップ
    if (line.startsWith(">")) continue; // 引用スキップ

    // 箇条書きから先頭文字を取り除く
    const cleaned = line.replace(/^[\-\*•・▪︎]\s*/, "").replace(/\*\*/g, "");
    if (cleaned.length < 8) continue;

    // 最初の文(日本語と英語の文末記号で区切る)
    const sent = cleaned.split(/[。.!?]/)[0];
    return truncate(sent.trim(), 120);
  }
  return "";
}

// 構造化されていない素のテキストの場合の要約
function summarizeFlatText(text: string, maxLen: number): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("---"));

  // 太字 / 重要マーク付きの箇条書きを優先
  const important = lines.filter((l) => /\*\*/.test(l) || /^[-*]\s+/.test(l)).slice(0, 5);
  const fallback = lines.slice(0, 5);
  const picked = important.length >= 3 ? important : fallback;

  return truncate(
    picked
      .map((l) => l.replace(/^[-*•・]\s*/, "").replace(/\*\*/g, ""))
      .join(" / "),
    maxLen,
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
