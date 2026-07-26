import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";
import { getEnvironment } from "./config/environment.js";
import logger, { setLogLevel } from "./core/logger.js";

/**
 * Sharding entry point (`npm run shard`).
 *
 * Discord only requires sharding past 2500 guilds. Below that `npm start` runs
 * a single process, which uses less memory and is easier to debug.
 */
let environment;

try {
  environment = getEnvironment();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

setLogLevel(environment.logLevel);

const workerPath = fileURLToPath(new URL("./index.js", import.meta.url));

const manager = new ShardingManager(workerPath, {
  respawn: true,
  token: environment.token,
  totalShards: environment.shardCount,
});

manager.on("shardCreate", (shard) => {
  logger.info(`[shard:${shard.id}] Starting.`);

  shard.on("ready", () => logger.success(`[shard:${shard.id}] Ready.`));
  shard.on("disconnect", () =>
    logger.warn(`[shard:${shard.id}] Disconnected.`),
  );
  shard.on("death", () => logger.warn(`[shard:${shard.id}] Died; respawning.`));
  shard.on("error", (error) => logger.error(`[shard:${shard.id}]`, error));
});

try {
  await manager.spawn();
  logger.success(`All ${manager.shards.size} shard(s) online.`);
} catch (error) {
  logger.error("Failed to start shards:", error);
  process.exitCode = 1;
}
