// 画面で選択肢として並べる値。DBにそのまま日本語で保存。
export const PROJECT_STATUS = ["順調", "注意", "遅延", "停止中", "完了"] as const;
export const RISK_LEVEL = ["低", "中", "高"] as const;
export const PRIORITY = ["低", "中", "高"] as const;
export const TASK_STATUS = ["未着手", "進行中", "待機中", "完了", "ブロック"] as const;
export const DECISION_STATUS = ["未対応", "検討中", "判断済", "中止"] as const;
export const RISK_STATUS = ["未対応", "対応中", "解消"] as const;
export const FOLLOWUP_STATUS = ["未対応", "進行中", "完了"] as const;
