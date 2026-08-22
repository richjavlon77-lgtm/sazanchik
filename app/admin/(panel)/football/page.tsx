import { db } from "@/db";
import { footballEvents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { FootballManager, type EventRow } from "@/components/admin/FootballManager";

export const dynamic = "force-dynamic";

export default async function FootballAdminPage() {
  const rows = await db
    .select()
    .from(footballEvents)
    .orderBy(desc(footballEvents.startsAt));

  const list: EventRow[] = rows.map((m) => ({
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    startsAt: m.startsAt.toISOString(),
    league: m.league,
    note: m.note,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl">⚽ Трансляции матчей</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Добавь матчи — на сайте появится блок «Смотри матч у нас».
        </p>
      </div>
      <FootballManager initial={list} />
    </div>
  );
}
