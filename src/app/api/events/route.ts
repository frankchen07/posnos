import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { buildEventId, todayDateString } from "@/lib/id";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      eventDate: events.eventDate,
      startTime: events.startTime,
      endTime: events.endTime,
      orderCounter: events.orderCounter,
      createdAt: events.createdAt,
      orderCount: sql<number>`count(${orders.id}) filter (where ${orders.deleted} = false)::int`,
    })
    .from(events)
    .leftJoin(orders, eq(orders.eventId, events.id))
    .groupBy(events.id)
    .orderBy(desc(events.eventDate), desc(events.createdAt));

  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = getDb();
  const eventDate = todayDateString();
  const id = buildEventId(name, eventDate);

  await db
    .insert(events)
    .values({ id, name, eventDate })
    .onConflictDoNothing();

  const [event] = await db.select().from(events).where(eq(events.id, id));
  return NextResponse.json({ event });
}
