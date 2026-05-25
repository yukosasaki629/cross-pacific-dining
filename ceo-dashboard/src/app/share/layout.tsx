import "../globals.css";

// 共有ビュー専用のレイアウト — ボトムナビは隠してシンプルに。
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
