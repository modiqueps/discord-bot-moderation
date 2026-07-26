import assert from "node:assert/strict";
import test from "node:test";
import { getEnvironment } from "../src/config/environment.js";

test("normalizes environment variables", () => {
  assert.deepEqual(
    getEnvironment({
      GUILD_ID: " 123 ",
      MONGO_URI: " mongodb://localhost/test ",
      TOKEN: " token ",
    }),
    {
      guildId: "123",
      logLevel: "info",
      mongoUri: "mongodb://localhost/test",
      shardCount: "auto",
      token: "token",
    },
  );
});

test("treats blank optional values as absent", () => {
  const environment = getEnvironment({
    GUILD_ID: "   ",
    MONGO_URI: "mongodb://localhost/test",
    TOKEN: "token",
  });

  assert.equal(environment.guildId, null);
});

test("reads the log level and shard count when provided", () => {
  const environment = getEnvironment({
    LOG_LEVEL: "debug",
    MONGO_URI: "mongodb://localhost/test",
    SHARD_COUNT: "4",
    TOKEN: "token",
  });

  assert.equal(environment.logLevel, "debug");
  assert.equal(environment.shardCount, 4);
});

test("throws a clear error when a required variable is missing", () => {
  assert.throws(
    () => getEnvironment({ MONGO_URI: "mongodb://localhost/test" }),
    /Missing environment variable: TOKEN/,
  );

  assert.throws(
    () => getEnvironment({ TOKEN: "token" }),
    /Missing environment variable: MONGO_URI/,
  );
});
