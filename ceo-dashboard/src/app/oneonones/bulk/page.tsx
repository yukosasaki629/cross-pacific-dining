import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { BulkImportForm } from "./BulkImportForm";

export const dynamic = "force-dynamic";

export default async function BulkImportPage() {
  const people = await prisma.person.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return (
    <div>
      <AppHeader
        title="1on1 一括取り込み"
        subtitle="週次サマリーを丸ごと貼り付けて、人別に自動分割"
        backHref="/oneonones"
      />
      <div className="px-3 py-4">
        <BulkImportForm initialPeople={people} />
      </div>
    </div>
  );
}
