"use client";

import { useTransition, useState } from "react";
import { markItemStatus, type ItemType } from "@/app/oneonones/actions";

const DONE_STATUS: Record<ItemType, string> = {
  task: "完了",
  followup: "完了",
  decision: "判断済",
  risk: "解消",
};

export function ItemCheckbox({
  type,
  id,
  currentStatus,
}: {
  type: ItemType;
  id: string;
  currentStatus: string;
}) {
  const [pending, start] = useTransition();
  const isDone = currentStatus === DONE_STATUS[type];
  const [optimisticDone, setOptimisticDone] = useState(isDone);

  function toggle() {
    const newStatus = optimisticDone ? "未対応" : DONE_STATUS[type];
    // task の「未対応」相当は「未着手」
    const adjusted = type === "task" && newStatus === "未対応" ? "未着手" : newStatus;
    setOptimisticDone(!optimisticDone);
    start(async () => {
      await markItemStatus(type, id, adjusted);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={optimisticDone ? "未完了に戻す" : "完了にする"}
      className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
        optimisticDone
          ? "border-ok-600 bg-ok-600 text-white"
          : "border-ink-300 bg-white text-transparent hover:border-ok-600"
      } ${pending ? "opacity-60" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>
  );
}
