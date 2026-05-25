"use client";
import { useTransition } from "react";
import { deleteTranscript } from "../actions";

export function DeleteTranscriptButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("この文字起こしを削除します。紐づく会議・レコードは保持されます。よろしいですか？")) return;
        start(async () => {
          await deleteTranscript(id);
        });
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}
