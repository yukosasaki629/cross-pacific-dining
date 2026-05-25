import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProviderBanner } from "@/components/layout/ProviderBanner";

export const metadata: Metadata = {
  title: "Chief of Staff OS",
  description: "ローカル・ファースト型 経営オペレーティングシステム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1">
            <ProviderBanner />
            <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
