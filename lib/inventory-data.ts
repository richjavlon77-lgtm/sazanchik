import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingredients, stockMovements } from "@/db/schema";

export type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  low: boolean;
  value: number; // stock × costPerUnit
};

export type MovementRow = {
  id: string;
  name: string;
  unit: string;
  delta: number;
  reason: string;
  note: string | null;
  at: string;
};

export type InventoryData = {
  items: IngredientRow[];
  totalValue: number;
  lowCount: number;
  movements: MovementRow[];
};

const TZ = "Asia/Tashkent";

export async function loadInventory(): Promise<InventoryData> {
  const rows = await db
    .select()
    .from(ingredients)
    .orderBy(asc(ingredients.name));

  const items: IngredientRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    stock: r.stock,
    minStock: r.minStock,
    costPerUnit: r.costPerUnit,
    low: r.minStock > 0 && r.stock <= r.minStock,
    value: Math.round(r.stock * r.costPerUnit),
  }));

  const totalValue = items.reduce((s, i) => s + i.value, 0);
  const lowCount = items.filter((i) => i.low).length;

  const movRows = await db
    .select({
      id: stockMovements.id,
      name: ingredients.name,
      unit: ingredients.unit,
      delta: stockMovements.delta,
      reason: stockMovements.reason,
      note: stockMovements.note,
      at: sql<string>`to_char(${stockMovements.createdAt} at time zone ${TZ}, 'DD.MM HH24:MI')`,
    })
    .from(stockMovements)
    .innerJoin(ingredients, eq(stockMovements.ingredientId, ingredients.id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(25);

  return { items, totalValue, lowCount, movements: movRows };
}
