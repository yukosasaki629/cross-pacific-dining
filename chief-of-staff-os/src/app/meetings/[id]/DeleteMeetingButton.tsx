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
        if (!confirm("Delete this meeting and all linked agent-output history? This cannot be undone.")) return;
        start(async () => {
          await deleteMeeting(id);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
