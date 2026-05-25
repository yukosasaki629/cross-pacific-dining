// データベースの自動バックアップ。
// db:reset / db:seed を実行する前に、現在の dev.db を
// prisma/backups/dev.db.<YYYY-MM-DD-HHMMSS> にコピーする。
//
// 万一データを消してしまった場合、prisma/backups/ の中から
// 該当ファイルを dev.db にコピーし直せば復旧できる。

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = join(process.cwd(), "prisma", "backups");
const KEEP_LAST_N = 10; // 最新10件だけ残す

if (!existsSync(DB_PATH)) {
  console.log("⏭  バックアップ対象のDBが存在しません(初回?)。スキップします。");
  process.exit(0);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const now = new Date();
const stamp =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
  `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const dest = join(BACKUP_DIR, `dev.db.${stamp}`);
copyFileSync(DB_PATH, dest);
console.log(`💾 バックアップを保存: prisma/backups/dev.db.${stamp}`);

// 古いバックアップを削除(最新 KEEP_LAST_N 個だけ残す)
const files = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("dev.db."))
  .map((f) => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length > KEEP_LAST_N) {
  for (const f of files.slice(KEEP_LAST_N)) {
    unlinkSync(join(BACKUP_DIR, f.name));
  }
  console.log(`🧹 古いバックアップを ${files.length - KEEP_LAST_N} 件削除しました`);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
