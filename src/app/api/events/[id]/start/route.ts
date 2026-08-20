import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const [event] = await db
    .update(events)
    .set({ startTime: new Date() })
    .where(eq(events.id, id))
    .returning();

  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}
