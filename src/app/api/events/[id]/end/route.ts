import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const [ended] = await db
    .update(events)
    .set({ endTime: new Date() })
    .where(and(eq(events.id, id), isNotNull(events.startTime), isNull(events.endTime)))
    .returning();
  if (ended) return NextResponse.json({ event: ended });

  // Never overwrite an existing end time — it would corrupt the event's duration.
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const error = event.endTime ? "event has already ended" : "event has not been started";
  return NextResponse.json({ error, event }, { status: 409 });
}
