"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { upsertPerson } from "../actions";

export function EditPersonInline({
  id,
  name,
  role,
}: {
  id: string;
  name: string;
  role: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [n, setN] = useState(name);
  const [r, setR] = useState(role ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function save() {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("name", n);
    fd.append("role", r);
    start(async () => {
      await upsertPerson(fd);
      setOpen(false);
    });
  }

  function cancel() {
    setN(name);
    setR(role ?? "");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`${name} を編集`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 text-ink-600 hover:border-accent-600 hover:text-accent-700 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClose={cancel}
        onClick={(e) => {
          if (e.target === dialogRef.current) cancel();
        }}
        className="rounded-xl border border-ink-200 bg-white p-0 backdrop:bg-ink-900/30"
      >
        <div className="w-[90vw] max-w-md p-5">
          <h3 className="text-[14px] font-semibold text-ink-900">担当者を編集</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">名前</label>
              <input
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">役職</label>
              <input
                value={r}
                onChange={(e) => setR(e.target.value)}
                className="input"
                placeholder="例:COO, Director of Finance"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={cancel} className="btn">キャンセル</button>
            <button onClick={save} disabled={pending || !n.trim()} className="btn-primary">
              {pending ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
