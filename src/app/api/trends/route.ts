import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders, materialCounts } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { buildEventTrends } from "@/lib/trends";

export async function GET() {
  const db = getDb();
  const notDeleted = eq(orders.deleted, false);

  const [eventRows, totals, itemMilkCounts, manualCounts] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        eventDate: events.eventDate,
        createdAt: events.createdAt,
      })
      .from(events),
    db
      .select({ eventId: orders.eventId, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(notDeleted)
      .groupBy(orders.eventId),
    db
      .select({
        eventId: orders.eventId,
        item: orders.item,
        milk: orders.milk,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(notDeleted, isNotNull(orders.milk)))
      .groupBy(orders.eventId, orders.item, orders.milk),
    db
      .select({
        eventId: materialCounts.eventId,
        materialKey: materialCounts.materialKey,
        containersUsed: materialCounts.containersUsed,
      })
      .from(materialCounts),
  ]);

  return NextResponse.json({
    events: buildEventTrends(eventRows, totals, itemMilkCounts, manualCounts),
  });
}
