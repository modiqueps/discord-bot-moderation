import logger from "../core/logger.js";
import guildModel from "../database/guildModel.js";

/**
 * Fetch a channel or role by id, treating "no longer exists" as `null` rather
 * than an error.
 *
 * `fetch` rejects with 10003/10011 when the object was deleted, which is an
 * expected outcome for stored configuration, not a failure worth logging.
 *
 * @param {{ fetch: (id: string) => Promise<unknown> }} manager
 * @param {string} id
 */
async function fetchOrNull(manager, id) {
  return manager.fetch(id).catch(() => null);
}

/**
 * Remove a configuration block whose channel or role has been deleted.
 *
 * Without this the same lookup fails on every single member event, filling the
 * log with an error the server staff cannot see or act on.
 *
 * @param {string} guildId
 * @param {"autoRoleConfig" | "counterConfig"} key
 */
export async function clearStaleConfig(guildId, key) {
  await guildModel
    .updateOne({ guildID: guildId }, { $unset: { [key]: 1 } })
    .catch((error) => logger.error(`Failed to clear ${key}:`, error));

  logger.warn(
    `Cleared ${key} for guild ${guildId}: the configured channel or role no longer exists.`,
  );
}

/**
 * Resolve the channel and role an auto-role config points at.
 *
 * @returns {Promise<{ channel: unknown, role: unknown } | null>} null when the
 *   config is incomplete or now points at deleted objects
 */
export async function resolveAutoRoleTargets(guild, config) {
  if (!config?.channel || !config?.role) {
    return null;
  }

  const [channel, role] = await Promise.all([
    fetchOrNull(guild.channels, config.channel),
    fetchOrNull(guild.roles, config.role),
  ]);

  if (!channel?.isTextBased() || !role) {
    await clearStaleConfig(guild.id, "autoRoleConfig");
    return null;
  }

  return { channel, role };
}

/**
 * Resolve the channel a member-goal config posts to.
 *
 * @returns {Promise<unknown | null>}
 */
export async function resolveCounterChannel(guild, config) {
  if (!config?.channel || !config?.count) {
    return null;
  }

  const channel = await fetchOrNull(guild.channels, config.channel);

  if (!channel?.isTextBased()) {
    await clearStaleConfig(guild.id, "counterConfig");
    return null;
  }

  return channel;
}
