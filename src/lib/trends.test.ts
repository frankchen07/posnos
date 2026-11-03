import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEventTrends, filterTrends } from "./trends.ts";

const ev = (id: string, eventDate: string, createdAt = `${eventDate}T12:00:00Z`) => ({
  id,
  name: id,
  eventDate,
  createdAt,
});

test("cups come from the per-event order count", () => {
  const [row] = buildEventTrends([ev("a", "2026-10-01")], [{ eventId: "a", count: 12 }], [], []);
  assert.equal(row.cups, 12);
});

test("milk containers are calculated from oz per drink when nothing was counted", () => {
  // 10 lattes x 6.5oz = 65oz whole milk / 64oz container
  const [row] = buildEventTrends(
    [ev("a", "2026-10-01")],
    [{ eventId: "a", count: 10 }],
    [{ eventId: "a", item: "latte", milk: "whole", count: 10 }],
    []
  );
  assert.equal(row.milk.whole.containers, 65 / 64);
  assert.equal(row.milk.whole.estimated, true);
});

test("a counted actual overrides the calculation", () => {
  const [row] = buildEventTrends(
    [ev("a", "2026-10-01")],
    [{ eventId: "a", count: 10 }],
    [{ eventId: "a", item: "latte", milk: "oat", count: 10 }],
    [{ eventId: "a", materialKey: "milk_oat", containersUsed: "3.50" }]
  );
  assert.deepEqual(row.milk.oat, { containers: 3.5, estimated: false });
});

test("an event with no milk orders uses zero containers of each milk", () => {
  const [row] = buildEventTrends([ev("a", "2026-10-01")], [], [], []);
  assert.equal(row.cups, 0);
  assert.equal(row.milk.almond.containers, 0);
});

test("milk rows from other events don't leak in", () => {
  const rows = buildEventTrends(
    [ev("a", "2026-10-01"), ev("b", "2026-10-02")],
    [],
    [{ eventId: "b", item: "latte", milk: "whole", count: 64 }],
    []
  );
  assert.equal(rows.find((r) => r.id === "a")!.milk.whole.containers, 0);
});

test("trends are newest first, ties broken by created time", () => {
  const rows = buildEventTrends(
    [
      ev("old", "2026-09-01"),
      ev("new-early", "2026-10-01", "2026-10-01T09:00:00Z"),
      ev("new-late", "2026-10-01", "2026-10-01T15:00:00Z"),
    ],
    [],
    [],
    []
  );
  assert.deepEqual(
    rows.map((r) => r.id),
    ["new-late", "new-early", "old"]
  );
});

test("each trend carries its series from the event name", () => {
  const [row] = buildEventTrends([{ ...ev("a", "2026-10-01"), name: "Coop-Electric-20261001" }], [], [], []);
  assert.equal(row.series, "coopelectric");
  assert.equal(row.seriesLabel, "coop-electric");
});

// Ten coop events (newest first, Oct 10 -> Oct 1) plus one 23andme on Oct 11.
const fixture = buildEventTrends(
  [
    { ...ev("23", "2026-10-11"), name: "23andme-20261011" },
    ...Array.from({ length: 10 }, (_, i) => {
      const date = `2026-10-${String(10 - i).padStart(2, "0")}`;
      return { ...ev(`coop${10 - i}`, date), name: `coopelectric-${date.replaceAll("-", "")}` };
    }),
    { ...ev("empty", "2026-10-12"), name: "coopelectric-20261012" },
  ],
  [
    { eventId: "23", count: 3 },
    ...Array.from({ length: 10 }, (_, i) => ({ eventId: `coop${i + 1}`, count: 10 })),
  ],
  [],
  []
);
const ALL = new Set(["coopelectric", "23andme"]);

test("events with no orders are left out", () => {
  const ids = filterTrends(fixture, { series: ALL, range: { kind: "all" } }).map((t) => t.id);
  assert.equal(ids.includes("empty"), false);
  assert.equal(ids.length, 11);
});

test("last N counts only the selected series", () => {
  const rows = filterTrends(fixture, {
    series: new Set(["coopelectric"]),
    range: { kind: "last", n: 3 },
  });
  assert.deepEqual(
    rows.map((t) => t.id),
    ["coop10", "coop9", "coop8"]
  );
});

test("a date range includes both its start and end", () => {
  const rows = filterTrends(fixture, {
    series: ALL,
    range: { kind: "dates", start: "2026-10-03", end: "2026-10-05" },
  });
  assert.deepEqual(
    rows.map((t) => t.id),
    ["coop5", "coop4", "coop3"]
  );
});

test("an empty date bound leaves that side open", () => {
  const rows = filterTrends(fixture, { series: ALL, range: { kind: "dates", start: "2026-10-10" } });
  assert.deepEqual(
    rows.map((t) => t.id),
    ["23", "coop10"]
  );
});
