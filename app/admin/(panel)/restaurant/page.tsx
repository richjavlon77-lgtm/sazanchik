import { db } from "@/db";
import { restaurant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RestaurantForm } from "@/components/admin/RestaurantForm";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantPage() {
  const [r] = await db.select().from(restaurant).where(eq(restaurant.id, 1));

  const initial = {
    name: r?.name ?? "Сазанчик CITY",
    taglineRu: r?.taglineRu ?? "",
    taglineUz: r?.taglineUz ?? "",
    taglineEn: r?.taglineEn ?? "",
    addressRu: r?.addressRu ?? "",
    addressUz: r?.addressUz ?? "",
    addressEn: r?.addressEn ?? "",
    phone: r?.phone ?? "",
    hoursRu: r?.hoursRu ?? "",
    hoursUz: r?.hoursUz ?? "",
    hoursEn: r?.hoursEn ?? "",
    instagram: r?.instagram ?? "",
  };

  return (
    <div>
      <h1 className="mb-1 font-heading text-3xl">Информация о ресторане</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Эти данные показаны в Hero, футере и Schema.org.
      </p>
      <RestaurantForm initial={initial} />
    </div>
  );
}
