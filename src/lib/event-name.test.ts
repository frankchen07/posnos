import { test } from "node:test";
import assert from "node:assert/strict";
import { eventSeries, stripNameDate } from "./event-name.ts";

test("a trailing yyyymmdd is stripped from the name", () => {
  assert.equal(stripNameDate("coopelectric-20261103"), "coopelectric");
});

test("a leading yyyymmdd is stripped from the name", () => {
  assert.equal(stripNameDate("20261027-coopelectric"), "coopelectric");
});

test("underscore and space separators are stripped too", () => {
  assert.equal(stripNameDate("coop electric_20261103"), "coop electric");
  assert.equal(stripNameDate("20261103 Coop Electric"), "Coop Electric");
});

test("names without a date are left alone", () => {
  assert.equal(stripNameDate("  Coop Electric "), "Coop Electric");
});

test("a name that is only a date is kept rather than emptied", () => {
  assert.equal(stripNameDate("20261103"), "20261103");
});

test("series label is the lowercased dateless name", () => {
  assert.deepEqual(eventSeries("CoopElectric-20261013"), {
    key: "coopelectric",
    label: "coopelectric",
  });
});

test("series key ignores punctuation so coop-electric matches coopelectric", () => {
  assert.equal(eventSeries("coop-electric-20260929").key, eventSeries("coopelectric").key);
});
