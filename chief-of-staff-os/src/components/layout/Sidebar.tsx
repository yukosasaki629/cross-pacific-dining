import Link from "next/link";

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  {
    group: "概要",
    items: [
      { href: "/", label: "ダッシュボード" },
      { href: "/weekly-brief", label: "週次ブリーフ" },
      { href: "/timeline", label: "インテリジェンス・タイムライン" },
      { href: "/friction-map", label: "組織課題マップ" },
    ],
  },
  {
    group: "記録",
    items: [
      { href: "/meetings", label: "会議メモ" },
      { href: "/transcripts", label: "文字起こし" },
      { href: "/knowledge-base", label: "ナレッジベース" },
    ],
  },
  {
    group: "管理",
    items: [
      { href: "/priorities", label: "CEO 優先事項" },
      { href: "/actions", label: "アクションアイテム" },
      { href: "/decisions", label: "意思決定ログ" },
      { href: "/decisions-needed", label: "判断待ち事項" },
      { href: "/projects", label: "プロジェクト" },
    ],
  },
  {
    group: "システム",
    items: [{ href: "/settings", label: "設定" }],
  },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-ink-200 bg-white">
      <div className="px-5 pb-6 pt-7">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
          Executive Operating System
        </div>
        <div className="mt-1 font-serif text-xl text-ink-900">Chief of Staff</div>
        <div className="mt-1 text-[11px] text-ink-400">ローカル・プライベート・監査可能</div>
      </div>
      <nav className="px-3 pb-8">
        {NAV.map((g) => (
          <div key={g.group} className="mb-5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              {g.group}
            </div>
            <ul>
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className="block rounded px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
