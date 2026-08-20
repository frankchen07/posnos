import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const notDeleted = and(eq(orders.eventId, id), eq(orders.deleted, false));

  const byItem = await db
    .select({ key: orders.item, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(notDeleted)
    .groupBy(orders.item);

  const byMilk = await db
    .select({ key: orders.milk, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(notDeleted)
    .groupBy(orders.milk);

  const bySyrup = await db
    .select({ key: orders.syrup, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(notDeleted)
    .groupBy(orders.syrup);

  const byTemp = await db
    .select({ key: orders.temp, count: sql<number>`count(*)::int` })
    .from(orders)
    .where(notDeleted)
    .groupBy(orders.temp);

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      decafCount: sql<number>`count(*) filter (where ${orders.decaf})::int`,
      boastStyleCount: sql<number>`count(*) filter (where ${orders.boastStyle})::int`,
      shotsCount: sql<number>`count(*) filter (where ${orders.shotsAdded} > 0)::int`,
    })
    .from(orders)
    .where(notDeleted);

  return NextResponse.json({
    event,
    total: totals?.total ?? 0,
    decafCount: totals?.decafCount ?? 0,
    boastStyleCount: totals?.boastStyleCount ?? 0,
    shotsCount: totals?.shotsCount ?? 0,
    byItem,
    byMilk,
    bySyrup,
    byTemp,
  });
}
