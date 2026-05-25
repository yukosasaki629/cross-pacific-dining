"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewBulk,
  createBulkMeetings,
  quickAddPerson,
  type BulkPreview,
} from "../actions";

type Person = { id: string; name: string; role: string | null };
type SectionState = BulkPreview["sections"][number] & {
  skip: boolean;
  assignedPersonId: string;
};

export function BulkImportForm({ initialPeople }: { initialPeople: Person[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<"input" | "review">("input");
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [sections, setSections] = useState<SectionState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [saving, startSaving] = useTransition();
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRole, setNewPersonRole] = useState("");
  const [addingPerson, startAddPerson] = useTransition();

  function onPreview() {
    setError(null);
    if (!text.trim()) {
      setError("メモを貼り付けてください");
      return;
    }
    startPreview(async () => {
      const result = await previewBulk(text);
      setPeople(result.people);
      setSections(
        result.sections.map((s) => ({
          ...s,
          skip: false,
          assignedPersonId: s.matchedPersonId ?? "",
        })),
      );
      setStage("review");
    });
  }

  function onSaveAll() {
    setError(null);
    const toSave = sections.filter((s) => !s.skip && s.assignedPersonId);
    if (toSave.length === 0) {
      setError("保存対象がありません。担当者を選択するか、スキップを外してください。");
      return;
    }
    startSaving(async () => {
      const result = await createBulkMeetings(
        toSave.map((s) => ({ personId: s.assignedPersonId, body: s.body })),
        date,
      );
      router.push(`/oneonones?bulk=${result.created}`);
    });
  }

  function onAddPerson() {
    if (!newPersonName.trim()) return;
    startAddPerson(async () => {
      const created = await quickAddPerson(newPersonName, newPersonRole);
      setPeople((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewPersonName("");
      setNewPersonRole("");
      setShowAddPerson(false);
    });
  }

  // -------------------- 入力ステージ --------------------
  if (stage === "input") {
    return (
      <div className="space-y-4">
        <div className="card card-pad space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              日付(全セクション共通)
            </label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              週次サマリー全文を貼り付け
            </label>
            <p className="mb-2 text-[11px] text-ink-500">
              <code># 1. COO / Sean</code> や <code># 5. Chief People Officer / Arlene</code> のような
              <strong>見出し付きセクション</strong>を自動検出して担当者ごとに分割します。
              担当者の名前または役職(CEO/CFO/COO/CMO/CTO 等)を見出しに入れておくと、自動マッチします。
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="textarea min-h-[400px]"
              placeholder={`# 5/15 CEO 1on1 週次詳細サマリー

# 1. COO / Sean:売上、店舗実行
- ...

# 2. VP of Marketing:FY27 Vision
- ...

# 3. Finance / Bob:Vena、AI 活用
- ...
`}
            />
          </div>
          {error ? (
            <div className="rounded border border-bad-600/40 bg-bad-50 p-2 text-[12px] text-bad-700">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              onClick={onPreview}
              disabled={previewing}
              className="btn-primary"
            >
              {previewing ? "分割中…" : "セクションに分割してプレビュー"}
            </button>
          </div>
        </div>

        <div className="card card-pad bg-ink-50/50">
          <h3 className="text-[12px] font-semibold text-ink-700">📋 使い方のヒント</h3>
          <ul className="mt-2 list-disc pl-5 text-[12px] text-ink-700 space-y-1">
            <li>大きな週次メモを丸ごと貼り付けるだけ</li>
            <li>担当者ごとに自動で分割 → プレビューで確認・調整できます</li>
            <li>1人に対し1つのMeetingNoteが作成されます(後で「処理する」で抽出)</li>
            <li>該当人物が未登録なら、プレビュー画面で追加できます</li>
          </ul>
        </div>
      </div>
    );
  }

  // -------------------- プレビューステージ --------------------
  const validSections = sections.filter((s) => !s.skip && s.assignedPersonId);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-accent-200 bg-accent-50/40 px-3 py-2.5 text-[13px]">
        <div className="font-medium text-accent-700">
          {sections.length} セクション検出 ・ {validSections.length} 件を保存予定
        </div>
        <div className="mt-0.5 text-[11px] text-ink-600">
          日付:<strong>{date}</strong> ・ スキップしたいセクションは右上のチェックを外してください。
          担当者が「未割当」のものは保存されません。
        </div>
      </div>

      {/* 人追加(必要なときだけ展開) */}
      <div className="card card-pad">
        {showAddPerson ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-ink-700">新しい相手を追加</h3>
              <button onClick={() => setShowAddPerson(false)} className="text-[11px] text-ink-500">
                閉じる
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                className="input"
                placeholder="名前(例:Sean)"
              />
              <input
                value={newPersonRole}
                onChange={(e) => setNewPersonRole(e.target.value)}
                className="input"
                placeholder="役職(例:COO)"
              />
            </div>
            <button
              onClick={onAddPerson}
              disabled={addingPerson || !newPersonName.trim()}
              className="btn-primary w-full"
            >
              {addingPerson ? "追加中…" : "追加して下のドロップダウンに反映"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddPerson(true)}
            className="text-[12px] font-medium text-accent-700"
          >
            + 担当者リストに未登録の人を追加
          </button>
        )}
      </div>

      {sections.map((s, idx) => (
        <SectionCard
          key={s.index}
          section={s}
          people={people}
          onChange={(updated) => {
            setSections((prev) => prev.map((p, i) => (i === idx ? updated : p)));
          }}
        />
      ))}

      {error ? (
        <div className="rounded border border-bad-600/40 bg-bad-50 p-2 text-[12px] text-bad-700">
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-20 z-10 -mx-3 border-t border-ink-200 bg-white/95 px-3 py-3 backdrop-blur md:bottom-0">
        <div className="flex gap-2">
          <button
            onClick={() => setStage("input")}
            className="btn flex-1"
          >
            ← 戻って編集
          </button>
          <button
            onClick={onSaveAll}
            disabled={saving || validSections.length === 0}
            className="btn-primary flex-1"
          >
            {saving ? "保存中…" : `${validSections.length} 件を一括保存`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  people,
  onChange,
}: {
  section: SectionState;
  people: Person[];
  onChange: (s: SectionState) => void;
}) {
  const isAssigned = !!section.assignedPersonId;
  const skipped = section.skip;
  return (
    <div
      className={`card card-pad ${skipped ? "opacity-50" : ""} ${
        !isAssigned && !skipped ? "border-warn-600/40 bg-warn-50/20" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-ink-900">{section.heading}</div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {section.matchReason}
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-1 text-[12px] text-ink-600">
          <input
            type="checkbox"
            checked={section.skip}
            onChange={(e) => onChange({ ...section, skip: e.target.checked })}
          />
          スキップ
        </label>
      </div>

      <div className="mb-2">
        <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
          担当者
        </label>
        <select
          className="input"
          value={section.assignedPersonId}
          disabled={section.skip}
          onChange={(e) => onChange({ ...section, assignedPersonId: e.target.value })}
        >
          <option value="">— 未割当(保存しない) —</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.role ? ` / ${p.role}` : ""}
            </option>
          ))}
        </select>
      </div>

      <details>
        <summary className="cursor-pointer text-[12px] text-ink-600">本文プレビュー</summary>
        <pre className="mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap rounded-md bg-ink-50 p-2 text-[11px] leading-relaxed text-ink-800">
          {section.body}
        </pre>
      </details>
    </div>
  );
}
