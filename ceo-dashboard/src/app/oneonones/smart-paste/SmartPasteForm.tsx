"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { previewBulkParse, applyBulkParse } from "@/app/topics/actions";

type Person = { id: string; name: string; role: string | null };
type Topic = { title: string; content: string };
type Section = {
  personId: string;
  personName: string;
  personRole: string | null;
  topics: Topic[];
};

export function SmartPasteForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"input" | "preview">("input");
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [people, setPeople] = useState<Person[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [preamble, setPreamble] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [parsing, startParse] = useTransition();
  const [saving, startSave] = useTransition();

  function parse() {
    setError(null);
    if (!text.trim()) {
      setError("メモを貼り付けてください");
      return;
    }
    startParse(async () => {
      const r = await previewBulkParse(text);
      if (r.parse.sections.length === 0) {
        setError(
          `登録済みの担当者の名前が見つかりませんでした。担当者一覧に名前があるか確認するか、貼り付けたメモの中で人名(例「Arlene」)が単独行で書かれているか確認してください。`,
        );
        setPeople(r.knownPeople);
        return;
      }
      setSections(r.parse.sections);
      setPreamble(r.parse.preamble);
      setPeople(r.knownPeople);
      setStage("preview");
    });
  }

  function saveAll() {
    setError(null);
    const valid = sections.filter((s) => s.personId && s.topics.length > 0);
    if (valid.length === 0) {
      setError("保存対象がありません");
      return;
    }
    startSave(async () => {
      const r = await applyBulkParse(
        valid.map((s) => ({
          personId: s.personId,
          topics: s.topics,
        })),
        date,
      );
      router.push(`/oneonones?ok=${r.meetings}-${r.topics}`);
    });
  }

  function updateSectionPerson(idx: number, personId: string) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, personId, personName: people.find((p) => p.id === personId)?.name ?? s.personName }
          : s,
      ),
    );
  }

  function updateTopic(sIdx: number, tIdx: number, patch: Partial<Topic>) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx
          ? { ...s, topics: s.topics.map((t, j) => (j === tIdx ? { ...t, ...patch } : t)) }
          : s,
      ),
    );
  }

  function removeTopic(sIdx: number, tIdx: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sIdx ? { ...s, topics: s.topics.filter((_, j) => j !== tIdx) } : s,
      ),
    );
  }

  function removeSection(sIdx: number) {
    setSections((prev) => prev.filter((_, i) => i !== sIdx));
  }

  // -------------------- 入力ステージ --------------------
  if (stage === "input") {
    return (
      <div className="space-y-4">
        <div className="card card-pad space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              日付(全1on1共通・あとで個別変更可)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              1on1メモ
            </label>
            <p className="mb-2 text-[11px] text-ink-500">
              人名が単独行(例「Arlene」)で書かれ、その下に話題名と内容が続く形式を自動認識します。
              `##` などの記号は不要。
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="textarea min-h-[400px]"
              placeholder={`例:\n\nArlene\n\nCFO探し\n\n5/11の週に2人の面接予定。\nPearl Meyer Ryan に妥当な報酬を聞く。\n\nサイバーセキュリティ\n\nWyane が入社。Shrez は退職。\n\nSean\n\nKura Reserve\n\n年に12回に出来るか Newton も入れて話し合う。\n...\n`}
            />
          </div>
          {error ? (
            <div className="rounded border border-bad-600/40 bg-bad-50 p-2 text-[12px] text-bad-700">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Link href="/oneonones" className="btn">キャンセル</Link>
            <button onClick={parse} disabled={parsing} className="btn-primary">
              {parsing ? "解析中…" : "解析してプレビュー"}
            </button>
          </div>
        </div>

        <div className="card card-pad text-[12px] text-ink-700">
          <div className="font-semibold mb-1">💡 認識ルール</div>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong>担当者</strong>:行が登録済み担当者の名前と完全一致(例「Sean」のみ)</li>
            <li><strong>話題名</strong>:50字以内・句点で終わらない・箇条書きでない短い行</li>
            <li><strong>内容</strong>:それ以外のすべての行</li>
            <li>「Risk:」「Action:」「要判断:」を含む内容は自動で ⭐ / 📌 が立ちます</li>
            <li>「報酬」「Pearl Meyer」「Sharaz」等は自動で機密区分が付き、社長共有ビューから除外</li>
          </ul>
        </div>
      </div>
    );
  }

  // -------------------- プレビューステージ --------------------
  const totalTopics = sections.reduce((acc, s) => acc + s.topics.length, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-accent-200 bg-accent-50/40 px-3 py-2.5 text-[13px]">
        <div className="font-medium text-accent-700">
          {sections.length} 人 ・ {totalTopics} 話題を検出
        </div>
        <div className="mt-0.5 text-[11px] text-ink-600">
          日付:<strong>{date}</strong> ・ 不要な話題やセクションは削除できます
        </div>
      </div>

      {preamble ? (
        <details className="card card-pad text-[12px]">
          <summary className="cursor-pointer font-medium text-ink-600">
            認識されなかった先頭テキスト({preamble.length} 文字)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-ink-50 p-2 text-[11px] text-ink-700">
            {preamble}
          </pre>
        </details>
      ) : null}

      {sections.map((s, sIdx) => (
        <div key={sIdx} className="card card-pad space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <label className="block text-[10px] font-semibold uppercase text-ink-500 mb-1">
                担当者
              </label>
              <select
                value={s.personId}
                onChange={(e) => updateSectionPerson(sIdx, e.target.value)}
                className="input text-[14px]"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.role ? ` / ${p.role}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeSection(sIdx)}
              className="btn-danger text-[11px] shrink-0"
            >
              この人を保存しない
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase text-ink-500">
              話題({s.topics.length})
            </div>
            {s.topics.map((t, tIdx) => (
              <div key={tIdx} className="rounded border border-ink-200 bg-white p-2">
                <div className="flex items-start gap-2">
                  <input
                    value={t.title}
                    onChange={(e) => updateTopic(sIdx, tIdx, { title: e.target.value })}
                    className="input text-[13px] py-1 font-medium"
                    placeholder="話題名"
                  />
                  <button
                    onClick={() => removeTopic(sIdx, tIdx)}
                    aria-label="削除"
                    className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded border border-bad-600/30 text-bad-700 hover:bg-bad-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
                {t.content ? (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[11px] text-ink-500">
                      内容({t.content.length} 文字)
                    </summary>
                    <textarea
                      value={t.content}
                      onChange={(e) => updateTopic(sIdx, tIdx, { content: e.target.value })}
                      className="textarea text-[12px] mt-1 min-h-[80px]"
                    />
                  </details>
                ) : null}
              </div>
            ))}
            {s.topics.length === 0 ? (
              <div className="text-[12px] text-ink-400">話題なし(この人は保存されません)</div>
            ) : null}
          </div>
        </div>
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
            onClick={saveAll}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? "保存中…" : `${sections.length}人分 / ${totalTopics}話題を保存`}
          </button>
        </div>
      </div>
    </div>
  );
}
