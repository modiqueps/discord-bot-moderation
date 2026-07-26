import { ActivityType, Events } from "discord.js";
import { PRESENCE_REFRESH_MS } from "../config/constants.js";
import logger from "../core/logger.js";
import { formatNumber } from "../util/format.js";

/**
 * discord.js renamed `ready` to `clientReady`; the old name still fires but
 * emits a deprecation warning and is removed in v15.
 */
export const name = Events.ClientReady;
export const once = true;

async function registerCommands(client) {
  // Commands are application-wide, so one shard registering them is enough.
  const isRegistrationShard = !client.shard || client.shard.ids.includes(0);

  if (!isRegistrationShard) {
    return;
  }

  const { guildId } = client.environment;
  const commands = client.commands.map((command) => command.data.toJSON());

  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(commands);
    logger.success(
      `${commands.length} commands registered in the development server.`,
    );
    return;
  }

  await client.application.commands.set(commands);
  logger.success(`${commands.length} global commands registered.`);
}

async function getTotals(client) {
  if (!client.shard) {
    return {
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce(
        (total, guild) => total + guild.memberCount,
        0,
      ),
    };
  }

  const [guildCounts, userCounts] = await Promise.all([
    client.shard.fetchClientValues("guilds.cache.size"),
    client.shard.broadcastEval((shardClient) =>
      shardClient.guilds.cache.reduce(
        (total, guild) => total + guild.memberCount,
        0,
      ),
    ),
  ]);

  return {
    guilds: guildCounts.reduce((total, count) => total + count, 0),
    users: userCounts.reduce((total, count) => total + count, 0),
  };
}

async function updateActivity(client) {
  const totals = await getTotals(client);
  const shardLabel = client.shard ? ` • Shard ${client.shard.ids[0] + 1}` : "";

  client.user.setActivity({
    name: `${formatNumber(totals.guilds)} servers • ${formatNumber(totals.users)} users${shardLabel}`,
    type: ActivityType.Watching,
  });
}

export default async function clientReady(client) {
  logger.success(`Logged in as ${client.user.tag}.`);

  await registerCommands(client);
  await updateActivity(client);

  const activityTimer = setInterval(() => {
    updateActivity(client).catch((error) =>
      logger.error("Failed to update the activity:", error),
    );
  }, PRESENCE_REFRESH_MS);

  activityTimer.unref();
}
