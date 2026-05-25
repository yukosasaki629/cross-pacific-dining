"use client";

import { useTransition } from "react";
import { deleteMeetingNote } from "../actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      className="btn-danger text-[12px]"
      onClick={() => {
        if (!confirm("この1on1メモを削除します。派生したレコードは残ります。")) return;
        start(async () => {
          await deleteMeetingNote(id);
        });
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}
