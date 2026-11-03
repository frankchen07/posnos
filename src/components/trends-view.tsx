"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { MILKS } from "@/lib/menu";
import { filterTrends, type TrendRange } from "@/lib/trends";
import type { EventTrend } from "@/lib/types";

function formatShortDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

// Fixed-width columns so the chart scrolls inside its own box on a phone
// instead of squeezing labels into each other.
const COLUMN = "w-12 shrink-0";

function Bars({
  columns,
  value,
  max,
  heightClass,
}: {
  columns: EventTrend[];
  value: (c: EventTrend) => { n: number; text: string; estimated?: boolean };
  max: number;
  heightClass: string;
}) {
  return (
    <div className="flex gap-1">
      {columns.map((c) => {
        const v = value(c);
        return (
          <div key={c.id} className={`${COLUMN} flex flex-col`}>
            {/* pt-5 reserves room for the tallest bar's value label */}
            <div className={`${heightClass} flex flex-col justify-end pt-5`}>
              <div className="relative mx-1" style={{ height: `${max > 0 ? (v.n / max) * 100 : 0}%` }}>
                <div className="absolute inset-x-0 -top-5 text-center font-mono text-xs text-espresso">
                  {v.text}
                </div>
                <div
                  className={`h-full rounded-t ${
                    v.estimated ? "border-2 border-b-0 border-dashed border-espresso/50" : "bg-espresso"
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function XLabels({ columns, showSeries }: { columns: EventTrend[]; showSeries: boolean }) {
  return (
    <div className="flex gap-1 border-t border-border pt-1">
      {columns.map((c) => (
        <div key={c.id} className={`${COLUMN} text-center text-xs`}>
          <div className="text-espresso">{formatShortDate(c.eventDate)}</div>
          {showSeries && <div className="truncate text-muted">{c.seriesLabel}</div>}
        </div>
      ))}
    </div>
  );
}

const RANGES = [
  { kind: "last", label: "Last 10" },
  { kind: "all", label: "All" },
  { kind: "dates", label: "Dates" },
] as const;

export function TrendsView() {
  const { data } = useSWR<{ events: EventTrend[] }>("/api/trends", fetcher);
  // Track what's unchecked so series that show up later start checked.
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [rangeKind, setRangeKind] = useState<TrendRange["kind"]>("last");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const all = data?.events ?? [];

  const seriesList = new Map<string, { label: string; count: number }>();
  for (const e of all) {
    if (e.cups === 0) continue;
    const cur = seriesList.get(e.series);
    if (cur) cur.count += 1;
    else seriesList.set(e.series, { label: e.seriesLabel, count: 1 });
  }
  const series = [...seriesList.entries()].sort((a, b) => b[1].count - a[1].count);

  const range: TrendRange =
    rangeKind === "last" ? { kind: "last", n: 10 } : rangeKind === "all" ? { kind: "all" } : { kind: "dates", start, end };
  const checked = new Set(series.map(([key]) => key).filter((key) => !unchecked.has(key)));
  const columns = filterTrends(all, { series: checked, range });
  // With one series checked the label under every column would just repeat it.
  const showSeries = checked.size > 1;

  const maxCups = Math.max(0, ...columns.map((c) => c.cups));
  // One scale across all three milks so the panels compare honestly.
  const maxMilk = Math.max(0, ...columns.flatMap((c) => MILKS.map((m) => c.milk[m.key].containers)));

  function toggle(key: string) {
    const next = new Set(unchecked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setUnchecked(next);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-cream">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-espresso">Trends</h1>
          <Link href="/history" className="text-sm text-muted underline">
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-4">
        {!data ? (
          <p className="py-8 text-center text-muted">Loading…</p>
        ) : series.length === 0 ? (
          <p className="py-8 text-center text-muted">No events with orders yet.</p>
        ) : (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-muted">Events</h3>
                <div className="flex gap-3 text-sm">
                  <button type="button" onClick={() => setUnchecked(new Set())} className="text-muted underline">
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnchecked(new Set(series.map(([key]) => key)))}
                    className="text-muted underline"
                  >
                    None
                  </button>
                </div>
              </div>
              {series.map(([key, s]) => (
                <label key={key} className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!unchecked.has(key)}
                    onChange={() => toggle(key)}
                    className="size-5 accent-espresso"
                  />
                  <span className="min-w-0 flex-1 truncate text-espresso">{s.label}</span>
                  <span className="text-sm text-muted">
                    {s.count} event{s.count === 1 ? "" : "s"}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase text-muted">Range</h3>
              <div className="flex gap-2">
                {RANGES.map((r) => (
                  <button
                    key={r.kind}
                    type="button"
                    onClick={() => setRangeKind(r.kind)}
                    className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                      rangeKind === r.kind ? "border-espresso bg-espresso text-cream" : "border-border text-espresso"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {rangeKind === "dates" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="min-w-0 text-sm text-muted">
                    From
                    <input
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-border bg-white px-2 text-base text-espresso"
                    />
                  </label>
                  <label className="min-w-0 text-sm text-muted">
                    To
                    <input
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-border bg-white px-2 text-base text-espresso"
                    />
                  </label>
                </div>
              )}
            </div>

            {columns.length === 0 ? (
              <p className="py-8 text-center text-muted">No events match these filters.</p>
            ) : (
              <>
                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase text-muted">Total Cups</h3>
                  <div className="overflow-x-auto">
                    <div className="w-max">
                      <Bars
                        columns={columns}
                        value={(c) => ({ n: c.cups, text: String(c.cups) })}
                        max={maxCups}
                        heightClass="h-36"
                      />
                      <XLabels columns={columns} showSeries={showSeries} />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-semibold uppercase text-muted">Milk Containers Used</h3>
                  <div className="overflow-x-auto">
                    <div className="w-max space-y-3">
                      {MILKS.map((m) => (
                        <div key={m.key}>
                          <div className="sticky left-0 w-max text-sm text-espresso">{m.label}</div>
                          <Bars
                            columns={columns}
                            value={(c) => {
                              const u = c.milk[m.key];
                              return {
                                n: u.containers,
                                text: `${u.estimated ? "~" : ""}${u.containers.toFixed(1)}`,
                                estimated: u.estimated,
                              };
                            }}
                            max={maxMilk}
                            heightClass="h-24"
                          />
                        </div>
                      ))}
                      <XLabels columns={columns} showSeries={showSeries} />
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
