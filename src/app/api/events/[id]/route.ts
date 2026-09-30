import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders, materialCounts } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  return NextResponse.json({ event });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = getDb();
  const [event] = await db
    .update(events)
    .set({ name })
    .where(eq(events.id, id))
    .returning();
  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.delete(orders).where(eq(orders.eventId, id));
  await db.delete(materialCounts).where(eq(materialCounts.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}
