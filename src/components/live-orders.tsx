"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { itemLabel } from "@/lib/menu";
import type { OrderRow } from "@/lib/types";

export function LiveOrders({ eventId }: { eventId: string }) {
  const { data, mutate } = useSWR<{ orders: OrderRow[] }>(
    `/api/events/${eventId}/orders`,
    fetcher,
    { refreshInterval: 2500 }
  );

  const orders = data?.orders ?? [];

  async function handleDelete(orderId: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: true }),
    });
    mutate();
  }

  if (orders.length === 0) {
    return <p className="py-8 text-center text-muted">No orders yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between py-3">
          <div>
            <div className="text-xs text-muted">
              #{order.seq} · {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="font-medium text-espresso">{itemLabel(order.item)}</div>
            <div className="font-mono text-sm text-muted">{order.abbreviation}</div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(order.id)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 active:bg-red-50"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
