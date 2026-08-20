import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { ITEMS, MILKS, SYRUPS, buildAbbreviation } from "@/lib/menu";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.eventId, id), eq(orders.deleted, false)))
    .orderBy(desc(orders.seq));
  return NextResponse.json({ orders: rows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = ITEMS.find((i) => i.key === body.item)?.key;
  const temp = body.temp === "iced" ? "iced" : body.temp === "hot" ? "hot" : null;
  const milk = body.milk ? MILKS.find((m) => m.key === body.milk)?.key ?? null : null;
  const syrup = body.syrup
    ? SYRUPS.find((s) => s.key === body.syrup)?.key ?? null
    : null;
  const shotsAdded = Number.isInteger(body.shotsAdded) ? body.shotsAdded : 0;
  const decaf = Boolean(body.decaf);
  const boastStyle = Boolean(body.boastStyle);

  if (!item || !temp) {
    return NextResponse.json(
      { error: "item and temp are required" },
      { status: 400 }
    );
  }

  const db = getDb();

  const [existing] = await db
    .select({ startTime: events.startTime, endTime: events.endTime })
    .from(events)
    .where(eq(events.id, id));

  if (!existing) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  if (!existing.startTime) {
    return NextResponse.json(
      { error: "event has not been started" },
      { status: 400 }
    );
  }
  if (existing.endTime) {
    return NextResponse.json(
      { error: "event has already ended" },
      { status: 400 }
    );
  }

  const [event] = await db
    .update(events)
    .set({ orderCounter: sql`${events.orderCounter} + 1` })
    .where(eq(events.id, id))
    .returning({ orderCounter: events.orderCounter });

  const seq = event.orderCounter;
  const orderId = `${id}-${seq}`;
  const abbreviation = buildAbbreviation({
    item,
    temp,
    milk,
    shotsAdded,
    syrup,
    decaf,
    boastStyle,
  });

  const [order] = await db
    .insert(orders)
    .values({
      id: orderId,
      eventId: id,
      seq,
      item,
      temp,
      milk,
      shotsAdded,
      syrup,
      decaf,
      boastStyle,
      abbreviation,
    })
    .returning();

  return NextResponse.json({ order });
}
