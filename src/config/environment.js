import "dotenv/config";

function requireValue(environment, key) {
  const value = environment[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. Copy the .env.example file to .env.`,
    );
  }

  return value;
}

function optionalValue(environment, key) {
  return environment[key]?.trim() || null;
}

/**
 * Read and validate the runtime configuration.
 *
 * Takes the environment as an argument so the tests can exercise it without
 * touching `process.env`.
 *
 * @param {NodeJS.ProcessEnv} [environment]
 */
export function getEnvironment(environment = process.env) {
  const shardCount = optionalValue(environment, "SHARD_COUNT");

  return {
    /** Register commands to this guild only; updates are instant. */
    guildId: optionalValue(environment, "GUILD_ID"),
    logLevel: optionalValue(environment, "LOG_LEVEL") ?? "info",
    mongoUri: requireValue(environment, "MONGO_URI"),
    /** Only read by the sharding entry point. */
    shardCount: shardCount ? Number(shardCount) : "auto",
    token: requireValue(environment, "TOKEN"),
  };
}
