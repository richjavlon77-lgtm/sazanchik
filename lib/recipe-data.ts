import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dishes, categories, dishVariants, ingredients, recipeItems } from "@/db/schema";

export type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
};

export type RecipeLine = {
  ingredientId: string;
  name: string;
  unit: string;
  qty: number;
  costPerUnit: number;
  lineCost: number;
};

export type DishRecipe = {
  id: string;
  name: string;
  category: string;
  price: number | null; // effective price (base or cheapest variant)
  cost: number; // food cost from recipe
  margin: number | null; // price − cost
  marginPct: number | null;
  recipe: RecipeLine[];
};

export type RecipeData = {
  ingredients: IngredientOption[];
  dishes: DishRecipe[];
};

export async function loadRecipes(): Promise<RecipeData> {
  const [dishRows, variantRows, ingRows, recipeRows] = await Promise.all([
    db
      .select({
        id: dishes.id,
        name: dishes.nameRu,
        price: dishes.price,
        category: categories.nameRu,
        catSort: categories.sortOrder,
        dishSort: dishes.sortOrder,
      })
      .from(dishes)
      .innerJoin(categories, eq(dishes.categoryId, categories.id))
      .orderBy(asc(categories.sortOrder), asc(dishes.sortOrder)),
    db.select().from(dishVariants),
    db.select().from(ingredients).orderBy(asc(ingredients.name)),
    db
      .select({
        dishId: recipeItems.dishId,
        ingredientId: recipeItems.ingredientId,
        qty: recipeItems.qty,
        name: ingredients.name,
        unit: ingredients.unit,
        costPerUnit: ingredients.costPerUnit,
      })
      .from(recipeItems)
      .innerJoin(ingredients, eq(recipeItems.ingredientId, ingredients.id)),
  ]);

  // cheapest variant price per dish (for dishes without a base price)
  const minVariant = new Map<string, number>();
  for (const v of variantRows) {
    const cur = minVariant.get(v.dishId);
    if (cur == null || v.price < cur) minVariant.set(v.dishId, v.price);
  }

  const recipeByDish = new Map<string, RecipeLine[]>();
  for (const r of recipeRows) {
    if (!recipeByDish.has(r.dishId)) recipeByDish.set(r.dishId, []);
    recipeByDish.get(r.dishId)!.push({
      ingredientId: r.ingredientId,
      name: r.name,
      unit: r.unit,
      qty: r.qty,
      costPerUnit: r.costPerUnit,
      lineCost: Math.round(r.qty * r.costPerUnit),
    });
  }

  const dishList: DishRecipe[] = dishRows.map((d) => {
    const recipe = recipeByDish.get(d.id) ?? [];
    const cost = recipe.reduce((s, l) => s + l.lineCost, 0);
    const price = d.price ?? minVariant.get(d.id) ?? null;
    const margin = price != null ? price - cost : null;
    const marginPct =
      price != null && price > 0 ? Math.round((margin! / price) * 100) : null;
    return {
      id: d.id,
      name: d.name,
      category: d.category,
      price,
      cost,
      margin,
      marginPct,
      recipe,
    };
  });

  return {
    ingredients: ingRows.map((i) => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      costPerUnit: i.costPerUnit,
    })),
    dishes: dishList,
  };
}
