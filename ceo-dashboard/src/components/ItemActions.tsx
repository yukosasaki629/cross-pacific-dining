"use client";

import { useState, useTransition } from "react";
import { deleteItem, updateItem } from "@/app/oneonones/actions";
import type { ItemType } from "@/app/oneonones/actions";

// 派生レコード(タスク・フォローアップ・判断・リスク)用の
// 編集 + 削除 ボタンセット。expand すると詳細編集フォームが出る。
export function ItemActions({
  type,
  id,
  current,
}: {
  type: ItemType;
  id: string;
  current: ItemCurrent;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState<ItemCurrent>(current);

  function onDelete() {
    if (!confirm("この項目を削除します。よろしいですか?")) return;
    start(async () => {
      await deleteItem(type, id);
    });
  }

  function onSave() {
    start(async () => {
      await updateItem(type, id, form);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="mt-2 rounded-md border border-accent-200 bg-accent-50/30 p-2 space-y-2">
        {type === "task" || type === "followup" ? (
          <Input
            label="内容"
            value={form.title ?? ""}
            onChange={(v) => setForm({ ...form, title: v })}
          />
        ) : type === "decision" ? (
          <Input
            label="議題"
            value={form.topic ?? ""}
            onChange={(v) => setForm({ ...form, topic: v })}
          />
        ) : (
          <Input
            label="リスク内容"
            value={form.description ?? ""}
            onChange={(v) => setForm({ ...form, description: v })}
          />
        )}

        {(type === "task" || type === "risk") ? (
          <Input
            label="担当者"
            value={form.owner ?? ""}
            onChange={(v) => setForm({ ...form, owner: v })}
          />
        ) : null}
        {type === "followup" ? (
          <Input
            label="対象者"
            value={form.who ?? ""}
            onChange={(v) => setForm({ ...form, who: v })}
          />
        ) : null}

        {type === "task" || type === "followup" || type === "decision" ? (
          <Input
            label="期限"
            type="date"
            value={form.dueDate ?? ""}
            onChange={(v) => setForm({ ...form, dueDate: v })}
          />
        ) : null}

        {type === "task" ? (
          <Select
            label="ステータス"
            value={form.status ?? "未着手"}
            options={["未着手", "進行中", "待機中", "完了", "ブロック"]}
            onChange={(v) => setForm({ ...form, status: v })}
          />
        ) : type === "followup" ? (
          <Select
            label="ステータス"
            value={form.status ?? "未対応"}
            options={["未対応", "進行中", "完了"]}
            onChange={(v) => setForm({ ...form, status: v })}
          />
        ) : type === "decision" ? (
          <Select
            label="ステータス"
            value={form.status ?? "未対応"}
            options={["未対応", "検討中", "判断済", "中止"]}
            onChange={(v) => setForm({ ...form, status: v })}
          />
        ) : (
          <Select
            label="状況"
            value={form.status ?? "対応中"}
            options={["未対応", "対応中", "解消"]}
            onChange={(v) => setForm({ ...form, status: v })}
          />
        )}

        {type === "task" ? (
          <Select
            label="優先度"
            value={form.priority ?? "中"}
            options={["低", "中", "高"]}
            onChange={(v) => setForm({ ...form, priority: v })}
          />
        ) : null}
        {type === "risk" ? (
          <Select
            label="重要度"
            value={form.severity ?? "中"}
            options={["低", "中", "高"]}
            onChange={(v) => setForm({ ...form, severity: v })}
          />
        ) : null}
        {type === "decision" ? (
          <Select
            label="重要度"
            value={form.importance ?? "中"}
            options={["低", "中", "高"]}
            onChange={(v) => setForm({ ...form, importance: v })}
          />
        ) : null}

        {type === "decision" ? (
          <Textarea
            label="推奨案"
            value={form.recommendation ?? ""}
            onChange={(v) => setForm({ ...form, recommendation: v })}
          />
        ) : null}
        {type === "risk" ? (
          <Textarea
            label="対応策"
            value={form.mitigation ?? ""}
            onChange={(v) => setForm({ ...form, mitigation: v })}
          />
        ) : null}
        {(type === "task" || type === "followup") ? (
          <Textarea
            label="メモ"
            value={form.memo ?? ""}
            onChange={(v) => setForm({ ...form, memo: v })}
          />
        ) : null}

        {/* 共有制御 */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="共有"
            value={form.visibility ?? "internal"}
            options={["internal", "ceo_shared"]}
            onChange={(v) => setForm({ ...form, visibility: v })}
          />
          {type === "decision" ? (
            <Select
              label="機密区分"
              value={form.sensitivity ?? "general"}
              options={["general", "board", "compensation", "executive_only"]}
              onChange={(v) => setForm({ ...form, sensitivity: v })}
            />
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => { setForm(current); setEditing(false); }}
            className="btn text-[11px]"
          >
            キャンセル
          </button>
          <button onClick={onSave} disabled={pending} className="btn-primary text-[11px]">
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setEditing(true)}
        aria-label="編集"
        className="inline-flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 hover:border-accent-600 hover:text-accent-700 active:scale-95"
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
        className="inline-flex h-6 w-6 items-center justify-center rounded border border-bad-600/30 text-bad-700 hover:bg-bad-50 active:scale-95 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </div>
  );
}

type ItemCurrent = {
  title?: string;
  description?: string;
  topic?: string;
  owner?: string | null;
  who?: string | null;
  status?: string;
  dueDate?: string | null;
  priority?: string;
  severity?: string;
  importance?: string;
  memo?: string | null;
  recommendation?: string | null;
  mitigation?: string | null;
  sensitivity?: string;
  visibility?: string;
};

function Input({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-[13px] py-1.5"
      />
    </div>
  );
}

function Textarea({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="textarea text-[13px] min-h-[60px]"
      />
    </div>
  );
}

function Select({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input text-[13px] py-1.5"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
