import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { BriefEditor } from "./BriefEditor";
import { startOfWeek, fmtDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function WeeklyBriefPage() {
  const weekStart = startOfWeek();
  const brief = await prisma.weeklyBrief.findFirst({ where: { weekOf: weekStart } });
  const history = await prisma.weeklyBrief.findMany({
    orderBy: { weekOf: "desc" },
    take: 8,
  });

  return (
    <div>
      <PageHeader
        title="週次エグゼクティブ・ブリーフ"
        subtitle={`${fmtDate(weekStart)} の週 · 登録済みの構造化データから生成`}
      />

      <BriefEditor
        existing={brief ? { id: brief.id, markdown: brief.markdown } : null}
        history={history.map((h) => ({ id: h.id, weekOf: h.weekOf.toISOString() }))}
      />
    </div>
  );
}
