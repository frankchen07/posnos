"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { EventListRow } from "@/lib/types";

export function JoinEventList({ onJoin }: { onJoin: (id: string) => void }) {
  const { data } = useSWR<{ events: EventListRow[] }>("/api/events", fetcher, {
    refreshInterval: 3000,
  });

  const openEvents = (data?.events ?? []).filter((ev) => !ev.endTime);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase text-muted">Join an Event</h2>
      {!data ? (
        <p className="text-muted">Loading…</p>
      ) : openEvents.length === 0 ? (
        <p className="text-muted">No open events — start one above.</p>
      ) : (
        <ul className="space-y-2">
          {openEvents.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onJoin(ev.id)}
                className="w-full rounded-2xl border-2 border-border bg-white p-4 text-left shadow-sm active:bg-surface"
              >
                <div className="font-bold text-espresso">{ev.name}</div>
                <div className="text-xs text-muted">
                  {ev.orderCount} order{ev.orderCount === 1 ? "" : "s"}
                  {!ev.startTime && " · not started"}
                  {ev.startTime && !ev.endTime && " · in progress"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
