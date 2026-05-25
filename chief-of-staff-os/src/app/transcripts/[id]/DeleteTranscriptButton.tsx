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
        if (!confirm("Delete this transcript? Linked meeting/records will be preserved.")) return;
        start(async () => {
          await deleteTranscript(id);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
