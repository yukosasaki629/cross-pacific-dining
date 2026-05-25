"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  updateTopic,
  deleteTopic,
  toggleTopicFlag,
} from "@/app/topics/actions";
import { fmtMd, isOverdue, toInputDate } from "@/lib/utils";

type Topic = {
  id: string;
  title: string;
  content: string | null;
  isImportant: boolean;
  needsFollowUp: boolean;
  category: string;
  status: string;
  owner: string | null;
  dueDate: Date | string | null;
  visibility: string;
  sensitivity: string;
  person?: { id: string; name: string; role: string | null } | null;
  meetingNote?: { id: string; date: Date | string } | null;
  project?: { id: string; name: string } | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  action: "アクション",
  decision: "判断",
  risk: "リスク",
  info: "情報",
  other: "その他",
};
const CATEGORY_COLOR: Record<string, string> = {
  action: "bg-accent-50 text-accent-700",
  decision: "bg-warn-50 text-warn-700",
  risk: "bg-bad-50 text-bad-700",
  info: "bg-ink-100 text-ink-600",
  other: "bg-ink-100 text-ink-600",
};

export function TopicCard({
  topic,
  showMeetingMeta = true,
  defaultExpanded = false,
}: {
  topic: Topic;
  showMeetingMeta?: boolean;
  defaultExpanded?: boolean;
}) {
  const [pending, start] = useTransition();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);

  const isDone = topic.status === "done";

  function toggle(flag: "isImportant" | "needsFollowUp" | "done") {
    start(async () => {
      await toggleTopicFlag(topic.id, flag);
    });
  }

  function onDelete() {
    if (!confirm("このトピックを削除します。よろしいですか?")) return;
    start(async () => {
      await deleteTopic(topic.id);
    });
  }

  return (
    <div
      className={`card card-pad ${isDone ? "opacity-60" : ""} ${
        topic.isImportant ? "ring-1 ring-warn-600/40" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 完了チェック */}
        <button
          onClick={() => toggle("done")}
          disabled={pending}
          aria-label={isDone ? "未完了に戻す" : "完了"}
          className={`shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border ${
            isDone
              ? "border-ok-600 bg-ok-600 text-white"
              : "border-ink-300 bg-white text-transparent hover:border-ok-600"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          {/* タイトル行 */}
          <div className={`text-[14.5px] font-semibold ${isDone ? "line-through text-ink-500" : "text-ink-900"}`}>
            {topic.title}
          </div>

          {/* メタ情報 */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-500">
            <span className={`pill ${CATEGORY_COLOR[topic.category] ?? "bg-ink-100 text-ink-600"}`}>
              {CATEGORY_LABEL[topic.category] ?? topic.category}
            </span>
            {topic.person ? <span>{topic.person.name}</span> : null}
            {topic.meetingNote && showMeetingMeta ? (
              <Link href={`/oneonones/${topic.meetingNote.id}`} className="link">
                {fmtMd(topic.meetingNote.date)}
              </Link>
            ) : null}
            {topic.owner ? <span>担当: {topic.owner}</span> : null}
            {topic.dueDate ? (
              <span className={isOverdue(topic.dueDate) ? "text-bad-700 font-medium" : ""}>
                期限 {fmtMd(topic.dueDate)}
                {isOverdue(topic.dueDate) ? "(超過)" : ""}
              </span>
            ) : null}
            {topic.sensitivity !== "general" ? (
              <span className="text-bad-700">機密: {topic.sensitivity}</span>
            ) : null}
          </div>

          {/* 内容(折りたたみ) */}
          {topic.content ? (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-[11px] text-accent-700"
              >
                {expanded ? "▼ 閉じる" : "▶ 内容を見る"}
              </button>
              {expanded ? (
                <div className="mt-1 whitespace-pre-wrap rounded-md bg-ink-50 p-2 text-[12px] leading-relaxed text-ink-700">
                  {topic.content}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* 右側のアクション */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {/* ⭐重要 */}
          <button
            onClick={() => toggle("isImportant")}
            disabled={pending}
            aria-label={topic.isImportant ? "重要マーク解除" : "重要にする"}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
              topic.isImportant
                ? "bg-warn-600 text-white"
                : "border border-ink-200 text-ink-400 hover:text-warn-700 hover:border-warn-600"
            }`}
            title="重要"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill={topic.isImportant ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          {/* 📌フォロー要 */}
          <button
            onClick={() => toggle("needsFollowUp")}
            disabled={pending}
            aria-label={topic.needsFollowUp ? "フォローマーク解除" : "フォロー要にする"}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition ${
              topic.needsFollowUp
                ? "bg-accent-600 text-white"
                : "border border-ink-200 text-ink-400 hover:text-accent-700 hover:border-accent-600"
            }`}
            title="フォロー要"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4v12a2 2 0 0 1-2 2H4l5 5 5-5h-3a2 2 0 0 1-2-2V4z" transform="rotate(45 12 12)" />
              <line x1="12" y1="3" x2="12" y2="14" />
              <polygon points="9 6 15 6 12 3" />
              <line x1="6" y1="20" x2="18" y2="20" />
            </svg>
          </button>

          <div className="flex gap-1">
            <button
              onClick={() => setEditing(!editing)}
              aria-label="編集"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 hover:border-accent-600 hover:text-accent-700"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              aria-label="削除"
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-bad-600/30 text-bad-700 hover:bg-bad-50"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {editing ? <InlineEdit topic={topic} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

function InlineEdit({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const [form, setForm] = useState({
    title: topic.title,
    content: topic.content ?? "",
    category: topic.category,
    owner: topic.owner ?? "",
    dueDate: toInputDate(topic.dueDate),
    visibility: topic.visibility,
    sensitivity: topic.sensitivity,
  });
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await updateTopic(topic.id, form);
      onClose();
    });
  }

  return (
    <div className="mt-3 rounded-md border border-accent-200 bg-accent-50/30 p-2 space-y-2">
      <div>
        <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">タイトル</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input text-[13px] py-1.5"
        />
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">内容</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="textarea text-[13px] min-h-[100px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">カテゴリ</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input text-[13px] py-1.5"
          >
            <option value="action">アクション</option>
            <option value="decision">判断</option>
            <option value="risk">リスク</option>
            <option value="info">情報</option>
            <option value="other">その他</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">担当</label>
          <input
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            className="input text-[13px] py-1.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">期限</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="input text-[13px] py-1.5"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">機密区分</label>
          <select
            value={form.sensitivity}
            onChange={(e) => setForm({ ...form, sensitivity: e.target.value })}
            className="input text-[13px] py-1.5"
          >
            <option value="general">general(共有可)</option>
            <option value="board">board(共有不可)</option>
            <option value="compensation">compensation(共有不可)</option>
            <option value="executive_only">executive_only(共有不可)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">共有設定</label>
        <select
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          className="input text-[13px] py-1.5"
        >
          <option value="internal">internal(優子のみ)</option>
          <option value="ceo_shared">ceo_shared(社長と共有)</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn text-[11px]">キャンセル</button>
        <button onClick={save} disabled={pending} className="btn-primary text-[11px]">
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
