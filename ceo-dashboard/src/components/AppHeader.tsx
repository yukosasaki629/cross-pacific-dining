import Link from "next/link";

export function AppHeader({
  title,
  subtitle,
  backHref,
  rightSlot,
  shareMode = false,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
  shareMode?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="戻る"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 active:bg-ink-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-ink-900">{title}</h1>
          {subtitle ? <p className="truncate text-[11px] text-ink-500">{subtitle}</p> : null}
        </div>
        {shareMode ? (
          <span className="pill bg-accent-50 text-accent-700">社長共有ビュー</span>
        ) : null}
        {rightSlot}
      </div>
    </header>
  );
}
