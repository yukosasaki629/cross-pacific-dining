"use client";

import { useState, useTransition } from "react";
import {
  deleteTopicsFromMeeting,
  createTopicFromObject,
  generateTopicsFromMeeting,
} from "@/app/topics/actions";

export function AddTopicPanel({
  meetingId,
  personId,
  topicCount,
}: {
  meetingId: string;
  personId: string;
  topicCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();
  const [clearing, startClear] = useTransition();
  const [splitting, startSplit] = useTransition();
  const [splitResult, setSplitResult] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("info");
  const [pnlImpact, setPnlImpact] = useState("");
  const [strategicCategory, setStrategicCategory] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setContent("");
    setCategory("info");
    setPnlImpact("");
    setStrategicCategory("");
    setIsImportant(false);
    setNeedsFollowUp(false);
    setError(null);
  }

  async function save() {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await createTopicFromObject({
          meetingId,
          personId,
          title: title.trim(),
          content: content.trim(),
          category,
          isImportant,
          needsFollowUp,
          pnlImpact: pnlImpact || null,
          strategicCategory: strategicCategory || null,
        });
        reset();
        // フォームは閉じずに連続入力可能に
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  async function saveAndClose() {
    await save();
    setExpanded(false);
  }

  function clearAll() {
    if (!confirm(`このメモのトピック ${topicCount}件 を全て削除します。よろしいですか?`)) return;
    startClear(async () => {
      await deleteTopicsFromMeeting(meetingId);
    });
  }

  function autoSplit() {
    setSplitResult(null);
    startSplit(async () => {
      const r = await generateTopicsFromMeeting(meetingId);
      if (r.created === 0) {
        setSplitResult(
          "## 見出しが見つかりませんでした。ChatGPT のプロンプトを使って ## 見出し付きでまとめ直すか、手動で「+ トピック追加」してください。",
        );
      } else {
        setSplitResult(`${r.created} 個のトピックを自動作成しました。⭐ / 📌 で割り振ってください。`);
      }
    });
  }

  return (
    <div className="card card-pad border-accent-200 bg-accent-50/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink-900">📋 トピック</h3>
          <p className="mt-1 text-[11px] text-ink-600">
            メモを読んで、重要なポイントを 1 つずつ手動でトピック化してください。<br />
            ⭐重要 / 📌フォロー要 を割り振ると、ホームと社長共有ビューに反映されます。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {topicCount > 0 ? (
            <button
              onClick={clearAll}
              disabled={clearing}
              className="btn-danger text-[11px]"
            >
              {clearing ? "削除中…" : `全削除(${topicCount})`}
            </button>
          ) : null}
          <button
            onClick={autoSplit}
            disabled={splitting}
            className="btn text-[12px]"
            title="メモが ## 見出し付きで書かれている場合、見出しごとに自動でトピック化"
          >
            {splitting ? "分割中…" : "## で自動分割"}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-primary text-[12px]"
          >
            {expanded ? "閉じる" : "+ トピック追加"}
          </button>
        </div>
      </div>

      {splitResult ? (
        <div className={`mt-3 rounded border p-2 text-[12px] ${
          splitResult.includes("見つかりません")
            ? "border-warn-600/40 bg-warn-50 text-warn-700"
            : "border-ok-600/40 bg-ok-50 text-ok-700"
        }`}>
          {splitResult}
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              タイトル <span className="text-bad-700">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例:5月売上が想定より弱い"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              内容(任意)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="背景・詳細を貼り付けまたは入力"
              className="textarea min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
                カテゴリ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="info">情報</option>
                <option value="action">アクション</option>
                <option value="decision">判断</option>
                <option value="risk">リスク</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
                P&L 影響
              </label>
              <select
                value={pnlImpact}
                onChange={(e) => setPnlImpact(e.target.value)}
                className="input"
              >
                <option value="">— 未分類 —</option>
                <option value="sales">📈 Sales</option>
                <option value="food_cost">💰 FoodCost削減</option>
                <option value="labor_cost">👥 LaborCost削減</option>
                <option value="ga">🏢 G&A</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
                戦略カテゴリ
              </label>
              <select
                value={strategicCategory}
                onChange={(e) => setStrategicCategory(e.target.value)}
                className="input"
              >
                <option value="">— なし —</option>
                <option value="aop">📊 AOP</option>
                <option value="strategy">🎯 Strategy</option>
                <option value="board">🏛 Board</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-[13px] text-warn-700 font-medium">⭐ 重要</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={needsFollowUp}
                onChange={(e) => setNeedsFollowUp(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-[13px] text-accent-700 font-medium">📌 フォロー要</span>
            </label>
          </div>

          {error ? (
            <div className="rounded border border-bad-600/40 bg-bad-50 p-2 text-[12px] text-bad-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { reset(); setExpanded(false); }}
              className="btn flex-1 text-[12px]"
            >
              キャンセル
            </button>
            <button
              onClick={save}
              disabled={pending || !title.trim()}
              className="btn flex-1 text-[12px]"
              title="連続入力(フォームはクリアされて開いたまま)"
            >
              {pending ? "保存中…" : "保存して続ける"}
            </button>
            <button
              onClick={saveAndClose}
              disabled={pending || !title.trim()}
              className="btn-primary flex-1 text-[12px]"
            >
              {pending ? "保存中…" : "保存して閉じる"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
