import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const [started] = await db
    .update(events)
    .set({ startTime: new Date() })
    .where(and(eq(events.id, id), isNull(events.startTime)))
    .returning();
  if (started) return NextResponse.json({ event: started });

  // Already started (e.g. from another device) — keep the original start time.
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}
