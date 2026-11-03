import { MILKS, type MilkKey } from "./menu.ts";
import { MILK_CONTAINER_OZ, calculatedMilkOz, milkMaterialKey } from "./materials.ts";
import { eventSeries } from "./event-name.ts";
import type { EventTrend, MilkUsage } from "./types.ts";

interface TrendEventInput {
  id: string;
  name: string;
  eventDate: string;
  createdAt: string | Date;
}

// Newest first, left to right, matching the Past Events list.
export function buildEventTrends(
  events: TrendEventInput[],
  totals: { eventId: string; count: number }[],
  itemMilkCounts: { eventId: string; item: string; milk: string | null; count: number }[],
  manualCounts: { eventId: string; materialKey: string; containersUsed: string }[]
): EventTrend[] {
  const cupsByEvent = new Map(totals.map((row) => [row.eventId, row.count]));
  const manualByKey = new Map(
    manualCounts.map((row) => [`${row.eventId}-${row.materialKey}`, Number(row.containersUsed)])
  );

  return [...events]
    .sort(
      (a, b) =>
        b.eventDate.localeCompare(a.eventDate) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((ev) => {
      const rows = itemMilkCounts.filter((row) => row.eventId === ev.id);
      const milk = Object.fromEntries(
        MILKS.map((m): [MilkKey, MilkUsage] => {
          const manual = manualByKey.get(`${ev.id}-${milkMaterialKey(m.key)}`);
          return [
            m.key,
            manual != null
              ? { containers: manual, estimated: false }
              : {
                  containers: calculatedMilkOz(rows, m.key) / MILK_CONTAINER_OZ[m.key],
                  estimated: true,
                },
          ];
        })
      ) as Record<MilkKey, MilkUsage>;
      const { key, label } = eventSeries(ev.name);
      return {
        id: ev.id,
        name: ev.name,
        series: key,
        seriesLabel: label,
        eventDate: ev.eventDate,
        cups: cupsByEvent.get(ev.id) ?? 0,
        milk,
      };
    });
}

export type TrendRange =
  | { kind: "last"; n: number }
  | { kind: "all" }
  | { kind: "dates"; start?: string; end?: string };

// Expects newest-first input (as buildEventTrends returns) and keeps that order.
// "Last N" is taken after the series filter, so it means the last N events of
// the selected series.
export function filterTrends(
  trends: EventTrend[],
  { series, range }: { series: Set<string>; range: TrendRange }
): EventTrend[] {
  const picked = trends.filter((t) => t.cups > 0 && series.has(t.series));
  if (range.kind === "last") return picked.slice(0, range.n);
  if (range.kind === "dates") {
    return picked.filter(
      (t) => (!range.start || t.eventDate >= range.start) && (!range.end || t.eventDate <= range.end)
    );
  }
  return picked;
}
