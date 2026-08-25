"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { ITEMS, type ItemKey, type OrderSelection } from "@/lib/menu";
import type { EventRow } from "@/lib/types";
import { OrderModal } from "@/components/order-modal";
import { LiveOrders } from "@/components/live-orders";
import { SummaryView } from "@/components/summary-view";

const CATEGORIES = [
  { key: "milk", label: "Milk Drinks" },
  { key: "non-milk", label: "Non-Milk Drinks" },
  { key: "non-coffee", label: "Non-Coffee Drinks" },
] as const;

function useElapsed(startTime: string | null, endTime: string | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startTime || endTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (!startTime) return null;
  const end = endTime ? new Date(endTime).getTime() : now;
  const ms = Math.max(0, end - new Date(startTime).getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function CateringApp() {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"order" | "live" | "summary">("order");
  const [modalItem, setModalItem] = useState<ItemKey | null>(null);

  const { data, mutate } = useSWR<{ event: EventRow }>(
    activeEventId ? `/api/events/${activeEventId}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );
  const event = data?.event ?? null;
  const elapsed = useElapsed(event?.startTime ?? null, event?.endTime ?? null);

  function switchEvent() {
    setActiveEventId(null);
    setNameInput("");
  }

  async function createOrJoinEvent() {
    const name = nameInput.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      setActiveEventId(json.event.id);
    } finally {
      setCreating(false);
    }
  }

  async function startTimer() {
    if (!activeEventId) return;
    await fetch(`/api/events/${activeEventId}/start`, { method: "POST" });
    mutate();
  }

  async function endTimer() {
    if (!activeEventId) return;
    await fetch(`/api/events/${activeEventId}/end`, { method: "POST" });
    mutate();
  }

  async function submitOrder(selection: OrderSelection) {
    if (!activeEventId) return;
    await fetch(`/api/events/${activeEventId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selection),
    });
    setModalItem(null);
    globalMutate(`/api/events/${activeEventId}/orders`);
    globalMutate(`/api/events/${activeEventId}/summary`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-cream">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
        {!activeEventId || !event ? (
          <div>
            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Catering event name"
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-lg text-espresso placeholder:text-muted"
              />
              <button
                type="button"
                disabled={creating || !nameInput.trim()}
                onClick={createOrJoinEvent}
                className="rounded-lg bg-espresso px-4 py-2 font-medium text-cream disabled:opacity-40"
              >
                Go
              </button>
            </div>
            <Link href="/history" className="mt-2 inline-block text-sm text-muted underline">
              Past events
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-espresso">{event.name}</div>
              <div className="text-xs text-muted">{event.id}</div>
            </div>
            <div className="flex items-center gap-3">
              {elapsed && (
                <span className="font-mono text-lg font-semibold text-espresso">{elapsed}</span>
              )}
              {!event.startTime && (
                <button
                  type="button"
                  onClick={startTimer}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
                >
                  Start
                </button>
              )}
              {event.startTime && !event.endTime && (
                <button
                  type="button"
                  onClick={endTimer}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white"
                >
                  End
                </button>
              )}
              <Link href="/history" className="text-sm text-muted underline">
                Past events
              </Link>
              <button
                type="button"
                onClick={switchEvent}
                className="text-sm text-muted underline"
              >
                New event
              </button>
            </div>
          </div>
        )}
      </header>

      {activeEventId && event && (
        <>
          <nav className="flex border-b border-border bg-white">
            {(["order", "live", "summary"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-center text-sm font-semibold uppercase tracking-wide ${
                  tab === t ? "border-b-2 border-espresso text-espresso" : "text-muted"
                }`}
              >
                {t === "order" ? "Order" : t === "live" ? "Live" : "Summary"}
              </button>
            ))}
          </nav>

          <main className="flex-1 p-4">
            {tab === "order" &&
              (event.endTime ? (
                <p className="py-8 text-center text-muted">
                  Event has ended. Order entry is closed.
                </p>
              ) : event.startTime ? (
                <div className="space-y-6">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.key}>
                      <h3 className="mb-2 text-sm font-semibold uppercase text-muted">
                        {cat.label}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {ITEMS.filter((item) => item.category === cat.key).map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setModalItem(item.key)}
                            className="rounded-2xl border-2 border-border bg-white py-6 text-lg font-semibold text-espresso shadow-sm active:bg-surface"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted">
                  Press Start to begin taking orders.
                </p>
              ))}
            {tab === "live" && <LiveOrders eventId={activeEventId} />}
            {tab === "summary" && <SummaryView eventId={activeEventId} />}
          </main>
        </>
      )}

      {modalItem && (
        <OrderModal
          itemKey={modalItem}
          onClose={() => setModalItem(null)}
          onSubmit={submitOrder}
        />
      )}
    </div>
  );
}
