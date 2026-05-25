// 内部値（英語）と画面表示（日本語）の対応。
// DBには英語のまま保存し、UI側で日本語に変換します。

export const MEETING_TYPE_LABELS: Record<string, string> = {
  "CEO 1:1": "CEO 1on1",
  "Executive Meeting": "経営会議",
  "Board Meeting Prep": "取締役会 準備",
  "Audit Committee": "監査委員会",
  "Compensation Committee": "報酬委員会",
  "Nominating Committee": "指名委員会",
  "Cross-functional Project": "部門横断プロジェクト",
  "Japan HQ Alignment": "日本本社との調整",
  "AI / Automation": "AI / 自動化",
  "Other": "その他",
};

export const CONFIDENTIALITY_LABELS: Record<string, string> = {
  Internal: "社内",
  Confidential: "機密",
  Restricted: "厳秘",
};

export const PRIORITY_LEVEL_LABELS: Record<string, string> = {
  High: "高",
  Medium: "中",
  Low: "低",
};

export const PRIORITY_STATUS_LABELS: Record<string, string> = {
  "On Track": "順調",
  "At Risk": "要注意",
  "Delayed": "遅延",
  "Paused": "一時停止",
  "Completed": "完了",
};

export const ACTION_STATUS_LABELS: Record<string, string> = {
  "Not Started": "未着手",
  "In Progress": "進行中",
  "Waiting": "待機中",
  "Completed": "完了",
  "Blocked": "ブロック中",
};

export const URGENCY_LABELS: Record<string, string> = {
  High: "高",
  Medium: "中",
  Low: "低",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  "Active": "進行中",
  "At Risk": "要注意",
  "Blocked": "ブロック中",
  "Paused": "一時停止",
  "Completed": "完了",
};

export const DECISION_NEEDED_STATUS_LABELS: Record<string, string> = {
  "Open": "未対応",
  "Awaiting Info": "情報待ち",
  "Awaiting CEO": "CEO判断待ち",
  "Decided": "決定済",
  "Cancelled": "中止",
};

export const RISK_STATUS_LABELS: Record<string, string> = {
  Open: "未対応",
  Mitigating: "対応中",
  Resolved: "解決済",
  Accepted: "受容",
};

export function labelFor(value: string | null | undefined, dict: Record<string, string>): string {
  if (!value) return "—";
  return dict[value] ?? value;
}
