import { AppHeader } from "@/components/AppHeader";
import { SmartPasteForm } from "./SmartPasteForm";

export const dynamic = "force-dynamic";

export default function SmartPastePage() {
  return (
    <div>
      <AppHeader
        title="まとめて貼り付け"
        subtitle="1週間分のメモを丸ごと → 自動で人別の1on1+話題に分割"
        backHref="/oneonones"
      />
      <div className="px-3 py-4">
        <SmartPasteForm />
      </div>
    </div>
  );
}
