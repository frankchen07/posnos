import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, orders } from "@/db/schema";
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.delete(orders).where(eq(orders.eventId, id));
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}
