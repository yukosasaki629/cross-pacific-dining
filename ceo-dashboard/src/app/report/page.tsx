import { composeReport } from "@/lib/report";
import { AppHeader } from "@/components/AppHeader";
import { ReportEditor } from "./ReportEditor";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const initial = await composeReport();
  return (
    <div>
      <AppHeader title="共有用レポート" subtitle="社長に送るサマリー" />
      <div className="px-3 py-4">
        <ReportEditor initial={initial} />
      </div>
    </div>
  );
}
