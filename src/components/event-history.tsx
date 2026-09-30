"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher, failureText } from "@/lib/fetcher";
import type { EventListRow } from "@/lib/types";
import { LiveOrders } from "@/components/live-orders";
import { SummaryView } from "@/components/summary-view";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  const [pendingDelete, setPendingDelete] = useState<EventListRow | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const events = data?.events ?? [];

  async function confirmDelete() {
    const ev = pendingDelete;
    if (!ev) return;
    setPendingDelete(null);
    setError(null);
    try {
      const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      if (expanded?.id === ev.id) setExpanded(null);
      mutate();
    } catch (err) {
      setError(`Couldn't delete "${ev.name}" — ${failureText(err)}. Try again.`);
    }
  }

  async function saveRename(ev: EventListRow) {
    const name = editing?.name.trim();
    if (!name || name === ev.name) return;
    setError(null);
    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      setEditing(null);
      mutate();
    } catch (err) {
      setError(`Couldn't rename "${ev.name}" — ${failureText(err)}. Try again.`);
    }
  }

  function toggle(id: string, view: "live" | "summary") {
    setExpanded((cur) => (cur?.id === id && cur.view === view ? null : { id, view }));
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-cream">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-espresso">Past Events</h1>
          <Link href="/" className="text-sm text-muted underline">
            Back
          </Link>
        </div>

        {error && (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-sm font-medium text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}
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
                {editing?.id === ev.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ id: ev.id, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(ev);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-border px-3 py-2 font-bold text-espresso"
                    />
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="min-h-11 shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-espresso active:bg-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveRename(ev)}
                      disabled={!editing.name.trim() || editing.name.trim() === ev.name}
                      className="min-h-11 shrink-0 rounded-lg bg-espresso px-3 py-2 text-sm font-medium text-cream disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-espresso">{ev.name}</div>
                      <div className="text-xs text-muted">
                        {formatDate(ev.eventDate)} · {ev.orderCount} order
                        {ev.orderCount === 1 ? "" : "s"}
                        {!ev.startTime && " · not started"}
                        {ev.startTime && !ev.endTime && " · in progress"}
                      </div>
                      <div className="text-xs text-muted/60">{ev.id}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ id: ev.id, name: ev.name })}
                        className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-medium text-espresso active:bg-surface"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(ev)}
                        className="min-h-11 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 active:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

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

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this event?"
          body={`Delete "${pendingDelete.name}" (${formatDate(pendingDelete.eventDate)}) and all ${pendingDelete.orderCount} order(s)? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
