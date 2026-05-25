// =============================================================================
// 一括メモを担当者ごとのセクションに分割
// =============================================================================
//
// 入力例:
//   # 5/15 CEO 1on1 週次詳細サマリー
//   ## 今週の全体感
//   # 1. COO / Sean：売上、店舗実行
//   ## 1-1. 5月売上...
//   # 2. VP of Marketing：FY27 Vision
//   ## 2-1. ...
//   # 3. Finance / Bob：Vena
//   ...
//
// 出力: 担当者ごとに分けた本文セクション群

export type PersonHint = {
  id: string;
  name: string;
  role: string | null;
};

export type Section = {
  index: number;        // 検出順
  heading: string;      // 見出しテキスト
  body: string;         // セクション本文(見出し含む)
  matchedPersonId: string | null;  // 自動マッチした担当者ID
  matchReason: string;  // なぜマッチした/しなかったか
};

// 役職キーワード → role 値(seed の Person.role と照合)
const ROLE_KEYWORDS: { keyword: string; role: string }[] = [
  // 英語役職
  { keyword: "CEO", role: "CEO" },
  { keyword: "CFO", role: "CFO" },
  { keyword: "COO", role: "COO" },
  { keyword: "CMO", role: "CMO" },
  { keyword: "CTO", role: "CTO" },
  { keyword: "CPO", role: "CPO" },
  { keyword: "VP of Marketing", role: "CMO" },
  { keyword: "VP Marketing", role: "CMO" },
  { keyword: "Chief People Officer", role: "CPO" },
  { keyword: "Chief Marketing", role: "CMO" },
  { keyword: "Chief Financial", role: "CFO" },
  { keyword: "Chief Operating", role: "COO" },
  { keyword: "Chief Technology", role: "CTO" },
  // 日本語役職
  { keyword: "社長", role: "CEO" },
  { keyword: "IT部長", role: "IT 部長" },
  { keyword: "人事部長", role: "HR 部長" },
  { keyword: "オペレーション部長", role: "Operations 部長" },
  { keyword: "オペレーション", role: "COO" }, // Operations の話題
  // 役職以外の語(直接 role には対応しないが、auto-match を頑張りすぎないため除外)
];

export function splitSectionsByPerson(text: string, people: PersonHint[]): Section[] {
  const lines = text.split(/\r?\n/);
  // H1 のみで分割(H2/H3 はサブセクションとして含める)
  const h1Lines: { lineNo: number; heading: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/);
    if (m) {
      h1Lines.push({ lineNo: i, heading: m[1].trim() });
    }
  }

  // H1 がない場合は全文を1セクションとして返す
  if (h1Lines.length === 0) {
    const match = matchPerson(text.slice(0, 200), people);
    return [
      {
        index: 0,
        heading: lines.find((l) => l.trim())?.slice(0, 60) ?? "(無題)",
        body: text,
        matchedPersonId: match?.id ?? null,
        matchReason: match?.reason ?? "見出しが見つかりません。担当者を手動で選択してください。",
      },
    ];
  }

  const sections: Section[] = [];
  for (let i = 0; i < h1Lines.length; i++) {
    const start = h1Lines[i].lineNo;
    const end = i + 1 < h1Lines.length ? h1Lines[i + 1].lineNo : lines.length;
    const body = lines.slice(start, end).join("\n").trim();
    const match = matchPerson(h1Lines[i].heading, people);
    sections.push({
      index: i,
      heading: h1Lines[i].heading,
      body,
      matchedPersonId: match?.id ?? null,
      matchReason: match?.reason ?? "担当者を自動検出できませんでした。手動で選択してください。",
    });
  }

  return sections;
}

function matchPerson(heading: string, people: PersonHint[]): { id: string; reason: string } | null {
  // 1. Person.name の部分一致を最優先(複数候補があれば、見出しでの位置が最も左のものを採用)
  let bestName: { person: PersonHint; pos: number } | null = null;
  for (const p of people) {
    const pos = heading.indexOf(p.name);
    if (pos >= 0 && (!bestName || pos < bestName.pos)) {
      bestName = { person: p, pos };
    }
  }
  if (bestName) {
    return { id: bestName.person.id, reason: `名前「${bestName.person.name}」が見出しに含まれる` };
  }
  // 2. 役職キーワードのマッチ(長いキーワードを優先 = より具体的な役職を優先)
  // 「Chief People Officer / Arlene:CFO候補」のような見出しでは「Chief People Officer」を取りたい
  const sortedRoles = [...ROLE_KEYWORDS].sort((a, b) => b.keyword.length - a.keyword.length);
  let bestRole: { keyword: string; role: string; pos: number } | null = null;
  for (const { keyword, role } of sortedRoles) {
    const pos = heading.indexOf(keyword);
    if (pos >= 0) {
      // 既存のマッチがない、または より左にある場合に更新
      if (!bestRole || pos < bestRole.pos) {
        bestRole = { keyword, role, pos };
      }
    }
  }
  if (bestRole) {
    const target = people.find((p) => p.role === bestRole!.role);
    if (target) {
      return { id: target.id, reason: `役職「${bestRole.keyword}」→ ${target.name}` };
    }
    // ロールキーワードはあるが、該当する Person が未登録
    return null;
  }
  return null;
}
