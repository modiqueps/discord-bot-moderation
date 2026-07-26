import { getEnvironment } from "./config/environment.js";
import ModiquepsClient from "./core/Client.js";
import logger from "./core/logger.js";
import { closeDatabase } from "./database/connection.js";

// Validated up front so a misconfigured .env — the most common first-run
// problem — reports the missing variable instead of a stack trace.
try {
  getEnvironment();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

const client = new ModiquepsClient();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`${signal} received; closing connections.`);

  // Leave anyway if a handle refuses to close. The timer is unref'd, so it only
  // fires when something else is still holding the loop open.
  setTimeout(() => process.exit(0), 5_000).unref();

  await client.destroy().catch(() => null);
  await closeDatabase().catch(() => null);

  process.exitCode = 0;
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (error) =>
  logger.error("Unhandled promise rejection:", error),
);
process.on("uncaughtException", (error) =>
  logger.error("Uncaught runtime exception:", error),
);

try {
  await client.start();
} catch (error) {
  logger.error("Failed to start ModiQuePS:", error);

  await client.destroy().catch(() => null);
  await closeDatabase().catch(() => null);

  // Setting the code lets the loop drain; process.exit() here would abort while
  // the discord.js and MongoDB handles are still closing.
  process.exitCode = 1;
}
