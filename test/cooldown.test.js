import assert from "node:assert/strict";
import test from "node:test";
import { clearCooldowns, getRemainingCooldown } from "../src/util/cooldown.js";

test.afterEach(() => clearCooldowns());

test("allows the first use and limits subsequent uses", () => {
  const command = { cooldown: 5, data: { name: "ping" } };

  assert.equal(getRemainingCooldown(command, "user-1", 1_000), 0);
  assert.equal(getRemainingCooldown(command, "user-1", 2_000), 4);
  assert.equal(getRemainingCooldown(command, "user-1", 6_000), 0);
});

test("does not enforce a cooldown when cooldown is false", () => {
  const command = { cooldown: false, data: { name: "help" } };

  assert.equal(getRemainingCooldown(command, "user-1", 1_000), 0);
  assert.equal(getRemainingCooldown(command, "user-1", 1_001), 0);
});

test("tracks each user separately", () => {
  const command = { cooldown: 5, data: { name: "ban" } };

  assert.equal(getRemainingCooldown(command, "user-1", 1_000), 0);
  assert.equal(getRemainingCooldown(command, "user-2", 1_000), 0);
  assert.ok(getRemainingCooldown(command, "user-1", 1_500) > 0);
});

test("tracks each command separately", () => {
  const ban = { cooldown: 5, data: { name: "ban" } };
  const kick = { cooldown: 5, data: { name: "kick" } };

  assert.equal(getRemainingCooldown(ban, "user-1", 1_000), 0);
  assert.equal(getRemainingCooldown(kick, "user-1", 1_000), 0);
});

test("falls back to the default duration when none is set", () => {
  const command = { data: { name: "help" } };

  assert.equal(getRemainingCooldown(command, "user-1", 1_000), 0);
  // DEFAULT_COOLDOWN_SECONDS is 5, so 1s later 4s remain.
  assert.equal(getRemainingCooldown(command, "user-1", 2_000), 4);
});
