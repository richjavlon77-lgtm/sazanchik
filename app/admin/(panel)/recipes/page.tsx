import { loadRecipes } from "@/lib/recipe-data";
import { RecipeManager } from "@/components/admin/RecipeManager";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const data = await loadRecipes();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">Рецепты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Что в каком блюде. Себестоимость и маржа считаются из цен товаров на
          складе. При заказе ингредиенты списываются автоматически.
        </p>
      </div>
      <RecipeManager data={data} />
    </div>
  );
}
