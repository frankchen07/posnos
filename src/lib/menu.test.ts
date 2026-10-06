import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAbbreviation, type OrderSelection } from "./menu.ts";

const base: OrderSelection = {
  item: "latte",
  temp: "hot",
  milk: null,
  shotsAdded: 0,
  syrup: null,
  decaf: false,
  boastStyle: false,
  sugar: false,
};

test("plain drink is just the item abbreviation", () => {
  assert.equal(buildAbbreviation(base), "L");
});

test("iced drinks are prefixed ICED so Live shows it", () => {
  assert.equal(buildAbbreviation({ ...base, temp: "iced" }), "ICED L");
  assert.equal(buildAbbreviation({ ...base, temp: "iced", milk: "whole", shotsAdded: 1 }), "ICED 2X L / WM");
});

test("always-iced nitro gets no ICED prefix", () => {
  assert.equal(buildAbbreviation({ ...base, item: "nitro_cold_brew", temp: "iced" }), "NCB");
});

test("sugar is its own add-on after syrup", () => {
  assert.equal(buildAbbreviation({ ...base, sugar: true }), "L / +S");
  assert.equal(buildAbbreviation({ ...base, syrup: "vanilla", sugar: true }), "L / +V / +S");
});

test("item codes", () => {
  assert.equal(buildAbbreviation({ ...base, item: "mocha_latte" }), "MoL");
  assert.equal(buildAbbreviation({ ...base, item: "matcha_latte" }), "MaL");
});

test("extra shots prefix the drink with the total shot count", () => {
  assert.equal(buildAbbreviation({ ...base, milk: "whole", shotsAdded: 1 }), "2X L / WM");
  assert.equal(buildAbbreviation({ ...base, shotsAdded: 2 }), "3X L");
  assert.equal(buildAbbreviation({ ...base, item: "cappuccino", shotsAdded: 1 }), "3X CAP");
  assert.equal(buildAbbreviation({ ...base, item: "flat_white", shotsAdded: 2 }), "4X FW");
  // Matcha is measured in shots too.
  assert.equal(buildAbbreviation({ ...base, item: "matcha_latte", shotsAdded: 1 }), "2X MaL");
});

test("drinks without a baseline shot get a shot add-on", () => {
  assert.equal(buildAbbreviation({ ...base, item: "nitro_cold_brew", shotsAdded: 1 }), "NCB / +1 Shot");
  assert.equal(buildAbbreviation({ ...base, item: "nitro_cold_brew", shotsAdded: 2 }), "NCB / +2 Shot");
});

test("syrup codes", () => {
  assert.equal(buildAbbreviation({ ...base, syrup: "vanilla" }), "L / +V");
  assert.equal(buildAbbreviation({ ...base, syrup: "maple_bourbon" }), "L / +MB");
  assert.equal(buildAbbreviation({ ...base, syrup: "mocha" }), "L / +Mo");
});

test("less sweet has no plus", () => {
  assert.equal(
    buildAbbreviation({ ...base, item: "mocha_latte", milk: "oat", syrup: "less_sweet" }),
    "MoL / O / 1/2 S"
  );
  assert.equal(
    buildAbbreviation({ ...base, item: "hot_chocolate", milk: "whole", syrup: "less_sweet" }),
    "XOCO / WM / 1/2 S"
  );
});

test("full order: shots+item / milk / syrup / mods", () => {
  assert.equal(
    buildAbbreviation({
      ...base,
      item: "cappuccino",
      temp: "iced",
      milk: "oat",
      shotsAdded: 2,
      syrup: "vanilla",
      decaf: true,
      boastStyle: true,
      sugar: true,
    }),
    "ICED 4X CAP / O / +V / +S / DECAF / BOAST"
  );
});
