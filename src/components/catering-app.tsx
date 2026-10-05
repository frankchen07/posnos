"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher, failureText, HttpError } from "@/lib/fetcher";
import { ITEMS, type ItemKey, type OrderSelection } from "@/lib/menu";
import type { EventRow } from "@/lib/types";
import { OrderModal } from "@/components/order-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LiveOrders } from "@/components/live-orders";
import { SummaryView } from "@/components/summary-view";
import { JoinEventList } from "@/components/join-event-list";

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

export function CateringApp({ initialEventId }: { initialEventId: string | null }) {
  const [activeEventId, setActiveEventId] = useState<string | null>(initialEventId);
  const [nameInput, setNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"order" | "live" | "summary">("order");
  const [modalItem, setModalItem] = useState<ItemKey | null>(null);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, error: loadError, mutate } = useSWR<{ event: EventRow }>(
    activeEventId ? `/api/events/${activeEventId}` : null,
    fetcher,
    {
      refreshInterval: 3000,
      onError: (err) => {
        if (err instanceof HttpError && err.status === 404) {
          switchEvent();
          setError("That event no longer exists.");
        }
      },
    }
  );
  const event = data?.event ?? null;
  const elapsed = useElapsed(event?.startTime ?? null, event?.endTime ?? null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Keep the active event in the URL so a reload or a discarded tab lands
  // back on the same event instead of the join screen.
  function openEvent(id: string) {
    setActiveEventId(id);
    window.history.replaceState(null, "", `?event=${encodeURIComponent(id)}`);
  }

  function switchEvent() {
    setActiveEventId(null);
    window.history.replaceState(null, "", "/");
    setNameInput("");
    setConfirmingEnd(false);
    setMenuOpen(false);
    setError(null);
  }

  async function createOrJoinEvent() {
    const name = nameInput.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      const json = await res.json();
      openEvent(json.event.id);
    } catch (err) {
      setError(`Couldn't open the event — ${failureText(err)}. Try again.`);
    } finally {
      setCreating(false);
    }
  }

  async function startTimer() {
    if (!activeEventId) return;
    setError(null);
    try {
      const res = await fetch(`/api/events/${activeEventId}/start`, { method: "POST" });
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      mutate();
    } catch (err) {
      setError(`Couldn't start the event — ${failureText(err)}. Try again.`);
    }
  }

  async function confirmEnd() {
    if (!activeEventId) return;
    setConfirmingEnd(false);
    if (event?.endTime) {
      setError("That event was already ended on another device.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/events/${activeEventId}/end`, { method: "POST" });
      if (res.status === 409) {
        setError("That event was already ended on another device.");
        mutate();
        return;
      }
      if (!res.ok) throw new Error(`server returned ${res.status}`);
      mutate();
    } catch (err) {
      setError(`Couldn't end the event — ${failureText(err)}. Try again.`);
    }
  }

  // Throws on failure so the modal stays open and shows the error.
  async function submitOrder(selection: OrderSelection) {
    if (!activeEventId) return;
    const res = await fetch(`/api/events/${activeEventId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selection),
    });
    if (!res.ok) throw new Error(`server returned ${res.status}`);
    setModalItem(null);
    globalMutate(`/api/events/${activeEventId}/orders`);
    globalMutate(`/api/events/${activeEventId}/summary`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-cream">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-2">
        {!activeEventId ? (
          <div className="py-1">
            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter catering event name"
                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-base text-espresso placeholder:text-muted"
              />
              <button
                type="button"
                disabled={creating || !nameInput.trim()}
                onClick={createOrJoinEvent}
                className="shrink-0 rounded-lg bg-espresso px-4 py-2 font-medium text-cream disabled:opacity-40"
              >
                Create event
              </button>
            </div>
            <Link href="/history" className="mt-2 inline-block text-sm text-muted underline">
              Past events
            </Link>
          </div>
        ) : !event ? (
          <div className="flex min-h-11 items-center justify-between gap-3">
            <p className="text-muted">
              {loadError ? "Couldn't load the event — retrying…" : "Loading…"}
            </p>
            <button
              type="button"
              onClick={switchEvent}
              className="min-h-11 shrink-0 text-sm text-muted underline"
            >
              New event
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate font-bold text-espresso">{event.name}</div>
            {elapsed && (
              <span className="shrink-0 font-mono text-lg font-semibold text-espresso">
                {elapsed}
              </span>
            )}
            {!event.startTime && (
              <button
                type="button"
                onClick={startTimer}
                className="min-h-11 shrink-0 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
              >
                Start
              </button>
            )}
            {event.startTime && !event.endTime && (
              <button
                type="button"
                onClick={() => setConfirmingEnd(true)}
                className="min-h-11 shrink-0 rounded-lg bg-red-600 px-4 py-2 font-medium text-white"
              >
                End
              </button>
            )}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted active:bg-surface"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-border bg-white py-1 shadow-lg">
                    <Link
                      href="/history"
                      className="block px-4 py-3 text-espresso active:bg-surface"
                    >
                      Past events
                    </Link>
                    <button
                      type="button"
                      onClick={switchEvent}
                      className="block w-full px-4 py-3 text-left text-espresso active:bg-surface"
                    >
                      New event
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
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

      {!activeEventId && (
        <main className="flex-1 p-4">
          <JoinEventList onJoin={openEvent} />
        </main>
      )}

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
                <div className="space-y-3">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.key}>
                      <h3 className="mb-1 text-xs font-semibold uppercase text-muted">
                        {cat.label}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {ITEMS.filter((item) => item.category === cat.key).map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setModalItem(item.key)}
                            className="h-24 rounded-2xl border-2 border-border bg-white px-2 text-base leading-tight font-semibold text-espresso shadow-sm active:bg-surface"
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

      {confirmingEnd && event?.startTime && !event.endTime && (
        <ConfirmDialog
          title="End this event?"
          body={`Ending "${event.name}" closes order entry for everyone.`}
          confirmLabel="End event"
          onConfirm={confirmEnd}
          onCancel={() => setConfirmingEnd(false)}
        />
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
