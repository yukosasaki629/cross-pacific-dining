"use client";
import { useTransition } from "react";
import { deleteMeeting } from "../actions";

export function DeleteMeetingButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-danger"
      disabled={pending}
      onClick={() => {
        if (!confirm("この会議と紐づくAI抽出履歴を削除します。元に戻せません。よろしいですか？")) return;
        start(async () => {
          await deleteMeeting(id);
        });
      }}
    >
      {pending ? "削除中…" : "削除"}
    </button>
  );
}
