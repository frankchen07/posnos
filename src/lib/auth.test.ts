import { test } from "node:test";
import assert from "node:assert/strict";
import { authToken, isAuthorized } from "./auth.ts";

test("the token for the right password authorizes", async () => {
  const token = await authToken("latte");
  assert.equal(await isAuthorized(token, "latte"), true);
});

test("the cookie is not the password itself", async () => {
  assert.notEqual(await authToken("latte"), "latte");
});

test("changing the password invalidates old cookies", async () => {
  const token = await authToken("latte");
  assert.equal(await isAuthorized(token, "mocha"), false);
});

test("a missing cookie is rejected", async () => {
  assert.equal(await isAuthorized(undefined, "latte"), false);
});

test("an unset password locks everyone out", async () => {
  const token = await authToken("latte");
  assert.equal(await isAuthorized(token, undefined), false);
  assert.equal(await isAuthorized(token, ""), false);
});
