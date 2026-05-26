// =============================================================================
// シード:無効化(意図的に何も投入しない)
// =============================================================================
//
// 経緯:過去のシードはサンプルデータ(サンプルCEO/CFO/COO 等、サンプル
// プロジェクト5件、サンプル判断・リスク・フォロー)を投入していたが、
// ユーザーが消したデータがリセットのたびに復活する事故を起こしたため、
// この機能を停止した。
//
// 復活させたい場合:
//   git log --oneline -- prisma/seed.ts で過去のバージョンを探し、
//   git show <hash>:ceo-dashboard/prisma/seed.ts > prisma/seed.ts
//   で復元できる。
//
// データ追加は必ず UI から:
//   - 1on1 相手:  http://localhost:3000/oneonones/people
//   - 1on1 メモ:  http://localhost:3000/oneonones/new
//   - プロジェクト: http://localhost:3000/projects/new
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 サンプルデータの自動投入は無効化されています。");
  console.log("   このシードは何もDBに追加しません。");
  console.log("");
  console.log("   データの追加は UI からおこなってください:");
  console.log("     - 1on1 相手:    http://localhost:3000/oneonones/people");
  console.log("     - 1on1 メモ:    http://localhost:3000/oneonones/new");
  console.log("     - プロジェクト:   http://localhost:3000/projects/new");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
