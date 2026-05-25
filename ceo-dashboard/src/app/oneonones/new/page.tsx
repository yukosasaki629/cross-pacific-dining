import Link from "next/link";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { createMeetingNote } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOneOnOne() {
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  if (people.length === 0) {
    return (
      <div>
        <AppHeader title="新規1on1" backHref="/oneonones" />
        <div className="px-3 py-6">
          <div className="card card-pad text-center">
            <p className="text-[14px] text-ink-700">最初に1on1の相手を登録してください。</p>
            <Link href="/oneonones/people" className="btn-primary mt-3 inline-flex">
              + 相手を登録する
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHeader title="新規1on1" subtitle="メモを貼り付けて保存" backHref="/oneonones" />

      <form action={createMeetingNote} className="px-3 py-4 space-y-4">
        <div className="card card-pad space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">対象者</label>
            <select name="personId" required className="input" defaultValue="">
              <option value="" disabled>— 選択 —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.role ? ` / ${p.role}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">日付</label>
            <input
              type="date"
              name="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-ink-500 mb-1">
              1on1 の生メモ
            </label>
            <textarea
              name="rawNotes"
              required
              className="textarea min-h-[260px]"
              placeholder={`ここに 1on1 メモをそのまま貼り付けてください。\n\n抽出のヒント:\n・「Action: 〜する」「TODO: 〜」 → アクションとして抽出\n・「決定: 〜」「合意した」 → 決定済として抽出\n・「判断待ち」「決めて欲しい」「?」終わり → 判断待ちとして抽出\n・「リスク」「懸念」「ブロッカー」 → リスクとして抽出\n・「最優先」「後回し」 → 該当プロジェクトの優先度変更提案\n・既存プロジェクト名が出てきたら自動で紐付け\n・「報酬」「取締役会」「役員人事」 → 自動で機密フラグ(社長共有ビューから除外)`}
            />
            <p className="mt-1 text-[11px] text-ink-500">
              保存後、詳細画面で「処理する」を押すと構造化抽出されます。生メモは常に保存されます。
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/oneonones" className="btn flex-1">キャンセル</Link>
          <button type="submit" className="btn-primary flex-1">保存する</button>
        </div>
      </form>
    </div>
  );
}
