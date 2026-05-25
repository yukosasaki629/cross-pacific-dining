// データベースが空のときだけシードを実行する安全なラッパー。
// 既存データがあれば何もせずに終了する。

import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

const prisma = new PrismaClient();

(async () => {
  const counts = await Promise.all([
    prisma.person.count(),
    prisma.project.count(),
    prisma.meetingNote.count(),
  ]);
  const total = counts.reduce((a, b) => a + b, 0);
  await prisma.$disconnect();

  if (total > 0) {
    console.log(`✅ 既存データがあります(Person/Project/Meeting 合計 ${total}件)。シードはスキップしました。`);
    console.log("   サンプルデータで初期化したい場合は: npm run db:reset");
    return;
  }

  console.log("📋 DBが空のためサンプルデータを投入します…");
  const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
})();
