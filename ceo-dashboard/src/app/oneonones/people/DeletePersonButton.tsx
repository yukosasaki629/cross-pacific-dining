"use client";

import { useTransition } from "react";
import { deletePerson } from "../actions";

export function DeletePersonButton({
  id,
  name,
  meetingCount,
}: {
  id: string;
  name: string;
  meetingCount: number;
}) {
  const [pending, start] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const msg =
      meetingCount > 0
        ? `「${name}」と、紐づく 1on1 ${meetingCount}件 + そこから派生したアクション・判断・リスクを全て削除します。よろしいですか?`
        : `「${name}」を削除します。よろしいですか?`;
    if (!confirm(msg)) return;
    start(async () => {
      await deletePerson(id);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-label={`${name} を削除`}
      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-bad-600/30 text-bad-700 hover:bg-bad-50 active:scale-95 disabled:opacity-50"
    >
      {pending ? (
        <span className="text-[10px]">…</span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      )}
    </button>
  );
}
