// Controlled vocabularies. SQLite has no enums; UI + zod enforce these.

export const MEETING_TYPES = [
  "CEO 1:1",
  "Executive Meeting",
  "Board Meeting Prep",
  "Audit Committee",
  "Compensation Committee",
  "Nominating Committee",
  "Cross-functional Project",
  "Japan HQ Alignment",
  "AI / Automation",
  "Other",
] as const;

export const CONFIDENTIALITY = ["Internal", "Confidential", "Restricted"] as const;

export const PRIORITY_LEVEL = ["High", "Medium", "Low"] as const;
export const PRIORITY_STATUS = [
  "On Track",
  "At Risk",
  "Delayed",
  "Paused",
  "Completed",
] as const;

export const ACTION_STATUS = [
  "Not Started",
  "In Progress",
  "Waiting",
  "Completed",
  "Blocked",
] as const;
export const URGENCY = ["High", "Medium", "Low"] as const;

export const PROJECT_STATUS = [
  "Active",
  "At Risk",
  "Blocked",
  "Paused",
  "Completed",
] as const;

export const DECISION_NEEDED_STATUS = [
  "Open",
  "Awaiting Info",
  "Awaiting CEO",
  "Decided",
  "Cancelled",
] as const;

export const RISK_STATUS = ["Open", "Mitigating", "Resolved", "Accepted"] as const;

export const SUGGESTED_TAGS = [
  "AI",
  "人件費",
  "報酬",
  "取締役会",
  "監査委員会",
  "指名委員会",
  "新店舗",
  "店舗工事",
  "IT",
  "人事",
  "財務",
  "マーケティング",
  "日本本社",
  "ガバナンス",
  "リスク",
  "ベンダー",
  "ポリシー",
  "戦略",
  "オペレーション",
  "組織文化",
  "コミュニケーション課題",
];
