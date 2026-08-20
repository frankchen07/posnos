"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { itemLabel, milkLabel, syrupLabel } from "@/lib/menu";
import type { SummaryResponse } from "@/lib/types";

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-espresso">{label}</span>
      <span className="font-mono font-semibold text-espresso">{count}</span>
    </div>
  );
}

export function SummaryView({ eventId }: { eventId: string }) {
  const { data } = useSWR<SummaryResponse>(
    `/api/events/${eventId}/summary`,
    fetcher,
    { refreshInterval: 4000 }
  );

  if (!data) return <p className="py-8 text-center text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-espresso px-4 py-3 text-center text-cream">
        <div className="text-3xl font-bold">{data.total}</div>
        <div className="text-sm text-cream/70">total drinks</div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase text-muted">By Drink</h3>
        {data.byItem.map((row) => (
          <CountRow key={row.key} label={itemLabel(row.key ?? "")} count={row.count} />
        ))}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase text-muted">By Milk</h3>
        {data.byMilk.map((row) => (
          <CountRow key={row.key ?? "none"} label={milkLabel(row.key) ?? "No Milk"} count={row.count} />
        ))}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase text-muted">By Temp</h3>
        {data.byTemp.map((row) => (
          <CountRow key={row.key} label={row.key === "iced" ? "Iced" : "Hot"} count={row.count} />
        ))}
      </div>

      {data.bySyrup.some((row) => row.key) && (
        <div>
          <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Syrup</h3>
          {data.bySyrup
            .filter((row) => row.key)
            .map((row) => (
              <CountRow key={row.key} label={syrupLabel(row.key) ?? ""} count={row.count} />
            ))}
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Mods</h3>
        <CountRow label="With extra shot(s)" count={data.shotsCount} />
        <CountRow label="Decaf" count={data.decafCount} />
        <CountRow label="Boast Style" count={data.boastStyleCount} />
      </div>
    </div>
  );
}
