import assert from "node:assert/strict";
import test from "node:test";
import { formatNumber } from "../src/util/format.js";

test("formats large numbers with compact suffixes", () => {
  assert.equal(formatNumber(999), "999");
  assert.equal(formatNumber(1_000), "1K");
  assert.equal(formatNumber(1_250), "1.3K");
  assert.equal(formatNumber(2_000_000), "2M");
  assert.equal(formatNumber(1_500_000_000), "1.5B");
});

test("handles invalid numbers safely", () => {
  assert.equal(formatNumber(Number.NaN), "0");
  assert.equal(formatNumber("invalid"), "0");
  assert.equal(formatNumber(undefined), "0");
});

test("accepts numeric strings", () => {
  assert.equal(formatNumber("1500"), "1.5K");
});
