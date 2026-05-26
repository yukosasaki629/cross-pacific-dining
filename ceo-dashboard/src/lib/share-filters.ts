import type { Prisma } from "@prisma/client";

// =============================================================================
// 共有ビュー(/share)のセキュリティ境界 — 単一の真実の源
// =============================================================================
//
// 設計原則:
//
// 1. 共有ビューに出すレコードは、明示的なフラグが立っているものだけ。
//    フラグが立っていなければ、デフォルトで「優子のみ」(internal)。
//
// 2. privateMemo は共有ビューのクエリで一切 SELECT しない。
//    `select` 句で許可フィールドだけを返す(omit ではなく select を使う)ことで、
//    将来スキーマにセンシティブなフィールドが増えても、自動的に漏れない。
//
// 3. board / compensation / executive_only に分類された意思決定は、
//    visibility フラグが何であろうと共有から自動除外。
//
// 4. 共有ビューと共有レポートは、必ずこの同じ関数を経由する。
//    クエリを書き散らかさない。
// =============================================================================

// ----- プロジェクト ----------------------------------------------------------

// 共有ビューに公開してよい Project フィールドの完全リスト。
// privateMemo を含まないことが本質。
export const SHARE_PROJECT_SELECT = {
  id: true,
  name: true,
  objective: true,
  owner: true,
  department: true,
  status: true,
  riskLevel: true,
  priority: true,
  nextAction: true,
  dueDate: true,
  currentSummary: true,
  successMetric: true,
  isSharedWithCEO: true,
  createdAt: true,
  updatedAt: true,
  // privateMemo は意図的に省く ← 共有してはいけない
} as const satisfies Prisma.ProjectSelect;

// 共有プロジェクトのみ
export function shareProjectWhere(extra: Prisma.ProjectWhereInput = {}): Prisma.ProjectWhereInput {
  return { isSharedWithCEO: true, ...extra };
}

// ----- 意思決定 -------------------------------------------------------------
//
// 共有ビューに出す条件:
//  - visibility = "ceo_shared"
//  - sensitivity = "general"  (board/compensation/executive_only は除外)
//  - 紐づくプロジェクトがあれば、そのプロジェクトも共有対象
export function shareDecisionWhere(extra: Prisma.DecisionWhereInput = {}): Prisma.DecisionWhereInput {
  return {
    AND: [
      { visibility: "ceo_shared" },
      { sensitivity: "general" },
      {
        OR: [
          { projectId: null },
          { project: { isSharedWithCEO: true } },
        ],
      },
      extra,
    ],
  };
}

// ----- リスク ----------------------------------------------------------------
export function shareRiskWhere(extra: Prisma.RiskWhereInput = {}): Prisma.RiskWhereInput {
  return {
    AND: [
      { visibility: "ceo_shared" },
      {
        OR: [
          { projectId: null },
          { project: { isSharedWithCEO: true } },
        ],
      },
      extra,
    ],
  };
}

// ----- 更新履歴 --------------------------------------------------------------
export function shareUpdateWhere(extra: Prisma.UpdateWhereInput = {}): Prisma.UpdateWhereInput {
  return {
    AND: [
      { visibility: "ceo_shared" },
      { project: { isSharedWithCEO: true } },
      extra,
    ],
  };
}

// ----- フォローアップ --------------------------------------------------------
export function shareFollowUpWhere(extra: Prisma.FollowUpWhereInput = {}): Prisma.FollowUpWhereInput {
  return {
    AND: [
      { visibility: "ceo_shared" },
      extra,
    ],
  };
}

// ----- トピック ---------------------------------------------------------------
//
// 共有ビューに出す条件:
//  - visibility = "ceo_shared"
//  - sensitivity = "general"  (board/compensation/executive_only は除外)
//  - 紐づくプロジェクトがあれば、そのプロジェクトも共有対象
export function shareTopicWhere(extra: Prisma.TopicWhereInput = {}): Prisma.TopicWhereInput {
  return {
    AND: [
      { visibility: "ceo_shared" },
      { sensitivity: "general" },
      {
        OR: [
          { projectId: null },
          { project: { isSharedWithCEO: true } },
        ],
      },
      extra,
    ],
  };
}

// ----- /report 用(社長に渡す前提:機密含めて全件) -------------------------
//
// 設計方針:
//   ダッシュボード本体は優子の個人ツール(社長には見せない)。
//   /report はそこから「社長に見せる週次サマリー」を生成する出口。
//   社長は1on1当事者なので、機密(報酬/Board/CFO候補/Sharaz等)も
//   そもそも知っている内容 → すべて含めて報告書化する。
//
//   privateMemo(プロジェクトの非公開メモ)だけは引き続き除外(用途が違うため)。
export function reportTopicWhere(extra: Prisma.TopicWhereInput = {}): Prisma.TopicWhereInput {
  return extra;
}

// ----- アクセス可否判定(プロジェクト詳細用) ---------------------------------
//
// /share/projects/[id] で「このIDは公開していいか?」を判断するときに使う。
// .findUnique({ where: { id }}) の戻り値に対して使うので、isSharedWithCEO を確認。
export function isProjectShareable(p: { isSharedWithCEO: boolean } | null): boolean {
  return !!p && p.isSharedWithCEO === true;
}

// ----- ガード値 --------------------------------------------------------------
//
// CEO共有の許容値。これ以外は不可。
export const VISIBILITY_VALUES = ["internal", "ceo_shared"] as const;
export const SENSITIVITY_VALUES = ["general", "board", "compensation", "executive_only"] as const;
export type Visibility = (typeof VISIBILITY_VALUES)[number];
export type Sensitivity = (typeof SENSITIVITY_VALUES)[number];
