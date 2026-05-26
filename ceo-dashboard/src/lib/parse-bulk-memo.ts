// =============================================================================
// 「自然な日本語フォーマット」の1on1メモを自動パース
// =============================================================================
//
// 想定フォーマット:
//
//   4/28 と 5/11 の1on1ノート(任意のヘッダー)
//
//   Arlene                       ← 人名(単独行・既存Personと一致)
//
//   CFO探し                       ← 話題名(短い・句点で終わらない)
//
//   5/11の週に2人の面接予定。     ← 内容(長め or 句点で終わる)
//   60日間は人材会社を使わずに探す予定。
//
//   Account Payable ポジション   ← 次の話題
//
//   FY25から必要だったポジション...
//
//   Sean                          ← 次の人
//
//   Monthly Other Cost Meeting
//   ...
//
// 検出ロジック:
//   - 単独行で「登録済みのPerson名と完全一致」 → 新しい人セクション
//   - 単独行・50字以内・句点(。.!?)で終わらない・箇条書きでない → 話題名
//   - それ以外 → 直前の話題の本文に追加
// =============================================================================

type PersonHint = { id: string; name: string; role: string | null };

export type ParsedTopic = {
  title: string;
  content: string;
};

export type ParsedSection = {
  personId: string;
  personName: string;
  personRole: string | null;
  topics: ParsedTopic[];
};

export type ParseBulkResult = {
  sections: ParsedSection[];
  preamble: string;       // 最初の人名より前にあった「ヘッダー」テキスト
  unassigned: string[];   // どこにも振り分けられなかった行
};

export function parseBulkMemo(text: string, people: PersonHint[]): ParseBulkResult {
  const lines = text.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  const preambleLines: string[] = [];
  const unassigned: string[] = [];

  let currentSection: ParsedSection | null = null;
  let currentTopic: ParsedTopic | null = null;
  let prevBlank = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      prevBlank = true;
      continue;
    }

    // 1. 既存Personの名前と完全一致 → 新しい人セクション
    const matched = matchPersonExact(line, people);
    if (matched) {
      currentSection = {
        personId: matched.id,
        personName: matched.name,
        personRole: matched.role,
        topics: [],
      };
      sections.push(currentSection);
      currentTopic = null;
      prevBlank = false;
      continue;
    }

    // 2. 話題名らしいか(短い・句点なし・箇条書きでない、かつ直前が空行で人セクション内)
    if (currentSection && prevBlank && looksLikeTopicTitle(line)) {
      currentTopic = { title: line, content: "" };
      currentSection.topics.push(currentTopic);
      prevBlank = false;
      continue;
    }

    // 3. 内容 → 現在の話題に追加
    if (currentTopic) {
      currentTopic.content += (currentTopic.content ? "\n" : "") + line;
    } else if (currentSection) {
      // 人セクションは始まったが話題タイトルがまだ無いケース
      // → ダミー話題「全般」を作って投入(あとでユーザーが分割可)
      if (!currentTopic) {
        currentTopic = { title: "全般", content: line };
        currentSection.topics.push(currentTopic);
      }
    } else {
      // 人セクションが始まる前のヘッダー行
      preambleLines.push(line);
    }
    prevBlank = false;
  }

  return {
    sections,
    preamble: preambleLines.join("\n"),
    unassigned,
  };
}

// 行が登録済みPerson名と完全一致するか
function matchPersonExact(line: string, people: PersonHint[]): PersonHint | null {
  for (const p of people) {
    // 厳密一致
    if (line === p.name) return p;
    // 「Sean / COO」「Sean(COO)」のような表記も許容
    if (
      line.startsWith(`${p.name} `) ||
      line.startsWith(`${p.name}/`) ||
      line.startsWith(`${p.name}(`) ||
      line.startsWith(`${p.name}(`)
    ) {
      return p;
    }
  }
  return null;
}

// 話題名らしいか
function looksLikeTopicTitle(line: string): boolean {
  if (line.length > 50) return false;
  // 箇条書きマーカー
  if (/^[-*・▪︎•]/.test(line)) return false;
  // 番号付きリスト
  if (/^\d+[\.\)]/.test(line)) return false;
  // 句点で終わる文章
  if (/[。.!?:;]\s*$/.test(line)) return false;
  // 日付らしい行(4/28 のような)
  if (/^\d{1,2}\/\d{1,2}/.test(line)) return false;
  // 「-」で始まる引用
  if (/^>/.test(line)) return false;
  return true;
}
