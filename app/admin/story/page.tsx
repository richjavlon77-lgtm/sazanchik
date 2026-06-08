import { db } from "@/db";
import { storyChapters } from "@/db/schema";
import { asc } from "drizzle-orm";
import { StoryForm } from "@/components/admin/StoryForm";

export const dynamic = "force-dynamic";

export default async function AdminStoryPage() {
  const rows = await db
    .select()
    .from(storyChapters)
    .orderBy(asc(storyChapters.sortOrder));

  const initial = rows.length
    ? rows.map((r) => ({
        id: r.id,
        titleRu: r.titleRu,
        titleUz: r.titleUz,
        titleEn: r.titleEn,
        bodyRu: r.bodyRu,
        bodyUz: r.bodyUz,
        bodyEn: r.bodyEn,
      }))
    : [
        {
          titleRu: "",
          titleUz: "",
          titleEn: "",
          bodyRu: "",
          bodyUz: "",
          bodyEn: "",
        },
      ];

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl">История ресторана</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Главы, которые видны в модалке «Наша история» на главной странице.
      </p>
      <StoryForm initial={initial} />
    </div>
  );
}
