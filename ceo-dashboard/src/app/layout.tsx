import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav, TopNav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "CEOダッシュボード",
  description: "重要プロジェクト・リスク・判断が必要な事項を1分で把握",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <TopNav />
        <div className="mx-auto max-w-5xl pb-24 md:pb-8">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
