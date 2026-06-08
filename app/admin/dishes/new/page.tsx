import Link from "next/link";
import { DishForm } from "@/components/admin/DishForm";
import { getAllCategoriesForForm } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function NewDishPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const cats = await getAllCategoriesForForm();
  const sp = await searchParams;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          ← Меню
        </Link>
        <h1 className="font-heading text-3xl">Новое блюдо</h1>
      </div>
      <DishForm
        dishId={null}
        categories={cats}
        initial={{ categorySlug: sp.category, diet: [], isPublished: true }}
      />
    </div>
  );
}
