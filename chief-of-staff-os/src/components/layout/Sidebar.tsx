import Link from "next/link";

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/weekly-brief", label: "Weekly Brief" },
      { href: "/timeline", label: "Intelligence Timeline" },
      { href: "/friction-map", label: "Friction Map" },
    ],
  },
  {
    group: "Capture",
    items: [
      { href: "/meetings", label: "Meetings" },
      { href: "/transcripts", label: "Transcripts" },
      { href: "/knowledge-base", label: "Knowledge Base" },
    ],
  },
  {
    group: "Tracking",
    items: [
      { href: "/priorities", label: "CEO Priorities" },
      { href: "/actions", label: "Action Items" },
      { href: "/decisions", label: "Decision Log" },
      { href: "/decisions-needed", label: "Decisions Needed" },
      { href: "/projects", label: "Projects" },
    ],
  },
  {
    group: "System",
    items: [{ href: "/settings", label: "Settings" }],
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
        <div className="mt-1 text-[11px] text-ink-400">Local · Private · Auditable</div>
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
