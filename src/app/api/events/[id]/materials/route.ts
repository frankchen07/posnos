import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, materialCounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MILKS } from "@/lib/menu";
import { milkMaterialKey } from "@/lib/materials";

const VALID_MATERIAL_KEYS = new Set(MILKS.map((m) => milkMaterialKey(m.key)));

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const materialKey = typeof body.materialKey === "string" ? body.materialKey : null;
  const containersUsed = Number(body.containersUsed);

  if (!materialKey || !VALID_MATERIAL_KEYS.has(materialKey)) {
    return NextResponse.json({ error: "invalid materialKey" }, { status: 400 });
  }
  if (!Number.isFinite(containersUsed) || containersUsed < 0 || containersUsed > 9999.99) {
    return NextResponse.json({ error: "invalid containersUsed" }, { status: 400 });
  }

  const db = getDb();

  const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, id));
  if (!event) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  const rowId = `${id}-${materialKey}`;
  const value = containersUsed.toFixed(2);
  await db
    .insert(materialCounts)
    .values({ id: rowId, eventId: id, materialKey, containersUsed: value })
    .onConflictDoUpdate({
      target: materialCounts.id,
      set: { containersUsed: value, updatedAt: new Date() },
    });

  return NextResponse.json({ materialKey, containersUsed });
}
