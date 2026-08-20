"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { EventListRow } from "@/lib/types";
import { LiveOrders } from "@/components/live-orders";
import { SummaryView } from "@/components/summary-view";

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EventHistory() {
  const { data, mutate } = useSWR<{ events: EventListRow[] }>(
    "/api/events",
    fetcher
  );
  const [expanded, setExpanded] = useState<{ id: string; view: "live" | "summary" } | null>(
    null
  );

  const events = data?.events ?? [];

  async function handleDelete(ev: EventListRow) {
    const confirmed = window.confirm(
      `Delete "${ev.name}" (${formatDate(ev.eventDate)}) and all ${ev.orderCount} order(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
    if (expanded?.id === ev.id) setExpanded(null);
    mutate();
  }

  function toggle(id: string, view: "live" | "summary") {
    setExpanded((cur) => (cur?.id === id && cur.view === view ? null : { id, view }));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-cream">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-espresso">Past Events</h1>
        <Link href="/" className="text-sm text-muted underline">
          Back
        </Link>
      </header>

      <main className="flex-1 p-4">
        {!data ? (
          <p className="py-8 text-center text-muted">Loading…</p>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-muted">No events yet.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-espresso">{ev.name}</div>
                    <div className="text-xs text-muted">
                      {formatDate(ev.eventDate)} · {ev.orderCount} order
                      {ev.orderCount === 1 ? "" : "s"}
                      {!ev.startTime && " · not started"}
                      {ev.startTime && !ev.endTime && " · in progress"}
                    </div>
                    <div className="text-xs text-muted/60">{ev.id}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev)}
                    className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 active:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(ev.id, "live")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      expanded?.id === ev.id && expanded.view === "live"
                        ? "border-espresso bg-espresso text-cream"
                        : "border-border text-espresso"
                    }`}
                  >
                    Live Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(ev.id, "summary")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      expanded?.id === ev.id && expanded.view === "summary"
                        ? "border-espresso bg-espresso text-cream"
                        : "border-border text-espresso"
                    }`}
                  >
                    Summary
                  </button>
                </div>

                {expanded?.id === ev.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    {expanded.view === "live" ? (
                      <LiveOrders eventId={ev.id} />
                    ) : (
                      <SummaryView eventId={ev.id} />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
