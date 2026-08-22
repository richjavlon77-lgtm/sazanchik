import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c] = await db.select().from(categories).where(eq(categories.id, id));
  if (!c) notFound();

  return (
    <div>
      <Link
        href="/admin/categories"
        className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
      >
        ← Категории
      </Link>
      <h1 className="mb-6 font-heading text-3xl">{c.nameRu}</h1>
      <CategoryForm
        catId={c.id}
        initial={{
          slug: c.slug,
          nameRu: c.nameRu,
          nameUz: c.nameUz,
          nameEn: c.nameEn,
          nameTr: c.nameTr ?? "",
          introRu: c.introRu ?? "",
          introUz: c.introUz ?? "",
          introEn: c.introEn ?? "",
          introTr: c.introTr ?? "",
          isPublished: c.isPublished,
          sortOrder: c.sortOrder,
        }}
      />
    </div>
  );
}
