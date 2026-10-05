import { test } from "node:test";
import assert from "node:assert/strict";
import { todayDateString } from "./id.ts";

test("event date is the Pacific calendar day, not UTC", () => {
  // 6pm PDT on Oct 4 is already Oct 5 in UTC.
  assert.equal(todayDateString(new Date("2026-10-05T01:00:00Z")), "2026-10-04");
});

test("morning in Pacific matches the same day", () => {
  assert.equal(todayDateString(new Date("2026-10-05T16:00:00Z")), "2026-10-05");
});
