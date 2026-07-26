import { readdir } from "node:fs/promises";
import logger from "./logger.js";

/**
 * Recursively collect every `.js` file below a directory URL.
 *
 * Results are sorted so load order is stable across platforms, which keeps
 * duplicate-name errors reproducible.
 *
 * @param {URL} directoryUrl
 * @returns {Promise<URL[]>}
 */
export async function findJavaScriptFiles(directoryUrl) {
  let entries;

  try {
    entries = await readdir(directoryUrl, { withFileTypes: true });
  } catch (error) {
    // An absent optional folder is not a failure.
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(
        ...(await findJavaScriptFiles(new URL(`${entry.name}/`, directoryUrl))),
      );
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(new URL(entry.name, directoryUrl));
    }
  }

  return files.sort((left, right) => left.href.localeCompare(right.href));
}

/**
 * Load command modules into a collection keyed by command name.
 *
 * A malformed module throws rather than being skipped: a moderation bot that
 * silently starts without `/ban` is worse than one that refuses to boot.
 *
 * @param {URL} directoryUrl
 * @param {import("discord.js").Collection<string, object>} target
 */
export async function loadCommands(directoryUrl, target) {
  for (const fileUrl of await findJavaScriptFiles(directoryUrl)) {
    const { default: command } = await import(fileUrl.href);

    if (!command?.data?.name || typeof command.execute !== "function") {
      throw new TypeError(`Invalid command module: ${fileUrl.pathname}`);
    }

    if (target.has(command.data.name)) {
      throw new Error(`Duplicate command name: ${command.data.name}`);
    }

    target.set(command.data.name, command);
    logger.debug(`Command loaded: /${command.data.name}`);
  }

  logger.info(`Loaded ${target.size} commands.`);
  return target;
}

/**
 * Bind event modules to the client.
 *
 * A module default-exports the listener and may export `name` and `once`.
 * `name` falls back to the file name. The client is appended as the final
 * argument of every listener.
 *
 * @param {import("discord.js").Client} client
 * @param {URL} directoryUrl
 */
export async function loadEvents(client, directoryUrl) {
  let loaded = 0;

  for (const fileUrl of await findJavaScriptFiles(directoryUrl)) {
    const module = await import(fileUrl.href);
    const listener = module.default;

    if (typeof listener !== "function") {
      throw new TypeError(`Invalid event module: ${fileUrl.pathname}`);
    }

    const eventName =
      module.name ?? fileUrl.pathname.split("/").at(-1).replace(".js", "");

    client[module.once ? "once" : "on"](eventName, (...args) =>
      listener(...args, client),
    );

    loaded += 1;
    logger.debug(`Event bound: ${eventName}`);
  }

  logger.info(`Loaded ${loaded} events.`);
  return loaded;
}
