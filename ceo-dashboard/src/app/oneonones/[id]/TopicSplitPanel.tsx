"use client";

import { useTransition, useState } from "react";
import {
  generateTopicsFromMeeting,
  deleteTopicsFromMeeting,
} from "@/app/topics/actions";

export function TopicSplitPanel({
  meetingId,
  hasTopics,
}: {
  meetingId: string;
  hasTopics: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function split() {
    setMsg(null);
    start(async () => {
      const r = await generateTopicsFromMeeting(meetingId);
      setMsg(`${r.created} 個のトピックを作成しました。下のリストで⭐重要・📌フォロー要を割り振ってください。`);
    });
  }

  function redo() {
    if (!confirm("既存のトピックを全て削除して、もう一度分割し直します。よろしいですか?")) return;
    setMsg(null);
    start(async () => {
      await deleteTopicsFromMeeting(meetingId);
      const r = await generateTopicsFromMeeting(meetingId);
      setMsg(`${r.created} 個のトピックを再作成しました。`);
    });
  }

  return (
    <div className="card card-pad border-accent-200 bg-accent-50/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-900">
            📋 トピックに分割
          </h3>
          <p className="mt-1 text-[11px] text-ink-600">
            メモのセクション(##)ごとに「トピック」を作成します。
            各トピックを ⭐重要 / 📌フォロー要 で割り振ると、ホームに反映されます。
          </p>
        </div>
        {!hasTopics ? (
          <button onClick={split} disabled={pending} className="btn-primary text-[12px] shrink-0">
            {pending ? "分割中…" : "トピックに分割"}
          </button>
        ) : (
          <button onClick={redo} disabled={pending} className="btn text-[12px] shrink-0">
            {pending ? "やり直し中…" : "✻ 分割しなおす"}
          </button>
        )}
      </div>
      {msg ? (
        <div className="mt-2 rounded border border-ok-600/40 bg-ok-50 p-2 text-[12px] text-ok-700">
          {msg}
        </div>
      ) : null}
    </div>
  );
}
