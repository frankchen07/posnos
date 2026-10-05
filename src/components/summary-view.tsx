"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { itemLabel, milkLabel, syrupLabel } from "@/lib/menu";
import { milkMaterialKey } from "@/lib/materials";
import type { MilkMaterialRow, SummaryResponse } from "@/lib/types";

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-espresso">{label}</span>
      <span className="font-mono font-semibold text-espresso">{count}</span>
    </div>
  );
}

function MaterialRow({
  eventId,
  material,
  onSaved,
}: {
  eventId: string;
  material: MilkMaterialRow;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(material.manualContainers?.toString() ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [prevManual, setPrevManual] = useState(material.manualContainers);

  // Resync from the server value while the field isn't being actively edited,
  // so a save from another station shows up here on the next poll.
  if (material.manualContainers !== prevManual) {
    setPrevManual(material.manualContainers);
    if (!dirty) {
      setValue(material.manualContainers?.toString() ?? "");
      setError(false);
    }
  }

  async function save() {
    if (value.trim() === "") {
      setDirty(false);
      return;
    }
    const containersUsed = Number(value);
    if (!Number.isFinite(containersUsed) || containersUsed < 0 || containersUsed > 9999.99) {
      setError(true);
      return;
    }
    if (containersUsed === material.manualContainers) {
      setDirty(false);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/events/${eventId}/materials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialKey: milkMaterialKey(material.key), containersUsed }),
      });
      if (!res.ok) throw new Error("save failed");
      setDirty(false);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const delta =
    material.manualContainers != null
      ? material.manualContainers - material.calculatedContainers
      : null;

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between">
        <span className="text-espresso">{material.label}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setDirty(true);
          }}
          onBlur={save}
          disabled={saving}
          placeholder="actual"
          className="w-28 rounded-lg border-2 border-border px-2 py-1 text-right font-mono text-espresso"
        />
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {material.calculatedContainers.toFixed(1)} containers · {material.calculatedOz.toFixed(0)}oz
          calculated
        </span>
        {error ? (
          <span className="text-red-600">save failed — try again</span>
        ) : (
          delta != null && (
            <span className={delta === 0 ? "" : delta > 0 ? "text-emerald-600" : "text-red-600"}>
              {delta === 0 ? "on target" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} vs calc`}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export function SummaryView({ eventId }: { eventId: string }) {
  const { data, mutate } = useSWR<SummaryResponse>(
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

      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Raw Materials — Milk</h3>
        {data.materials.milk.map((material) => (
          <MaterialRow
            key={material.key}
            eventId={eventId}
            material={material}
            onSaved={() => mutate()}
          />
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
