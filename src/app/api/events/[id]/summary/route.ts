import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders, materialCounts } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { MILKS, type ItemKey, type MilkKey } from "@/lib/menu";
import { MILK_OZ_PER_DRINK, MILK_CONTAINER_OZ, milkMaterialKey } from "@/lib/materials";

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

  const byItemMilk = await db
    .select({
      item: orders.item,
      milk: orders.milk,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(notDeleted, isNotNull(orders.milk)))
    .groupBy(orders.item, orders.milk);

  const manualCounts = await db
    .select({
      materialKey: materialCounts.materialKey,
      containersUsed: materialCounts.containersUsed,
    })
    .from(materialCounts)
    .where(eq(materialCounts.eventId, id));
  const manualByKey = new Map(
    manualCounts.map((row) => [row.materialKey, Number(row.containersUsed)])
  );

  const milkMaterials = MILKS.map((m) => {
    const key = m.key as MilkKey;
    const calculatedOz = byItemMilk
      .filter((row) => row.milk === key)
      .reduce(
        (sum, row) => sum + row.count * (MILK_OZ_PER_DRINK[row.item as ItemKey] ?? 0),
        0
      );
    const containerOz = MILK_CONTAINER_OZ[key];
    const materialKey = milkMaterialKey(key);
    return {
      key,
      label: m.label,
      calculatedOz,
      containerOz,
      calculatedContainers: calculatedOz / containerOz,
      manualContainers: manualByKey.get(materialKey) ?? null,
    };
  });

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
    materials: { milk: milkMaterials },
  });
}
