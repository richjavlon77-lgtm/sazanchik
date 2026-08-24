import Link from "next/link";
import { notFound } from "next/navigation";
import { DishForm } from "@/components/admin/DishForm";
import { getAllCategoriesForForm, getDishById } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cats, found] = await Promise.all([
    getAllCategoriesForForm(),
    getDishById(id),
  ]);

  if (!found || !found.categorySlug) notFound();
  const { dish, variants, categorySlug } = found;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/menu"
          className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          ← Меню
        </Link>
        <h1 className="font-heading text-3xl">{dish.nameRu}</h1>
        <p className="mt-1 text-xs text-muted-foreground">slug: {dish.slug}</p>
      </div>
      <DishForm
        dishId={dish.id}
        categories={cats}
        initial={{
          categorySlug,
          slug: dish.slug,
          nameRu: dish.nameRu,
          nameUz: dish.nameUz,
          nameTr: dish.nameTr ?? "",
          nameEn: dish.nameEn,
          descriptionRu: dish.descriptionRu ?? "",
          descriptionUz: dish.descriptionUz ?? "",
          descriptionTr: dish.descriptionTr ?? "",
          descriptionEn: dish.descriptionEn ?? "",
          price: dish.price ?? null,
          weight: dish.weight ?? "",
          imageUrl: dish.imageUrl ?? "",
          spicy: (dish.spicy ?? null) as 1 | 2 | 3 | null,
          diet: (dish.diet as string[]) ?? [],
          calories: dish.calories ?? null,
          allergens: (dish.allergens as string[]) ?? [],
          isPublished: dish.isPublished,
          sortOrder: dish.sortOrder,
          variants: variants.map((v) => ({
            labelRu: v.labelRu,
            labelUz: v.labelUz,
            labelEn: v.labelEn,
            labelTr: v.labelTr ?? undefined,
            price: v.price,
            stockFactor: v.stockFactor,
          })),
        }}
      />
    </div>
  );
}
